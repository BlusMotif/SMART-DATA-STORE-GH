import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  loginSchema, registerSchema, agentRegisterSchema, purchaseSchema, withdrawalRequestSchema,
  UserRole, TransactionStatus, ProductType, WithdrawalStatus
} from "@shared/schema";
import { initializePayment, verifyPayment, validateWebhookSignature, isPaystackConfigured, isPaystackTestMode } from "./paystack";
import { getSupabaseServer } from "./supabase";
import { 
  validatePhoneNetwork, 
  getNetworkMismatchError, 
  normalizePhoneNumber,
  isValidPhoneLength,
  detectNetwork,
  validatePhoneNumberDetailed
} from "./utils/network-validator";

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

// Generate unique transaction reference
function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomUUID().split("-")[0].toUpperCase();
  return `CLEC-${timestamp}-${random}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:10000'}/agent/activation-complete`,
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

      const paystackData = await paystackResponse.json();

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
  // PRODUCTS - DATA BUNDLES
  // ============================================
  app.get("/api/products/data-bundles", async (req, res) => {
    const network = req.query.network as string | undefined;
    try {
      const bundles = await storage.getDataBundles({ network, isActive: true });
      res.json(bundles);
    } catch (error: any) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch data bundles" });
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
  app.get("/api/paystack/config", (req, res) => {
    res.json({
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
      isConfigured: isPaystackConfigured(),
      isTestMode: isPaystackTestMode(),
    });
  });

  // ============================================
  // CHECKOUT / TRANSACTIONS
  // ============================================
  app.post("/api/checkout/initialize", async (req, res) => {
    try {
      // Validate input
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      const data = purchaseSchema.parse(req.body);
      
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

      if (data.productType === ProductType.DATA_BUNDLE) {
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
        costPrice = parseFloat(product.costPrice);
        network = product.network;
      } else {
        const [type, yearStr] = data.productId.split("-");
        const year = parseInt(yearStr);
        product = await storage.getAvailableResultChecker(type, year);
        if (!product) {
          return res.status(404).json({ error: "No stock available" });
        }
        productName = `${type.toUpperCase()} ${year} Result Checker`;
        amount = parseFloat(product.basePrice);
        costPrice = parseFloat(product.costPrice);
      }

      let agentId: string | undefined;
      let agentProfit = 0;

      if (data.agentSlug) {
        const agent = await storage.getAgentBySlug(data.agentSlug);
        if (agent && agent.isApproved) {
          agentId = agent.id;
          
          // Check if agent has custom pricing for this bundle
          if (data.productType === ProductType.DATA_BUNDLE) {
            const customPrice = await storage.getAgentPriceForBundle(agent.id, data.productId);
            if (customPrice) {
              const agentPrice = parseFloat(customPrice);
              // Agent profit is the difference between their price and cost price
              agentProfit = agentPrice - costPrice;
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
      const profit = amount - costPrice;

      const transaction = await storage.createTransaction({
        reference,
        type: data.productType,
        productId: product.id,
        productName,
        network,
        amount: amount.toFixed(2),
        costPrice: costPrice.toFixed(2),
        profit: profit.toFixed(2),
        customerPhone: normalizedPhone,
        customerEmail: data.customerEmail,
        status: TransactionStatus.PENDING,
        agentId,
        agentProfit: agentProfit.toFixed(2),
      });

      // Initialize Paystack payment
      const customerEmail = data.customerEmail || `${normalizedPhone}@clectech.com`;
      const callbackUrl = `${req.protocol}://${req.get("host")}/checkout/success`;

      try {
        const paystackResponse = await initializePayment({
          email: customerEmail,
          amount: Math.round(amount * 100), // Convert GHS to pesewas
          reference: reference,
          callbackUrl: callbackUrl,
          metadata: {
            transactionId: transaction.id,
            productName: productName,
            customerPhone: normalizedPhone,
          },
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
        });
      } catch (paystackError: any) {
        // If Paystack fails, clean up the transaction
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.FAILED,
        });
        throw new Error(paystackError.message || "Payment initialization failed");
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Checkout failed" });
    }
  });

  app.get("/api/transactions/verify/:reference", async (req, res) => {
    try {
      const transaction = await storage.getTransactionByReference(req.params.reference);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status === TransactionStatus.COMPLETED) {
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

      // Verify payment with Paystack API
      const paystackVerification = await verifyPayment(req.params.reference);
      
      if (paystackVerification.data.status !== "success") {
        // Payment not successful yet
        return res.json({
          success: false,
          status: paystackVerification.data.status,
          message: paystackVerification.data.gateway_response,
        });
      }

      // Payment successful - fulfill the order
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

      // Update transaction as completed
      await storage.updateTransaction(transaction.id, {
        status: TransactionStatus.COMPLETED,
        completedAt: new Date(),
        deliveredPin,
        deliveredSerial,
        paymentReference: paystackVerification.data.reference,
      });

      // Credit agent if applicable
      if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
        await storage.updateAgentBalance(transaction.agentId, parseFloat(transaction.agentProfit || "0"), true);
      }

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
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Verification failed" });
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
        if (paymentData.status === "abandoned" || paymentData.status === "cancelled") {
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
            console.log("User already exists, returning existing account details");
            const existingAgent = await storage.getAgentByUserId(existingUser.id);
            
            if (existingAgent) {
              return res.json({
                status: "success",
                message: "Agent account already created successfully",
                autoLogin: true,
                loginCredentials: {
                  email: regData.email,
                  password: regData.password
                },
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
              costPrice: "0.00",
              profit: activationFee.toString(),
              customerPhone: regData.phone,
              customerEmail: regData.email,
              paymentMethod: "paystack",
              status: TransactionStatus.COMPLETED,
              completedAt: new Date(),
              paymentReference: paymentData.reference,
              agentId: null,
              agentProfit: "0.00",
            });
            console.log("Step 4 SUCCESS: Activation transaction recorded:", transaction.id);

            // Generate login credentials for auto-login
            console.log("Step 5: Preparing auto-login response");
            const response = { 
              status: "success", 
              message: "Payment verified and agent account created successfully",
              autoLogin: true,
              loginCredentials: {
                email: regData.email,
                password: regData.password,
              },
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

  // Paystack Webhook Handler
  app.post("/api/paystack/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      const rawBody = req.rawBody as Buffer;

      // Validate webhook signature using raw body
      if (!rawBody || !validateWebhookSignature(rawBody, signature)) {
        console.error("Invalid Paystack webhook signature");
        return res.status(400).json({ error: "Invalid signature" });
      }

      const event = req.body;

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
              return res.sendStatus(200);
            }
            
            const regData = metadata.registration_data;
            
            try {
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
                return res.sendStatus(200);
              }

              const userId = authData.user.id;
              console.log("User created via webhook:", userId);

              // Create user in local database
              await storage.createUser({
                id: userId,
                email: regData.email,
                password: '',
                name: regData.name,
                phone: regData.phone,
                role: UserRole.AGENT,
              });

              // Create agent record (approved since payment is complete)
              const agent = await storage.createAgent({
                userId: userId,
                storefrontSlug: regData.storefrontSlug,
                businessName: regData.businessName,
                isApproved: true,
                paymentPending: false,
              });
              console.log("Agent created via webhook:", agent.id);

              // Create transaction record
              const activationFee = 60.00;
              await storage.createTransaction({
                reference: reference,
                type: ProductType.AGENT_ACTIVATION,
                productId: agent.id,
                productName: "Agent Account Activation",
                network: null,
                amount: activationFee.toString(),
                costPrice: "0.00",
                profit: activationFee.toString(),
                customerPhone: regData.phone,
                customerEmail: regData.email,
                paymentMethod: "paystack",
                status: TransactionStatus.COMPLETED,
                completedAt: new Date(),
                paymentReference: reference,
                agentId: null,
                agentProfit: "0.00",
              });
              
              console.log("Agent registration completed via webhook");
            } catch (createError: any) {
              console.error("Error creating account in webhook:", createError);
            }
            
            return res.sendStatus(200);
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
            }
            
            return res.sendStatus(200);
          }
        }

        // Handle regular transaction payments
        const transaction = await storage.getTransactionByReference(reference);
        if (!transaction) {
          console.error("Transaction not found for webhook:", reference);
          return res.sendStatus(200); // Return 200 to acknowledge receipt
        }

        if (transaction.status === TransactionStatus.COMPLETED) {
          return res.sendStatus(200); // Already processed
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

      res.sendStatus(200);
    } catch (error: any) {
      console.error("Webhook processing error:", error);
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
      console.log("Agent total profit:", agent.totalProfit);

      const user = await storage.getUser(dbUser.id);
      const stats = await storage.getTransactionStats(agent.id);

      res.json({
        agent: {
          ...agent,
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
        balance: Number(agent.balance) || 0,
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
      
      // Validate minimum withdrawal amount of GHC 50
      if (data.amount < 50) {
        return res.status(400).json({ error: "Minimum withdrawal amount is GH₵50" });
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

      // Create withdrawal with COMPLETED status (automatic approval)
      const withdrawal = await storage.createWithdrawal({
        agentId: agent.id,
        amount: data.amount.toFixed(2),
        status: WithdrawalStatus.COMPLETED, // Changed from PENDING to COMPLETED
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      });

      // Deduct from agent balance
      await storage.updateAgentBalance(agent.id, -data.amount, false);

      res.json({
        ...withdrawal,
        message: "Withdrawal completed successfully. Funds will be transferred to your account within 24 hours."
      });
    } catch (error: any) {
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

          // Get bundle to validate against cost price
          const bundle = await storage.getDataBundle(bundleId);
          if (bundle && priceNum >= parseFloat(bundle.costPrice)) {
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

  app.patch("/api/admin/withdrawals/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, adminNote } = req.body;

      const withdrawal = await storage.getWithdrawal(req.params.id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }

      if (withdrawal.status !== WithdrawalStatus.PENDING) {
        return res.status(400).json({ error: "Withdrawal already processed" });
      }

      // Get admin user from database using email from JWT
      const dbUser = await storage.getUserByEmail(req.user!.email);
      if (!dbUser) {
        return res.status(404).json({ error: "Admin user not found" });
      }

      const updated = await storage.updateWithdrawal(req.params.id, {
        status,
        adminNote,
        processedBy: dbUser.id,
        processedAt: new Date(),
      });

      // If rejected, refund to agent balance
      if (status === WithdrawalStatus.REJECTED) {
        await storage.updateAgentBalance(withdrawal.agentId, parseFloat(withdrawal.amount), false);
      }

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update withdrawal" });
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
        { name: "Daily Lite", network: "mtn", dataAmount: "500MB", validity: "1 Day", basePrice: "2.00", costPrice: "1.50" },
        { name: "Daily Plus", network: "mtn", dataAmount: "1GB", validity: "1 Day", basePrice: "3.50", costPrice: "2.80" },
        { name: "Weekly Basic", network: "mtn", dataAmount: "2GB", validity: "7 Days", basePrice: "8.00", costPrice: "6.50" },
        { name: "Weekly Pro", network: "mtn", dataAmount: "5GB", validity: "7 Days", basePrice: "15.00", costPrice: "12.00" },
        { name: "Monthly Starter", network: "mtn", dataAmount: "10GB", validity: "30 Days", basePrice: "25.00", costPrice: "20.00" },
        { name: "Monthly Premium", network: "mtn", dataAmount: "20GB", validity: "30 Days", basePrice: "45.00", costPrice: "38.00" },
        { name: "Daily Lite", network: "telecel", dataAmount: "500MB", validity: "1 Day", basePrice: "2.00", costPrice: "1.50" },
        { name: "Daily Plus", network: "telecel", dataAmount: "1GB", validity: "1 Day", basePrice: "3.50", costPrice: "2.80" },
        { name: "Weekly Basic", network: "telecel", dataAmount: "3GB", validity: "7 Days", basePrice: "10.00", costPrice: "8.00" },
        { name: "Weekly Pro", network: "telecel", dataAmount: "6GB", validity: "7 Days", basePrice: "18.00", costPrice: "14.50" },
        { name: "Monthly Basic", network: "telecel", dataAmount: "8GB", validity: "30 Days", basePrice: "22.00", costPrice: "18.00" },
        { name: "Monthly Plus", network: "telecel", dataAmount: "15GB", validity: "30 Days", basePrice: "38.00", costPrice: "32.00" },
        { name: "Daily Bundle", network: "airteltigo", dataAmount: "750MB", validity: "1 Day", basePrice: "2.50", costPrice: "1.90" },
        { name: "Daily Max", network: "airteltigo", dataAmount: "1.5GB", validity: "1 Day", basePrice: "4.00", costPrice: "3.20" },
        { name: "Weekly Bundle", network: "airteltigo", dataAmount: "4GB", validity: "7 Days", basePrice: "12.00", costPrice: "9.50" },
        { name: "Weekly Max", network: "airteltigo", dataAmount: "7GB", validity: "7 Days", basePrice: "20.00", costPrice: "16.00" },
        { name: "Monthly Value", network: "airteltigo", dataAmount: "12GB", validity: "30 Days", basePrice: "30.00", costPrice: "25.00" },
        { name: "Monthly Max", network: "airteltigo", dataAmount: "25GB", validity: "30 Days", basePrice: "50.00", costPrice: "42.00" },
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
        costPrice: "0.00",
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
      const {
        productType,
        productId,
        productName,
        network,
        amount,
        customerPhone,
        agentSlug,
      } = req.body;

      if (!productType || !productName || !amount || !customerPhone) {
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

      if (productType === ProductType.DATA_BUNDLE && productId) {
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

      const profit = basePrice - costPrice;

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
      
      const transaction = await storage.createTransaction({
        reference,
        type: productType,
        productId,
        productName,
        network,
        amount: purchaseAmount.toFixed(2),
        costPrice: costPrice.toFixed(2),
        profit: profit.toFixed(2),
        customerPhone,
        customerEmail: dbUser.email,
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
      const messageId = await storage.createChatMessage(chatId, user.id, senderType, message.trim());

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

  return httpServer;
}
