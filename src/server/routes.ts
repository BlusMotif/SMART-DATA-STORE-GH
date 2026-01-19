import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { randomUUID, randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import multer from "multer";
import {
  loginSchema, registerSchema, agentRegisterSchema, purchaseSchema, withdrawalRequestSchema,
  UserRole, TransactionStatus, ProductType, WithdrawalStatus, InsertResultChecker,
  users, walletTopupTransactions, auditLogs
} from "../shared/schema.js";
import { initializePayment, verifyPayment, validateWebhookSignature, isPaystackConfigured, isPaystackTestMode } from "./paystack.js";
import { fulfillDataBundleTransaction } from "./providers.js";
// Role labels for storefront display
const ROLE_LABELS = {
  admin: "Admin",
  agent: "Agent",
  dealer: "Dealer",
  super_dealer: "Super Dealer",
  master: "Master",
  user: "User",
  guest: "Guest",
} as const;
// Process webhook events asynchronously
async function processWebhookEvent(event: any) {
  if (event.event === "charge.success") {
    const data = event.data;
    const reference = data.reference;
    const metadata = data.metadata;
    // Check if this is an agent activation payment
    if (metadata && metadata.purpose === "agent_activation") {
      // Handle new flow - pending registration (account not created yet)
      if (metadata.pending_registration && metadata.registration_data) {
        console.log("Processing pending agent registration via webhook:", reference);
        const supabaseServer = getSupabase();
        if (!supabaseServer) {
          console.error("Supabase not initialized for webhook");
          return;
        }
        const regData = metadata.registration_data;
        try {
          // Check if agent already exists
          const existingAgent = await storage.getAgentBySlug(regData.storefrontSlug);
          if (existingAgent) {
            console.log("Agent already exists for slug:", regData.storefrontSlug);
            return;
          }
          // Create user in Supabase Auth
          const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
            email: regData.email,
            password: regData.password,
            user_metadata: {
              name: regData.name,
              phone: regData.phone,
              role: 'agent'
            },
            email_confirm: true
          });
          if (authError) {
            console.error("Failed to create auth user in webhook:", authError);
            return;
          }
          const userId = authData.user.id;
          console.log("User created via webhook:", userId);
          // Check if user already exists in local database
          const existingUser = await storage.getUser(userId);
          if (!existingUser) {
            // Create user in local database
            await storage.createUser({
              id: userId,
              email: regData.email,
              password: '',
              name: regData.name,
              phone: regData.phone,
              role: UserRole.AGENT,
            });
          }
          // Create agent record (approved since payment is complete)
          const agent = await storage.createAgent({
            userId: userId,
            storefrontSlug: regData.storefrontSlug,
            businessName: regData.businessName,
            businessDescription: regData.businessDescription,
            isApproved: true,
            paymentPending: false,
          });
          console.log("Agent created via webhook:", agent.id);
          // Check if transaction already exists
          const existingTransaction = await storage.getTransactionByReference(reference);
          if (!existingTransaction) {
            // Create transaction record
            const activationFee = 60.00;
            await storage.createTransaction({
              reference: reference,
              type: ProductType.AGENT_ACTIVATION,
              productId: agent.id,
              productName: "Agent Account Activation",
              network: null,
              amount: activationFee.toString(),
              profit: activationFee.toString(),
              customerPhone: regData.phone,
              customerEmail: regData.email,
              paymentMethod: "paystack",
              status: TransactionStatus.COMPLETED,
              paymentReference: reference,
              agentId: null,
              agentProfit: "0.00",
            });
          }
          console.log("Agent registration completed via webhook");
        } catch (createError: any) {
          console.error("Error creating account in webhook:", createError);
        }
        return;
      }
      // Handle old flow - agent already exists
      if (metadata.agent_id) {
        console.log("Processing agent activation payment (old flow):", reference);
        try {
          // Update transaction status
          if (metadata.transaction_id) {
            await storage.updateTransaction(metadata.transaction_id, {
              status: TransactionStatus.COMPLETED,
              completedAt: new Date(),
              paymentReference: reference,
            });
            console.log("Activation transaction marked as completed:", metadata.transaction_id);
          }
          // Auto-approve the agent and mark payment as received
          const agent = await storage.updateAgent(metadata.agent_id, {
            isApproved: true,
            paymentPending: false,
          });
          if (agent) {
            console.log("Agent auto-approved after payment:", agent.id);
            // Update user role to agent
            const updatedUser = await storage.updateUser(agent.userId, { role: UserRole.AGENT });
            if (updatedUser) {
              console.log("User role updated to agent:", updatedUser.id);
            } else {
              console.error("Failed to update user role to agent for user:", agent.userId);
            }
          }
        } catch (oldFlowError: any) {
          console.error("Error processing old flow webhook:", oldFlowError);
        }
        return;
      }
    }
    // Handle regular transaction payments
    try {
      const transaction = await storage.getTransactionByReference(reference);
      if (!transaction) {
        console.error("Transaction not found for webhook:", reference);
        return; // Return early, don't throw
      }
      if (transaction.status === TransactionStatus.COMPLETED) {
        return; // Already processed
      }
      // Fulfill the order
      let deliveredPin: string | undefined;
      let deliveredSerial: string | undefined;
      if (transaction.type === ProductType.RESULT_CHECKER && transaction.productId) {
        const [type, yearStr] = transaction.productId.split("-");
        const year = parseInt(yearStr);
        // Try to get an available pre-generated checker first
        let checker = await storage.getResultChecker(transaction.productId);
        if (checker && !checker.isSold) {
          await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
          deliveredPin = checker.pin;
          deliveredSerial = checker.serialNumber;
        } else {
          // Auto-generate PIN and serial if no available checker exists
          deliveredPin = Math.random().toString(36).substring(2, 10).toUpperCase();
          deliveredSerial = Math.random().toString(36).substring(2, 12).toUpperCase();
          // Create a new result checker record
          const newChecker = await storage.createResultChecker({
            type,
            year,
            serialNumber: deliveredSerial,
            pin: deliveredPin,
            basePrice: transaction.amount,
          });
          console.log("Auto-generated result checker via Paystack:", newChecker.id);
        }
      }
      // If this is a data bundle transaction, try to fulfill using provider settings
      if (transaction.type === ProductType.DATA_BUNDLE) {
        const autoProcessingEnabled = (await storage.getSetting("data_bundle_auto_processing")) === "true";
        if (autoProcessingEnabled) {
          try {
            const fulfillResult = await fulfillDataBundleTransaction(transaction);
            await storage.updateTransaction(transaction.id, { apiResponse: JSON.stringify(fulfillResult) });
            // If provider reports all recipients ok, mark delivered/completed
            if (fulfillResult && fulfillResult.success && Array.isArray(fulfillResult.results)) {
              const allOk = fulfillResult.results.every((r: any) => r.status === "ok");
              if (allOk) {
                await storage.updateTransaction(transaction.id, {
                  status: TransactionStatus.DELIVERED,
                  deliveryStatus: "delivered",
                  completedAt: new Date(),
                  paymentReference: data.reference,
                });
              } else {
                await storage.updateTransaction(transaction.id, {
                  status: TransactionStatus.COMPLETED,
                  deliveryStatus: "processing",
                  completedAt: new Date(),
                  paymentReference: data.reference,
                  failureReason: JSON.stringify(fulfillResult.results),
                });
              }
            } else {
              await storage.updateTransaction(transaction.id, {
                status: TransactionStatus.COMPLETED,
                deliveryStatus: "failed",
                completedAt: new Date(),
                paymentReference: data.reference,
                failureReason: fulfillResult?.error || "Provider fulfillment failed",
              });
            }
          } catch (err: any) {
            console.error("Fulfillment error:", err);
            await storage.updateTransaction(transaction.id, {
              status: TransactionStatus.COMPLETED,
              deliveryStatus: "failed",
              completedAt: new Date(),
              paymentReference: data.reference,
              failureReason: String(err?.message || err),
            });
          }
        } else {
          // Manual processing - just mark as completed, delivery pending
          await storage.updateTransaction(transaction.id, {
            status: TransactionStatus.COMPLETED,
            deliveryStatus: "pending",
            completedAt: new Date(),
            paymentReference: data.reference,
          });
        }
      } else {
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          deliveredPin,
          deliveredSerial,
          paymentReference: data.reference,
        });
      }
      // Credit agent if applicable
      if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
        await storage.updateAgentBalance(transaction.agentId, parseFloat(transaction.agentProfit || "0"), true);
        // Also credit agent's profit wallet for withdrawals
        const agent = await storage.getAgent(transaction.agentId);
        if (agent) {
          let profitWallet = await storage.getProfitWallet(agent.userId);
          if (!profitWallet) {
            profitWallet = await storage.createProfitWallet({
              userId: agent.userId,
              availableBalance: "0.00",
              pendingBalance: "0.00",
              totalEarned: "0.00",
            });
          }
          const agentProfitValue = parseFloat(transaction.agentProfit || "0");
          const newAvailableBalance = (parseFloat(profitWallet.availableBalance) + agentProfitValue).toFixed(2);
          const newTotalEarned = (parseFloat(profitWallet.totalEarned) + agentProfitValue).toFixed(2);
          await storage.updateProfitWallet(agent.userId, {
            availableBalance: newAvailableBalance,
            totalEarned: newTotalEarned,
          });
        }
      }
      console.log("Payment processed via webhook:", reference);
    } catch (transactionError: any) {
      console.error("Error processing transaction webhook:", transactionError);
    }
  }
  // Handle other Paystack webhooks if needed
  console.log(`Unhandled webhook event: ${event.event}`);
}
import { getSupabaseServer } from "./index.js";
import {
  validatePhoneNetwork,
  getNetworkMismatchError,
  normalizePhoneNumber,
  isValidPhoneLength,
  detectNetwork,
  validatePhoneNumberDetailed
} from "./utils/network-validator.js";
// Get Supabase instance
const getSupabase = () => getSupabaseServer();
// Password strength validation
function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}
// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
// Phone validation - updated to use network validator
function isValidPhone(phone: string): boolean {
  return isValidPhoneLength(phone);
}
// Supabase JWT auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
        user_metadata?: {
          name?: string;
          role?: string;
        };
      };
      apiKey?: {
        id: string;
        userId: string;
        name: string;
        key: string;
        permissions: any;
        isActive: boolean;
        lastUsed: Date | null;
        createdAt: Date;
      };
    }
  }
}
// Auth middleware using Supabase JWT
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const supabaseServer = getSupabase();
    if (!supabaseServer) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user || !user.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Get user role - first from metadata, then try database
    let role = user.email === 'eleblununana@gmail.com' ? 'admin' :
               (user.user_metadata?.role || user.app_metadata?.role || 'user');
    try {
      const dbUser = await storage.getUserByEmail(user.email);
      if (dbUser) {
        role = dbUser.role; // Database role takes precedence if available
      } else {
        // User exists in Supabase but not in our database - create them
        console.log("Creating user in database:", user.email);
        try {
          const newUser = await storage.createUser({
            id: user.id, // Use Supabase user ID for consistency
            email: user.email,
            password: "", // Password not needed since auth is handled by Supabase
            name: user.user_metadata?.name || user.email.split('@')[0],
            phone: user.phone || null,
            role: role, // Use metadata role as default
            isActive: true,
          });
          role = newUser.role;
          console.log("User created in database with role:", role);
        } catch (createError) {
          console.error("Failed to create user in database:", createError);
          // Keep metadata role if DB creation fails
        }
      }
    } catch (dbError) {
      console.error("Database error in auth middleware:", dbError);
      // Continue with role from metadata instead of failing
      console.log("Using role from Supabase metadata due to DB error:", role);
    }
    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      role: role,
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: "Unauthorized" });
  }
};
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // requireAuth should have already run and set req.user with role
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Admin access required" });
    }
    // Check role from req.user (already set by requireAuth middleware)
    if (req.user.role !== UserRole.ADMIN) {
      console.log(`Access denied for user ${req.user.email} with role: ${req.user.role}`);
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(403).json({ error: "Admin access required" });
  }
};
const requireAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // requireAuth should have already run and set req.user with role
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Agent access required" });
    }
    // Check if user has agent-level access or higher (agent, dealer, super_dealer, master, admin)
    const agentRoles = [UserRole.AGENT, UserRole.DEALER, UserRole.SUPER_DEALER, UserRole.MASTER, UserRole.ADMIN];
    if (!req.user.role || !agentRoles.includes(req.user.role as typeof UserRole.AGENT)) {
      console.log(`Access denied for user ${req.user.email} with role: ${req.user.role}`);
      return res.status(403).json({ error: "Agent access required" });
    }
    next();
  } catch (error) {
    console.error('Agent auth error:', error);
    res.status(403).json({ error: "Agent access required" });
  }
};
const requireSupport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // requireAuth should have already run and set req.user with role
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Support access required" });
    }
    // Check role from req.user (already set by requireAuth middleware)
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.AGENT) {
      console.log(`Access denied for user ${req.user.email} with role: ${req.user.role}`);
      return res.status(403).json({ error: "Support access required" });
    }
    next();
  } catch (error) {
    console.error('Support auth error:', error);
    res.status(403).json({ error: "Support access required" });
  }
};
const requireApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "API key required" });
    }
    const key = authHeader.substring(7); // Remove 'Bearer ' prefix
    const apiKey = await storage.getApiKeyByKey(key);
    if (!apiKey || !apiKey.isActive) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    // Update last used timestamp
    await storage.updateApiKey(apiKey.id, { lastUsed: new Date() });
    req.apiKey = apiKey;
    next();
  } catch (error) {
    console.error('API key auth error:', error);
    res.status(401).json({ error: "Invalid API key" });
  }
};
const requireDealer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // requireAuth should have already run and set req.user with role
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Dealer access required" });
    }
    // Check if user has dealer-level access or higher (dealer, super_dealer, master, admin)
    const dealerRoles = [UserRole.DEALER, UserRole.SUPER_DEALER, UserRole.MASTER, UserRole.ADMIN];
    if (!req.user.role || !dealerRoles.includes(req.user.role as typeof UserRole.DEALER)) {
      console.log(`Access denied for user ${req.user.email} with role: ${req.user.role}`);
      return res.status(403).json({ error: "Dealer access required" });
    }
    next();
  } catch (error) {
    console.error('Dealer auth error:', error);
    res.status(403).json({ error: "Dealer access required" });
  }
};
const requireSuperDealer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // requireAuth should have already run and set req.user with role
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Super Dealer access required" });
    }
    // Check if user has super-dealer-level access or higher (super_dealer, master, admin)
    const superDealerRoles = [UserRole.SUPER_DEALER, UserRole.MASTER, UserRole.ADMIN];
    if (!req.user.role || !superDealerRoles.includes(req.user.role as typeof UserRole.SUPER_DEALER)) {
      console.log(`Access denied for user ${req.user.email} with role: ${req.user.role}`);
      return res.status(403).json({ error: "Super Dealer access required" });
    }
    next();
  } catch (error) {
    console.error('Super Dealer auth error:', error);
    res.status(403).json({ error: "Super Dealer access required" });
  }
};
const requireMaster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // requireAuth should have already run and set req.user with role
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Master access required" });
    }
    // Check if user has master-level access or higher (master, admin)
    const masterRoles = [UserRole.MASTER, UserRole.ADMIN];
    if (!req.user.role || !masterRoles.includes(req.user.role as typeof UserRole.MASTER)) {
      console.log(`Access denied for user ${req.user.email} with role: ${req.user.role}`);
      return res.status(403).json({ error: "Master access required" });
    }
    next();
  } catch (error) {
    console.error('Master auth error:', error);
    res.status(403).json({ error: "Master access required" });
  }
};
// Generate unique transaction reference
function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomUUID().split("-")[0].toUpperCase();
  return `CLEC-${timestamp}-${random}`;
}
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<void> {
  // ============================================
  // AUTH ROUTES
  // ============================================
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate input
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const data = registerSchema.parse(req.body);
      // Validate password strength
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      // Validate email format
      if (!isValidEmail(data.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const supabaseServer = getSupabase();
      if (!supabaseServer) {
        return res.status(500).json({ error: "Supabase not configured" });
      }
      // Check if user already exists in database
      try {
        const existing = await storage.getUserByEmail(data.email);
        if (existing) {
          return res.status(400).json({ error: "Email already registered" });
        }
      } catch (dbError) {
        console.error("Database error checking existing user:", dbError);
        return res.status(500).json({ error: "Database connection failed" });
      }
      // Sign up with Supabase
      const { data: supabaseData, error } = await supabaseServer.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: UserRole.GUEST,
            phone: data.phone || null,
          }
        }
      });
      if (error || !supabaseData.user) {
        return res.status(400).json({ error: error?.message || "Registration failed" });
      }
      // Create user in local database with Supabase user ID
      try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await storage.createUser({
          id: supabaseData.user.id, // Use Supabase user ID
          email: data.email,
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
          role: UserRole.GUEST,
        });
        res.status(201).json({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          access_token: supabaseData.session?.access_token,
          refresh_token: supabaseData.session?.refresh_token,
        });
      } catch (dbError) {
        console.error("Database error creating user:", dbError);
        // If database creation fails, delete the Supabase user to maintain consistency
        try {
          await supabaseServer.auth.admin.deleteUser(supabaseData.user.id);
        } catch (cleanupError) {
          console.error("Failed to cleanup Supabase user:", cleanupError);
        }
        return res.status(500).json({ error: "Failed to create user in database" });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate input
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const { email, password } = req.body;
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: "Email and password are required" });
      }
      // Validate email format
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const supabaseServer = getSupabase();
      if (!supabaseServer) {
        return res.status(500).json({ error: "Supabase not configured" });
      }
      // Sign in with Supabase
      const { data, error } = await supabaseServer.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      // TEMPORARY: Set admin role for specific email in Supabase metadata
      if (email === 'eleblununana@gmail.com') {
        try {
          await supabaseServer.auth.admin.updateUserById(data.user.id, {
            user_metadata: { ...data.user.user_metadata, role: 'admin' },
            app_metadata: { ...data.user.app_metadata, role: 'admin' }
          });
          console.log('✅ Admin role set for:', email);
        } catch (updateError) {
          console.error('Failed to set admin role:', updateError);
        }
      }
      // Get user role from database (required for proper role management)
      let role = email === 'eleblununana@gmail.com' ? 'admin' : 'user'; // Default role
      let agent = null;
      // Always try to get user from database for role and additional data
      try {
        const dbUser = await storage.getUserByEmail(email);
        if (dbUser) {
          role = dbUser.role;
          if (dbUser.role === UserRole.AGENT) {
            agent = await storage.getAgentByUserId(dbUser.id);
          }
        } else {
          // User exists in Supabase but not in our database
          // This shouldn't happen in normal flow, but handle gracefully
          console.warn("User authenticated but not found in database:", email);
          role = 'user'; // Default to user role
        }
      } catch (dbError) {
        console.error("Database error getting user data:", dbError);
        // If database is down, we can't determine role safely
        return res.status(500).json({ error: "Database connection failed" });
      }
      res.json({
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          role: role,
          phone: data.user.phone || null
        },
        agent: agent ? {
          id: agent.id,
          businessName: agent.businessName,
          storefrontSlug: agent.storefrontSlug,
          balance: agent.balance,
          totalSales: agent.totalSales,
        } : null,
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const supabaseServer = getSupabase();
        if (supabaseServer) {
          // Sign out from Supabase
          await supabaseServer.auth.admin.signOut(token);
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ user: null });
      }
      const token = authHeader.substring(7);
      const supabaseServer = getSupabase();
      if (!supabaseServer) {
        console.error("Supabase not configured");
        return res.status(500).json({ error: "Supabase not configured" });
      }
      const { data: userData, error } = await supabaseServer.auth.getUser(token);
      if (error || !userData?.user || !userData.user.email) {
        console.log("Standard auth failed, trying admin API fallback...");
        // Try to decode JWT to get user ID for admin API fallback
        try {
          const decoded = jwt.decode(token) as any;
          if (decoded?.sub) {
            const { data: adminData, error: adminError } = await supabaseServer.auth.admin.getUserById(decoded.sub);
            if (adminError || !adminData?.user) {
              console.error("Admin API fallback also failed:", adminError);
              return res.json({ user: null });
            }
            var user = adminData.user;
          } else {
            return res.json({ user: null });
          }
        } catch (jwtError) {
          console.error("JWT processing error:", jwtError);
          return res.json({ user: null });
        }
      } else {
        var user = userData.user;
      }
      console.log("Final user object:", { id: user.id, email: user.email });
      // TEMPORARY: Override role for specific admin email
      let role = user.email === 'eleblununana@gmail.com' ? 'admin' :
                 (user.user_metadata?.role || user.app_metadata?.role || 'user');
      let agent = null;
      let dbUser = null;
      // Try to get additional data from database if connection is available
      try {
        dbUser = await storage.getUserByEmail(user.email!);
        if (dbUser) {
          role = dbUser.role; // Database role takes precedence
          if (dbUser.role === UserRole.AGENT) {
            agent = await storage.getAgentByUserId(dbUser.id);
          }
        } else {
          // User exists in Supabase but not in our database - create them
          console.log("Creating user in database:", user.email);
          try {
            const newUser = await storage.createUser({
              id: user.id, // Persist Supabase user ID to avoid FK mismatches
              email: user.email!,
              password: "", // Password not needed since auth is handled by Supabase
              name: user.user_metadata?.name || user.email!.split('@')[0],
              phone: user.phone || null,
              role: 'user', // Default role for new users
              isActive: true,
            });
            dbUser = newUser;
            role = newUser.role;
            console.log("User created in database with role:", role);
          } catch (createError) {
            console.error("Failed to create user in database:", createError);
            // Continue with default role from metadata if DB creation fails
          }
        }
      } catch (dbError) {
        console.error("Database error getting user data:", dbError);
        // If database is down, use role from Supabase metadata
        console.log("Using role from Supabase metadata due to DB error:", role);
      }
      console.log("Final user data:", { id: user.id, email: user.email, role, hasAgent: !!agent });
      res.json({
        user: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          role: role,
          phone: user.phone || null,
          walletBalance: dbUser?.walletBalance || '0.00'
        },
        agent: agent ? {
          id: agent.id,
          businessName: agent.businessName,
          storefrontSlug: agent.storefrontSlug,
          balance: agent.balance,
          totalSales: agent.totalSales,
          totalProfit: agent.totalProfit,
          isApproved: agent.isApproved,
        } : null,
      });
    } catch (error: any) {
      console.error("Auth check error:", error);
      res.json({ user: null });
    }
  });
  // ============================================
  // AGENT REGISTRATION
  // ============================================
  app.post("/api/agent/register", async (req, res) => {
    try {
      const supabaseServer = getSupabase();
      if (!supabaseServer) {
        console.error('Supabase server client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
        return res.status(500).json({ error: "Server configuration error" });
      }
      // Validate input
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const data = agentRegisterSchema.parse(req.body);
      // Validate password strength
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      // Validate email and phone
      if (!isValidEmail(data.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      if (!isValidPhone(data.phone)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }
      console.log("Agent registration data:", data);
      // Check if storefront slug is taken
      const existingSlug = await storage.getAgentBySlug(data.storefrontSlug);
      if (existingSlug) {
        return res.status(400).json({ error: "Storefront URL already taken" });
      }
      // Check if user already exists with this email
      console.log("Checking if user exists");
      const { data: existingUsers } = await supabaseServer.auth.admin.listUsers();
      const existingAuthUser = existingUsers?.users.find(u => u.email === data.email);
      if (existingAuthUser) {
        // Check if they already have an agent account
        const existingAgent = await storage.getAgentByUserId(existingAuthUser.id);
        if (existingAgent) {
          if (existingAgent.isApproved) {
            return res.status(400).json({ error: "This email is already registered and activated as an agent. Please login instead." });
          } else {
            return res.status(400).json({ error: "This email has a pending agent registration. Please complete the activation process or contact support." });
          }
        }
      }
      // DO NOT CREATE ACCOUNT YET - Only initialize payment
      // Account will be created after successful payment verification
      // Create a temporary reference for payment tracking
      const activationFee = 60.00; // GHC 60.00
      const tempReference = `agent_pending_${Date.now()}_${data.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      console.log("Initializing payment without creating account");
      const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      // Initialize Paystack payment for agent activation
      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          amount: Math.round(activationFee * 100), // Convert to pesewas
          currency: "GHS",
          reference: tempReference,
          callback_url: `${frontendUrl}/agent/activation-complete`,
          metadata: {
            purpose: "agent_activation",
            pending_registration: true,
            // Store all registration data in metadata for account creation after payment
            registration_data: {
              email: data.email,
              password: data.password,
              name: data.name,
              phone: data.phone,
              storefrontSlug: data.storefrontSlug,
              businessName: data.businessName,
              businessDescription: data.businessDescription,
            },
          },
        }),
      });
      const paystackData = await paystackResponse.json() as any;
      if (!paystackData.status) {
        console.error("Paystack initialization failed:", paystackData);
        return res.status(500).json({ error: "Payment initialization failed" });
      }
      console.log("Payment initialized. Account will be created after successful payment:", paystackData.data.reference);
      res.json({
        message: "Please complete payment to activate your agent account",
        paymentUrl: paystackData.data.authorization_url,
        paymentReference: paystackData.data.reference,
        amount: activationFee,
      });
    } catch (error: any) {
      console.error("Error during agent registration:", error.message);
      console.error("Full error:", error);
      console.error("Error stack:", error.stack);
      // Handle specific database errors
      if (error.code === '23505') {
        return res.status(400).json({ error: "This email or phone number is already registered" });
      }
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: "Invalid registration data",
          details: error.errors
        });
      }
      res.status(500).json({
        error: error.message || "Registration failed",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
    // ============================================
    // UPGRADE EXISTING USER TO AGENT (same account)
    // ============================================
    app.post("/api/agent/upgrade", requireAuth, async (req, res) => {
      try {
        const supabaseServer = getSupabase();
        if (!supabaseServer) {
          console.error('Supabase server client not initialized.');
          return res.status(500).json({ error: "Server configuration error" });
        }
        const user = (req as any).user;
        if (!user || !user.id) return res.status(401).json({ error: "Unauthorized" });
        console.log("Upgrade request for user:", user.id, "email:", user.email);
        // Ensure user exists in database
        let dbUser = await storage.getUserByEmail(user.email);
        if (!dbUser) {
          console.log("User not in database, creating...");
          dbUser = await storage.createUser({
            id: user.id,
            email: user.email,
            password: "",
            name: user.user_metadata?.name || user.email.split('@')[0],
            phone: user.phone || null,
            role: 'user',
            isActive: true,
          });
          console.log("User created in db:", dbUser.id);
        }
        const { businessName, businessDescription, storefrontSlug } = req.body || {};
        if (!businessName || !storefrontSlug) {
          return res.status(400).json({ error: "Business name and storefront slug are required" });
        }
        // Check if user already has an agent
        const existingAgent = await storage.getAgentByUserId(user.id);
        if (existingAgent) {
          return res.status(400).json({ error: "Your account is already an agent" });
        }
        // Check slug availability
        const slugTaken = await storage.getAgentBySlug(storefrontSlug);
        if (slugTaken) {
          return res.status(400).json({ error: "Storefront URL already taken" });
        }
        console.log("Creating agent for user:", dbUser.id);
        // Create agent record (pending approval/payment)
        const agent = await storage.createAgent({
          userId: dbUser.id,
          storefrontSlug,
          businessName,
          businessDescription,
          isApproved: false,
          paymentPending: true,
        } as any);
        if (!agent) {
          return res.status(500).json({ error: "Failed to create agent record" });
        }
        console.log("Agent created:", agent.id);
        // Create pending transaction record
        const activationFee = 60.0;
        const tempReference = `agent_pending_${Date.now()}_${user.id}`;
        const transaction = await storage.createTransaction({
          reference: tempReference,
          type: ProductType.AGENT_ACTIVATION,
          productId: agent.id,
          productName: "Agent Account Activation",
          network: null,
          amount: activationFee.toString(),
          profit: activationFee.toString(),
          customerPhone: user.phone || "",
          customerEmail: user.email || null,
          paymentMethod: "paystack",
          status: TransactionStatus.PENDING,
          paymentReference: null,
          agentId: agent.id,
          agentProfit: "0.00",
        } as any);
        console.log("Transaction created:", transaction.id);
        console.log("Initializing Paystack payment...");
        // Initialize Paystack payment
        console.log("Making Paystack API call with email:", user.email, "amount:", Math.round(activationFee * 100));
        const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
        const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            amount: Math.round(activationFee * 100),
            currency: "GHS",
            reference: tempReference,
            callback_url: `${frontendUrl}/agent/activation-complete`,
            metadata: {
              purpose: "agent_activation",
              agent_id: agent.id,
              transaction_id: transaction.id,
            },
          }),
        });
        const paystackData = await paystackResponse.json() as any;
        console.log("Paystack response status:", paystackData.status, "data:", paystackData);
        console.log("Paystack response full:", JSON.stringify(paystackData, null, 2));
        if (!paystackData.status) {
          // cleanup
          try { await storage.deleteAgent(agent.id); } catch (_) {}
          try { await storage.updateTransaction(transaction.id, { status: TransactionStatus.FAILED }); } catch (_) {}
          return res.status(500).json({ error: "Payment initialization failed" });
        }
        res.json({ paymentUrl: paystackData.data.authorization_url, paymentReference: paystackData.data.reference, amount: activationFee });
        console.log("Returning payment URL:", paystackData.data.authorization_url);
        console.log("Full response being sent:", { paymentUrl: paystackData.data.authorization_url, paymentReference: paystackData.data.reference, amount: activationFee });
      } catch (error: any) {
        console.error("Error during agent upgrade:", error.message);
        console.error("Full error:", error);
        res.status(500).json({ error: error.message || "Upgrade failed" });
      }
    });
  // Helper function to get default bundles for a network
  function getDefaultBundlesForNetwork(network: string) {
    const bundleConfigs: Record<string, any[]> = {
      at_bigtime: [
        { name: 'Daily Bundle', network: 'at_bigtime', dataAmount: '500MB', validity: '1 Day', basePrice: '2.00', agentPrice: '1.80', dealerPrice: '1.70', superDealerPrice: '1.60', masterPrice: '1.50', adminPrice: '1.40', isActive: true },
        { name: 'Weekly Bundle', network: 'at_bigtime', dataAmount: '2GB', validity: '7 Days', basePrice: '8.00', agentPrice: '7.20', dealerPrice: '6.80', superDealerPrice: '6.40', masterPrice: '6.00', adminPrice: '5.60', isActive: true },
        { name: 'Monthly Bundle', network: 'at_bigtime', dataAmount: '5GB', validity: '30 Days', basePrice: '20.00', agentPrice: '18.00', dealerPrice: '17.00', superDealerPrice: '16.00', masterPrice: '15.00', adminPrice: '14.00', isActive: true }
      ],
      at_ishare: [
        { name: 'Daily iShare', network: 'at_ishare', dataAmount: '750MB', validity: '1 Day', basePrice: '2.50', agentPrice: '2.25', dealerPrice: '2.13', superDealerPrice: '2.00', masterPrice: '1.88', adminPrice: '1.75', isActive: true },
        { name: 'Weekly iShare', network: 'at_ishare', dataAmount: '3GB', validity: '7 Days', basePrice: '10.00', agentPrice: '9.00', dealerPrice: '8.50', superDealerPrice: '8.00', masterPrice: '7.50', adminPrice: '7.00', isActive: true },
        { name: 'Monthly iShare', network: 'at_ishare', dataAmount: '8GB', validity: '30 Days', basePrice: '25.00', agentPrice: '22.50', dealerPrice: '21.25', superDealerPrice: '20.00', masterPrice: '18.75', adminPrice: '17.50', isActive: true }
      ],
      mtn: [
        { name: 'MTN 500MB', network: 'mtn', dataAmount: '500MB', validity: '1 Day', basePrice: '1.50', agentPrice: '1.35', dealerPrice: '1.28', superDealerPrice: '1.20', masterPrice: '1.13', adminPrice: '1.05', isActive: true },
        { name: 'MTN 1GB', network: 'mtn', dataAmount: '1GB', validity: '1 Day', basePrice: '3.00', agentPrice: '2.70', dealerPrice: '2.55', superDealerPrice: '2.40', masterPrice: '2.25', adminPrice: '2.10', isActive: true },
        { name: 'MTN 2GB', network: 'mtn', dataAmount: '2GB', validity: '3 Days', basePrice: '6.00', agentPrice: '5.40', dealerPrice: '5.10', superDealerPrice: '4.80', masterPrice: '4.50', adminPrice: '4.20', isActive: true }
      ],
      telecel: [
        { name: 'Telecel 500MB', network: 'telecel', dataAmount: '500MB', validity: '1 Day', basePrice: '1.50', agentPrice: '1.35', dealerPrice: '1.28', superDealerPrice: '1.20', masterPrice: '1.13', adminPrice: '1.05', isActive: true },
        { name: 'Telecel 1GB', network: 'telecel', dataAmount: '1GB', validity: '1 Day', basePrice: '3.00', agentPrice: '2.70', dealerPrice: '2.55', superDealerPrice: '2.40', masterPrice: '2.25', adminPrice: '2.10', isActive: true },
        { name: 'Telecel 2GB', network: 'telecel', dataAmount: '2GB', validity: '3 Days', basePrice: '6.00', agentPrice: '5.40', dealerPrice: '5.10', superDealerPrice: '4.80', masterPrice: '4.50', adminPrice: '4.20', isActive: true }
      ]
    };
    return bundleConfigs[network] || [];
  }
  // ============================================
  // PRODUCTS - DATA BUNDLES
  // ============================================
  app.get("/api/products/data-bundles", async (req, res) => {
    const network = req.query.network as string | undefined;
    const agentSlug = req.query.agent as string | undefined;
    console.log("[API] /api/products/data-bundles called with network:", network, "agent:", agentSlug);
    try {
      let bundles = await storage.getDataBundles({ network, isActive: true });
      console.log(`[API] Fetched ${bundles.length} bundles for network: ${network}`);
      let pricedBundles;
      if (agentSlug) {
        // Handle agent storefront pricing - use resolved prices
        const agent = await storage.getAgentBySlug(agentSlug);
        if (agent && agent.isApproved) {
          // For agent storefronts, use resolved prices (custom or admin base)
          pricedBundles = await Promise.all(bundles.map(async (bundle) => {
            const resolvedPrice = await storage.getResolvedPrice(bundle.id, agent.id, 'agent');
            const adminBasePrice = await storage.getRoleBasePrice(bundle.id, 'agent');
            const basePrice = adminBasePrice ? parseFloat(adminBasePrice) : parseFloat(bundle.basePrice || '0');
            const sellingPrice = resolvedPrice ? parseFloat(resolvedPrice) : basePrice;
            const profit = Math.max(0, sellingPrice - basePrice);
            return {
              ...bundle,
              basePrice: basePrice.toFixed(2),
              effective_price: sellingPrice.toFixed(2),
              profit_margin: profit.toFixed(2),
            };
          }));
        } else {
          // Invalid agent, use admin price
          pricedBundles = bundles.map(bundle => ({
            ...bundle,
            basePrice: parseFloat(bundle.adminPrice || bundle.basePrice || '0').toFixed(2),
            effective_price: parseFloat(bundle.adminPrice || bundle.basePrice || '0').toFixed(2),
            profit_margin: '0.00',
          }));
        }
      } else {
        // Check if user is authenticated to apply role-based pricing
        let userRole = 'guest';
        let userId: string | undefined;
        try {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const supabaseServer = getSupabase();
            if (supabaseServer) {
              const { data: { user }, error } = await supabaseServer.auth.getUser(token);
              if (!error && user && user.email) {
                const dbUser = await storage.getUserByEmail(user.email);
                if (dbUser) {
                  userRole = dbUser.role;
                  userId = dbUser.id;
                }
              }
            }
          }
        } catch (authError) {
          // Ignore auth errors, treat as guest
          console.log('Auth check failed, treating as guest');
        }
        // Apply role-based pricing using the new resolved price system
        pricedBundles = await Promise.all(bundles.map(async (bundle) => {
          let effectivePrice = parseFloat(bundle.basePrice || '0');
          let profitMargin = '0.00';
          let adminBasePriceValue = parseFloat(bundle.basePrice || '0');
          if (userRole !== 'guest' && userId) {
            // Get resolved price (custom selling price or role base price fallback)
            const resolvedPrice = await storage.getResolvedPrice(bundle.id, userId, userRole);
            const roleBasePrice = await storage.getRoleBasePrice(bundle.id, userRole);
            
            if (resolvedPrice) {
              effectivePrice = parseFloat(resolvedPrice);
              // Calculate profit margin (selling price - role base price)
              if (roleBasePrice) {
                adminBasePriceValue = parseFloat(roleBasePrice);
                profitMargin = (effectivePrice - adminBasePriceValue).toFixed(2);
              }
            } else if (roleBasePrice) {
              // Use role base price if no resolved price
              effectivePrice = parseFloat(roleBasePrice);
              adminBasePriceValue = effectivePrice;
            }
          } else {
            // Guest users see base price
            effectivePrice = parseFloat(bundle.basePrice || '0');
            adminBasePriceValue = effectivePrice;
          }
          return {
            ...bundle,
            basePrice: adminBasePriceValue.toFixed(2),
            effective_price: effectivePrice.toFixed(2),
            profit_margin: profitMargin,
          };
        }));
      }
      console.log(`[API] Returning ${pricedBundles.length} priced bundles`);
      res.json(pricedBundles);
    } catch (error: any) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch data bundles" });
    }
  });
  // Get available networks with base prices for homepage dropdown
  app.get("/api/products/networks", async (req, res) => {
    try {
      const networks = await storage.getNetworksWithBasePrices();
      res.json(networks);
    } catch (error: any) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch networks" });
    }
  });
  // Check storefront slug availability
  app.get("/api/agent/check-slug", async (req, res) => {
    try {
      const slug = (req.query.slug || "").toString().toLowerCase();
      if (!slug) return res.status(400).json({ error: "slug is required" });
      if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: "invalid slug format" });
      const existing = await storage.getAgentBySlug(slug);
      res.json({ available: !existing });
    } catch (err: any) {
      console.error("Error checking slug:", err);
      res.status(500).json({ error: "Failed to check slug" });
    }
  });
  app.get("/api/products/data-bundles/:id", async (req, res) => {
    try {
      const bundle = await storage.getDataBundle(req.params.id);
      if (!bundle || !bundle.isActive) {
        return res.status(404).json({ error: "Data bundle not found" });
      }

      // Check if user is authenticated to apply role-based pricing
      let userRole = 'guest';
      let userId: string | undefined;
      try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const supabaseServer = getSupabase();
          if (supabaseServer) {
            const { data: { user }, error } = await supabaseServer.auth.getUser(token);
            if (!error && user && user.email) {
              const dbUser = await storage.getUserByEmail(user.email);
              if (dbUser) {
                userRole = dbUser.role;
                userId = dbUser.id;
              }
            }
          }
        }
      } catch (authError) {
        // Ignore auth errors, treat as guest
        console.log('Auth check failed, treating as guest');
      }

      // Apply role-based pricing using the resolved price system
      let effectivePrice = parseFloat(bundle.basePrice || '0');
      let profitMargin = '0.00';
      let adminBasePriceValue = parseFloat(bundle.basePrice || '0');

      if (userRole !== 'guest' && userId) {
        // Get resolved price (custom selling price or role base price fallback)
        const resolvedPrice = await storage.getResolvedPrice(bundle.id, userId, userRole);
        const roleBasePrice = await storage.getRoleBasePrice(bundle.id, userRole);

        if (resolvedPrice) {
          effectivePrice = parseFloat(resolvedPrice);
          // Calculate profit margin (selling price - role base price)
          if (roleBasePrice) {
            adminBasePriceValue = parseFloat(roleBasePrice);
            profitMargin = (effectivePrice - adminBasePriceValue).toFixed(2);
          }
        } else if (roleBasePrice) {
          // Use role base price if no resolved price
          effectivePrice = parseFloat(roleBasePrice);
          adminBasePriceValue = effectivePrice;
        }
      }

      res.json({
        ...bundle,
        basePrice: adminBasePriceValue.toFixed(2),
        effective_price: effectivePrice.toFixed(2),
        profit_margin: profitMargin,
      });
    } catch (error: any) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch data bundle" });
    }
  });
  // ============================================
  // PRODUCTS - RESULT CHECKERS (Stock info)
  // ============================================
  app.get("/api/products/result-checkers/stock", async (req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear, currentYear - 1, currentYear - 2];
      const stock: { type: string; year: number; available: number; stock: number; price: number }[] = [];
      for (const year of years) {
        for (const type of ["bece", "wassce"]) {
          const available = await storage.getResultCheckerStock(type, year);
          if (available > 0) {
            const checker = await storage.getAvailableResultChecker(type, year);
            stock.push({
              type,
              year,
              available,
              stock: available,
              price: parseFloat(checker?.basePrice || "0"),
            });
          }
        }
      }
      res.json(stock);
    } catch (error: any) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch result checker stock" });
    }
  });
  app.get("/api/products/result-checkers/info/:type/:year", async (req, res) => {
    try {
      const type = req.params.type;
      const year = parseInt(req.params.year);
      const available = await storage.getResultCheckerStock(type, year);
      if (available === 0) {
        return res.status(404).json({ error: "No stock available" });
      }
      const checker = await storage.getAvailableResultChecker(type, year);
      res.json({
        type,
        year,
        price: parseFloat(checker?.basePrice || "0"),
        stock: available,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch result checker info" });
    }
  });
  // ============================================
  // STOREFRONT
  // ============================================
  app.get("/api/store/:role/:slug", async (req, res) => {
    try {
      const { role, slug } = req.params;
      // Validate role
      const validRoles = ['agent', 'dealer', 'super_dealer', 'master'];
      if (!validRoles.includes(role)) {
        return res.status(404).json({ error: "Invalid store type" });
      }
      let storeData: any = null;
      let roleOwnerId: string;
      if (role === 'agent') {
        // Handle agent storefront
        try {
          const agent = await storage.getAgentBySlug(slug);
          if (!agent || !agent.isApproved) {
            console.log(`Storefront not found: slug=${slug}, agent=${!!agent}, approved=${agent?.isApproved}`);
            return res.status(404).json({ error: "Store not found" });
          }
          const user = await storage.getUser(agent.userId);
          storeData = {
            businessName: agent.businessName,
            businessDescription: agent.businessDescription,
            slug: agent.storefrontSlug,
            whatsappSupportLink: agent.whatsappSupportLink,
            whatsappChannelLink: agent.whatsappChannelLink,
            role: 'agent'
          };
          roleOwnerId = agent.id;
        } catch (dbError) {
          console.error('Database error in storefront lookup:', dbError);
          return res.status(500).json({ error: "Database error" });
        }
      } else {
        // Handle dealer/super_dealer/master storefronts
        const user = await storage.getUserBySlug(slug, role);
        if (!user) {
          return res.status(404).json({ error: "Store not found" });
        }
        storeData = {
          businessName: `${user.name} (${ROLE_LABELS[role as keyof typeof ROLE_LABELS]})`,
          businessDescription: `${ROLE_LABELS[role as keyof typeof ROLE_LABELS]} storefront`,
          slug: slug,
          role: role
        };
        roleOwnerId = user.id;
      }
      // Get all active data bundles
      const allBundles = await storage.getDataBundles({ isActive: true });
      // Get result checkers
      const currentYear = new Date().getFullYear();
      const resultCheckerStock = [];
      for (const year of [currentYear, currentYear - 1]) {
        for (const type of ["bece", "wassce"]) {
          const available = await storage.getResultCheckerStock(type, year);
          if (available > 0) {
            const checker = await storage.getAvailableResultChecker(type, year);
            const basePrice = parseFloat(checker?.basePrice || "0");
            resultCheckerStock.push({
              type,
              year,
              available,
              price: basePrice.toFixed(2),
            });
          }
        }
      }
      res.json({
        store: storeData,
        // Only expose role-scoped products with resolved pricing
        dataBundles: await Promise.all(allBundles.map(async (b) => {
          // Get resolved price (custom selling price or admin base price fallback)
          const resolvedPrice = await storage.getResolvedPrice(b.id, roleOwnerId, role);
          if (!resolvedPrice) {
            // If no price available, don't show the bundle
            return null;
          }
          return {
            id: b.id,
            name: b.name,
            network: b.network,
            dataAmount: b.dataAmount,
            validity: b.validity,
            apiCode: b.apiCode,
            isActive: b.isActive,
            price: resolvedPrice,
          };
        })).then(arr => arr.filter(Boolean)),
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load store" });
    }
  });
  // Store-specific user registration
  app.post("/api/store/:slug/register", async (req, res) => {
    try {
      const { slug } = req.params;
      const agent = await storage.getAgentBySlug(slug);
      if (!agent || !agent.isApproved) {
        return res.status(404).json({ error: "Store not found" });
      }
      // Validate input
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const data = registerSchema.parse(req.body);
      // Validate password strength
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      // Validate email format
      if (!isValidEmail(data.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const supabaseServer = getSupabase();
      if (!supabaseServer) {
        return res.status(500).json({ error: "Supabase not configured" });
      }
      // Check if user already exists in database
      try {
        const existing = await storage.getUserByEmail(data.email);
        if (existing) {
          return res.status(400).json({ error: "Email already registered" });
        }
      } catch (dbError) {
        console.error("Database error checking existing user:", dbError);
        return res.status(500).json({ error: "Database connection failed" });
      }
      // Sign up with Supabase
      const { data: supabaseData, error } = await supabaseServer.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: UserRole.GUEST,
            phone: data.phone || null,
            referredByAgent: agent.id, // Track which agent referred this user
          }
        }
      });
      if (error || !supabaseData.user) {
        return res.status(400).json({ error: error?.message || "Registration failed" });
      }
      // Create user in local database with Supabase user ID
      try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await storage.createUser({
          id: supabaseData.user.id,
          email: data.email,
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
          role: UserRole.GUEST, // Store users start as GUEST
        });
        res.status(201).json({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          access_token: supabaseData.session?.access_token,
          refresh_token: supabaseData.session?.refresh_token,
          agentStore: slug, // Return the store slug for frontend to track
        });
      } catch (dbError) {
        console.error("Database error creating user:", dbError);
        try {
          await supabaseServer.auth.admin.deleteUser(supabaseData.user.id);
        } catch (cleanupError) {
          console.error("Failed to cleanup Supabase user:", cleanupError);
        }
        return res.status(500).json({ error: "Failed to create user in database" });
      }
    } catch (error: any) {
      console.error("Store registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  // ============================================
  // PAYSTACK CONFIG
  // ============================================
  app.get("/api/paystack/config", async (req, res) => {
    try {
      const publicKey = (await storage.getSetting("paystack.public_key")) || process.env.PAYSTACK_PUBLIC_KEY || "";
      const secretKey = (await storage.getSetting("paystack.secret_key")) || process.env.PAYSTACK_SECRET_KEY || "";
      const isConfigured = !!secretKey;
      const isTestMode = secretKey.startsWith("sk_test_");
      res.json({ publicKey, isConfigured, isTestMode });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load paystack config" });
    }
  });
  // ============================================
  // CHECKOUT / TRANSACTIONS
  // ============================================
  // Excel bulk upload for registered users
  app.post("/api/checkout/bulk-upload", requireAuth, multer({ storage: multer.memoryStorage() }).single('excelFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Excel file is required" });
      }
      // Import xlsx dynamically to avoid issues
      const XLSX = await import('xlsx');
      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (!jsonData || jsonData.length === 0) {
        return res.status(400).json({ error: "Excel file is empty or invalid" });
      }
      // Validate Excel structure - expect columns: phone, bundleName, bundleId
      const requiredColumns = ['phone', 'bundleName', 'bundleId'];
      const firstRow = jsonData[0] as any;
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      if (missingColumns.length > 0) {
        return res.status(400).json({
          error: `Missing required columns: ${missingColumns.join(', ')}. Expected: phone, bundleName, bundleId`
        });
      }
      // Process and validate each row
      const orderItems: any[] = [];
      const errors: string[] = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const rowNum = i + 2; // +2 because Excel is 1-indexed and we skip header
        try {
          const phone = row.phone?.toString().trim();
          const bundleName = row.bundleName?.toString().trim();
          const bundleId = row.bundleId?.toString().trim();
          if (!phone || !bundleName || !bundleId) {
            errors.push(`Row ${rowNum}: Missing phone, bundleName, or bundleId`);
            continue;
          }
          // Validate phone number
          const normalizedPhone = normalizePhoneNumber(phone);
          if (!isValidPhoneLength(normalizedPhone)) {
            errors.push(`Row ${rowNum}: Invalid phone number format: ${phone}`);
            continue;
          }
          // Validate bundle exists
          const bundle = await storage.getDataBundle(bundleId);
          if (!bundle || !bundle.isActive) {
            errors.push(`Row ${rowNum}: Bundle not found or inactive: ${bundleId}`);
            continue;
          }
          // Validate network matches phone
          const networkFromPhone = detectNetwork(normalizedPhone);
          if (networkFromPhone !== bundle.network) {
            errors.push(`Row ${rowNum}: Phone network (${networkFromPhone}) doesn't match bundle network (${bundle.network})`);
            continue;
          }
          orderItems.push({
            phone: normalizedPhone,
            bundleName: bundleName,
            bundleId: bundleId,
            dataAmount: bundleName.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i)?.[1] || '',
          });
        } catch (error: any) {
          errors.push(`Row ${rowNum}: ${error.message}`);
        }
      }
      if (orderItems.length === 0) {
        return res.status(400).json({ error: "No valid order items found in Excel file" });
      }
      // Check for duplicate phone numbers in bulk upload
      const phoneNumbers = orderItems.map(item => item.phone);
      const duplicatePhones = phoneNumbers.filter((phone, index) => phoneNumbers.indexOf(phone) !== index);
      const uniqueDuplicates = [...new Set(duplicatePhones)];
      if (uniqueDuplicates.length > 0) {
        console.error(`[BulkUpload] Duplicate phone numbers found: ${uniqueDuplicates.join(', ')}`);
        return res.status(400).json({
          error: `Duplicate phone numbers detected in bulk upload: ${uniqueDuplicates.join(', ')}. Each phone number can only appear once per bulk purchase.`,
          duplicatePhones: uniqueDuplicates
        });
      }
      // Get authenticated user
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      // Check if any bundle is for AT iShare network (bulk purchases not allowed)
      const hasAtIshareBundle = orderItems.some(item => {
        // We already validated bundles exist, so we can safely get them
        // But to avoid extra DB calls, we'll check during price calculation
        return false; // Will check during the loop below
      });
      // Calculate total amount and prepare order items with prices
      let totalAmount = 0;
      const processedOrderItems: any[] = [];
      let computedAgentProfit = 0;
      for (const item of orderItems) {
        const bundle = await storage.getDataBundle(item.bundleId);
        if (!bundle) continue;
        // Check for AT iShare bundles
        if (bundle.network === "at_ishare") {
          return res.status(400).json({ error: "Bulk purchases are not available for AT iShare network" });
        }
        // Determine final selling price. For agents, REQUIRE an explicit agent_sell_price (custom price).
        let itemPrice = parseFloat(bundle.basePrice);
        let adminPrice = parseFloat(bundle.adminPrice || bundle.basePrice || '0');
        if (user.role === 'agent') {
          const resolvedPrice = await storage.getResolvedPrice(bundle.id, user.id, 'agent');
          if (!resolvedPrice) {
            return res.status(400).json({ error: `No pricing available for bundle ${bundle.name} (${bundle.id}).` });
          }
          itemPrice = parseFloat(resolvedPrice);
          const adminBasePrice = await storage.getRoleBasePrice(bundle.id, 'agent');
          adminPrice = adminBasePrice ? parseFloat(adminBasePrice) : parseFloat(bundle.basePrice || '0');
        } else if (user.role === 'dealer') {
          const resolvedPrice = await storage.getResolvedPrice(bundle.id, user.id, 'dealer');
          itemPrice = resolvedPrice ? parseFloat(resolvedPrice) : parseFloat(bundle.basePrice || '0');
        } else if (user.role === 'super_dealer') {
          const resolvedPrice = await storage.getResolvedPrice(bundle.id, user.id, 'super_dealer');
          itemPrice = resolvedPrice ? parseFloat(resolvedPrice) : parseFloat(bundle.basePrice || '0');
        } else if (user.role === 'master') {
          const resolvedPrice = await storage.getResolvedPrice(bundle.id, user.id, 'master');
          itemPrice = resolvedPrice ? parseFloat(resolvedPrice) : parseFloat(bundle.basePrice || '0');
        }
        // Compute agent commission per item (selling price - admin base price)
        if (user.role === 'agent') {
          computedAgentProfit += Math.max(0, itemPrice - adminPrice);
        }
        processedOrderItems.push({
          ...item,
          price: itemPrice,
        });
        totalAmount += itemPrice;
      }
      // Check wallet balance for registered users
      if (user.role !== 'guest') {
        const userData = await storage.getUser(user.id);
        if (!userData) {
          return res.status(404).json({ error: "User not found" });
        }
        // Check wallet balance (use integer arithmetic to avoid floating point precision issues)
        const walletBalanceCents = Math.round(parseFloat(userData.walletBalance) * 100);
        const totalAmountCents = Math.round(totalAmount * 100);
        if (walletBalanceCents < totalAmountCents) {
          return res.status(400).json({
            error: `Insufficient wallet balance. Required: GHS ${(totalAmountCents / 100).toFixed(2)}, Available: GHS ${(walletBalanceCents / 100).toFixed(2)}`
          });
        }
      }
      // Create transaction
      const reference = generateReference();
      const transaction = await storage.createTransaction({
        reference,
        type: "data_bundle",
        productId: null, // Bulk order
        productName: `Bulk Data Bundle Purchase (${orderItems.length} items)`,
        network: null,
        amount: totalAmount.toFixed(2),
        profit: "0.00", // Will be calculated per item
        customerPhone: user.phone || "",
        customerEmail: user.email,
        phoneNumbers: JSON.stringify(processedOrderItems),
        isBulkOrder: true,
        status: "pending",
        agentId: user.role === 'agent' ? user.id : undefined,
        agentProfit: user.role === 'agent' ? computedAgentProfit.toFixed(2) : "0.00",
      });
      // Deduct from wallet if registered user
      if (user.role !== 'guest') {
        const userData = await storage.getUser(user.id);
        if (userData) {
          const currentBalanceCents = Math.round(parseFloat(userData.walletBalance) * 100);
          const totalAmountCents = Math.round(totalAmount * 100);
          const newBalanceCents = currentBalanceCents - totalAmountCents;
          const newBalance = newBalanceCents / 100;
          await storage.updateUser(user.id, { walletBalance: newBalance.toFixed(2) });
        }
      }
      // Mark transaction as completed immediately for wallet payments
      await storage.updateTransaction(transaction.id, {
        status: "completed",
        completedAt: new Date(),
        paymentReference: "wallet",
      });
      // Financial integrity: credit agent only their profit, and record admin revenue separately
      if (user.role === 'agent' && parseFloat(transaction.agentProfit || "0") > 0) {
        const agentProfitValue = parseFloat(transaction.agentProfit || "0");
        const adminRevenue = parseFloat((parseFloat(transaction.amount) - agentProfitValue).toFixed(2));
        // Safety check
        if (Math.abs(agentProfitValue + adminRevenue - parseFloat(transaction.amount)) > 0.01) {
          console.error("AGENT_PROFIT_MISMATCH detected for transaction", transaction.id);
          throw new Error("AGENT_PROFIT_MISMATCH");
        }
        // Credit agent balance with PROFIT only
        await storage.updateAgentBalance(user.id, agentProfitValue, true);
        // Record admin revenue as its own transaction for accounting
        const adminRef = `ADMINREV-${transaction.reference}`;
        await storage.createTransaction({
          reference: adminRef,
          type: "admin_revenue",
          productId: null,
          productName: `Admin revenue for bulk transaction ${transaction.reference}`,
          network: null,
          amount: adminRevenue.toFixed(2),
          profit: "0.00",
          customerPhone: "",
          customerEmail: null,
          isBulkOrder: false,
          status: "completed",
          paymentStatus: "paid",
        });
      }
      // Process delivery for bulk orders
      const autoProcessingEnabled = (await storage.getSetting("data_bundle_auto_processing")) === "true";
      if (autoProcessingEnabled) {
        // Process each item
        for (const item of processedOrderItems) {
          try {
            // This would call the provider API for each item
            // For now, mark as delivered since it's wallet payment
            await storage.updateTransactionDeliveryStatus(transaction.id, "delivered");
          } catch (error) {
            console.error("Bulk delivery error:", error);
          }
        }
      } else {
        // Manual processing - keep as pending
        await storage.updateTransactionDeliveryStatus(transaction.id, "pending");
      }
      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          amount: transaction.amount,
          productName: transaction.productName,
          status: "completed",
          deliveryStatus: autoProcessingEnabled ? "delivered" : "pending",
        },
        totalRows: jsonData.length,
        processedItems: orderItems.length,
        errors: errors,
        message: `Bulk purchase completed successfully. ${orderItems.length} items processed${errors.length > 0 ? `. ${errors.length} validation errors found.` : ''}`
      });
    } catch (error: any) {
      console.error('Excel bulk purchase error:', error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });
  app.post("/api/checkout/initialize", async (req, res) => {
    try {
      // Validate input
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }

      // ENFORCE PAYSTACK-ONLY FOR STOREFRONT PURCHASES
      if (req.body.agentSlug) {
        console.log("[Checkout] Storefront purchase detected - enforcing Paystack-only payment");
        // Storefront purchases must go through Paystack for proper agent accounting
        // No wallet payments allowed for agent storefronts
      }

      console.log("[Checkout] ========== REQUEST PARSING ==========");
      console.log("[Checkout] Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("[Checkout] req.body.phoneNumbers type:", typeof req.body.phoneNumbers);
      console.log("[Checkout] req.body.phoneNumbers is array:", Array.isArray(req.body.phoneNumbers));
      console.log("[Checkout] req.body.phoneNumbers value:", req.body.phoneNumbers);
      const data = purchaseSchema.parse(req.body);
      console.log("[Checkout] Parsed data:", JSON.stringify(data, null, 2));
      console.log("[Checkout] data.phoneNumbers type:", typeof data.phoneNumbers);
      console.log("[Checkout] data.phoneNumbers is array:", Array.isArray(data.phoneNumbers));
      console.log("[Checkout] data.phoneNumbers:", data.phoneNumbers);
      console.log("[Checkout] data.isBulkOrder:", data.isBulkOrder);
      console.log("[Checkout] ================================================");
      // Normalize and validate phone number format (only if provided)
      let normalizedPhone: string | undefined;
      if (data.customerPhone) {
        normalizedPhone = normalizePhoneNumber(data.customerPhone);
        if (!isValidPhoneLength(normalizedPhone)) {
          return res.status(400).json({
            error: "Invalid phone number length. Phone number must be exactly 10 digits including the prefix (e.g., 0241234567)"
          });
        }
      }
      // Validate email format if provided
      if (data.customerEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.customerEmail)) {
          return res.status(400).json({ error: "Invalid email format" });
        }
      }
      let product: any;
      let productName: string;
      let amount: number;
      let costPrice: number;
      let agentProfit: number = 0;
      let network: string | null = null;
      // Handle new bulk format with orderItems
      if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) {
        console.log("[Checkout] ========== NEW BULK FORMAT DETECTED ==========");
        console.log("[Checkout] orderItems:", data.orderItems);
        console.log("[Checkout] ================================================");
        // Use the first item for initial product info
        const firstItem = data.orderItems[0];
        product = await storage.getDataBundle(firstItem.bundleId);
        if (!product || !product.isActive) {
          return res.status(404).json({ error: "Bundle not found" });
        }
        // Get network from data or product
        network = data.network || product.network;
        // Validate all phone numbers match the network
        for (const item of data.orderItems) {
          const normalizedItemPhone = normalizePhoneNumber(item.phone);
          if (!normalizedItemPhone || !isValidPhoneLength(normalizedItemPhone)) {
            console.error(`[BulkOrder] Invalid phone number: ${item.phone}`);
            return res.status(400).json({ error: `Invalid phone number: ${item.phone}` });
          }
          if (!validatePhoneNetwork(normalizedItemPhone, network!)) {
            const errorMsg = getNetworkMismatchError(normalizedItemPhone, network!);
            console.error(`[BulkOrder] Network mismatch for phone: ${item.phone} | Error: ${errorMsg}`);
            return res.status(400).json({ error: errorMsg });
          }
        }
        // Check for duplicate phone numbers in bulk order
        const phoneNumbers = data.orderItems.map(item => normalizePhoneNumber(item.phone));
        const duplicatePhones = phoneNumbers.filter((phone, index) => phoneNumbers.indexOf(phone) !== index);
        const uniqueDuplicates = [...new Set(duplicatePhones)];
        if (uniqueDuplicates.length > 0) {
          console.error(`[BulkOrder] Duplicate phone numbers found: ${uniqueDuplicates.join(', ')}`);
          return res.status(400).json({
            error: `Duplicate phone numbers detected in bulk order: ${uniqueDuplicates.join(', ')}. Each phone number can only appear once per bulk purchase.`,
            duplicatePhones: uniqueDuplicates
          });
        }
        // Calculate total amount from orderItems. For agent storefronts, REQUIRE agent_sell_price per item.
        costPrice = 0;
        amount = 0;
        let computedAgentProfit = 0;
        // If this request targets an agent storefront, resolve the agent and enforce explicit agent prices
        let storefrontAgent: any = null;
        if (data.agentSlug) {
          storefrontAgent = await storage.getAgentBySlug(data.agentSlug);
          if (!storefrontAgent || !storefrontAgent.isApproved) {
            return res.status(400).json({ error: "Invalid agent storefront" });
          }
        }
        for (const item of data.orderItems) {
          const bundle = await storage.getDataBundle(item.bundleId);
          if (!bundle) {
            console.error(`[BulkOrder] Bundle not found for bundleId: ${item.bundleId}`);
            return res.status(400).json({ error: `Bundle not found for bundleId: ${item.bundleId}` });
          }
          // For agent storefront, use resolved price (custom or admin base)
          let itemPrice: number;
          if (storefrontAgent) {
            const resolvedPrice = await storage.getResolvedPrice(bundle.id, storefrontAgent.id, 'agent');
            if (!resolvedPrice) {
              return res.status(400).json({ error: `No pricing available for bundle ${bundle.name}` });
            }
            itemPrice = parseFloat(resolvedPrice);
          } else {
            // For non-agent purchases, use admin base price
            const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
            itemPrice = adminBasePrice ? parseFloat(adminBasePrice) : parseFloat(bundle.basePrice || '0');
          }
          amount += itemPrice;
          // Calculate profit as selling price - agent base price for agents, or admin base price for others
          const basePriceValue = storefrontAgent
            ? await storage.getRoleBasePrice(bundle.id, 'agent')
            : await storage.getAdminBasePrice(bundle.id);
          const basePrice = basePriceValue ? parseFloat(basePriceValue) : parseFloat(bundle.basePrice || '0');
          const profit = itemPrice - basePrice;
          computedAgentProfit += Math.max(0, profit); // Profit is 0 if using admin price
        }
        // store computed agent profit for later use
        agentProfit = computedAgentProfit;
        console.log("[Checkout] Bulk order total amount (from orderItems):", amount);
        console.log("[Checkout] Bulk order total cost price:", costPrice);
        productName = `Bulk Order - ${data.orderItems.length} items`;
      } else if (data.productId && data.productType === ProductType.DATA_BUNDLE) {
        product = await storage.getDataBundle(data.productId);
        if (!product || !product.isActive) {
          return res.status(404).json({ error: "Product not found" });
        }
        // Validate that phone number matches the selected network (only if phone provided)
        if (normalizedPhone && !validatePhoneNetwork(normalizedPhone, product.network)) {
          const errorMsg = getNetworkMismatchError(normalizedPhone, product.network);
          return res.status(400).json({ error: errorMsg });
        }
        // Apply role-based pricing for single purchases
        let userRole = 'guest';
        let agentId: string | undefined;
        // Check for agent storefront
        if (data.agentSlug) {
          const agent = await storage.getAgentBySlug(data.agentSlug);
          if (agent && agent.isApproved) {
            userRole = 'agent';
            agentId = agent.id;
            // Use resolved price for agent storefront
            const resolvedPrice = await storage.getResolvedPrice(data.productId, agent.id, 'agent');
            if (!resolvedPrice) {
              return res.status(400).json({ error: "No pricing available for this product" });
            }
            amount = parseFloat(resolvedPrice);
            // Calculate profit as selling price - agent base price
            const agentBasePrice = await storage.getRoleBasePrice(data.productId, 'agent');
            const basePrice = agentBasePrice ? parseFloat(agentBasePrice) : parseFloat(product.basePrice || '0');
            agentProfit = Math.max(0, amount - basePrice); // Profit is 0 if using admin price
          } else {
            amount = parseFloat(product.adminPrice || product.basePrice || '0');
          }
        } else {
          // Check authenticated user role
          let dbUser: any = null;
          try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
              const token = authHeader.substring(7);
              const supabaseServer = getSupabase();
              if (supabaseServer) {
                const { data: { user }, error } = await supabaseServer.auth.getUser(token);
                if (!error && user && user.email) {
                  dbUser = await storage.getUserByEmail(user.email);
                  if (dbUser) {
                    userRole = dbUser.role;
                  }
                }
              }
            }
          } catch (authError) {
            // Ignore auth errors, treat as guest
          }
          // Apply role-based pricing for direct purchases
          if (userRole !== 'guest' && dbUser) {
            const resolvedPrice = await storage.getResolvedPrice(data.productId, dbUser.id, userRole);
            if (resolvedPrice) {
              amount = parseFloat(resolvedPrice);
            } else {
              amount = parseFloat(product.adminPrice || product.basePrice || '0');
            }
          } else {
            amount = parseFloat(product.basePrice || '0');
          }
        }
        productName = `${product.network.toUpperCase()} ${product.dataAmount} - ${product.validity}`;
        costPrice = 0; // Cost price removed from schema
        network = product.network;
        // Validate amount from frontend
        const expectedAmount = amount;
        if (data.amount) {
          const frontendAmount = parseFloat(data.amount);
          console.log("[Checkout] Frontend amount:", frontendAmount);
          console.log("[Checkout] Backend expected amount:", expectedAmount);
          if (Math.abs(frontendAmount - expectedAmount) > 0.01) {
            return res.status(400).json({ error: "Price mismatch. Please refresh and try again." });
          }
          amount = frontendAmount; // Use frontend amount if validation passes
        }
        console.log("[Checkout] Single purchase pricing:");
        console.log("[Checkout] admin_price:", product.adminPrice);
        console.log("[Checkout] agent_price:", product.agentPrice);
        console.log("[Checkout] user_role:", userRole);
        console.log("[Checkout] final_amount:", amount);
      } else if (data.productId) {
        const [type, yearStr] = data.productId.split("-");
        const year = parseInt(yearStr);
        product = await storage.getAvailableResultChecker(type, year);
        if (!product) {
          return res.status(404).json({ error: "No stock available" });
        }
        productName = `${type.toUpperCase()} ${year} Result Checker`;
        amount = parseFloat(product.basePrice);
        costPrice = 0; // Cost price removed from schema
      } else {
        return res.status(400).json({ error: "Product ID or order items required" });
      }
      let agentId: string | undefined;
      if (data.agentSlug) {
        const agent = await storage.getAgentBySlug(data.agentSlug);
        if (agent && agent.isApproved) {
          agentId = agent.id;
          // For bulk orders with orderItems, profit is already calculated
          if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) {
            // For bulk orders using orderItems, `agentProfit` was already computed above
            // and represents the total profit for the whole bulk (sum of (agentPrice - adminPrice)).
            console.log("[Checkout] Bulk order computed agent profit:", agentProfit);
          }
          // For single orders, profit is already calculated above for agent storefronts
          if (data.productType === ProductType.DATA_BUNDLE && data.productId) {
            // Profit already calculated above for agent storefronts
            // For non-agent purchases, no agent profit
          } else {
            // For result checkers, profit already calculated above for agent storefronts
          }
        }
      }
      const reference = generateReference();
      // Handle bulk orders - store full order items with GB info
      const phoneNumbersData = data.orderItems
        ? data.orderItems.map((item: any) => ({
            phone: item.phone,
            bundleName: item.bundleName,
            dataAmount: item.bundleName.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i)?.[1] || '',
          }))
        : data.phoneNumbers;
      const isBulkOrder = !!(data.isBulkOrder || (data.orderItems && data.orderItems.length > 0));
      // Validate that bulk orders are not allowed for AT iShare network
      if (isBulkOrder && network === "at_ishare") {
        return res.status(400).json({ error: "Bulk purchases are not available for AT iShare network" });
      }
      console.log("[Checkout] ========== RAW DATA EXTRACTION ==========");
      console.log("[Checkout] data object keys:", Object.keys(data));
      console.log("[Checkout] data.phoneNumbers value:", data.phoneNumbers);
      console.log("[Checkout] data.orderItems:", data.orderItems);
      console.log("[Checkout] phoneNumbersData value:", phoneNumbersData);
      console.log("[Checkout] phoneNumbersData type:", typeof phoneNumbersData);
      console.log("[Checkout] phoneNumbersData is array:", Array.isArray(phoneNumbersData));
      console.log("[Checkout] data.isBulkOrder value:", isBulkOrder);
      console.log("[Checkout] ================================================");
      // Calculate number of recipients with multiple checks
      let numberOfRecipients = 1;
      // Primary check: phoneNumbersData is a valid array with items
      if (Array.isArray(phoneNumbersData) && phoneNumbersData.length > 0) {
        numberOfRecipients = phoneNumbersData.length;
        console.log("[Checkout] ✓ Using phoneNumbersData array length:", numberOfRecipients);
      }
      // Secondary check: orderItems array
      else if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) {
        numberOfRecipients = data.orderItems.length;
        console.log("[Checkout] ✓ Using orderItems array length:", numberOfRecipients);
      }
      // Tertiary check: isBulkOrder flag is true and phoneNumbersData exists
      else if (isBulkOrder === true && phoneNumbersData) {
        if (Array.isArray(phoneNumbersData)) {
          numberOfRecipients = phoneNumbersData.length || 1;
          console.log("[Checkout] ✓ Using isBulkOrder flag with array, length:", numberOfRecipients);
        } else if (typeof phoneNumbersData === 'object') {
          // Fallback: Try to convert to array
          try {
            const phoneArray = Array.from(phoneNumbersData as any);
            numberOfRecipients = phoneArray.length || 1;
            console.log("[Checkout] ✓ Converted phoneNumbersData to array, length:", numberOfRecipients);
          } catch (e) {
            console.log("[Checkout] ⚠ Failed to convert phoneNumbersData to array, defaulting to 1");
            numberOfRecipients = 1;
          }
        } else {
          console.log("[Checkout] ⚠ isBulkOrder is true but phoneNumbersData is not an array:", typeof phoneNumbersData);
          numberOfRecipients = 1;
        }
      }
      // If still 1 recipient but isBulkOrder is true, log warning
      else if (isBulkOrder === true) {
        console.log("[Checkout] ⚠ WARNING: isBulkOrder is true but phoneNumbersData is missing or invalid!");
        console.log("[Checkout] ⚠ phoneNumbersData:", phoneNumbersData);
        console.log("[Checkout] ⚠ Defaulting to 1 recipient - THIS MAY BE A BUG!");
      }
      console.log("[Checkout] ========== BULK ORDER CALCULATION ==========");
      console.log("[Checkout] phoneNumbersData is array:", Array.isArray(phoneNumbersData));
      console.log("[Checkout] phoneNumbersData length:", (phoneNumbersData as any)?.length);
      console.log("[Checkout] isBulkOrder flag:", isBulkOrder);
      console.log("[Checkout] FINAL numberOfRecipients:", numberOfRecipients);
      console.log("[Checkout] Unit price (amount):", amount);
      console.log("[Checkout] Unit cost price:", costPrice);
      console.log("[Checkout] ================================================");
      // Calculate total amount for bulk orders
      // For orderItems format, amount is already the total
      const totalAmount = data.orderItems ? amount : (amount * numberOfRecipients);
      const totalCostPrice = 0;
      const totalProfit = agentProfit * numberOfRecipients; // Actual profit = selling_price - base_price
      const totalAgentProfit = agentProfit * numberOfRecipients;
      console.log("[Checkout] ========== CALCULATED TOTALS ==========");
      console.log("[Checkout] Total amount (", amount, " * ", numberOfRecipients, "):", totalAmount);
      console.log("[Checkout] Total cost price:", totalCostPrice);
      console.log("[Checkout] Total profit:", totalProfit);
      console.log("[Checkout] Total agent profit:", totalAgentProfit);
      console.log("[Checkout] ================================================");
      const transaction = await storage.createTransaction({
        reference,
        type: data.productType,
        productId: product.id,
        productName,
        network,
        amount: totalAmount.toFixed(2),
        profit: totalProfit.toFixed(2),
        customerPhone: normalizedPhone || null,
        customerEmail: data.customerEmail,
        phoneNumbers: (isBulkOrder && phoneNumbersData) ? JSON.stringify(phoneNumbersData) : undefined,
        isBulkOrder: isBulkOrder || false,
        status: TransactionStatus.PENDING,
        paymentStatus: "pending",
        agentId,
        agentProfit: totalAgentProfit.toFixed(2),
      });
      // Handle wallet payments immediately
      if (data.paymentMethod === 'wallet') {
        // BLOCK WALLET PAYMENTS FOR STOREFRONT PURCHASES
        if (data.agentSlug) {
          console.log("[Checkout] Blocking storefront purchase via wallet - agentSlug:", data.agentSlug);
          return res.status(400).json({
            error: "Storefront purchases must be made through Paystack for proper agent accounting"
          });
        }
        console.log("[Checkout] Processing wallet payment for reference:", reference);
        // Get authenticated user
        let dbUser: any = null;
        try {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const supabaseServer = getSupabase();
            if (supabaseServer) {
              const { data: { user }, error } = await supabaseServer.auth.getUser(token);
              if (!error && user && user.email) {
                dbUser = await storage.getUserByEmail(user.email);
              }
            }
          }
        } catch (authError) {
          console.error("[Checkout] Auth error for wallet payment:", authError);
          return res.status(401).json({ error: "Authentication required for wallet payments" });
        }
        if (!dbUser) {
          return res.status(401).json({ error: "User not found" });
        }
        // Check wallet balance (use integer arithmetic to avoid floating point precision issues)
        const walletBalanceCents = Math.round(parseFloat(dbUser.walletBalance || "0") * 100);
        const totalAmountCents = Math.round(totalAmount * 100);
        if (walletBalanceCents < totalAmountCents) {
          return res.status(400).json({
            error: "Insufficient wallet balance",
            balance: (walletBalanceCents / 100).toFixed(2),
            required: (totalAmountCents / 100).toFixed(2),
          });
        }
        // Update transaction for wallet payment
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.CONFIRMED,
          paymentStatus: "paid",
          paymentMethod: "wallet",
        });
        // Deduct from wallet (use same precision handling as balance check)
        const newBalanceCents = walletBalanceCents - totalAmountCents;
        const newBalance = newBalanceCents / 100;
        await storage.updateUser(dbUser.id, { walletBalance: newBalance.toFixed(2) });
        // Process the order immediately
        let deliveredPin: string | undefined;
        let deliveredSerial: string | undefined;
        if (transaction.type === ProductType.RESULT_CHECKER && transaction.productId) {
          const checker = await storage.getResultChecker(transaction.productId);
          if (checker && !checker.isSold) {
            await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
            deliveredPin = checker.pin;
            deliveredSerial = checker.serialNumber;
          }
        } else if (transaction.type === ProductType.DATA_BUNDLE) {
          // Process data bundle through API
          console.log("[Checkout] Processing data bundle transaction via API:", transaction.reference);
          const fulfillmentResult = await fulfillDataBundleTransaction(transaction);
          if (!fulfillmentResult.success) {
            console.error("[Checkout] Data bundle API fulfillment failed:", fulfillmentResult.error);
            // Still mark as completed but log the error
            await storage.updateTransaction(transaction.id, {
              failureReason: `API fulfillment failed: ${fulfillmentResult.error}`,
            });
          }
        }
        // Mark transaction as completed
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          deliveredPin,
          deliveredSerial,
        });
        // Credit agent if applicable
        if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
          const agentProfitValue = parseFloat(transaction.agentProfit || "0");
          await storage.updateAgentBalance(transaction.agentId, agentProfitValue, true);
          // Also credit agent's profit wallet for withdrawals
          const agent = await storage.getAgent(transaction.agentId);
          if (agent) {
            let profitWallet = await storage.getProfitWallet(agent.userId);
            if (!profitWallet) {
              profitWallet = await storage.createProfitWallet({
                userId: agent.userId,
                availableBalance: "0.00",
                pendingBalance: "0.00",
                totalEarned: "0.00",
              });
            }
            const newAvailableBalance = (parseFloat(profitWallet.availableBalance) + agentProfitValue).toFixed(2);
            const newTotalEarned = (parseFloat(profitWallet.totalEarned) + agentProfitValue).toFixed(2);
            await storage.updateProfitWallet(agent.userId, {
              availableBalance: newAvailableBalance,
              totalEarned: newTotalEarned,
            });
          }
        }
        return res.json({
          success: true,
          transaction: {
            id: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount,
            productName: transaction.productName,
            status: TransactionStatus.COMPLETED,
            deliveredPin,
            deliveredSerial,
          },
          newBalance: newBalance.toFixed(2),
        });
      }
      // Initialize Paystack payment
      const customerEmail = data.customerEmail || (normalizedPhone ? `${normalizedPhone}@clectech.com` : `result-checker-${reference}@clectech.com`);
      // Use frontend URL for callback instead of backend URL
      const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      const callbackUrl = `${frontendUrl}/checkout/success?reference=${reference}`;
      console.log("[Checkout] Paystack initialization:", {
        totalAmount,
        amountInPesewas: Math.round(totalAmount * 100),
        reference
      });
      try {
        const paystackResponse = await initializePayment({
          email: customerEmail,
          amount: Math.round(totalAmount * 100), // Convert GHS to pesewas
          reference: reference,
          callbackUrl: callbackUrl,
          metadata: {
            transactionId: transaction.id,
            productName: productName,
            customerPhone: normalizedPhone || null,
            isBulkOrder: isBulkOrder || false,
            numberOfRecipients: numberOfRecipients,
          },
        });
        console.log("[Checkout] Paystack response received:", {
          authorization_url: paystackResponse.data.authorization_url,
          access_code: paystackResponse.data.access_code
        });
        res.json({
          transaction: {
            id: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount,
            productName: transaction.productName,
          },
          paymentUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
          debug: {
            phoneNumbers: phoneNumbersData,
            isBulkOrder: isBulkOrder,
            numberOfRecipients: numberOfRecipients,
            unitPrice: amount,
            totalAmount: totalAmount,
            amountSentToPaystack: Math.round(totalAmount * 100),
          }
        });
      } catch (paystackError: any) {
        console.error("[Checkout] Paystack initialization failed:", paystackError);
        console.error("[Checkout] Error details:", {
          message: paystackError.message,
          phoneNumbers: phoneNumbersData,
          numberOfRecipients: numberOfRecipients,
          totalAmount: totalAmount
        });
        // If Paystack fails, clean up the transaction
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.FAILED,
        });
        return res.status(500).json({
          error: paystackError.message || "Payment initialization failed",
          debug: {
            phoneNumbers: phoneNumbersData,
            numberOfRecipients: numberOfRecipients,
            totalAmount: totalAmount,
          }
        });
      }
    } catch (error: any) {
      console.error("[Checkout] General error:", error);
      res.status(400).json({
        error: error.message || "Checkout failed",
        debug: {
          error: error.toString()
        }
      });
    }
  });
  app.get("/api/transactions/verify/:reference", async (req, res) => {
    try {
      console.log("[Verify] Starting verification for reference:", req.params.reference);
      const transaction = await storage.getTransactionByReference(req.params.reference);
      if (!transaction) {
        console.log("[Verify] Transaction not found:", req.params.reference);
        return res.status(404).json({ error: "Transaction not found" });
      }
      console.log("[Verify] Transaction status:", transaction.status);
      if (transaction.status === TransactionStatus.COMPLETED) {
        console.log("[Verify] Transaction already completed");
        return res.json({
          success: true,
          transaction: {
            reference: transaction.reference,
            productName: transaction.productName,
            amount: transaction.amount,
            status: transaction.status,
            deliveredPin: transaction.deliveredPin,
            deliveredSerial: transaction.deliveredSerial,
          },
        });
      }
      // Verify payment with Paystack API with retry logic
      console.log("[Verify] Calling Paystack API for verification");
      let paystackVerification;
      let retryCount = 0;
      const maxRetries = 2;
      while (retryCount < maxRetries) {
        try {
          paystackVerification = await verifyPayment(req.params.reference);
          console.log(`[Verify] Paystack response (attempt ${retryCount + 1}):`, paystackVerification.data.status);
          if (paystackVerification.data.status === "success") {
            break; // Payment successful, exit retry loop
          }
          // If not successful and not last retry, wait before trying again
          if (retryCount < maxRetries - 1) {
            console.log(`[Verify] Payment status is ${paystackVerification.data.status}, waiting 1s before retry...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          retryCount++;
        } catch (error: any) {
          console.error(`[Verify] Paystack API error (attempt ${retryCount + 1}):`, error.message);
          if (retryCount < maxRetries - 1) {
            console.log("[Verify] Retrying after error...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
          } else {
            throw error; // Re-throw on last attempt
          }
        }
      }
      if (!paystackVerification || paystackVerification.data.status !== "success") {
        // Payment not successful after retries - update payment status to failed
        const status = paystackVerification?.data.status || "unknown";
        console.log("[Verify] Payment not successful after retries, final status:", status);
        // Update transaction payment status to failed
        await storage.updateTransaction(transaction.id, {
          paymentStatus: status === "abandoned" ? "cancelled" : "failed"
        });
        return res.json({
          success: false,
          status: status,
          message: paystackVerification?.data.gateway_response || "Payment verification in progress",
          transaction: {
            reference: transaction.reference,
            status: transaction.status,
          }
        });
      }
      // Payment successful - fulfill the order
      console.log("[Verify] Payment successful, fulfilling order");
      let deliveredPin: string | undefined;
      let deliveredSerial: string | undefined;
      if (transaction.type === ProductType.RESULT_CHECKER && transaction.productId) {
        const checker = await storage.getResultChecker(transaction.productId);
        if (checker && !checker.isSold) {
          await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
          deliveredPin = checker.pin;
          deliveredSerial = checker.serialNumber;
          console.log("[Verify] Result checker delivered");
        }
      }
      // Update transaction as completed
      await storage.updateTransaction(transaction.id, {
        status: TransactionStatus.COMPLETED,
        paymentStatus: "paid",
        completedAt: new Date(),
        deliveredPin,
        deliveredSerial,
        paymentReference: paystackVerification.data.reference,
      });
      console.log("[Verify] Transaction updated to completed");
      // Credit agent if applicable and record admin revenue
      if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
        const agentProfitValue = parseFloat(transaction.agentProfit || "0");
        const totalPaid = parseFloat(transaction.amount || "0");
        const adminRevenue = parseFloat((totalPaid - agentProfitValue).toFixed(2));
        // Safety check
        if (Math.abs(agentProfitValue + adminRevenue - totalPaid) > 0.01) {
          console.error("INVALID_BULK_PAYOUT detected for webhook transaction", transaction.reference);
          throw new Error("INVALID_BULK_PAYOUT");
        }
        await storage.updateAgentBalance(transaction.agentId, agentProfitValue, true);
        console.log("[Verify] Agent credited");
        // Also credit agent's profit wallet for withdrawals
        const agent = await storage.getAgent(transaction.agentId);
        if (agent) {
          let profitWallet = await storage.getProfitWallet(agent.userId);
          if (!profitWallet) {
            profitWallet = await storage.createProfitWallet({
              userId: agent.userId,
              availableBalance: "0.00",
              pendingBalance: "0.00",
              totalEarned: "0.00",
            });
          }
          const newAvailableBalance = (parseFloat(profitWallet.availableBalance) + agentProfitValue).toFixed(2);
          const newTotalEarned = (parseFloat(profitWallet.totalEarned) + agentProfitValue).toFixed(2);
          await storage.updateProfitWallet(agent.userId, {
            availableBalance: newAvailableBalance,
            totalEarned: newTotalEarned,
          });
        }
        // Record admin revenue transaction
        const adminRef = `ADMINREV-${transaction.reference}`;
        await storage.createTransaction({
          reference: adminRef,
          type: "admin_revenue",
          productId: null,
          productName: `Admin revenue for transaction ${transaction.reference}`,
          network: null,
          amount: adminRevenue.toFixed(2),
          profit: "0.00",
          customerPhone: "",
          customerEmail: null,
          isBulkOrder: false,
          status: TransactionStatus.COMPLETED,
          paymentStatus: "paid",
        });
      }
      // Process data bundle transactions through API
      if (transaction.type === ProductType.DATA_BUNDLE) {
        console.log("[Verify] Processing data bundle transaction via API:", transaction.reference);
        const fulfillmentResult = await fulfillDataBundleTransaction(transaction);
        if (fulfillmentResult.success) {
          console.log("[Verify] Data bundle API fulfillment successful:", fulfillmentResult);
        } else {
          console.error("[Verify] Data bundle API fulfillment failed:", fulfillmentResult.error);
          // Update transaction with error note but keep as completed since payment was successful
          await storage.updateTransaction(transaction.id, {
            failureReason: `API fulfillment failed: ${fulfillmentResult.error}`,
          });
        }
      }
      console.log("[Verify] Verification complete, sending success response");
      res.json({
        success: true,
        transaction: {
          reference: transaction.reference,
          productName: transaction.productName,
          amount: transaction.amount,
          status: TransactionStatus.COMPLETED,
          deliveredPin,
          deliveredSerial,
        },
      });
    } catch (error: any) {
      console.error("[Verify] Payment verification error:", error.message || error);
      res.status(500).json({ error: error.message || "Verification failed" });
    }
  });
  // Paystack Payment Verification (for frontend callback)
  app.get("/api/paystack/verify", async (req, res) => {
    try {
      const reference = req.query.reference as string;
      if (!reference) {
        return res.status(400).json({ error: "Payment reference is required" });
      }
      console.log("Verifying payment reference:", reference);
      try {
        // Verify payment with Paystack
        const verificationResult = await verifyPayment(reference);
        if (!verificationResult.status) {
          console.log("Payment verification failed for reference:", reference);
          return res.json({ status: "failed", message: "Payment verification failed" });
        }
        const paymentData = verificationResult.data;
        console.log("Payment data received:", { status: paymentData.status, reference: paymentData.reference });
        // Handle cancelled or abandoned payments
        if (paymentData.status === "abandoned") {
          console.log("Payment was cancelled or abandoned:", reference);
          return res.json({
            status: "cancelled",
            message: "Payment was cancelled. Please try again if you wish to complete your registration."
          });
        }
        if (paymentData.status === "success") {
        const metadata = paymentData.metadata as any;
        // Check if this is a pending agent registration (new flow - account not created yet)
        if (metadata && metadata.pending_registration && metadata.registration_data) {
          console.log("Processing pending agent registration after payment success");
          console.log("Registration data:", metadata.registration_data);
          const supabaseServer = getSupabase();
          if (!supabaseServer) {
            console.error("Supabase not configured");
            return res.json({ status: "failed", message: "Server configuration error" });
          }
          const regData = metadata.registration_data;
          // Check if user already exists (idempotency check for duplicate verification calls)
          const existingUser = await storage.getUserByEmail(regData.email);
          if (existingUser && existingUser.role === 'agent') {
            console.log("User already exists as agent, returning existing account details");
            const existingAgent = await storage.getAgentByUserId(existingUser.id);
            if (existingAgent) {
              // Ensure the agent is approved after successful payment
              if (!existingAgent.isApproved) {
                await storage.updateAgent(existingAgent.id, { isApproved: true });
                console.log("Updated existing agent to approved");
              }
              return res.json({
                status: "success",
                message: "Agent account already created successfully. Please login with your credentials.",
                data: {
                  reference: paymentData.reference,
                  amount: paymentData.amount,
                  paidAt: paymentData.paid_at,
                  agent: {
                    id: existingAgent.id,
                    businessName: existingAgent.businessName,
                    storefrontSlug: existingAgent.storefrontSlug
                  },
                  user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    name: existingUser.name,
                    role: existingUser.role
                  }
                }
              });
            }
          } else if (existingUser && existingUser.role !== 'agent') {
            console.log("User exists but not agent, upgrading to agent");
            // Update user role to agent
            await storage.updateUser(existingUser.id, { role: UserRole.AGENT });
            // Create agent record
            const agent = await storage.createAgent({
              userId: existingUser.id,
              storefrontSlug: regData.storefrontSlug,
              businessName: regData.businessName,
              isApproved: true,
              paymentPending: false,
            });
            console.log("Agent created for existing user:", agent.id);
            // Create transaction record
            const activationFee = 60.00;
            const transaction = await storage.createTransaction({
              reference: paymentData.reference,
              type: ProductType.AGENT_ACTIVATION,
              productId: agent.id,
              productName: "Agent Account Activation",
              network: null,
              amount: activationFee.toString(),
              profit: activationFee.toString(),
              customerPhone: regData.phone,
              customerEmail: regData.email,
              paymentMethod: "paystack",
              status: TransactionStatus.COMPLETED,
              paymentStatus: "paid",
              paymentReference: paymentData.reference,
              agentId: null,
              agentProfit: "0.00",
            });
            return res.json({
              status: "success",
              message: "Payment verified and agent account upgraded successfully. Please login with your credentials.",
              data: {
                reference: paymentData.reference,
                amount: paymentData.amount,
                paidAt: paymentData.paid_at,
                agent: {
                  id: agent.id,
                  businessName: agent.businessName,
                  storefrontSlug: agent.storefrontSlug,
                },
                user: {
                  id: existingUser.id,
                  email: existingUser.email,
                  name: existingUser.name,
                  role: 'agent',
                }
              }
            });
          }
          // Now create the account after successful payment
          try {
            console.log("Step 1: Checking if user already exists in Supabase");
            const { data: existingUsers } = await supabaseServer.auth.admin.listUsers();
            const existingAuthUser = existingUsers?.users.find(u => u.email === regData.email);

            let userId: string;
            if (existingAuthUser) {
              console.log("User already exists in Supabase:", existingAuthUser.id);
              userId = existingAuthUser.id;
            } else {
              console.log("Step 1: Creating user in Supabase Auth:", regData.email);
              const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
                email: regData.email,
                password: regData.password,
                user_metadata: {
                  name: regData.name,
                  phone: regData.phone,
                  role: 'agent'
                },
                email_confirm: true
              });
              if (authError) {
                console.error("Step 1 FAILED: Auth user creation error:", authError);
                console.error("Auth error details:", JSON.stringify(authError, null, 2));
                return res.json({
                  status: "failed",
                  message: "Payment successful but account creation failed. Please contact support.",
                  error: authError.message
                });
              }
              userId = authData.user.id;
              console.log("Step 1 SUCCESS: Supabase user created:", userId);
            }

            // Check if user already exists in local database
            const existingLocalUser = await storage.getUserByEmail(regData.email);
            if (existingLocalUser) {
              console.log("User already exists in local database:", existingLocalUser.id);
              // Update the user role if needed
              if (existingLocalUser.role !== UserRole.AGENT) {
                await storage.updateUser(existingLocalUser.id, { role: UserRole.AGENT });
                console.log("Updated user role to agent");
              }
            } else {
              // Create user in local database
              console.log("Step 2: Creating user in local database");
              const localUser = await storage.createUser({
                id: userId,
                email: regData.email,
                password: '', // Empty password since auth is handled by Supabase
                name: regData.name,
                phone: regData.phone,
                role: UserRole.AGENT,
              });
              console.log("Step 2 SUCCESS: User created in local database:", localUser.id);
            }

            // Check if agent already exists
            const existingAgent = await storage.getAgentByUserId(userId);
            let agent;
            if (existingAgent) {
              console.log("Agent already exists:", existingAgent.id);
              // Update agent to approved if not already
              if (!existingAgent.isApproved) {
                agent = await storage.updateAgent(existingAgent.id, {
                  isApproved: true,
                  paymentPending: false
                });
                console.log("Updated agent to approved");
              } else {
                agent = existingAgent;
              }
            } else {
              // Create agent record (already approved since payment is complete)
              console.log("Step 3: Creating agent record");
              agent = await storage.createAgent({
                userId: userId,
                storefrontSlug: regData.storefrontSlug,
                businessName: regData.businessName,
                isApproved: true, // Approved since payment is successful
                paymentPending: false,
              });
              console.log("Step 3 SUCCESS: Agent created and approved:", agent.id);
            }

            // Ensure agent is defined before proceeding
            if (!agent) {
              throw new Error("Failed to create or update agent");
            }

            // Create transaction record for the activation payment (only if it doesn't exist)
            const existingTransaction = await storage.getTransactionByReference(paymentData.reference);
            if (!existingTransaction) {
              console.log("Step 4: Recording activation transaction");
              const activationFee = 60.00;
              const transaction = await storage.createTransaction({
                reference: paymentData.reference,
                type: ProductType.AGENT_ACTIVATION,
                productId: agent.id,
                productName: "Agent Account Activation",
                network: null,
                amount: activationFee.toString(),
                profit: activationFee.toString(),
                customerPhone: regData.phone,
                customerEmail: regData.email,
                paymentMethod: "paystack",
                status: TransactionStatus.COMPLETED,
                paymentStatus: "paid",
                paymentReference: paymentData.reference,
                agentId: null,
                agentProfit: "0.00",
              });
              console.log("Step 4 SUCCESS: Activation transaction recorded:", transaction.id);
            } else {
              console.log("Transaction already exists for reference:", paymentData.reference);
            }

            // Generate success response
            console.log("Step 5: Preparing success response");
            const response = {
              status: "success",
              message: "Payment verified and agent account created successfully. Please login with your credentials.",
              data: {
                reference: paymentData.reference,
                amount: paymentData.amount,
                paidAt: paymentData.paid_at,
                agent: {
                  id: agent.id,
                  businessName: agent.businessName,
                  storefrontSlug: agent.storefrontSlug,
                },
                user: {
                  id: userId,
                  email: regData.email,
                  name: regData.name,
                  role: 'agent',
                }
              }
            };
            console.log("Step 5 SUCCESS: Sending success response");
            return res.json(response);
          } catch (createError: any) {
            console.error("ERROR in account creation process:", createError);
            console.error("Error message:", createError.message);
            console.error("Error stack:", createError.stack);
            console.error("Error code:", createError.code);

            return res.json({
              status: "failed",
              message: "Payment successful but account creation failed. Please contact support with this reference: " + paymentData.reference,
              error: createError.message,
              reference: paymentData.reference
            });
          }
        }
        // Check if this is an agent activation payment (old flow - account already exists)
        if (metadata && metadata.purpose === "agent_activation" && metadata.agent_id) {
          console.log("Agent activation payment verified (old flow):", metadata.agent_id);
          // Update transaction status
          if (metadata.transaction_id) {
            await storage.updateTransaction(metadata.transaction_id, {
              status: TransactionStatus.COMPLETED,
              completedAt: new Date(),
              paymentReference: paymentData.reference,
            });
            console.log("Activation transaction marked as completed:", metadata.transaction_id);
          }
          // Auto-approve the agent and mark payment as received
          const agent = await storage.updateAgent(metadata.agent_id, {
            isApproved: true,
            paymentPending: false,
          });
          if (agent) {
            console.log("Agent auto-approved after payment verification:", agent.id);
            // Update user role to agent
            const updatedUser = await storage.updateUser(agent.userId, { role: UserRole.AGENT });
            if (updatedUser) {
              console.log("User role updated to agent:", updatedUser.id);
            } else {
              console.error("Failed to update user role to agent for user:", agent.userId);
            }
          }
        }
        return res.json({
          status: "success",
          message: "Payment verified successfully",
          data: {
            reference: paymentData.reference,
            amount: paymentData.amount,
            paidAt: paymentData.paid_at
          }
        });
      } else {
        return res.json({
          status: "failed",
          message: `Payment status: ${paymentData.status}`
        });
      }
      } catch (verifyError: any) {
        console.error("Error in payment verification process:", verifyError);
        console.error("Error stack:", verifyError.stack);
        return res.json({
          status: "failed",
          message: "Payment verification failed. Please try again.",
          error: verifyError.message
        });
      }
    } catch (error: any) {
      console.error("Payment verification error (outer catch):", error);
      console.error("Error stack:", error.stack);
      return res.json({
        status: "failed",
        message: error.message || "Verification failed"
      });
    }
  });
  // Process webhook events asynchronously
  async function processWebhookEvent(event: any) {
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const metadata = data.metadata;
      // Check if this is an agent activation payment
      if (metadata && metadata.purpose === "agent_activation") {
        // Handle new flow - pending registration (account not created yet)
        if (metadata.pending_registration && metadata.registration_data) {
          console.log("Processing pending agent registration via webhook:", reference);
          const supabaseServer = getSupabase();
          if (!supabaseServer) {
            console.error("Supabase not initialized for webhook");
            return;
          }
          const regData = metadata.registration_data;
          try {
            // Check if agent already exists
            const existingAgent = await storage.getAgentBySlug(regData.storefrontSlug);
            if (existingAgent) {
              console.log("Agent already exists for slug:", regData.storefrontSlug);
              return;
            }
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
              email: regData.email,
              password: regData.password,
              user_metadata: {
                name: regData.name,
                phone: regData.phone,
                role: 'agent'
              },
              email_confirm: true
            });
            if (authError) {
              console.error("Failed to create auth user in webhook:", authError);
              return;
            }
            const userId = authData.user.id;
            console.log("User created via webhook:", userId);
            // Check if user already exists in local database
            const existingUser = await storage.getUser(userId);
            if (!existingUser) {
              // Create user in local database
              await storage.createUser({
                id: userId,
                email: regData.email,
                password: '',
                name: regData.name,
                phone: regData.phone,
                role: UserRole.AGENT,
              });
            }
            // Create agent record (approved since payment is complete)
            const agent = await storage.createAgent({
              userId: userId,
              storefrontSlug: regData.storefrontSlug,
              businessName: regData.businessName,
              businessDescription: regData.businessDescription,
              isApproved: true,
              paymentPending: false,
            });
            console.log("Agent created via webhook:", agent.id);
            if (!agent) {
              console.error("Failed to create agent in webhook");
              return;
            }
            // Check if transaction already exists
            const existingTransaction = await storage.getTransactionByReference(reference);
            if (!existingTransaction) {
              // Create transaction record
              const activationFee = 60.00;
              await storage.createTransaction({
                reference: reference,
                type: ProductType.AGENT_ACTIVATION,
                productId: agent.id,
                productName: "Agent Account Activation",
                network: null,
                amount: activationFee.toString(),
                profit: activationFee.toString(),
                customerPhone: regData.phone,
                customerEmail: regData.email,
                paymentMethod: "paystack",
                status: TransactionStatus.COMPLETED,
                paymentReference: reference,
                agentId: null,
                agentProfit: "0.00",
              });
            }
            console.log("Agent registration completed via webhook");
          } catch (createError: any) {
            console.error("Error creating account in webhook:", createError);
          }
          return;
        }
        // Handle old flow - agent already exists
        if (metadata.agent_id) {
          console.log("Processing agent activation payment (old flow):", reference);
          // Update transaction status
          if (metadata.transaction_id) {
            await storage.updateTransaction(metadata.transaction_id, {
              status: TransactionStatus.COMPLETED,
              completedAt: new Date(),
              paymentReference: reference,
            });
            console.log("Activation transaction marked as completed:", metadata.transaction_id);
          }
          // Auto-approve the agent and mark payment as received
          const agent = await storage.updateAgent(metadata.agent_id, {
            isApproved: true,
            paymentPending: false,
          });
          if (agent) {
            console.log("Agent auto-approved after payment:", agent.id);
            // Update user role to agent
            const updatedUser = await storage.updateUser(agent.userId, { role: UserRole.AGENT });
            if (updatedUser) {
              console.log("User role updated to agent:", updatedUser.id);
            } else {
              console.error("Failed to update user role to agent for user:", agent.userId);
            }
          }
          return;
        }
      }
      // Handle regular transaction payments
      const transaction = await storage.getTransactionByReference(reference);
      if (!transaction) {
        console.error("Transaction not found for webhook:", reference);
        return;
      }
      if (transaction.status === TransactionStatus.COMPLETED) {
        return; // Already processed
      }
      // Fulfill the order
      let deliveredPin: string | undefined;
      let deliveredSerial: string | undefined;
      if (transaction.type === ProductType.RESULT_CHECKER && transaction.productId) {
        const [type, yearStr] = transaction.productId.split("-");
        const year = parseInt(yearStr);
        // Try to get an available pre-generated checker first
        let checker = await storage.getAvailableResultChecker(type, year);
        if (checker) {
          // Use pre-generated checker
          await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
          deliveredPin = checker.pin;
          deliveredSerial = checker.serialNumber;
        } else {
          // Generate PIN and serial automatically
          deliveredSerial = `RC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          deliveredPin = Math.random().toString(36).substring(2, 10).toUpperCase();
          // Create a new result checker record
          const newChecker = await storage.createResultChecker({
            type,
            year,
            serialNumber: deliveredSerial,
            pin: deliveredPin,
            basePrice: transaction.amount,
          });
          console.log("Auto-generated result checker via Paystack:", newChecker.id);
        }
      }
      await storage.updateTransaction(transaction.id, {
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(),
        deliveredPin,
        deliveredSerial,
        paymentReference: data.reference,
      });
      // Credit agent if applicable
      if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
        await storage.updateAgentBalance(transaction.agentId, parseFloat(transaction.agentProfit || "0"), true);
        // Also credit agent's profit wallet for withdrawals
        const agent = await storage.getAgent(transaction.agentId);
        if (agent) {
          let profitWallet = await storage.getProfitWallet(agent.userId);
          if (!profitWallet) {
            profitWallet = await storage.createProfitWallet({
              userId: agent.userId,
              availableBalance: "0.00",
              pendingBalance: "0.00",
              totalEarned: "0.00",
            });
          }
          const agentProfitValue = parseFloat(transaction.agentProfit || "0");
          const newAvailableBalance = (parseFloat(profitWallet.availableBalance) + agentProfitValue).toFixed(2);
          const newTotalEarned = (parseFloat(profitWallet.totalEarned) + agentProfitValue).toFixed(2);
          await storage.updateProfitWallet(agent.userId, {
            availableBalance: newAvailableBalance,
            totalEarned: newTotalEarned,
          });
        }
      }
      console.log("Payment processed via webhook:", reference);
    }
  }
  // Admin wallet top-up
  app.post("/api/admin/wallet/topup", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      if (!userId || !amount) {
        return res.status(400).json({ error: "User ID and amount are required" });
      }
      const topupAmount = parseFloat(amount);
      if (isNaN(topupAmount) || topupAmount <= 0 || topupAmount > 10000) {
        return res.status(400).json({ error: "Invalid amount (must be between 0.01 and 10,000)" });
      }
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Validate admin role
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      const adminId = req.user!.id;
      // Update user wallet balance
      const newBalance = (parseFloat(user.walletBalance || '0') + topupAmount).toFixed(2);
      await storage.updateUser(userId, { walletBalance: newBalance });
      // Create wallet topup transaction record
      await storage.createWalletTopupTransaction({
        userId,
        adminId,
        amount: topupAmount.toFixed(2),
        reason: reason || null,
      });
      // Create audit log
      await storage.createAuditLog({
        userId: adminId,
        action: 'wallet_topup',
        entityType: 'user',
        entityId: userId,
        oldValue: JSON.stringify({ walletBalance: user.walletBalance }),
        newValue: JSON.stringify({ walletBalance: newBalance, amount: topupAmount, reason }),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      res.json({
        success: true,
        message: `Successfully topped up ${user.name}'s wallet with GHS ${topupAmount.toFixed(2)}`,
        newBalance: (parseFloat(user.walletBalance || '0') + topupAmount).toFixed(2)
      });
    } catch (error: any) {
      console.error("Wallet topup error:", error);
      res.status(500).json({ error: "Failed to top up wallet" });
    }
  });
  // Get wallet topup transactions
  app.get("/api/admin/wallet/topup-transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getWalletTopupTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load wallet topup transactions" });
    }
  });
  // Paystack Webhook Handler
  app.post("/api/paystack/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      const rawBody = req.rawBody as Buffer;
      // Validate webhook signature using raw body
      if (!rawBody || !(await validateWebhookSignature(rawBody, signature))) {
        console.error("Invalid Paystack webhook signature");
        return res.status(400).json({ error: "Invalid signature" });
      }
      const event = req.body;
      // Process webhook asynchronously to prevent blocking
      setImmediate(async () => {
        try {
          await processWebhookEvent(event);
        } catch (webhookError: any) {
          console.error("Webhook processing error:", webhookError);
        }
      });
      // Always respond immediately to prevent Paystack retries
      res.sendStatus(200);
    } catch (error: any) {
      console.error("Webhook handler error:", error);
      res.sendStatus(200); // Always return 200 to prevent Paystack retries
    }
  });
  // ============================================
  // AGENT ROUTES
  // ============================================
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      /* --------------------------------------------------
         1. AUTH GUARD (ABSOLUTELY REQUIRED)
      -------------------------------------------------- */
      if (!req.user || !req.user.email) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log("Profile request for:", req.user.email);

      /* --------------------------------------------------
         2. LOAD USER (SOURCE OF TRUTH)
      -------------------------------------------------- */
      const dbUser = await storage.getUserByEmail(req.user.email);

      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const role = dbUser.role;
      const userDetails = await storage.getUser(dbUser.id);

      /* --------------------------------------------------
         3. ROLE: AGENT / DEALER / MASTER
      -------------------------------------------------- */
      if (
        role === UserRole.AGENT ||
        role === UserRole.DEALER ||
        role === UserRole.SUPER_DEALER ||
        role === UserRole.MASTER
      ) {
        const agent = await storage.getAgentByUserId(dbUser.id);

        /* ------------------------
           3A. AGENT EXISTS
        ------------------------ */
        if (agent) {
          const stats = await storage.getTransactionStats(agent.id);

          const withdrawals = await storage.getWithdrawals({
            userId: dbUser.id,
          });

          const withdrawnTotal = withdrawals
            .filter(w => w?.status === "paid")
            .reduce((sum, w) => sum + Number(w?.amount || 0), 0);

          const totalProfit = Number(agent.totalProfit || 0);
          const profitBalance = Math.max(0, totalProfit - withdrawnTotal);

          return res.json({
            profile: {
              ...agent,
              walletBalance: Number(dbUser.walletBalance || 0),
              profitBalance,
              totalWithdrawals: withdrawnTotal,
              role,
              user: {
                name: userDetails?.name ?? null,
                email: userDetails?.email ?? null,
                phone: userDetails?.phone ?? null,
              },
            },
            stats,
          });
        }

        /* ------------------------
           3B. NO AGENT RECORD YET
        ------------------------ */
        return res.json({
          profile: {
            id: dbUser.id,
            userId: dbUser.id,
            walletBalance: Number(dbUser.walletBalance || 0),
            profitBalance: 0,
            totalProfit: "0",
            totalSales: "0",
            balance: "0",
            totalWithdrawals: 0,
            role,
            storefrontSlug: null,
            businessName: null,
            businessDescription: null,
            isApproved: false,
            paymentPending: false,
            user: {
              name: userDetails?.name ?? null,
              email: userDetails?.email ?? null,
              phone: userDetails?.phone ?? null,
            },
          },
          stats: {
            total: 0,
            completed: 0,
            pending: 0,
            revenue: 0,
            profit: 0,
          },
        });
      }

      /* --------------------------------------------------
         4. OTHER ROLES (ADMIN ETC)
      -------------------------------------------------- */
      return res.json({
        profile: {
          id: dbUser.id,
          userId: dbUser.id,
          walletBalance: Number(dbUser.walletBalance || 0),
          profitBalance: 0,
          role,
          user: {
            name: userDetails?.name ?? null,
            email: userDetails?.email ?? null,
            phone: userDetails?.phone ?? null,
          },
        },
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          revenue: 0,
          profit: 0,
        },
      });

    } catch (err) {
      console.error("PROFILE API FATAL ERROR:", err);
      return res.status(500).json({ error: "Failed to load profile" });
    }
  });
  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { name, email, phone, whatsappSupportLink, whatsappChannelLink } = req.body;

      // Update user info (works for all roles)
      if (name !== undefined || email !== undefined || phone !== undefined) {
        await storage.updateUser(dbUser.id, {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
        });
      }

      // Update agent-specific info only if user has agent record
      const role = dbUser.role;
      if ((role === UserRole.AGENT || role === UserRole.DEALER || role === UserRole.SUPER_DEALER || role === UserRole.MASTER)) {
        const agent = await storage.getAgentByUserId(dbUser.id);
        if (agent && (whatsappSupportLink !== undefined || whatsappChannelLink !== undefined)) {
          await storage.updateAgent(agent.id, {
            ...(whatsappSupportLink !== undefined && { whatsappSupportLink }),
            ...(whatsappChannelLink !== undefined && { whatsappChannelLink }),
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app.get("/api/agent/transactions", requireAuth, requireAgent, async (req, res) => {
    try {
      // Get user from database using email from JWT
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Get agent transactions
      const agentTransactions = await storage.getTransactions({
        agentId: agent.id,
        limit: 100,
      });

      // Get wallet topup transactions for this user
      const walletTopups = await storage.getTransactions({
        customerEmail: dbUser.email,
        type: "wallet_topup",
        limit: 50,
      });

      // Combine and sort by createdAt descending
      const allTransactions = [...agentTransactions, ...walletTopups]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100); // Limit to 100 total

      res.json(allTransactions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load transactions" });
    }
  });
  app.get("/api/agent/stats", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const role = dbUser.role;
      let stats;

      if (role === UserRole.AGENT || role === UserRole.DEALER || role === UserRole.SUPER_DEALER || role === UserRole.MASTER) {
        const agent = await storage.getAgentByUserId(dbUser.id);
        if (agent) {
          // Full agent stats
          const transactions = await storage.getTransactions({ agentId: agent.id });
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayTransactions = transactions.filter(t => new Date(t.createdAt) >= today);
          const todayProfit = todayTransactions.reduce((sum, t) => sum + parseFloat(t.agentProfit || "0"), 0);
          stats = {
            balance: Number(dbUser.walletBalance) || 0, // Use user's wallet balance
            totalProfit: Number(agent.totalProfit) || 0,
            totalSales: Number(agent.totalSales) || 0,
            totalTransactions: transactions.length,
            todayProfit: Number(todayProfit.toFixed(2)),
            todayTransactions: todayTransactions.length,
          };
        } else {
          // Basic stats for users without agent records
          stats = {
            balance: Number(dbUser.walletBalance) || 0,
            totalProfit: 0,
            totalSales: 0,
            totalTransactions: 0,
            todayProfit: 0,
            todayTransactions: 0,
          };
        }
      } else {
        // Basic stats for other roles
        stats = {
          balance: Number(dbUser.walletBalance) || 0,
          totalProfit: 0,
          totalSales: 0,
          totalTransactions: 0,
          todayProfit: 0,
          todayTransactions: 0,
        };
      }

      console.log("Stats for role", role, ":", JSON.stringify(stats, null, 2));
      res.json(stats);
    } catch (error: any) {
      console.error("Error loading stats:", error);
      res.status(500).json({ error: "Failed to load stats" });
    }
  });
  // Get agent transaction stats
  app.get("/api/agent/transactions/stats", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Get agent transactions (for profit/revenue stats)
      const agentTransactions = await storage.getTransactions({ agentId: agent.id });

      // Get wallet topup transactions for this user
      const walletTopups = await storage.getTransactions({
        customerEmail: dbUser.email,
        type: "wallet_topup",
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate stats from agent transactions only (wallet topups don't generate agent profit)
      const todayAgentTransactions = agentTransactions.filter(t => new Date(t.createdAt) >= today);
      const totalRevenue = agentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalProfit = agentTransactions.reduce((sum, t) => sum + parseFloat(t.agentProfit || "0"), 0);

      // Include wallet topups in total transaction count
      const totalTransactions = agentTransactions.length + walletTopups.length;
      const todayTransactions = todayAgentTransactions.length + walletTopups.filter(t => new Date(t.createdAt) >= today).length;

      const stats = {
        totalTransactions,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        todayTransactions,
      };
      res.json(stats);
    } catch (error: any) {
      console.error("Error loading agent transaction stats:", error);
      res.status(500).json({ error: "Failed to load transaction stats" });
    }
  });
  app.get("/api/agent/transactions/recent", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const role = dbUser.role;
      let transactions: any[] = [];

      if (role === UserRole.AGENT || role === UserRole.DEALER || role === UserRole.SUPER_DEALER || role === UserRole.MASTER) {
        const agent = await storage.getAgentByUserId(dbUser.id);
        if (agent) {
          transactions = await storage.getTransactions({
            agentId: agent.id,
            limit: 10,
          });
        }
      }
      // For users without agent records or other roles, return empty array

      res.json(transactions);
    } catch (error: any) {
      console.error("Error loading recent transactions:", error);
      res.status(500).json({ error: "Failed to load recent transactions" });
    }
  });
  app.get("/api/agent/withdrawals", requireAuth, requireAgent, async (req, res) => {
    try {
      if (!req.user || !req.user.email) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const withdrawals = (await storage.getWithdrawals({ userId: dbUser.id })) || [];
      res.json(withdrawals);
    } catch (err) {
      console.error("GET /withdrawals error:", err);
      res.status(500).json({ error: "Failed to load withdrawals" });
    }
  });

  app.post("/api/agent/withdrawals", requireAuth, requireAgent, async (req, res) => {
    try {
      if (!req.user || !req.user.email) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const data = withdrawalRequestSchema.parse(req.body);

      // Validate min/max withdrawal
      if (data.amount < 10) {
        return res.status(400).json({ error: "Minimum withdrawal amount is GH₵10" });
      }
      if (data.amount > 100_000) {
        return res.status(400).json({ error: "Maximum withdrawal amount is GH₵100,000" });
      }

      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (!agent.isApproved) {
        return res.status(403).json({ error: "Agent not approved" });
      }

      const profitWallet = await storage.getProfitWallet(dbUser.id);
      const availableBalance = profitWallet ? parseFloat(profitWallet.availableBalance || "0") : 0;

      if (availableBalance < data.amount) {
        return res.status(400).json({
          error: "Insufficient profit wallet balance",
          balance: availableBalance.toFixed(2),
          requested: data.amount.toFixed(2),
        });
      }

      const withdrawal = await storage.createWithdrawal({
        userId: dbUser.id,
        amount: data.amount.toFixed(2),
        status: WithdrawalStatus.PENDING,
        paymentMethod: data.paymentMethod,
        bankName: "",
        bankCode: "",
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      });

      res.json({
        ...withdrawal,
        message: "Withdrawal request submitted successfully. It will be processed after admin approval.",
      });
    } catch (err: any) {
      console.error("POST /withdrawals error:", err);
      res.status(400).json({ error: err.message || "Withdrawal failed" });
    }
  });
  // Agent storefront management
  app.patch("/api/agent/storefront", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const { businessName, businessDescription, whatsappSupportLink, whatsappChannelLink } = req.body;
      const updatedAgent = await storage.updateAgent(agent.id, {
        businessName,
        businessDescription,
        whatsappSupportLink,
        whatsappChannelLink,
      });
      res.json(updatedAgent);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update storefront" });
    }
  });
  // Get agent custom pricing
  app.get("/api/agent/pricing", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const pricing = await storage.getCustomPricing(agent.id, 'agent');
      // Get admin base prices for display
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = pricing.find(p => p.productId === bundle.id);
        const adminBasePrice = await storage.getRoleBasePrice(bundle.id, 'agent');
        return {
          bundleId: bundle.id,
          agentPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          agentProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });
  // Update agent custom pricing
  app.post("/api/agent/pricing", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const { prices } = req.body;
      if (!prices || typeof prices !== 'object') {
        return res.status(400).json({ error: "Invalid pricing data" });
      }
      // Update or delete pricing for each bundle
      for (const [bundleId, priceData] of Object.entries(prices)) {
        const priceObj = priceData as { agentPrice?: string };
        if (!priceObj.agentPrice || priceObj.agentPrice.trim() === "") {
          // Delete pricing if price is empty
          await storage.deleteCustomPricing(bundleId, agent.id, 'agent');
        } else {
          // Set custom selling price
          await storage.setCustomPricing(bundleId, agent.id, 'agent', priceObj.agentPrice);
        }
      }
      // Return updated pricing
      const updatedPricing = await storage.getCustomPricing(agent.id, 'agent');
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = updatedPricing.find(p => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          agentPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          agentProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error: any) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });
  // Agent wallet stats
  app.get("/api/agent/wallet", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      // Get agent transactions for wallet topups and spending
      const transactions = await storage.getTransactions({
        agentId: agent.id,
      });
      // Filter wallet topups (when agents top up their user wallet)
      const walletTopups = transactions.filter(t => t.type === 'wallet_topup' && t.status === 'completed');
      const totalTopups = walletTopups.length;
      const totalTopupAmount = walletTopups.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      // Filter wallet payments (when agents spend from their user wallet)
      const walletPayments = transactions.filter(t => t.paymentMethod === 'wallet');
      const totalSpent = walletPayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      // Get last topup
      const lastTopup = walletTopups.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      // For agents, the "balance" refers to their profit balance (withdrawable profit)
      // Compute withdrawals sum (only include paid withdrawals)
      const withdrawals = await storage.getWithdrawals({ userId: dbUser.id });
      const withdrawnTotal = withdrawals
        .filter(w => w.status === 'paid')
        .reduce((s, w) => s + parseFloat((w.amount as any) || 0), 0);
      // Profit balance = totalProfit - totalWithdrawals (safety: never negative)
      const totalProfit = parseFloat(agent.totalProfit || '0');
      const profitBalance = Math.max(0, totalProfit - withdrawnTotal);
      res.json({
        balance: profitBalance.toFixed(2), // Agent's withdrawable profit balance
        totalTopups,
        totalTopupAmount: totalTopupAmount.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        lastTopupDate: lastTopup?.createdAt || null,
        lastTopupAmount: lastTopup?.amount || null,
      });
    } catch (error: any) {
      console.error("Error loading agent wallet stats:", error);
      res.status(500).json({ error: "Failed to load wallet stats" });
    }
  });
  // ============================================
  // DEALER PRICING ROUTES
  // ============================================
  // Get dealer custom pricing
  app.get("/api/dealer/pricing", requireAuth, requireDealer, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const pricing = await storage.getCustomPricing(dbUser.id, 'dealer');
      // Get admin base prices for display
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = pricing.find(p => p.productId === bundle.id);
        const adminBasePrice = await storage.getRoleBasePrice(bundle.id, 'dealer');
        return {
          bundleId: bundle.id,
          dealerPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          dealerProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });
  // Update dealer custom pricing
  app.post("/api/dealer/pricing", requireAuth, requireDealer, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { prices } = req.body;
      if (!prices || typeof prices !== 'object') {
        return res.status(400).json({ error: "Invalid pricing data" });
      }
      // Update or delete pricing for each bundle
      for (const [bundleId, priceData] of Object.entries(prices)) {
        const priceObj = priceData as { dealerPrice?: string };
        if (!priceObj.dealerPrice || priceObj.dealerPrice.trim() === "") {
          // Delete pricing if price is empty
          await storage.deleteCustomPricing(bundleId, dbUser.id, 'dealer');
        } else {
          // Set custom selling price
          await storage.setCustomPricing(bundleId, dbUser.id, 'dealer', priceObj.dealerPrice);
        }
      }
      // Return updated pricing
      const updatedPricing = await storage.getCustomPricing(dbUser.id, 'dealer');
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = updatedPricing.find(p => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          dealerPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          dealerProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error: any) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });
  // ============================================
  // SUPER-DEALER PRICING ROUTES
  // ============================================
  // Get super-dealer custom pricing
  app.get("/api/super-dealer/pricing", requireAuth, requireSuperDealer, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const pricing = await storage.getCustomPricing(dbUser.id, 'super_dealer');
      // Get admin base prices for display
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = pricing.find(p => p.productId === bundle.id);
        const adminBasePrice = await storage.getRoleBasePrice(bundle.id, 'super_dealer');
        return {
          bundleId: bundle.id,
          superDealerPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          superDealerProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });
  // Update super-dealer custom pricing
  app.post("/api/super-dealer/pricing", requireAuth, requireSuperDealer, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { prices } = req.body;
      if (!prices || typeof prices !== 'object') {
        return res.status(400).json({ error: "Invalid pricing data" });
      }
      // Update or delete pricing for each bundle
      for (const [bundleId, priceData] of Object.entries(prices)) {
        const priceObj = priceData as { superDealerPrice?: string };
        if (!priceObj.superDealerPrice || priceObj.superDealerPrice.trim() === "") {
          // Delete pricing if price is empty
          await storage.deleteCustomPricing(bundleId, dbUser.id, 'super_dealer');
        } else {
          // Set custom selling price
          await storage.setCustomPricing(bundleId, dbUser.id, 'super_dealer', priceObj.superDealerPrice);
        }
      }
      // Return updated pricing
      const updatedPricing = await storage.getCustomPricing(dbUser.id, 'super_dealer');
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = updatedPricing.find(p => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          superDealerPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          superDealerProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error: any) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });
  // ============================================
  // MASTER PRICING ROUTES
  // ============================================
  // Get master custom pricing
  app.get("/api/master/pricing", requireAuth, requireMaster, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const pricing = await storage.getCustomPricing(dbUser.id, 'master');
      // Get admin base prices for display
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = pricing.find(p => p.productId === bundle.id);
        const adminBasePrice = await storage.getRoleBasePrice(bundle.id, 'master');
        return {
          bundleId: bundle.id,
          masterPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          masterProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });
  // Update master custom pricing
  app.post("/api/master/pricing", requireAuth, requireMaster, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { prices } = req.body;
      if (!prices || typeof prices !== 'object') {
        return res.status(400).json({ error: "Invalid pricing data" });
      }
      // Update or delete pricing for each bundle
      for (const [bundleId, priceData] of Object.entries(prices)) {
        const priceObj = priceData as { masterPrice?: string };
        if (!priceObj.masterPrice || priceObj.masterPrice.trim() === "") {
          // Delete pricing if price is empty
          await storage.deleteCustomPricing(bundleId, dbUser.id, 'master');
        } else {
          // Set custom selling price
          await storage.setCustomPricing(bundleId, dbUser.id, 'master', priceObj.masterPrice);
        }
      }
      // Return updated pricing
      const updatedPricing = await storage.getCustomPricing(dbUser.id, 'master');
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = updatedPricing.find(p => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          masterPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          masterProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error: any) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });
  // ============================================
  // ADMIN ROUTES
  // ============================================
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load stats" });
    }
  });
  app.get("/api/admin/rankings/customers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topCustomers = await storage.getTopCustomers(limit);
      res.json(topCustomers);
    } catch (error: any) {
      console.error("Error fetching top customers:", error);
      res.status(500).json({ error: "Failed to load rankings" });
    }
  });
  // Public endpoint for rankings (visible to all users)
  app.get("/api/rankings/customers", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topCustomers = await storage.getTopCustomers(limit);
      // Include truncated email for public view (privacy-conscious)
      const publicRankings = topCustomers.map((customer, index) => {
        let truncatedEmail = "";
        if (customer.customerEmail) {
          const [localPart, domain] = customer.customerEmail.split("@");
          truncatedEmail = localPart.length > 2 ? localPart.substring(0, 2) + ".....@" + domain : customer.customerEmail;
        }
        return {
          rank: index + 1,
          customerPhone: customer.customerPhone ? (customer.customerPhone.length > 6 ? customer.customerPhone.substring(0, 6) + "......." : customer.customerPhone) : "",
          customerEmail: truncatedEmail,
          totalPurchases: customer.totalPurchases,
          totalSpent: customer.totalSpent,
        };
      });
      res.json(publicRankings);
    } catch (error: any) {
      console.error("Error fetching public rankings:", error);
      res.status(500).json({ error: "Failed to load rankings" });
    }
  });
  app.get("/api/admin/transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const transactions = await storage.getTransactions({ status, limit: 200 });
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load transactions" });
    }
  });
  app.patch("/api/admin/transactions/:id/delivery-status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { deliveryStatus } = req.body;
      if (!["pending", "processing", "delivered", "failed"].includes(deliveryStatus)) {
        return res.status(400).json({ error: "Invalid delivery status" });
      }
      const transaction = await storage.updateTransactionDeliveryStatus(req.params.id, deliveryStatus);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  });
  // Export transactions to CSV
  app.get("/api/admin/transactions/export", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { paymentStatus = 'all' } = req.query;
      let paymentStatusFilter: string[] | undefined;
      if (paymentStatus === 'paid') {
        paymentStatusFilter = ['paid'];
      } else if (paymentStatus === 'pending') {
        paymentStatusFilter = ['pending'];
      } else if (paymentStatus === 'all') {
        paymentStatusFilter = undefined; // No filter
      } else {
        return res.status(400).json({ error: "Invalid payment status filter. Use 'paid', 'pending', or 'all'" });
      }
      const transactions = await storage.getTransactionsForExport(paymentStatusFilter);
      const csvData = transactions.map(tx => ({
        reference: tx.reference,
        productName: tx.productName,
        network: tx.network,
        amount: tx.amount,
        profit: tx.profit,
        customerPhone: tx.customerPhone,
        customerEmail: tx.customerEmail,
        paymentStatus: tx.paymentStatus,
        deliveryStatus: tx.deliveryStatus || "pending",
        createdAt: tx.createdAt,
        completedAt: tx.completedAt || "",
        phoneNumbers: (tx.phoneNumbers && Array.isArray(tx.phoneNumbers)) ?
          tx.phoneNumbers.map((p: any) => p.phone).join("; ") :
          "",
        isBulkOrder: tx.isBulkOrder ? "Yes" : "No",
      }));
      res.json(csvData);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to export transactions" });
    }
  });
  app.get("/api/admin/agents", requireAuth, requireAdmin, async (req, res) => {
    try {
      const agents = await storage.getAgents();
      const agentsWithUsers = await Promise.all(agents.map(async (agent) => {
        const user = await storage.getUser(agent.userId);
        return {
          ...agent,
          user: user ? { name: user.name, email: user.email, phone: user.phone } : null,
        };
      }));
      res.json(agentsWithUsers);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load agents" });
    }
  });
  app.patch("/api/admin/agents/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { isApproved } = req.body;
      const agent = await storage.updateAgent(req.params.id, { isApproved });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update agent" });
    }
  });
  app.patch("/api/admin/agents/:id/whatsapp", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { whatsappSupportLink, whatsappChannelLink } = req.body;
      const agent = await storage.updateAgent(req.params.id, {
        whatsappSupportLink: whatsappSupportLink || null,
        whatsappChannelLink: whatsappChannelLink || null,
      });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update WhatsApp links" });
    }
  });
  // Delete agent
  app.delete("/api/admin/agents/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const supabaseServer = getSupabase();
      if (!supabaseServer) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      // Get the user associated with this agent
      const user = await storage.getUser(agent.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const userId = agent.userId;
      console.log(`Starting permanent deletion of agent ${req.params.id} and user ${userId}`);
      // Step 1: Delete from database first (will cascade to related records)
      console.log("Deleting agent from database...");
      await storage.deleteAgent(req.params.id);
      console.log("Agent deleted from database");
      console.log("Deleting user from database...");
      await storage.deleteUser(userId);
      console.log("User deleted from database");
      // Step 2: Delete from Supabase Auth (permanent deletion)
      console.log("Deleting user from Supabase Auth...");
      const { error: authError } = await supabaseServer.auth.admin.deleteUser(userId);
      if (authError) {
        console.error("Failed to delete user from Supabase Auth:", authError);
        return res.status(500).json({
          error: "User deleted from database but failed to delete from authentication. Please try again.",
          details: authError.message
        });
      }
      console.log(`User ${userId} permanently deleted from Supabase Auth`);
      res.json({
        message: "Agent and user permanently deleted from database and authentication",
        deletedAgentId: req.params.id,
        deletedUserId: userId
      });
    } catch (error: any) {
      console.error("Error deleting agent:", error);
      res.status(500).json({
        error: "Failed to delete agent",
        details: error.message
      });
    }
  });
  // Get all users with last purchase data
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const usersWithPurchaseData = await Promise.all(allUsers.map(async (user) => {
        // Get user's completed transactions by email
        const transactions = await storage.getTransactions({
          customerEmail: user.email,
          status: TransactionStatus.COMPLETED,
        });
        // Sort by date descending to get latest first
        const sortedTransactions = transactions.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const lastPurchase = sortedTransactions.length > 0 ? {
          date: sortedTransactions[0].createdAt,
          amount: parseFloat(sortedTransactions[0].amount),
          productType: sortedTransactions[0].type,
        } : null;
        const totalSpent = sortedTransactions.reduce((sum, t) =>
          sum + parseFloat(t.amount), 0
        );
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
          lastPurchase,
          totalPurchases: sortedTransactions.length,
          totalSpent,
        };
      }));
      res.json(usersWithPurchaseData);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load users" });
    }
  });
  // Delete user
  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const supabaseServer = getSupabase();
      if (!supabaseServer) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Prevent deleting admin users
      if (user.role === UserRole.ADMIN) {
        return res.status(403).json({ error: "Cannot delete admin users" });
      }
      const userId = req.params.id;
      console.log(`Starting permanent deletion of user ${userId}`);
      // Step 1: If user is an agent, delete the agent record first
      if (user.role === UserRole.AGENT) {
        const agent = await storage.getAgentByUserId(userId);
        if (agent) {
          console.log("Deleting agent record:", agent.id);
          await storage.deleteAgent(agent.id);
          console.log("Agent record deleted:", agent.id);
        }
      }
      // Step 2: Delete user from database
      console.log("Deleting user from database...");
      await storage.deleteUser(userId);
      console.log("User deleted from database");
      // Step 3: Delete from Supabase Auth (permanent deletion)
      console.log("Deleting user from Supabase Auth...");
      const { error: authError } = await supabaseServer.auth.admin.deleteUser(userId);
      if (authError) {
        console.error("Failed to delete user from Supabase Auth:", authError);
        return res.status(500).json({
          error: "User deleted from database but failed to delete from authentication. Please try again.",
          details: authError.message
        });
      }
      console.log(`User ${userId} permanently deleted from Supabase Auth`);
      res.json({
        message: "User permanently deleted from database and authentication",
        deletedUserId: userId
      });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        error: "Failed to delete user",
        details: error.message
      });
    }
  });
  // Update user role
  app.patch("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;
      // Validate role
      const validRoles = ["admin", "agent", "dealer", "super_dealer", "master", "user", "guest"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      // Get current user
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const oldRole = currentUser.role;
      // Update user role
      const user = await storage.updateUser(userId, { role });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Handle role change implications
      if (oldRole === 'agent' && role !== 'agent') {
        // User was an agent, now is not - deactivate agent record
        const agent = await storage.getAgentByUserId(userId);
        if (agent) {
          await storage.updateAgent(agent.id, { isApproved: false });
          console.log(`Deactivated agent record for user ${userId} due to role change from ${oldRole} to ${role}`);
        }
      } else if (oldRole !== 'agent' && oldRole !== 'dealer' && oldRole !== 'super_dealer' && oldRole !== 'master' && (role === 'agent' || role === 'dealer' || role === 'super_dealer' || role === 'master')) {
        // User is now an agent/dealer/super_dealer/master - check if agent record exists
        const existingAgent = await storage.getAgentByUserId(userId);
        if (!existingAgent) {
          // Create agent record with default values and auto approve
          await storage.createAgent({
            userId: userId,
            storefrontSlug: `${user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}${userId.slice(-4)}`,
            businessName: `${user.name || 'User'}'s Store`,
            isApproved: true, // Auto approve since admin changed role
            paymentPending: false, // No payment needed
          });
          console.log(`Created and auto-approved agent record for user ${userId} due to role change to ${role}`);
        } else if (!existingAgent.isApproved) {
          // Reactivate if exists but not approved
          await storage.updateAgent(existingAgent.id, { isApproved: true, paymentPending: false });
          console.log(`Reactivated agent record for user ${userId}`);
        }
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });
  // Delete inactive users by last purchase date
  app.delete("/api/admin/users/delete-inactive", requireAuth, requireAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string);
      if (!days || days <= 0) {
        return res.status(400).json({ error: "Invalid days parameter. Must be a positive integer." });
      }
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - days);
      const allUsers = await storage.getUsers();
      const supabaseServer = getSupabase();
      if (!supabaseServer) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      const inactiveUsers = [];
      for (const user of allUsers) {
        if (user.role === UserRole.ADMIN) continue; // Don't delete admins
        const transactions = await storage.getTransactions({
          customerEmail: user.email,
          status: TransactionStatus.COMPLETED,
        });
        if (transactions.length === 0) {
          // No purchases ever
          inactiveUsers.push(user);
        } else {
          const lastTransaction = transactions.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          if (new Date(lastTransaction.createdAt) < thresholdDate) {
            inactiveUsers.push(user);
          }
        }
      }
      let deletedCount = 0;
      const errors = [];
      for (const user of inactiveUsers) {
        try {
          console.log(`Deleting inactive user ${user.id}`);
          // Delete agent record if exists
          if (user.role === UserRole.AGENT) {
            const agent = await storage.getAgentByUserId(user.id);
            if (agent) {
              await storage.deleteAgent(agent.id);
            }
          }
          // Delete from database
          await storage.deleteUser(user.id);
          // Delete from Supabase Auth
          const { error: authError } = await supabaseServer.auth.admin.deleteUser(user.id);
          if (authError) {
            console.error(`Failed to delete user ${user.id} from Supabase Auth:`, authError);
            errors.push(`Failed to delete ${user.email} from auth: ${authError.message}`);
          } else {
            deletedCount++;
          }
        } catch (error: any) {
          console.error(`Error deleting user ${user.id}:`, error);
          errors.push(`Failed to delete ${user.email}: ${error.message}`);
        }
      }
      res.json({
        message: `Deleted ${deletedCount} inactive users`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error("Error deleting inactive users:", error);
      res.status(500).json({
        error: "Failed to delete inactive users",
        details: error.message
      });
    }
  });
  // ============================================
  // ANNOUNCEMENTS ROUTES
  // ============================================
  // Get all announcements
  app.get("/api/admin/announcements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load announcements" });
    }
  });
  // Create announcement
  app.post("/api/admin/announcements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title, message } = req.body;
      if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
      }
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const announcement = await storage.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        isActive: true,
        createdBy: dbUser.name || dbUser.email,
      });
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });
  // Update announcement
  app.patch("/api/admin/announcements/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { isActive } = req.body;
      const announcement = await storage.updateAnnouncement(req.params.id, { isActive });
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });
  // Delete announcement
  app.delete("/api/admin/announcements/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteAnnouncement(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json({ message: "Announcement deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });
  // Get active announcements for all users (public)
  app.get("/api/announcements/active", async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load announcements" });
    }
  });
  // Admin - Withdrawals Management
  app.get("/api/admin/withdrawals", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const withdrawals = await storage.getWithdrawals({
        status: status as string,
      });
      // Get user details for each withdrawal
      const withdrawalsWithUsers = await Promise.all(
        withdrawals.map(async (withdrawal) => {
          const user = await storage.getUser(withdrawal.userId);
          // Try to get agent info, but don't fail if it doesn't exist
          let agentInfo = null;
          try {
            const agent = await storage.getAgentByUserId(withdrawal.userId);
            if (agent) {
              agentInfo = { businessName: agent.businessName, storefrontSlug: agent.storefrontSlug };
            }
          } catch (error) {
            // Agent not found, continue without agent info
            console.log(`No agent record found for user ${withdrawal.userId}`);
          }
          return {
            ...withdrawal,
            user: user ? { name: user.name, email: user.email, phone: user.phone } : null,
            agent: agentInfo,
          };
        })
      );
      res.json({ withdrawals: withdrawalsWithUsers });
    } catch (error: any) {
      console.error("Admin withdrawals error:", error);
      res.status(500).json({ error: "Failed to load withdrawals" });
    }
  });
  // Admin - Data Bundles CRUD
  app.get("/api/admin/data-bundles", requireAuth, requireAdmin, async (req, res) => {
    try {
      const bundles = await storage.getDataBundles();
      res.json(bundles);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load data bundles" });
    }
  });
  app.post("/api/admin/data-bundles", requireAuth, requireAdmin, async (req, res) => {
    try {
      const bundle = await storage.createDataBundle(req.body);
      res.json(bundle);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create data bundle" });
    }
  });
  app.patch("/api/admin/data-bundles/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const bundle = await storage.updateDataBundle(req.params.id, req.body);
      if (!bundle) {
        return res.status(404).json({ error: "Data bundle not found" });
      }
      res.json(bundle);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update data bundle" });
    }
  });
  app.delete("/api/admin/data-bundles/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteDataBundle(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete data bundle" });
    }
  });
  // Admin - Role Base Prices Management
  app.get("/api/admin/role-base-prices", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roleBasePrices = await storage.getRoleBasePrices();
      res.json(roleBasePrices);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load role base prices" });
    }
  });
  app.post("/api/admin/role-base-prices", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { bundleId, role, basePrice } = req.body;
      if (!bundleId || !role || !basePrice) {
        return res.status(400).json({ error: "Bundle ID, role, and base price are required" });
      }
      const price = parseFloat(basePrice);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: "Invalid base price" });
      }
      // Validate role
      const validRoles = ['agent', 'dealer', 'super_dealer', 'master'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      await storage.setRoleBasePrice(bundleId, role, price.toFixed(2), req.user!.role!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to set role base price" });
    }
  });
  app.delete("/api/admin/role-base-prices/:bundleId/:role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { bundleId, role } = req.params;
      // Remove the role base price by setting it to null/empty
      await storage.setRoleBasePrice(bundleId, role, "0.00", req.user!.role!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete role base price" });
    }
  });
  // Admin - Result Checkers
  app.get("/api/admin/result-checkers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const isSold = req.query.isSold === "true" ? true : req.query.isSold === "false" ? false : undefined;
      const checkers = await storage.getResultCheckers({ type, year, isSold });
      res.json(checkers);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load result checkers" });
    }
  });
  app.post("/api/admin/result-checkers/bulk", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Validate input
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const { type, year, basePrice, costPrice, checkers: checkersStr } = req.body;
      if (!type || !year || !basePrice || !costPrice || !checkersStr) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Validate types
      if (typeof type !== 'string' || typeof checkersStr !== 'string') {
        return res.status(400).json({ error: "Invalid field types" });
      }
      // Validate numeric fields
      const yearNum = parseInt(year);
      const basePriceNum = parseFloat(basePrice);
      const costPriceNum = parseFloat(costPrice);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({ error: "Invalid year" });
      }
      if (isNaN(basePriceNum) || basePriceNum <= 0 || basePriceNum > 10000) {
        return res.status(400).json({ error: "Invalid base price" });
      }
      if (isNaN(costPriceNum) || costPriceNum <= 0 || costPriceNum > basePriceNum) {
        return res.status(400).json({ error: "Invalid cost price" });
      }
      const lines = checkersStr.split("\n").filter((line: string) => line.trim());
      const checkersData = lines.map((line: string) => {
        const [serialNumber, pin] = line.split(",").map((s: string) => s.trim());
        return {
          type,
          year: parseInt(year),
          serialNumber,
          pin,
          basePrice,
          costPrice,
        };
      }).filter((c: any) => c.serialNumber && c.pin);
      if (checkersData.length === 0) {
        return res.status(400).json({ error: "No valid checkers provided" });
      }
      const created = await storage.createResultCheckersBulk(checkersData);
      res.json({ added: created.length });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create result checkers" });
    }
  });
  app.get("/api/admin/result-checkers/summary", requireAuth, requireAdmin, async (req, res) => {
    try {
      const summary = await storage.getResultCheckerSummary();
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load summary" });
    }
  });
  app.put("/api/admin/result-checkers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { type, year, serialNumber, pin, basePrice } = req.body;
      const updateData: Partial<InsertResultChecker> = {};
      if (type !== undefined) updateData.type = type;
      if (year !== undefined) updateData.year = year;
      if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
      if (pin !== undefined) updateData.pin = pin;
      if (basePrice !== undefined) updateData.basePrice = basePrice;
      const checker = await storage.updateResultChecker(id, updateData);
      if (!checker) {
        return res.status(404).json({ error: "Result checker not found" });
      }
      res.json(checker);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update result checker" });
    }
  });
  app.delete("/api/admin/result-checkers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteResultChecker(id);
      if (!deleted) {
        return res.status(404).json({ error: "Result checker not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete result checker" });
    }
  });
  app.get("/api/admin/transactions/recent", requireAuth, requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getTransactions({ limit: 10 });
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load recent transactions" });
    }
  });
  // ============================================
  // SEED PRODUCTS (for initial setup - admin only)
  // ============================================
  app.post("/api/seed/products", requireAuth, requireAdmin, async (req, res) => {
    try {
      const existingBundles = await storage.getDataBundles({});
      const existingCheckers = await storage.getResultCheckers({});
      
      let bundlesSeeded = 0;
      let checkersSeeded = 0;
      
      // Seed data bundles if they don't exist
      if (existingBundles.length === 0) {
        const sampleBundles = [
          { name: "Daily Lite", network: "mtn", dataAmount: "500MB", validity: "1 Day", basePrice: "2.00", agentPrice: "1.80", dealerPrice: "1.70", superDealerPrice: "1.60", masterPrice: "1.50", adminPrice: "1.40" },
          { name: "Daily Plus", network: "mtn", dataAmount: "1GB", validity: "1 Day", basePrice: "3.50", agentPrice: "3.15", dealerPrice: "2.98", superDealerPrice: "2.80", masterPrice: "2.63", adminPrice: "2.45" },
          { name: "Weekly Basic", network: "mtn", dataAmount: "2GB", validity: "7 Days", basePrice: "8.00", agentPrice: "7.20", dealerPrice: "6.80", superDealerPrice: "6.40", masterPrice: "6.00", adminPrice: "5.60" },
          { name: "Weekly Pro", network: "mtn", dataAmount: "5GB", validity: "7 Days", basePrice: "15.00", agentPrice: "13.50", dealerPrice: "12.75", superDealerPrice: "12.00", masterPrice: "11.25", adminPrice: "10.50" },
          { name: "Monthly Starter", network: "mtn", dataAmount: "10GB", validity: "30 Days", basePrice: "25.00", agentPrice: "22.50", dealerPrice: "21.25", superDealerPrice: "20.00", masterPrice: "18.75", adminPrice: "17.50" },
          { name: "Monthly Premium", network: "mtn", dataAmount: "20GB", validity: "30 Days", basePrice: "45.00", agentPrice: "40.50", dealerPrice: "38.25", superDealerPrice: "36.00", masterPrice: "33.75", adminPrice: "31.50" },
          { name: "Daily Lite", network: "telecel", dataAmount: "500MB", validity: "1 Day", basePrice: "2.00", agentPrice: "1.80", dealerPrice: "1.70", superDealerPrice: "1.60", masterPrice: "1.50", adminPrice: "1.40" },
          { name: "Daily Plus", network: "telecel", dataAmount: "1GB", validity: "1 Day", basePrice: "3.50", agentPrice: "3.15", dealerPrice: "2.98", superDealerPrice: "2.80", masterPrice: "2.63", adminPrice: "2.45" },
          { name: "Weekly Basic", network: "telecel", dataAmount: "3GB", validity: "7 Days", basePrice: "10.00", agentPrice: "9.00", dealerPrice: "8.50", superDealerPrice: "8.00", masterPrice: "7.50", adminPrice: "7.00" },
          { name: "Weekly Pro", network: "telecel", dataAmount: "6GB", validity: "7 Days", basePrice: "18.00", agentPrice: "16.20", dealerPrice: "15.30", superDealerPrice: "14.40", masterPrice: "13.50", adminPrice: "12.60" },
          { name: "Monthly Basic", network: "telecel", dataAmount: "8GB", validity: "30 Days", basePrice: "22.00", agentPrice: "19.80", dealerPrice: "18.70", superDealerPrice: "17.60", masterPrice: "16.50", adminPrice: "15.40" },
          { name: "Monthly Plus", network: "telecel", dataAmount: "15GB", validity: "30 Days", basePrice: "38.00", agentPrice: "34.20", dealerPrice: "32.30", superDealerPrice: "30.40", masterPrice: "28.50", adminPrice: "26.60" },
          { name: "Daily Bundle", network: "at_bigtime", dataAmount: "500MB", validity: "1 Day", basePrice: "2.00", agentPrice: "1.80", dealerPrice: "1.70", superDealerPrice: "1.60", masterPrice: "1.50", adminPrice: "1.40" },
          { name: "Weekly Bundle", network: "at_bigtime", dataAmount: "2GB", validity: "7 Days", basePrice: "8.00", agentPrice: "7.20", dealerPrice: "6.80", superDealerPrice: "6.40", masterPrice: "6.00", adminPrice: "5.60" },
          { name: "Monthly Bundle", network: "at_bigtime", dataAmount: "5GB", validity: "30 Days", basePrice: "20.00", agentPrice: "18.00", dealerPrice: "17.00", superDealerPrice: "16.00", masterPrice: "15.00", adminPrice: "14.00" },
          { name: "Daily iShare", network: "at_ishare", dataAmount: "750MB", validity: "1 Day", basePrice: "2.50", agentPrice: "2.25", dealerPrice: "2.13", superDealerPrice: "2.00", masterPrice: "1.88", adminPrice: "1.75" },
          { name: "Weekly iShare", network: "at_ishare", dataAmount: "3GB", validity: "7 Days", basePrice: "10.00", agentPrice: "9.00", dealerPrice: "8.50", superDealerPrice: "8.00", masterPrice: "7.50", adminPrice: "7.00" },
          { name: "Monthly iShare", network: "at_ishare", dataAmount: "8GB", validity: "30 Days", basePrice: "25.00", agentPrice: "22.50", dealerPrice: "21.25", superDealerPrice: "20.00", masterPrice: "18.75", adminPrice: "17.50" },
        ];
        for (const bundle of sampleBundles) {
          await storage.createDataBundle(bundle);
        }
        bundlesSeeded = sampleBundles.length;
      }

      // Seed result checkers if they don't exist
      if (existingCheckers.length === 0) {
        const currentYear = new Date().getFullYear();
        const years = [currentYear, currentYear - 1, currentYear - 2];
        const sampleResultCheckers = [];
        
        for (const year of years) {
          for (const type of ["bece", "wassce"]) {
            // Create 10 sample result checkers for each type/year combination
            for (let i = 1; i <= 10; i++) {
              sampleResultCheckers.push({
                type,
                year,
                serialNumber: `${type.toUpperCase()}${year}${String(i).padStart(3, '0')}`,
                pin: `PIN${year}${String(i).padStart(3, '0')}`,
                basePrice: type === "bece" ? "15.00" : "25.00"
              });
            }
          }
        }

        for (const checker of sampleResultCheckers) {
          await storage.createResultChecker(checker);
        }
        checkersSeeded = sampleResultCheckers.length;
      }

      res.json({ 
        message: "Products seeded successfully", 
        dataBundles: bundlesSeeded || existingBundles.length,
        resultCheckers: checkersSeeded || existingCheckers.length,
        bundlesSeeded,
        checkersSeeded
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to seed products" });
    }
  });
  // ============================================
  // FILE UPLOAD ROUTES
  // ============================================
  app.post("/api/admin/upload/logo", requireAuth, requireAdmin, global.upload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/assets/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error: any) {
      res.status(500).json({ error: "Upload failed" });
    }
  });
  app.post("/api/admin/upload/banner", requireAuth, requireAdmin, global.upload.single("banner"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/assets/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error: any) {
      res.status(500).json({ error: "Upload failed" });
    }
  });
  app.post("/api/admin/upload/network-logo", requireAuth, requireAdmin, global.upload.single("networkLogo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/assets/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error: any) {
      res.status(500).json({ error: "Upload failed" });
    }
  });
  // ============================================
  // BREAK SETTINGS ROUTES
  // ============================================
  app.get("/api/admin/break-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getBreakSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load break settings" });
    }
  });
  app.post("/api/admin/break-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { isEnabled, enabled, message } = req.body;
      const finalIsEnabled = isEnabled !== undefined ? isEnabled : enabled;
      if (typeof finalIsEnabled !== 'boolean') {
        return res.status(400).json({ error: "isEnabled or enabled must be a boolean" });
      }
      if (finalIsEnabled && (!message || typeof message !== 'string' || message.trim().length === 0)) {
        return res.status(400).json({ error: "Message is required when break mode is enabled" });
      }
      const settings = await storage.updateBreakSettings({
        isEnabled: finalIsEnabled,
        message: message?.trim() || "",
      });
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update break settings" });
    }
  });
  // ============================================
  // ADMIN - TRANSACTIONS MANAGEMENT
  // ============================================
  // Get all transactions (admin view)
  app.get("/api/admin/transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const type = req.query.type as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions({
        status: status as any,
        type: type as any,
        limit,
      });
      // Add delivery status and phone numbers for admin view
      const transactionsWithDetails = transactions.map(tx => ({
        ...tx,
        deliveryStatus: (tx as any).deliveryStatus || "pending",
        phoneNumbers: (tx as any).phoneNumbers,
        isBulkOrder: (tx as any).isBulkOrder,
      }));
      res.json(transactionsWithDetails);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load transactions" });
    }
  });
  // Update delivery status for a transaction
  app.patch("/api/admin/transactions/:transactionId/delivery-status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { deliveryStatus } = req.body;
      if (!deliveryStatus || !["pending", "processing", "delivered", "failed"].includes(deliveryStatus)) {
        return res.status(400).json({ error: "Invalid delivery status" });
      }
      const transaction = await storage.updateTransaction(transactionId, { deliveryStatus });
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update delivery status" });
    }
  });
  // ============================================
  // ADMIN - API CONFIGURATION
  // ============================================
  app.get("/api/admin/api-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const keys = [
        "api.mtn.key",
        "api.mtn.endpoint",
        "api.telecel.key",
        "api.at_bigtime.key",
        "api.at_ishare.key",
        "paystack.secret_key",
        "paystack.public_key",
      ];
      const result: Record<string, string> = {};
      for (const k of keys) {
        const v = await storage.getSetting(k);
        if (v !== undefined) result[k] = v;
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load API configuration" });
    }
  });
  app.post("/api/admin/api-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const body = req.body || {};
      for (const [k, v] of Object.entries(body)) {
        if (typeof v === 'string') {
          await storage.setSetting(k, v);
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to save API configuration" });
    }
  });
  // Public endpoint for break settings (no auth required)
  app.get("/api/break-settings", async (req, res) => {
    try {
      const settings = await storage.getBreakSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load break settings" });
    }
  });
  // ============================================
  // USER ROUTES
  // ============================================
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      // Get user from database using email from JWT
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const transactions = await storage.getTransactions({
        customerEmail: req.user!.email,
        limit: 50,
      });
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load transactions" });
    }
  });
  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      // Get user from database using email from JWT
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const transactions = await storage.getTransactions({
        customerEmail: req.user!.email,
      });
      const totalOrders = transactions.length;
      const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      res.json({
        totalOrders,
        totalSpent: totalSpent.toFixed(2),
        walletBalance: dbUser.walletBalance || "0.00",
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load user stats" });
    }
  });
  // ============================================
  // PROFIT WALLET & WITHDRAWAL ROUTES
  // ============================================
  // Get profit wallet balance
  app.get("/api/user/profit-wallet", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      let wallet = await storage.getProfitWallet(dbUser.id);
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await storage.createProfitWallet({
          userId: dbUser.id,
          availableBalance: "0.00",
          pendingBalance: "0.00",
          totalEarned: "0.00",
        });
      }
      res.json({
        wallet,
        user: { name: dbUser.name, email: dbUser.email },
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load profit wallet" });
    }
  });
  // Get profit transactions
  app.get("/api/user/profit-transactions", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { status, limit } = req.query;
      const transactions = await storage.getProfitTransactions(dbUser.id, {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ transactions });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load profit transactions" });
    }
  });
  // Verify bank account
  app.post("/api/user/verify-bank-account", requireAuth, async (req, res) => {
    try {
      const { accountNumber, bankCode } = req.body;
      if (!accountNumber || !bankCode) {
        return res.status(400).json({ error: "Account number and bank code are required" });
      }
      const { resolveBankAccount } = await import("./paystack.js");
      const result = await resolveBankAccount(accountNumber, bankCode);
      res.json({
        accountName: result.data.account_name,
        accountNumber: result.data.account_number,
        bankCode,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to verify bank account" });
    }
  });
  // Request withdrawal
  app.post("/api/user/withdrawals", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { amount, accountNumber, accountName, bankCode, bankName } = req.body;
      // Validate amount
      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount < 10) {
        return res.status(400).json({ error: "Minimum withdrawal amount is GHS 10" });
      }
      // Get profit wallet
      const wallet = await storage.getProfitWallet(dbUser.id);
      if (!wallet) {
        return res.status(400).json({ error: "Profit wallet not found" });
      }
      // Check available balance (but don't deduct yet)
      const availableBalance = parseFloat(wallet.availableBalance);
      if (availableBalance < withdrawalAmount) {
        return res.status(400).json({
          error: "Insufficient available balance",
          available: availableBalance.toFixed(2),
          requested: withdrawalAmount.toFixed(2),
        });
      }
      // Create withdrawal request (funds are NOT deducted here)
      const withdrawal = await storage.createWithdrawal({
        userId: dbUser.id,
        amount: withdrawalAmount.toFixed(2),
        status: WithdrawalStatus.PENDING,
        paymentMethod: "bank",
        bankName,
        bankCode,
        accountNumber,
        accountName,
      });
      res.json({
        withdrawal,
        message: "Withdrawal request submitted successfully. It will be processed after admin approval.",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create withdrawal request" });
    }
  });
  // Get user withdrawals
  app.get("/api/user/withdrawals", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const withdrawals = await storage.getWithdrawals({ userId: dbUser.id });
      res.json({ withdrawals });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load withdrawals" });
    }
  });
  // Admin routes for withdrawal management

  // Admin approve/reject withdrawal
  app.patch("/api/admin/withdrawals/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { action, adminNote } = req.body; // action: "approve" | "reject"
      const withdrawal = await storage.getWithdrawal(id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (action === "approve") {
        // Check if withdrawal is pending
        if (withdrawal.status !== "pending") {
          return res.status(400).json({ error: "Withdrawal is not in pending status" });
        }
        // DO NOT deduct amount from profit wallet on approval
        // Balance will be deducted only when marked as paid
        // Update withdrawal status to approved
        await storage.updateWithdrawal(id, {
          status: WithdrawalStatus.APPROVED,
          approvedBy: req.user!.id,
          approvedAt: new Date(),
          adminNote,
        });
        res.json({
          message: "Withdrawal approved. Admin will manually send the money and mark as paid.",
          withdrawal: await storage.getWithdrawal(id),
        });
      } else if (action === "reject") {
        // Check if withdrawal is pending
        if (withdrawal.status !== "pending") {
          return res.status(400).json({ error: "Withdrawal is not in pending status" });
        }
        // Update withdrawal status to rejected
        await storage.updateWithdrawal(id, {
          status: WithdrawalStatus.REJECTED,
          rejectionReason: adminNote,
        });
        res.json({
          message: "Withdrawal rejected",
          withdrawal: await storage.getWithdrawal(id),
        });
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to process withdrawal" });
    }
  });
  // Admin approve withdrawal
  app.post("/api/admin/withdrawals/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNote } = req.body;
      const withdrawal = await storage.getWithdrawal(id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (withdrawal.status !== "pending") {
        return res.status(400).json({ error: "Withdrawal is not in pending status" });
      }
      // DO NOT deduct amount from profit wallet on approval
      // Balance will be deducted only when marked as paid
      // Update withdrawal status to approved
      await storage.updateWithdrawal(id, {
        status: WithdrawalStatus.APPROVED,
        approvedBy: req.user!.id,
        approvedAt: new Date(),
        adminNote,
      });
      res.json({
        message: "Withdrawal approved. Admin will manually send the money and mark as paid.",
        withdrawal: await storage.getWithdrawal(id),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to approve withdrawal" });
    }
  });
  // Admin reject withdrawal
  app.post("/api/admin/withdrawals/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNote } = req.body;
      const withdrawal = await storage.getWithdrawal(id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (withdrawal.status !== "pending") {
        return res.status(400).json({ error: "Withdrawal is not in pending status" });
      }
      // Update withdrawal status to rejected
      await storage.updateWithdrawal(id, {
        status: WithdrawalStatus.REJECTED,
        rejectionReason: adminNote,
      });
      res.json({
        message: "Withdrawal rejected",
        withdrawal: await storage.getWithdrawal(id),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to reject withdrawal" });
    }
  });
  // Admin mark withdrawal as paid
  app.post("/api/admin/withdrawals/:id/mark_paid", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const withdrawal = await storage.getWithdrawal(id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (withdrawal.status !== "approved") {
        return res.status(400).json({ error: "Withdrawal is not in approved status" });
      }
      // Deduct amount from profit wallet when marking as paid
      const wallet = await storage.getProfitWallet(withdrawal.userId);
      if (!wallet) {
        return res.status(400).json({ error: "Profit wallet not found" });
      }
      const withdrawalAmount = parseFloat(withdrawal.amount);
      const currentBalance = parseFloat(wallet.availableBalance);
      if (currentBalance < withdrawalAmount) {
        return res.status(400).json({ error: "Insufficient balance in profit wallet" });
      }
      const newBalance = (currentBalance - withdrawalAmount).toFixed(2);
      await storage.updateProfitWallet(withdrawal.userId, {
        availableBalance: newBalance,
      });
      // Update withdrawal status to paid
      await storage.updateWithdrawal(id, {
        status: WithdrawalStatus.PAID,
        paidAt: new Date(),
      });
      res.json({
        message: "Withdrawal marked as paid. Funds have been deducted from profit wallet.",
        withdrawal: await storage.getWithdrawal(id),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to mark withdrawal as paid" });
    }
  });
  // Paystack webhook for transfer status updates
  app.post("/api/webhooks/paystack", async (req, res) => {
    try {
      const { validateWebhookSignature } = await import("./paystack.js");
      // Verify webhook signature
      const isValid = validateWebhookSignature(
        JSON.stringify(req.body),
        req.headers["x-paystack-signature"] as string
      );
      if (!isValid) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
      const event = req.body;
      
      // Automated transfers are deprecated in favor of manual admin approval
      // Just log the event for now
      if (event.event === "transfer.success" || event.event === "transfer.failed" || event.event === "transfer.reversed") {
        console.log(`Received transfer webhook event: ${event.event}`, event.data);
      }
      
      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app.get("/api/user/rank", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate user's stats from all transactions (completed and pending)
      const allTransactions = await storage.getTransactions({
        customerEmail: req.user!.email,
      });

      const completedTransactions = allTransactions.filter(t => t.status === 'completed');
      const pendingTransactions = allTransactions.filter(t => t.status === 'pending' || t.status === 'confirmed');

      const userTotalSpent = completedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const userPendingSpent = pendingTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const userTotalTransactions = allTransactions.length;

      // Get all users' stats
      const allUsers = await storage.getUsers();
      const userRanks = await Promise.all(allUsers.map(async (u) => {
        const userTxns = await storage.getTransactions({
          customerEmail: u.email,
        });
        const completed = userTxns.filter(t => t.status === 'completed');
        const totalSpent = completed.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalTransactions = userTxns.length;

        return {
          email: u.email,
          totalSpent,
          totalTransactions,
          score: totalSpent + (totalTransactions * 0.1) // Give small bonus for transaction count
        };
      }));

      // Sort by score descending (spending + transaction bonus)
      userRanks.sort((a, b) => b.score - a.score);

      // Find user's rank (1-based)
      const userRank = userRanks.findIndex(u => u.email === req.user!.email) + 1;

      res.json({
        rank: userRank,
        totalUsers: userRanks.length,
        totalSpent: userTotalSpent,
        pendingSpent: userPendingSpent,
        totalTransactions: userTotalTransactions,
        score: userTotalSpent + (userTotalTransactions * 0.1)
      });
    } catch (error: any) {
      console.error("Rank API error:", error);
      res.status(500).json({ error: "Failed to get rank" });
    }
  });
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { name, phone } = req.body;
      // Validate input
      if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
        return res.status(400).json({ error: "Name must be at least 2 characters" });
      }
      if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length < 10)) {
        return res.status(400).json({ error: "Phone number must be at least 10 digits" });
      }
      // Update user profile
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = phone.trim();
      const updatedUser = await storage.updateUser(dbUser.id, updateData);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update profile" });
      }
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          phone: updatedUser.phone,
          role: updatedUser.role,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { name, email } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters" });
      }
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email is required" });
      }
      // Get current user
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      // Update user profile
      await storage.updateUser(dbUser.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      res.json({ message: "Profile updated successfully" });
    } catch (error: any) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  // Order tracking - search by beneficiary number or transaction ID
  app.get("/api/track-order", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }
      const trimmedQuery = q.trim();
      // Search by transaction ID/reference first
      let transaction = await storage.getTransactionByReference(trimmedQuery);
      // If not found, search by beneficiary phone number
      if (!transaction) {
        transaction = await storage.getTransactionByBeneficiaryPhone(trimmedQuery);
      }
      if (!transaction) {
        return res.status(404).json({ error: "Order not found. Please check your transaction ID or beneficiary phone number." });
      }
      // Return limited transaction info for tracking
      let phoneNumbers = transaction.phoneNumbers;
      if (typeof phoneNumbers === 'string') {
        try {
          phoneNumbers = JSON.parse(phoneNumbers);
        } catch (e) {
          phoneNumbers = null;
        }
      }
      res.json({
        id: transaction.id,
        reference: transaction.reference,
        productName: transaction.productName,
        customerPhone: transaction.customerPhone,
        amount: transaction.amount,
        status: transaction.status,
        deliveryStatus: transaction.deliveryStatus,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        phoneNumbers: phoneNumbers, // For bulk orders
        isBulkOrder: transaction.isBulkOrder,
      });
    } catch (error: any) {
      console.error('Order tracking error:', error);
      res.status(500).json({ error: "Failed to track order" });
    }
  });
  // Bulk upload data bundles
  app.post("/api/user/bulk-upload", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      let network: string;
      let data: string;
      // Handle file upload
      if (req.is('multipart/form-data')) {
        network = req.body.network;
        // For file upload, we'd need to parse the file content
        // For now, let's focus on text input
        return res.status(400).json({ error: "File upload not implemented yet" });
      } else {
        // Handle text input
        network = req.body.network;
        data = req.body.data;
      }
      if (!network || !data) {
        return res.status(400).json({ error: "Network and data are required" });
      }
      // Disable bulk uploads for AT iShare network
      if (network === "at_ishare") {
        return res.status(400).json({ error: "Bulk uploads are not available for AT iShare network" });
      }
      // Parse the data format: phone_number GB_amount (one per line)
      const lines = data.split('\n').map(line => line.trim()).filter(line => line);
      const orderItems: any[] = [];
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length !== 2) {
          return res.status(400).json({ error: `Invalid format: ${line}. Expected: phone_number GB_amount` });
        }
        const phone = parts[0].trim();
        const gbAmount = parseInt(parts[1].trim());
        if (isNaN(gbAmount) || gbAmount < 1 || gbAmount > 100) {
          return res.status(400).json({ error: `Invalid GB amount: ${parts[1]}. Must be 1-100` });
        }
        // Validate phone number
        const normalizedPhone = normalizePhoneNumber(phone);
        if (!normalizedPhone || !isValidPhoneLength(normalizedPhone)) {
          return res.status(400).json({ error: `Invalid phone number: ${phone}` });
        }
        // Validate network match
        if (!validatePhoneNetwork(normalizedPhone, network)) {
          const errorMsg = getNetworkMismatchError(normalizedPhone, network);
          return res.status(400).json({ error: errorMsg });
        }
        // Find bundle by data amount and network
        const bundles = await storage.getDataBundles({ network, isActive: true });
        const bundle = bundles.find(b => {
          const bundleGB = parseInt(b.dataAmount.replace('GB', ''));
          return bundleGB === gbAmount;
        });
        if (!bundle) {
          return res.status(404).json({ error: `Bundle not found for ${gbAmount}GB on ${network} network` });
        }
        // Calculate price based on user role
        let price = parseFloat(bundle.basePrice);
        if (dbUser.role === 'agent') {
          price = parseFloat(bundle.agentPrice || bundle.basePrice);
        } else if (dbUser.role === 'dealer') {
          price = parseFloat(bundle.dealerPrice || bundle.basePrice);
        } else if (dbUser.role === 'super_dealer') {
          price = parseFloat(bundle.superDealerPrice || bundle.basePrice);
        }
        orderItems.push({
          bundleId: bundle.id,
          phone: normalizedPhone,
          price: price,
        });
      }
      if (orderItems.length === 0) {
        return res.status(400).json({ error: "No valid items found" });
      }
      // Calculate total amount
      const totalAmount = orderItems.reduce((sum, item) => sum + item.price, 0);
      // Check wallet balance if payment method is wallet
      const paymentMethod = req.body.paymentMethod || 'wallet';
      if (paymentMethod === 'wallet') {
        const walletBalance = parseFloat(dbUser.walletBalance || '0');
        if (walletBalance < totalAmount) {
          return res.status(400).json({ error: `Insufficient wallet balance. Required: GH₵${totalAmount.toFixed(2)}, Available: GH₵${walletBalance.toFixed(2)}` });
        }
      }
      // Process the bulk order using the checkout logic
      const checkoutData = {
        orderItems,
        network,
        customerPhone: orderItems[0].phone, // Use first phone as customer phone
        customerEmail: dbUser.email,
        paymentMethod,
        isBulkOrder: true,
      };
      // Call the checkout initialization
      const checkoutResponse = await fetch(`${req.protocol}://${req.get('host')}/api/checkout/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
        },
        body: JSON.stringify(checkoutData),
      });
      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json().catch(() => ({ error: 'Checkout failed' }));
        return res.status(checkoutResponse.status).json(errorData);
      }
      const checkoutResult = await checkoutResponse.json();
      res.json({
        processed: orderItems.length,
        totalAmount: totalAmount.toFixed(2),
        checkout: checkoutResult,
      });
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ error: "Failed to process bulk upload", details: error.message });
    }
  });
  // ============================================
  // WALLET ROUTES
  // ============================================
  // Get wallet statistics
  app.get("/api/wallet/stats", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const transactions = await storage.getTransactions({
        customerEmail: req.user!.email,
      });
      // Filter wallet topups
      const walletTopups = transactions.filter(t => t.type === 'wallet_topup' && t.status === 'completed');
      const totalTopups = walletTopups.length;
      const totalTopupAmount = walletTopups.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      // Filter wallet payments
      const walletPayments = transactions.filter(t => t.paymentMethod === 'wallet');
      const totalSpent = walletPayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      // Get last topup
      const lastTopup = walletTopups.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      res.json({
        walletBalance: dbUser.walletBalance || "0.00",
        totalTopups,
        totalTopupAmount: totalTopupAmount.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        lastTopupDate: lastTopup?.createdAt || null,
        lastTopupAmount: lastTopup?.amount || null,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load wallet stats" });
    }
  });
  // Initialize wallet topup
  app.post("/api/wallet/topup/initialize", requireAuth, async (req, res) => {
    try {
      const { amount, paymentMethod = "paystack" } = req.body;
      if (!amount || parseFloat(amount) < 1) {
        return res.status(400).json({ error: "Invalid amount. Minimum topup is GHS 1" });
      }

      // For wallet topup, only Paystack is supported
      if (paymentMethod === "wallet") {
        return res.status(400).json({ error: "Wallet balance cannot be used to top up wallet. Please use Paystack." });
      }

      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      // Create topup transaction
      const reference = `WALLET-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const transaction = await storage.createTransaction({
        reference,
        type: "wallet_topup",
        productName: "Wallet Top-up",
        amount: parseFloat(amount).toFixed(2),
        profit: "0.00",
        customerPhone: dbUser.phone || "",
        customerEmail: dbUser.email,
        paymentMethod: paymentMethod,
        status: TransactionStatus.PENDING,
      });
      // Initialize Paystack payment
      const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      const callbackUrl = `${frontendUrl}/wallet/topup/success`;
      const paystackResponse = await initializePayment({
        email: dbUser.email,
        amount: Math.round(parseFloat(amount) * 100),
        reference,
        callbackUrl: callbackUrl,
        metadata: {
          type: "wallet_topup",
          userId: dbUser.id,
          customerName: dbUser.name,
        },
      });
      if (paystackResponse.status && paystackResponse.data) {
        res.json({
          authorizationUrl: paystackResponse.data.authorization_url,
          reference: paystackResponse.data.reference,
          accessCode: paystackResponse.data.access_code,
        });
      } else {
        const paystackError = paystackResponse as { message: string };
        throw new Error(paystackError.message || "Payment initialization failed");
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Wallet topup failed" });
    }
  });
  // Verify wallet topup
  app.get("/api/wallet/topup/verify/:reference", requireAuth, async (req, res) => {
    try {
      const transaction = await storage.getTransactionByReference(req.params.reference);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      if (transaction.type !== "wallet_topup") {
        return res.status(400).json({ error: "Invalid transaction type" });
      }
      if (transaction.status === TransactionStatus.COMPLETED) {
        return res.json({
          success: true,
          amount: transaction.amount,
          status: transaction.status,
        });
      }
      // Verify payment with Paystack
      const paystackVerification = await verifyPayment(req.params.reference);
      if (paystackVerification.data.status !== "success") {
        return res.json({
          success: false,
          status: paystackVerification.data.status,
          message: paystackVerification.data.gateway_response,
        });
      }
      // Credit wallet
      const dbUser = await storage.getUserByEmail(transaction.customerEmail!);
      if (dbUser) {
        const newBalance = parseFloat(dbUser.walletBalance || "0") + parseFloat(transaction.amount);
        await storage.updateUser(dbUser.id, { walletBalance: newBalance.toFixed(2) });
      }
      // Update transaction
      await storage.updateTransaction(transaction.id, {
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(),
        paymentReference: paystackVerification.data.reference,
      });
      res.json({
        success: true,
        amount: transaction.amount,
        newBalance: dbUser ? (parseFloat(dbUser.walletBalance || "0") + parseFloat(transaction.amount)).toFixed(2) : "0.00",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Verification failed" });
    }
  });
  // Pay with wallet
  app.post("/api/wallet/pay", requireAuth, async (req, res) => {
    try {
      console.log("Wallet pay request body:", req.body);
      const {
        productType,
        productId,
        productName,
        network,
        amount,
        customerPhone,
        phoneNumbers,
        isBulkOrder,
        agentSlug,
        orderItems,
      } = req.body;

      // BLOCK WALLET PAYMENTS FOR STOREFRONT PURCHASES
      if (agentSlug) {
        console.log("[Wallet] Blocking storefront purchase via wallet - agentSlug:", agentSlug);
        return res.status(400).json({
          error: "Storefront purchases must be made through Paystack for proper agent accounting"
        });
      }

      // For new bulk format, productName might be generated
      const effectiveProductName = productName || (orderItems ? `Bulk Order - ${orderItems.length} items` : null);
      if (!productType || !effectiveProductName || !amount || !customerPhone) {
        console.error("Missing required fields:", { productType, productName: effectiveProductName, amount, customerPhone });
        return res.status(400).json({ error: "Missing required fields" });
      }
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      // Check wallet balance (use integer arithmetic to avoid floating point precision issues)
      const purchaseAmount = parseFloat(amount);
      const walletBalanceCents = Math.round(parseFloat(dbUser.walletBalance || "0") * 100);
      const purchaseAmountCents = Math.round(purchaseAmount * 100);
      if (walletBalanceCents < purchaseAmountCents) {
        return res.status(400).json({
          error: "Insufficient wallet balance",
          balance: (walletBalanceCents / 100).toFixed(2),
          required: (purchaseAmountCents / 100).toFixed(2),
        });
      }
      // Get product pricing
      let product: any;
      let costPrice = 0;
      let basePrice = parseFloat(amount);
      // Handle new bulk format with orderItems
      if (orderItems && Array.isArray(orderItems) && orderItems.length > 0) {
        console.log("[Wallet] Processing orderItems:", orderItems);
        // Calculate total cost price from all items
        costPrice = 0;
        for (const item of orderItems) {
          const bundle = await storage.getDataBundle(item.bundleId);
          if (bundle) {
            costPrice += 0; // Cost price removed from schema
          }
        }
        // Use the first item's bundle for validation
        product = await storage.getDataBundle(orderItems[0].bundleId);
      } else if (productType === ProductType.DATA_BUNDLE && productId) {
        product = await storage.getDataBundle(productId);
        if (product) {
          costPrice = parseFloat(product.costPrice);
          basePrice = parseFloat(product.basePrice);
        }
      } else if (productType === ProductType.RESULT_CHECKER && productId) {
        product = await storage.getResultChecker(productId);
        if (product) {
          costPrice = parseFloat(product.costPrice);
          basePrice = parseFloat(product.basePrice);
        }
      }
      // Handle agent commission for storefront purchases
      let agentId: string | undefined;
      let agentProfit = 0;
      if (agentSlug) {
        const agent = await storage.getAgentBySlug(agentSlug);
        if (agent && agent.isApproved) {
          agentId = agent.id;
          // For agent storefront purchases, calculate profit as selling price - agent base price
          const agentBasePrice = await storage.getRoleBasePrice(productId || orderItems[0].bundleId, 'agent');
          const basePrice = agentBasePrice ? parseFloat(agentBasePrice) : parseFloat(product?.basePrice || '0');
          agentProfit = Math.max(0, purchaseAmount - basePrice); // Profit is 0 if using admin price
        }
      }
      // Calculate total profit (selling price - admin base price, or 0 if using admin price)
      const adminBasePrice = await storage.getAdminBasePrice(productId || orderItems[0].bundleId);
      const profitBasePrice = adminBasePrice ? parseFloat(adminBasePrice) : parseFloat(product?.basePrice || '0');
      const profit = Math.max(0, purchaseAmount - profitBasePrice);
      // Create transaction
      const reference = `WALLET-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      // Store full order items with GB info for bulk orders, or just phone numbers for simple orders
      const phoneNumbersData = orderItems
        ? orderItems.map((item: any) => ({
            phone: item.phone,
            bundleName: item.bundleName,
            dataAmount: item.bundleName.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i)?.[1] || '',
          }))
        : (phoneNumbers ? phoneNumbers.map((phone: string) => ({ phone })) : undefined);
      console.log("[Wallet] ========== PHONE NUMBERS EXTRACTION ==========");
      console.log("[Wallet] orderItems:", orderItems);
      console.log("[Wallet] phoneNumbers param:", req.body?.phoneNumbers);
      console.log("[Wallet] phoneNumbersData:", phoneNumbersData);
      console.log("[Wallet] ===================================================");
      const transaction = await storage.createTransaction({
        reference,
        type: productType,
        productId: productId || (orderItems ? orderItems[0].bundleId : null),
        productName: effectiveProductName,
        network,
        amount: purchaseAmount.toFixed(2),
        profit: profit.toFixed(2),
        customerPhone,
        customerEmail: dbUser.email,
        phoneNumbers: (isBulkOrder || (orderItems && orderItems.length > 0)) && phoneNumbersData ? phoneNumbersData : undefined,
        isBulkOrder: isBulkOrder || (orderItems && orderItems.length > 0) || false,
        paymentMethod: "wallet",
        status: TransactionStatus.CONFIRMED,
        paymentStatus: "paid",
        agentId,
        agentProfit: agentProfit > 0 ? agentProfit.toFixed(2) : undefined,
      });
      // Deduct from wallet (use same precision handling as balance check)
      const newBalanceCents = walletBalanceCents - purchaseAmountCents;
      const newBalance = newBalanceCents / 100;
      await storage.updateUser(dbUser.id, { walletBalance: newBalance.toFixed(2) });
      // Process the order
      let deliveredPin: string | undefined;
      let deliveredSerial: string | undefined;
      if (productType === ProductType.RESULT_CHECKER && productId) {
        const [type, yearStr] = productId.split("-");
        const year = parseInt(yearStr);
        // Try to get an available pre-generated checker first
        let checker = await storage.getAvailableResultChecker(type, year);
        if (checker) {
          // Use pre-generated checker
          await storage.markResultCheckerSold(checker.id, transaction.id, customerPhone);
          deliveredPin = checker.pin;
          deliveredSerial = checker.serialNumber;
        } else {
          // Generate PIN and serial automatically
          deliveredSerial = `RC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          deliveredPin = Math.random().toString(36).substring(2, 10).toUpperCase();
          // Create a new result checker record
          const newChecker = await storage.createResultChecker({
            type,
            year,
            serialNumber: deliveredSerial,
            pin: deliveredPin,
            basePrice: purchaseAmount.toString(),
          });
          console.log("Auto-generated result checker:", newChecker.id);
        }
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          deliveredPin,
          deliveredSerial,
        });
      } else {
        // For data bundles, process through API first
        console.log("[Wallet] Processing data bundle transaction via API:", transaction.reference);
        const fulfillmentResult = await fulfillDataBundleTransaction(transaction);
        if (fulfillmentResult.success) {
          console.log("[Wallet] Data bundle API fulfillment successful:", fulfillmentResult);
          await storage.updateTransaction(transaction.id, {
            status: TransactionStatus.COMPLETED,
            completedAt: new Date(),
          });
        } else {
          console.error("[Wallet] Data bundle API fulfillment failed:", fulfillmentResult.error);
          // Still mark as completed but log the error - in production you might want to handle this differently
          await storage.updateTransaction(transaction.id, {
            status: TransactionStatus.COMPLETED,
            completedAt: new Date(),
            failureReason: `API fulfillment failed: ${fulfillmentResult.error}`,
          });
        }
      }
      // Credit agent (wallet payments): only credit PROFIT and record admin revenue
      if (agentId && agentProfit > 0) {
        const totalPaid = parseFloat(purchaseAmount.toFixed(2));
        const agentProfitValue = parseFloat(agentProfit.toFixed(2));
        const adminRevenue = parseFloat((totalPaid - agentProfitValue).toFixed(2));
        // Safety check
        if (Math.abs(agentProfitValue + adminRevenue - totalPaid) > 0.01) {
          console.error("INVALID_BULK_PAYOUT detected for wallet transaction", transaction.reference);
          throw new Error("INVALID_BULK_PAYOUT");
        }
        // Credit agent with profit only
        await storage.updateAgentBalance(agentId, agentProfitValue, true);
        // Also credit agent's profit wallet for withdrawals
        const agent = await storage.getAgent(agentId);
        if (agent) {
          let profitWallet = await storage.getProfitWallet(agent.userId);
          if (!profitWallet) {
            profitWallet = await storage.createProfitWallet({
              userId: agent.userId,
              availableBalance: "0.00",
              pendingBalance: "0.00",
              totalEarned: "0.00",
            });
          }
          const newAvailableBalance = (parseFloat(profitWallet.availableBalance) + agentProfitValue).toFixed(2);
          const newTotalEarned = (parseFloat(profitWallet.totalEarned) + agentProfitValue).toFixed(2);
          await storage.updateProfitWallet(agent.userId, {
            availableBalance: newAvailableBalance,
            totalEarned: newTotalEarned,
          });
        }
        // Record admin revenue as a separate transaction for accounting
        const adminRef = `ADMINREV-${transaction.reference}`;
        await storage.createTransaction({
          reference: adminRef,
          type: "admin_revenue",
          productId: null,
          productName: `Admin revenue for transaction ${transaction.reference}`,
          network: null,
          amount: adminRevenue.toFixed(2),
          profit: "0.00",
          customerPhone: "",
          customerEmail: null,
          isBulkOrder: false,
          status: TransactionStatus.COMPLETED,
          paymentStatus: "paid",
        });
      }
      res.json({
        success: true,
        reference: transaction.reference,
        newBalance: newBalance.toFixed(2),
        deliveredPin,
        deliveredSerial,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Payment failed" });
    }
  });
  // ===== CHAT SUPPORT API ROUTES =====
  // Create new chat session
  app.post("/api/support/chat/create", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const userName = user.user_metadata?.name || user.email.split('@')[0];
      const chatId = await storage.createSupportChat(user.id, user.email, userName);
      res.json({ success: true, chatId });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create chat" });
    }
  });
  // Get user's chat sessions
  app.get("/api/support/chats", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const chats = await storage.getUserSupportChats(user.id);
      res.json(chats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get chats" });
    }
  });
  // Get chat details with messages
  app.get("/api/support/chat/:chatId", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { chatId } = req.params;
      const chat = await storage.getSupportChatById(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      // Verify user owns chat or is admin
      if (chat.userId !== user.id && user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: "Access denied" });
      }
      const messages = await storage.getChatMessages(chatId);
      res.json({ chat, messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get chat" });
    }
  });
  // Send message in chat
  app.post("/api/support/chat/:chatId/message", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { chatId } = req.params;
      const { message } = req.body;
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }
      const chat = await storage.getSupportChatById(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      // Verify user owns chat or is admin
      if (chat.userId !== user.id && user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: "Access denied" });
      }
      const senderType = user.role === UserRole.ADMIN ? 'admin' : 'user';
      // Check if this is user's first message BEFORE creating it
      let isFirstUserMessage = false;
      if (senderType === 'user') {
        const existingMessages = await storage.getChatMessages(chatId);
        const existingUserMessages = existingMessages.filter(msg => msg.senderType === 'user');
        isFirstUserMessage = existingUserMessages.length === 0;
      }
      const messageId = await storage.createChatMessage(chatId, user.id, senderType, message.trim());
      // Send automated welcome message if this was the user's first message
      if (isFirstUserMessage) {
        const autoReplyMessage = "Thank you for contacting us! 🙏\n\nPlease leave your concerns, questions, or reports below and our support team will respond as soon as they're available. We typically respond within a few hours during business hours.\n\nFeel free to provide as much detail as possible about your issue, and we'll get back to you with a solution.\n\nFor urgent matters, you can also reach us via WhatsApp.";
        // Use a system user ID for automated messages
        await storage.createChatMessage(chatId, user.id, 'admin', autoReplyMessage);
      }
      res.json({ success: true, messageId });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });
  // Mark messages as read
  app.put("/api/support/message/:messageId/read", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.markMessageAsRead(req.params.messageId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to mark message as read" });
    }
  });
  // Close chat
  app.put("/api/support/chat/:chatId/close", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { chatId } = req.params;
      const chat = await storage.getSupportChatById(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      // Only chat owner or admin can close
      if (chat.userId !== user.id && user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.closeSupportChat(chatId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to close chat" });
    }
  });
  // Get unread message count for user
  app.get("/api/support/unread-count", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const count = await storage.getUnreadUserMessagesCount(user.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get unread count" });
    }
  });
  // Get unread message count for admin/agent support
  app.get("/api/support/admin/unread-count", requireAuth, requireSupport, async (req: Request, res: Response) => {
    try {
      const count = await storage.getUnreadAdminMessagesCount();
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get unread count" });
    }
  });
  // Admin: Get all support chats
  app.get("/api/admin/support/chats", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const chats = await storage.getAllSupportChats(status as string);
      res.json(chats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get chats" });
    }
  });
  // Admin: Assign chat to admin
  app.put("/api/admin/support/chat/:chatId/assign", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const adminId = req.user!.id;
      await storage.assignChatToAdmin(chatId, adminId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to assign chat" });
    }
  });
  // ============================================
  // SETTINGS ROUTES
  // ============================================
  // Get all settings
  app.get("/api/admin/settings", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load settings" });
    }
  });
  // Update setting
  app.put("/api/admin/settings/:key", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      if (!value) {
        return res.status(400).json({ error: "Value is required" });
      }
      await storage.setSetting(key, value, description);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update setting" });
    }
  });
  // Get specific setting
  app.get("/api/admin/settings/:key", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const value = await storage.getSetting(key);
      res.json({ key, value });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get setting" });
    }
  });
  // ============================================
  // ADMIN CREDENTIAL MANAGEMENT
  // ============================================
  // Get all users (for admin to manage credentials)
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      // Don't send passwords in response
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt,
      }));
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load users" });
    }
  });
  // Update user credentials
  app.put("/api/admin/users/:userId/credentials", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { email, password, name, phone } = req.body;
      if (!email && !password && !name && phone === undefined) {
        return res.status(400).json({ error: "At least one field must be provided" });
      }
      // Get current user data
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const updateData: any = {};
      const supabaseUpdates: any = {};
      if (email && email !== currentUser.email) {
        updateData.email = email;
        supabaseUpdates.email = email;
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
        supabaseUpdates.password = password;
      }
      if (name && name !== currentUser.name) {
        updateData.name = name;
        supabaseUpdates.user_metadata = { ...supabaseUpdates.user_metadata, name };
      }
      if (phone !== undefined && phone !== currentUser.phone) {
        updateData.phone = phone;
        supabaseUpdates.phone = phone;
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No changes detected" });
      }
      // Update Supabase Auth if email or password changed
      if (supabaseUpdates.email || supabaseUpdates.password || supabaseUpdates.phone) {
        const supabaseServer = getSupabase();
        if (supabaseServer) {
          try {
            const { error } = await supabaseServer.auth.admin.updateUserById(userId, supabaseUpdates);
            if (error) {
              console.error("Failed to update Supabase Auth:", error);
              return res.status(500).json({ error: "Failed to update authentication credentials" });
            }
          } catch (authError) {
            console.error("Supabase Auth update error:", authError);
            return res.status(500).json({ error: "Failed to update authentication credentials" });
          }
        }
      }
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update user credentials" });
    }
  });
  // Generate and download result checker PDF
  app.get("/api/result-checker/:transactionId/pdf", requireAuth, async (req, res) => {
    try {
      const { transactionId } = req.params;
      // Get user from database
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      // Get transaction
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      // Verify user owns this transaction
      if (transaction.customerEmail !== dbUser.email) {
        return res.status(403).json({ error: "Access denied" });
      }
      // Verify it's a result checker transaction
      if (transaction.type !== ProductType.RESULT_CHECKER) {
        return res.status(400).json({ error: "Invalid transaction type" });
      }
      // Verify transaction is completed and has credentials
      if (transaction.status !== TransactionStatus.COMPLETED || !transaction.deliveredPin || !transaction.deliveredSerial) {
        return res.status(400).json({ error: "Transaction not completed or credentials not available" });
      }
      // Parse productId to get type and year
      const [type, yearStr] = transaction.productId!.split("-");
      const year = parseInt(yearStr);
      // Generate PDF
      const { generateResultCheckerPDF } = await import('./utils/pdf-generator.js');
      const pdfBuffer = await generateResultCheckerPDF({
        type,
        year,
        pin: transaction.deliveredPin,
        serialNumber: transaction.deliveredSerial,
        customerName: dbUser.name,
        customerPhone: transaction.customerPhone || undefined,
        purchaseDate: new Date(transaction.completedAt || transaction.createdAt),
        transactionReference: transaction.reference,
      });
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type.toUpperCase()}-Result-Checker-${year}-${transaction.reference}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      // Send PDF buffer
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate PDF" });
    }
  });
  // ============================================
  // API KEYS
  // ============================================
  // Get user's API keys
  app.get("/api/user/api-keys", requireAuth, async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeys(req.user!.id);
      res.json(apiKeys);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch API keys" });
    }
  });
  // Create new API key
  app.post("/api/user/api-keys", requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: "API key name is required" });
      }
      // Generate a secure API key
      const key = `sk_${randomBytes(32).toString('hex')}`;
      // Resolve the database user id to use for the foreign key.
      // Some installations have pre-existing users with a different local id
      // (created before Supabase IDs were adopted). Prefer the DB user id
      // when it exists to avoid foreign key violations.
      let resolvedUserId = req.user!.id;
      try {
        const dbUser = await storage.getUserByEmail(req.user!.email!);
        if (dbUser) {
          resolvedUserId = dbUser.id;
        } else {
          // Create a DB user record with the Supabase id so future ops match
          try {
            await storage.createUser({
              id: req.user!.id,
              email: req.user!.email!,
              password: "",
              name: req.user!.user_metadata?.name || req.user!.email!.split('@')[0],
              phone: (req as any).user?.phone || null,
              role: 'user',
              isActive: true,
            });
          } catch (createErr) {
            // If creation fails due to unique email constraint, fetch the existing user and use its id
            console.error('Failed to create DB user for API key creation:', createErr);
            const fallback = await storage.getUserByEmail(req.user!.email!);
            if (fallback) resolvedUserId = fallback.id;
          }
        }
      } catch (err) {
        console.error('Error resolving DB user id for API key creation:', err);
      }
      const apiKey = await storage.createApiKey({
        userId: resolvedUserId,
        name: name.trim(),
        key,
        permissions: "{}",
        isActive: true,
      });
      // Return the key (this is the only time it will be shown)
      res.json({
        ...apiKey,
        key, // Include the key in response
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create API key" });
    }
  });
  // Revoke API key
  app.delete("/api/user/api-keys/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      // Find API key by ID
      const apiKeys = await storage.getApiKeys(req.user!.id);
      const apiKey = apiKeys.find(k => k.id === id);
      if (!apiKey) {
        return res.status(404).json({ error: "API key not found" });
      }
      await storage.deleteApiKey(apiKey.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to revoke API key" });
    }
  });
  // ============================================
  // API ENDPOINTS (API KEY AUTHENTICATED)
  // ============================================
  // Get user balance
  app.get("/api/v1/user/balance", requireApiKey, async (req, res) => {
    try {
      const user = await storage.getUser(req.apiKey!.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        balance: user.walletBalance,
        currency: "GHS"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get balance" });
    }
  });
  // Get user transactions
  app.get("/api/v1/user/transactions", requireApiKey, async (req, res) => {
    try {
      const user = await storage.getUser(req.apiKey!.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { limit = 10, offset = 0 } = req.query;
      const transactions = await storage.getTransactions({
        customerEmail: user.email,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json({
        transactions: transactions.map(t => ({
          id: t.id,
          reference: t.reference,
          type: t.type,
          amount: t.amount,
          status: t.status,
          createdAt: t.createdAt
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get transactions" });
    }
  });

}
