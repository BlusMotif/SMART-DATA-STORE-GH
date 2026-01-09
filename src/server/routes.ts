import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { randomUUID } from "crypto";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import multer from "multer";
import {
  loginSchema, registerSchema, agentRegisterSchema, purchaseSchema, withdrawalRequestSchema,
  UserRole, TransactionStatus, ProductType, WithdrawalStatus
} from "../shared/schema.js";
import { initializePayment, verifyPayment, validateWebhookSignature, isPaystackConfigured, isPaystackTestMode, createTransferRecipient, initiateTransfer, verifyTransfer } from "./paystack.js";
import { fulfillDataBundleTransaction } from "./providers.js";

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
        const checker = await storage.getResultChecker(transaction.productId);
        if (checker && !checker.isSold) {
          await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
          deliveredPin = checker.pin;
          deliveredSerial = checker.serialNumber;
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
      }

      console.log("Payment processed via webhook:", reference);
    } catch (transactionError: any) {
      console.error("Error processing transaction webhook:", transactionError);
    }
  }

  // Handle transfer events
  if (event.event === "transfer.success") {
    try {
      const data = event.data;
      const transferReference = data.reference;
      
      console.log("Processing transfer success:", transferReference);
      
      // Find withdrawal by transfer reference
      const withdrawals = await storage.getWithdrawals();
      const withdrawal = withdrawals.find(w => w.transferReference === transferReference);
      
      if (withdrawal) {
        await storage.updateWithdrawal(withdrawal.id, {
          status: WithdrawalStatus.COMPLETED,
          processedAt: new Date(),
        });
        console.log("Withdrawal marked as completed:", withdrawal.id);
      }
    } catch (transferError: any) {
      console.error("Error processing transfer webhook:", transferError);
    }
  }
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

    // Check role from req.user (already set by requireAuth middleware)
    if (req.user.role !== UserRole.AGENT) {
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

      // Try to get additional data from database if connection is available
      try {
        const dbUser = await storage.getUserByEmail(user.email!);
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
              email: user.email!,
              password: "", // Password not needed since auth is handled by Supabase
              name: user.user_metadata?.name || user.email!.split('@')[0],
              phone: user.phone || null,
              role: 'user', // Default role for new users
              isActive: true,
            });
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
          phone: user.phone || null
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
          return res.status(400).json({ error: "This email is already registered as an agent" });
        }
      }

      // DO NOT CREATE ACCOUNT YET - Only initialize payment
      // Account will be created after successful payment verification
      
      // Create a temporary reference for payment tracking
      const activationFee = 60.00; // GHC 60.00
      const tempReference = `agent_pending_${Date.now()}_${data.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      console.log("Initializing payment without creating account");

      const baseUrl = `${req.protocol}://${req.get("host")}`;

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
          callback_url: `${baseUrl}/agent/activation-complete`,
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

        const { businessName, storefrontSlug } = req.body || {};
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
          isApproved: false,
          paymentPending: true,
        } as any);
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

        const baseUrl = `${req.protocol}://${req.get("host")}`;

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
            callback_url: `${baseUrl}/agent/activation-complete`,
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

  // ============================================
  // PRODUCTS - DATA BUNDLES
  // ============================================
  app.get("/api/products/data-bundles", async (req, res) => {
    const network = req.query.network as string | undefined;
    try {
      const bundles = await storage.getDataBundles({ network, isActive: true });

      // Check if user is authenticated to apply role-based pricing
      let userRole = 'guest';
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
              }
            }
          }
        }
      } catch (authError) {
        // Ignore auth errors, treat as guest
        console.log('Auth check failed, treating as guest');
      }

      // Apply role-based pricing
      const pricedBundles = bundles.map(bundle => {
        let price = parseFloat(bundle.basePrice || '0');

        // Apply role-based pricing
        if (userRole === 'agent' && bundle.agentPrice) {
          price = parseFloat(bundle.agentPrice);
        } else if (userRole === 'dealer' && bundle.dealerPrice) {
          price = parseFloat(bundle.dealerPrice);
        } else if (userRole === 'super_dealer' && bundle.superDealerPrice) {
          price = parseFloat(bundle.superDealerPrice);
        } else if (userRole === 'master' && bundle.masterPrice) {
          price = parseFloat(bundle.masterPrice);
        } else if (userRole === 'admin' && bundle.adminPrice) {
          price = parseFloat(bundle.adminPrice);
        }

        if (isNaN(price)) price = 0;

        return {
          ...bundle,
          customPrice: price.toFixed(2),
        };
      });

      res.json(pricedBundles);
    } catch (error: any) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch data bundles" });
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
      res.json(bundle);
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
  app.get("/api/store/:slug", async (req, res) => {
    try {
      const agent = await storage.getAgentBySlug(req.params.slug);
      if (!agent || !agent.isApproved) {
        return res.status(404).json({ error: "Store not found" });
      }

      const user = await storage.getUser(agent.userId);
      const bundles = await storage.getDataBundles({ isActive: true });

      // Get agent's custom pricing
      const customPricing = await storage.getAgentCustomPricing(agent.id);
      const pricingMap = new Map(customPricing.map(p => [p.bundleId, p.customPrice]));

      const currentYear = new Date().getFullYear();
      const resultCheckerStock = [];
      for (const year of [currentYear, currentYear - 1]) {
        for (const type of ["bece", "wassce"]) {
          const available = await storage.getResultCheckerStock(type, year);
          if (available > 0) {
            const checker = await storage.getAvailableResultChecker(type, year);
            const markup = parseFloat(agent.customPricingMarkup || "0");
            const basePrice = parseFloat(checker?.basePrice || "0");
            resultCheckerStock.push({
              type,
              year,
              available,
              price: (basePrice * (1 + markup / 100)).toFixed(2),
            });
          }
        }
      }

      res.json({
        agent: {
          businessName: agent.businessName,
          businessDescription: agent.businessDescription,
          slug: agent.storefrontSlug,
        },
        dataBundles: bundles.map(b => {
          // Use custom price if set, otherwise use base price
          const customPrice = pricingMap.get(b.id);
          return {
            ...b,
            customPrice: parseFloat(customPrice || b.basePrice),
          };
        }),
        resultCheckers: resultCheckerStock,
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

      // Get authenticated user
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Calculate total amount and prepare order items with prices
      let totalAmount = 0;
      const processedOrderItems: any[] = [];

      for (const item of orderItems) {
        const bundle = await storage.getDataBundle(item.bundleId);
        if (!bundle) continue;

        // Apply agent pricing if user is agent
        let itemPrice = parseFloat(bundle.basePrice);
        if (user.role === 'agent' && bundle.agentPrice) {
          itemPrice = parseFloat(bundle.agentPrice);
        } else if (user.role === 'dealer' && bundle.dealerPrice) {
          itemPrice = parseFloat(bundle.dealerPrice);
        } else if (user.role === 'super_dealer' && bundle.superDealerPrice) {
          itemPrice = parseFloat(bundle.superDealerPrice);
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

        if (parseFloat(userData.walletBalance) < totalAmount) {
          return res.status(400).json({ 
            error: `Insufficient wallet balance. Required: GHS ${totalAmount.toFixed(2)}, Available: GHS ${userData.walletBalance}` 
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
        phoneNumbers: processedOrderItems,
        isBulkOrder: true,
        status: "pending",
        agentId: user.role === 'agent' ? user.id : undefined,
        agentProfit: "0.00",
      });

      // Deduct from wallet if registered user
      if (user.role !== 'guest') {
        const userData = await storage.getUser(user.id);
        if (userData) {
          const newBalance = parseFloat(userData.walletBalance) - totalAmount;
          await storage.updateUser(user.id, { walletBalance: newBalance.toFixed(2) });
        }
      }

      // Mark transaction as completed immediately for wallet payments
      await storage.updateTransaction(transaction.id, {
        status: "completed",
        completedAt: new Date(),
        paymentReference: "wallet",
      });

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
      
      // Normalize and validate phone number format
      const normalizedPhone = normalizePhoneNumber(data.customerPhone);
      
      if (!isValidPhoneLength(normalizedPhone)) {
        return res.status(400).json({ 
          error: "Invalid phone number length. Phone number must be exactly 10 digits including the prefix (e.g., 0241234567)" 
        });
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
        
        // Calculate cost price and amount from orderItems (prices already include agent markup)
        costPrice = 0;
        amount = 0;
        for (const item of data.orderItems) {
          const bundle = await storage.getDataBundle(item.bundleId);
          if (!bundle) {
            console.error(`[BulkOrder] Bundle not found for bundleId: ${item.bundleId}`);
            return res.status(400).json({ error: `Bundle not found for bundleId: ${item.bundleId}` });
          }
          costPrice += 0; // Cost price removed from schema
          amount += item.price; // Price already includes agent markup from frontend
        }
        
        console.log("[Checkout] Bulk order total amount (from orderItems):", amount);
        console.log("[Checkout] Bulk order total cost price:", costPrice);
        
        productName = `Bulk Order - ${data.orderItems.length} items`;
      } else if (data.productId && data.productType === ProductType.DATA_BUNDLE) {
        product = await storage.getDataBundle(data.productId);
        if (!product || !product.isActive) {
          return res.status(404).json({ error: "Product not found" });
        }
        
        // Validate that phone number matches the selected network
        if (!validatePhoneNetwork(normalizedPhone, product.network)) {
          const errorMsg = getNetworkMismatchError(normalizedPhone, product.network);
          return res.status(400).json({ error: errorMsg });
        }
        
        productName = `${product.network.toUpperCase()} ${product.dataAmount} - ${product.validity}`;
        amount = parseFloat(product.basePrice);
        costPrice = 0; // Cost price removed from schema
        network = product.network;
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
      let agentProfit = 0;

      if (data.agentSlug) {
        const agent = await storage.getAgentBySlug(data.agentSlug);
        if (agent && agent.isApproved) {
          agentId = agent.id;
          
          // For bulk orders with orderItems, profit is already calculated
          if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) {
            // Calculate profit: amount (since cost price removed)
            agentProfit = amount;
            console.log("[Checkout] Bulk order agent profit:", agentProfit);
          }
          // For single orders, check custom pricing or apply markup
          else if (data.productType === ProductType.DATA_BUNDLE && data.productId) {
            const customPrice = await storage.getAgentPriceForBundle(agent.id, data.productId);
            if (customPrice) {
              const agentPrice = parseFloat(customPrice);
              // Agent profit is the agent price (since cost price removed)
              agentProfit = agentPrice;
              amount = agentPrice;
            } else {
              // Fall back to markup if no custom price
              const markup = parseFloat(agent.customPricingMarkup || "0");
              const agentPrice = amount * (1 + markup / 100);
              agentProfit = agentPrice - amount;
              amount = agentPrice;
            }
          } else {
            // For result checkers, use markup
            const markup = parseFloat(agent.customPricingMarkup || "0");
            const agentPrice = amount * (1 + markup / 100);
            agentProfit = agentPrice - amount;
            amount = agentPrice;
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
      const isBulkOrder = data.isBulkOrder || (data.orderItems && data.orderItems.length > 0);
      
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
      const totalProfit = totalAmount;
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
        customerPhone: normalizedPhone,
        customerEmail: data.customerEmail,
        phoneNumbers: (isBulkOrder && phoneNumbersData) ? phoneNumbersData : undefined,
        isBulkOrder: isBulkOrder || false,
        status: TransactionStatus.PENDING,
        agentId,
        agentProfit: totalAgentProfit.toFixed(2),
      });

      // Initialize Paystack payment
      const customerEmail = data.customerEmail || `${normalizedPhone}@clectech.com`;
      const callbackUrl = `${req.protocol}://${req.get("host")}/checkout/success?reference=${reference}`;

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
            customerPhone: normalizedPhone,
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
        // Payment not successful after retries
        const status = paystackVerification?.data.status || "unknown";
        console.log("[Verify] Payment not successful after retries, final status:", status);
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
        completedAt: new Date(),
        deliveredPin,
        deliveredSerial,
        paymentReference: paystackVerification.data.reference,
      });
      console.log("[Verify] Transaction updated to completed");

      // Credit agent if applicable
      if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
        await storage.updateAgentBalance(transaction.agentId, parseFloat(transaction.agentProfit || "0"), true);
        console.log("[Verify] Agent credited");
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
              return res.json({ 
                status: "failed", 
                message: "Payment successful but account creation failed. Please contact support.",
                error: authError.message
              });
            }

            const userId = authData.user.id;
            console.log("Step 1 SUCCESS: Supabase user created:", userId);

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

            // Create agent record (already approved since payment is complete)
            console.log("Step 3: Creating agent record");
            const agent = await storage.createAgent({
              userId: userId,
              storefrontSlug: regData.storefrontSlug,
              businessName: regData.businessName,
              isApproved: true, // Approved since payment is successful
              paymentPending: false,
            });
            console.log("Step 3 SUCCESS: Agent created and approved:", agent.id);

            // Create transaction record for the activation payment
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
              paymentReference: paymentData.reference,
              agentId: null,
              agentProfit: "0.00",
            });
            console.log("Step 4 SUCCESS: Activation transaction recorded:", transaction.id);

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
            console.error("Error stack:", createError.stack);
            return res.json({ 
              status: "failed", 
              message: "Payment successful but account creation failed. Please contact support.",
              error: createError.message
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
        const checker = await storage.getResultChecker(transaction.productId);
        if (checker && !checker.isSold) {
          await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
          deliveredPin = checker.pin;
          deliveredSerial = checker.serialNumber;
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
      }

      console.log("Payment processed via webhook:", reference);
    }

    // Handle transfer events
    if (event.event === "transfer.success") {
      const data = event.data;
      const transferReference = data.reference;
      
      console.log("Processing transfer success:", transferReference);
      
      // Find withdrawal by transfer reference
      const withdrawals = await storage.getWithdrawals();
      const withdrawal = withdrawals.find(w => w.transferReference === transferReference);
      
      if (withdrawal) {
        await storage.updateWithdrawal(withdrawal.id, {
          status: WithdrawalStatus.COMPLETED,
          processedAt: new Date(),
        });
        console.log("Withdrawal marked as completed:", withdrawal.id);
      }
    }

    if (event.event === "transfer.failed" || event.event === "transfer.reversed") {
      const data = event.data;
      const transferReference = data.reference;
      
      console.log("Processing transfer failure:", transferReference);
      
      // Find withdrawal by transfer reference
      const withdrawals = await storage.getWithdrawals();
      const withdrawal = withdrawals.find(w => w.transferReference === transferReference);
      
      if (withdrawal) {
        // Refund the agent balance
        const agent = await storage.getAgent(withdrawal.agentId);
        if (agent) {
          await storage.updateAgentBalance(agent.id, parseFloat(withdrawal.amount), false);
        }
        
        await storage.updateWithdrawal(withdrawal.id, {
          status: WithdrawalStatus.FAILED,
          adminNote: `Transfer failed: ${data.failures?.[0]?.message || 'Unknown error'}`,
          processedAt: new Date(),
        });
        console.log("Withdrawal marked as failed and balance refunded:", withdrawal.id);
      }
    }
  }

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
  app.get("/api/agent/profile", requireAuth, requireAgent, async (req, res) => {
    try {
      // Get user from database using email from JWT
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent profile not found" });
      }

      console.log("Agent balance from DB:", agent.balance);
      console.log("User wallet balance:", dbUser.walletBalance);
      console.log("Agent total profit:", agent.totalProfit);

      const user = await storage.getUser(dbUser.id);
      const stats = await storage.getTransactionStats(agent.id);

      res.json({
        agent: {
          ...agent,
          balance: dbUser.walletBalance, // Use user's wallet balance for agent dashboard
          user: { name: user?.name, email: user?.email, phone: user?.phone },
        },
        stats,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load profile" });
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

      const transactions = await storage.getTransactions({
        agentId: agent.id,
        limit: 100,
      });

      res.json(transactions);
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

      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const transactions = await storage.getTransactions({ agentId: agent.id });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = transactions.filter(t => new Date(t.createdAt) >= today);
      const todayProfit = todayTransactions.reduce((sum, t) => sum + parseFloat(t.agentProfit || "0"), 0);

      const stats = {
        balance: Number(dbUser.walletBalance) || 0, // Use user's wallet balance
        totalProfit: Number(agent.totalProfit) || 0,
        totalSales: Number(agent.totalSales) || 0,
        totalTransactions: transactions.length,
        todayProfit: Number(todayProfit.toFixed(2)),
        todayTransactions: todayTransactions.length,
      };

      console.log("Agent stats:", JSON.stringify(stats, null, 2));
      console.log("Total transactions with agentId:", transactions.length);

      res.json(stats);
    } catch (error: any) {
      console.error("Error loading agent stats:", error);
      res.status(500).json({ error: "Failed to load agent stats" });
    }
  });

  app.get("/api/agent/transactions/recent", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const transactions = await storage.getTransactions({
        agentId: agent.id,
        limit: 10,
      });

      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load recent transactions" });
    }
  });

  app.get("/api/agent/withdrawals", requireAuth, requireAgent, async (req, res) => {
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

      const withdrawals = await storage.getWithdrawals({ agentId: agent.id });
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load withdrawals" });
    }
  });

  app.post("/api/agent/withdrawals", requireAuth, requireAgent, async (req, res) => {
    try {
      // Validate input
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      const data = withdrawalRequestSchema.parse(req.body);
      
      // Validate minimum withdrawal amount of GHC 10
      if (data.amount < 10) {
        return res.status(400).json({ error: "Minimum withdrawal amount is GH₵10" });
      }

      // Additional validation for maximum withdrawal amount
      if (data.amount > 100000) {
        return res.status(400).json({ error: "Maximum withdrawal amount is GH₵100,000" });
      }

      // Get user from database using email from JWT
      const dbUser = await storage.getUserByEmail(req.user!.email);
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

      const balance = parseFloat(agent.balance);
      if (data.amount > balance) {
        return res.status(400).json({ 
          error: "Insufficient balance",
          balance: balance.toFixed(2),
          requested: data.amount.toFixed(2)
        });
      }

      // Handle different payment methods
      let recipientCode = null;
      let bankName = data.bankName || "";
      let bankCode = data.bankCode || "";

      if (data.paymentMethod === "bank") {
        // Bank transfer - requires bank details
        if (!data.bankName || !data.bankCode) {
          return res.status(400).json({ error: "Bank name and code are required for bank transfers" });
        }

        // Check if agent already has a transfer recipient for this account
        const existingWithdrawals = await storage.getWithdrawals({ agentId: agent.id });
        const existingRecipient = existingWithdrawals.find(w => 
          w.accountNumber === data.accountNumber && 
          w.bankCode === data.bankCode &&
          w.recipientCode
        );

        if (existingRecipient?.recipientCode) {
          recipientCode = existingRecipient.recipientCode;
        } else {
          // Create new transfer recipient for bank
          try {
            const recipientResponse = await createTransferRecipient({
              type: "nuban",
              name: data.accountName,
              account_number: data.accountNumber,
              bank_code: data.bankCode,
              currency: "GHS"
            });
            recipientCode = recipientResponse.data.recipient_code;
          } catch (error: any) {
            console.error("Failed to create bank transfer recipient:", error);
            return res.status(400).json({ error: "Failed to setup bank account for transfer. Please check your bank details." });
          }
        }
      } else {
        // Mobile money transfer
        const mobileMoneyConfig = {
          mtn_momo: { name: "MTN Mobile Money", code: "UMTN" },
          telecel_cash: { name: "Telecel Cash", code: "UTEL" },
          airtel_tigo_cash: { name: "AirtelTigo Cash", code: "UAIRTIGO" },
          vodafone_cash: { name: "Vodafone Cash", code: "UVODAFONE" },
        };

        const config = mobileMoneyConfig[data.paymentMethod as keyof typeof mobileMoneyConfig];
        if (!config) {
          return res.status(400).json({ error: "Invalid payment method" });
        }

        bankName = config.name;
        bankCode = config.code;

        // Check if agent already has a transfer recipient for this mobile money account
        const existingWithdrawals = await storage.getWithdrawals({ agentId: agent.id });
        const existingRecipient = existingWithdrawals.find(w => 
          w.accountNumber === data.accountNumber && 
          w.paymentMethod === data.paymentMethod &&
          w.recipientCode
        );

        if (existingRecipient?.recipientCode) {
          recipientCode = existingRecipient.recipientCode;
        } else {
          // Create new transfer recipient for mobile money
          try {
            const recipientResponse = await createTransferRecipient({
              type: "mobile_money",
              name: data.accountName,
              account_number: data.accountNumber,
              bank_code: config.code,
              currency: "GHS"
            });
            recipientCode = recipientResponse.data.recipient_code;
          } catch (error: any) {
            console.error("Failed to create mobile money recipient:", error);
            return res.status(400).json({ error: "Failed to setup mobile money account for transfer. Please check your phone number." });
          }
        }
      }

      // Generate transfer reference
      const transferReference = `WD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Initiate transfer
      let transferResponse;
      try {
        transferResponse = await initiateTransfer({
          source: "balance",
          amount: data.amount,
          recipient: recipientCode,
          reason: `Agent withdrawal - ${agent.businessName} (${data.paymentMethod.toUpperCase()})`,
          reference: transferReference
        });
      } catch (error: any) {
        console.error("Failed to initiate transfer:", error);
        return res.status(400).json({ error: "Failed to initiate transfer. Please try again." });
      }

      // Create withdrawal record
      const withdrawal = await storage.createWithdrawal({
        agentId: agent.id,
        amount: data.amount.toFixed(2),
        status: WithdrawalStatus.PROCESSING,
        paymentMethod: data.paymentMethod,
        bankName: bankName,
        bankCode: bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        recipientCode: recipientCode,
        transferReference: transferReference,
        transferCode: transferResponse.data.transfer_code,
      });

      // Deduct from agent balance immediately
      await storage.updateAgentBalance(agent.id, -data.amount, false);

      res.json({
        ...withdrawal,
        message: "Withdrawal initiated successfully. Funds will be transferred to your account within a few minutes."
      });
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      res.status(400).json({ error: error.message || "Withdrawal failed" });
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

      const { businessName, businessDescription } = req.body;
      const updatedAgent = await storage.updateAgent(agent.id, {
        businessName,
        businessDescription,
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

      const pricing = await storage.getAgentCustomPricing(agent.id);
      res.json(pricing);
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
      for (const [bundleId, price] of Object.entries(prices)) {
        const priceStr = price as string;
        if (!priceStr || priceStr === '') {
          // Delete custom pricing if empty
          await storage.deleteAgentCustomPricing(agent.id, bundleId);
        } else {
          // Validate price
          const priceNum = parseFloat(priceStr);
          if (isNaN(priceNum) || priceNum < 0) {
            continue; // Skip invalid prices
          }

          // Get bundle to validate against base price (cost price removed)
          const bundle = await storage.getDataBundle(bundleId);
          if (bundle && priceNum >= parseFloat(bundle.basePrice)) {
            await storage.setAgentCustomPricing(agent.id, bundleId, priceStr);
          }
        }
      }

      const updatedPricing = await storage.getAgentCustomPricing(agent.id);
      res.json(updatedPricing);
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
      // Remove sensitive email information for public view
      const publicRankings = topCustomers.map((customer, index) => ({
        rank: index + 1,
        customerPhone: customer.customerPhone,
        totalPurchases: customer.totalPurchases,
        totalSpent: customer.totalSpent,
      }));
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

  app.get("/api/admin/transactions/export", requireAuth, requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsForExport();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to export transactions" });
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
          date: sortedTransactions[0].createdAt.toISOString(),
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
          createdAt: user.createdAt.toISOString(),
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
      const validRoles = ["admin", "agent", "dealer", "super_dealer", "user", "guest"];
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
      } else if (oldRole !== 'agent' && oldRole !== 'dealer' && oldRole !== 'super_dealer' && (role === 'agent' || role === 'dealer' || role === 'super_dealer')) {
        // User is now an agent/dealer/super_dealer - check if agent record exists
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

  // Get active announcements for users
  app.get("/api/announcements/active", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser || dbUser.role === 'guest') {
        return res.json([]); // Don't show announcements to guests
      }

      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load announcements" });
    }
  });

  app.get("/api/admin/withdrawals", requireAuth, requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const withdrawals = await storage.getWithdrawals({ status });
      
      const withdrawalsWithAgents = await Promise.all(withdrawals.map(async (w) => {
        const agent = await storage.getAgent(w.agentId);
        const user = agent ? await storage.getUser(agent.userId) : null;
        return {
          ...w,
          agent: agent ? { businessName: agent.businessName } : null,
          user: user ? { name: user.name } : null,
        };
      }));

      res.json(withdrawalsWithAgents);
    } catch (error: any) {
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
      if (existingBundles.length > 0) {
        return res.json({ message: "Products already exist", count: existingBundles.length });
      }

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

      res.json({ message: "Products seeded successfully", count: sampleBundles.length });
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

  // Export transactions to CSV
  app.get("/api/admin/transactions/export", requireAuth, requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getTransactions();

      const csvData = transactions.map(tx => ({
        reference: tx.reference,
        productName: tx.productName,
        network: tx.network,
        amount: tx.amount,
        profit: tx.profit,
        customerPhone: tx.customerPhone,
        customerEmail: tx.customerEmail,
        status: tx.status,
        deliveryStatus: (tx as any).deliveryStatus || "pending",
        createdAt: tx.createdAt.toISOString(),
        completedAt: tx.completedAt?.toISOString() || "",
        phoneNumbers: (tx as any).phoneNumbers ? 
          (tx as any).phoneNumbers.map((p: any) => p.phone).join("; ") : 
          "",
        isBulkOrder: (tx as any).isBulkOrder ? "Yes" : "No",
      }));

      res.json(csvData);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to export transactions" });
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
        phoneNumbers: transaction.phoneNumbers, // For bulk orders
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
      const { amount } = req.body;

      if (!amount || parseFloat(amount) < 1) {
        return res.status(400).json({ error: "Invalid amount. Minimum topup is GHS 1" });
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
        paymentMethod: "paystack",
        status: TransactionStatus.PENDING,
      });

      // Initialize Paystack payment
      const callbackUrl = `${req.protocol}://${req.get("host")}/wallet/topup/success`;
      
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

      // Check wallet balance
      const walletBalance = parseFloat(dbUser.walletBalance || "0");
      const purchaseAmount = parseFloat(amount);

      if (walletBalance < purchaseAmount) {
        return res.status(400).json({ 
          error: "Insufficient wallet balance",
          balance: walletBalance.toFixed(2),
          required: purchaseAmount.toFixed(2),
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

      const profit = purchaseAmount - costPrice;

      // Handle agent commission
      let agentId: string | undefined;
      let agentProfit = 0;

      if (agentSlug) {
        const agent = await storage.getAgentBySlug(agentSlug);
        if (agent) {
          agentId = agent.id;
          const markup = parseFloat(agent.customPricingMarkup || "0") / 100;
          agentProfit = basePrice * markup;
        }
      }

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
        agentId,
        agentProfit: agentProfit > 0 ? agentProfit.toFixed(2) : undefined,
      });

      // Deduct from wallet
      const newBalance = walletBalance - purchaseAmount;
      await storage.updateUser(dbUser.id, { walletBalance: newBalance.toFixed(2) });

      // Process the order
      let deliveredPin: string | undefined;
      let deliveredSerial: string | undefined;

      if (productType === ProductType.RESULT_CHECKER && productId) {
        const checker = await storage.getResultChecker(productId);
        if (checker && !checker.isSold) {
          await storage.markResultCheckerSold(checker.id, transaction.id, customerPhone);
          deliveredPin = checker.pin;
          deliveredSerial = checker.serialNumber;
          
          await storage.updateTransaction(transaction.id, {
            status: TransactionStatus.COMPLETED,
            completedAt: new Date(),
            deliveredPin,
            deliveredSerial,
          });
        }
      } else {
        // For data bundles, mark as completed immediately
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
        });
      }

      // Credit agent
      if (agentId && agentProfit > 0) {
        await storage.updateAgentBalance(agentId, agentProfit, true);
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

}
