import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import {
  loginSchema, registerSchema, agentRegisterSchema, purchaseSchema, withdrawalRequestSchema,
  UserRole, TransactionStatus, ProductType, WithdrawalStatus
} from "@shared/schema";
import { initializePayment, verifyPayment, validateWebhookSignature, isPaystackConfigured, isPaystackTestMode } from "./paystack";
import { supabaseServer } from "./supabase";

// Supabase JWT auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
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

    if (!supabaseServer) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const { data: { user }, error } = await supabaseServer.auth.getUser(token);

    if (error || !user || !user.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: "Unauthorized" });
  }
};

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const token = authHeader.substring(7);

    if (!supabaseServer) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const { data: { user }, error } = await supabaseServer.auth.getUser(token);

    if (error || !user || !user.email || user.user_metadata?.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(403).json({ error: "Admin access required" });
  }
};

const requireAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ error: "Agent access required" });
    }

    const token = authHeader.substring(7);

    if (!supabaseServer) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const { data: { user }, error } = await supabaseServer.auth.getUser(token);

    if (error || !user || !user.email || user.user_metadata?.role !== UserRole.AGENT) {
      return res.status(403).json({ error: "Agent access required" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };
    next();
  } catch (error) {
    console.error('Agent auth middleware error:', error);
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
      const data = registerSchema.parse(req.body);

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

      // Create user in local database
      try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await storage.createUser({
          ...data,
          password: hashedPassword,
          role: UserRole.GUEST,
        });

        res.status(201).json({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          access_token: supabaseData.session?.access_token,
          refresh_token: supabaseData.session?.refresh_token,
        });
      } catch (dbError) {
        console.error("Database error creating user:", dbError);
        // If database creation fails, we should probably delete the Supabase user
        // But for now, just return an error
        return res.status(500).json({ error: "Failed to create user in database" });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

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

      // Get user role from user metadata or database
      let role = data.user.user_metadata?.role || 'user';
      let agent = null;

      // Try to get user from database for additional data
      try {
        const dbUser = await storage.getUserByEmail(email);
        if (dbUser) {
          role = dbUser.role;
          if (dbUser.role === UserRole.AGENT) {
            agent = await storage.getAgentByUserId(dbUser.id);
          }
        }
      } catch (dbError) {
        console.error("Database error getting user data:", dbError);
        // Continue with Supabase data if database fails
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

      if (!supabaseServer) {
        return res.status(500).json({ error: "Supabase not configured" });
      }

      const { data: { user }, error } = await supabaseServer.auth.getUser(token);

      if (error || !user) {
        return res.json({ user: null });
      }

      // Get user role from user metadata or database
      let role = user.user_metadata?.role || 'user';
      let agent = null;

      // Try to get user from database for additional data
      try {
        const dbUser = await storage.getUserByEmail(user.email!);
        if (dbUser) {
          role = dbUser.role;
          if (dbUser.role === UserRole.AGENT) {
            agent = await storage.getAgentByUserId(dbUser.id);
          }
        }
      } catch (dbError) {
        console.error("Database error getting user data:", dbError);
        // Continue with Supabase data if database fails
      }

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
      if (!supabaseServer) {
        console.error('Supabase server client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
        return res.status(500).json({ error: "Server configuration error" });
      }

      const data = agentRegisterSchema.parse(req.body);
      console.log("Agent registration data:", data);

      // Check if storefront slug is taken
      const existingSlug = await storage.getAgentBySlug(data.storefrontSlug);
      if (existingSlug) {
        return res.status(400).json({ error: "Storefront URL already taken" });
      }

      console.log("Creating user in Supabase Auth");
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
        email: data.email,
        password: data.password,
        user_metadata: {
          name: data.name,
          phone: data.phone,
          role: 'agent'
        },
        email_confirm: true
      });

      if (authError) {
        console.error("Supabase auth error:", authError);
        return res.status(400).json({ error: authError.message });
      }

      console.log("Supabase user created:", authData.user.id);

      console.log("Creating agent in database");
      // Create agent record in database
      const agent = await storage.createAgent({
        userId: authData.user.id,
        storefrontSlug: data.storefrontSlug,
        businessName: data.businessName,
        isApproved: false,
      });

      console.log("Agent created:", agent.id);

      res.json({
        user: { 
          id: authData.user.id, 
          email: authData.user.email, 
          name: data.name, 
          role: 'agent',
          phone: data.phone
        },
        agent: { 
          id: agent.id, 
          businessName: agent.businessName, 
          storefrontSlug: agent.storefrontSlug, 
          isApproved: false 
        },
      });
    } catch (error: any) {
      console.error("Error during agent registration:", error.message);
      res.status(500).json({ error: "Registration failed" });
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
        dataBundles: bundles.map(b => ({
          ...b,
          price: (parseFloat(b.basePrice) * (1 + parseFloat(agent.customPricingMarkup || "0") / 100)).toFixed(2),
        })),
        resultCheckers: resultCheckerStock,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load store" });
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
      const data = purchaseSchema.parse(req.body);
      
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
          const markup = parseFloat(agent.customPricingMarkup || "0");
          const agentPrice = amount * (1 + markup / 100);
          agentProfit = agentPrice - amount;
          amount = agentPrice;
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
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        status: TransactionStatus.PENDING,
        agentId,
        agentProfit: agentProfit.toFixed(2),
      });

      // Initialize Paystack payment
      const customerEmail = data.customerEmail || `${data.customerPhone}@clectech.com`;
      const callbackUrl = `${req.protocol}://${req.get("host")}/checkout/success`;

      try {
        const paystackResponse = await initializePayment({
          email: customerEmail,
          amount: amount,
          reference: reference,
          callbackUrl: callbackUrl,
          metadata: {
            transactionId: transaction.id,
            productName: productName,
            customerPhone: data.customerPhone,
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
      const data = withdrawalRequestSchema.parse(req.body);

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
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const withdrawal = await storage.createWithdrawal({
        agentId: agent.id,
        amount: data.amount.toFixed(2),
        status: WithdrawalStatus.PENDING,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      });

      // Deduct from agent balance
      await storage.updateAgentBalance(agent.id, -data.amount, false);

      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Withdrawal request failed" });
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
      const { type, year, basePrice, costPrice, checkers: checkersStr } = req.body;
      
      if (!type || !year || !basePrice || !costPrice || !checkersStr) {
        return res.status(400).json({ error: "Missing required fields" });
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

  return httpServer;
}
