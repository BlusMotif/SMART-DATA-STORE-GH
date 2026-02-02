/**
 * Server Entry Point
 * 
 * Environment variables are loaded in the following priority:
 * 1. System environment variables (set by hosting providers like Hostinger)
 * 2. .env.production / .env.development files (for local development)
 * 3. .env file (base fallback)
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get directory for resolving paths (ESM equivalent of __dirname)
const __serverFilename = fileURLToPath(import.meta.url);
const __serverDirname = path.dirname(__serverFilename);
const rootDir = path.resolve(__serverDirname, '../..');

/**
 * Load environment variables
 * Always load from .env files to ensure correct values
 * Environment-specific files override base .env
 */
function loadEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Load base .env first
  dotenv.config({ path: path.join(rootDir, '.env'), override: true });
  
  // Then load environment-specific file (overrides base)
  const envFile = nodeEnv === 'production' ? '.env.production' : '.env.development';
  dotenv.config({ path: path.join(rootDir, envFile), override: true });
}

// Load environment before anything else
loadEnvironment();

// Validate required environment variables
function validateEnv(): void {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    // Missing env vars - will fail on DB connection
  }
}

validateEnv();

// Initialize Supabase immediately after loading environment variables
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServerInstance: SupabaseClient | null = null;

function initializeSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseServerInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return supabaseServerInstance;
}

export function getSupabaseServer(): SupabaseClient | null {
  return supabaseServerInstance;
}

// For backward compatibility
export let supabaseServer: SupabaseClient | null = null;

// Allow skipping Supabase initialization for local dev/smoke tests
if (process.env.SKIP_DB !== 'true') {
  initializeSupabase();
}

import express, { type Request, Response, NextFunction, type Express } from "express";
// @ts-ignore
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
// @ts-ignore
import cors from "cors";
import multer from "multer";
import fs from "fs";

// Reuse __dirname from top of file
const __filename = __serverFilename;
const __dirname = __serverDirname;

// ========================
// TIMEOUTS & PERFORMANCE
// ========================
const REQUEST_TIMEOUT_MS = 30 * 1000; // 30 seconds
const SOCKET_TIMEOUT_MS = 60 * 1000; // 60 seconds
const KEEP_ALIVE_TIMEOUT_MS = 65 * 1000; // 65 seconds

function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../../dist/public");
  
  if (!fs.existsSync(distPath)) {
    // Don't throw error in production - just continue
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`,
      );
    }
    return;
  }

  // Serve static files with optimized caching for shared hosting
  // Assets with hash in filename get long cache, others get short cache
  app.use(express.static(distPath, {
    maxAge: '1d', // 1 day default cache
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Long cache for hashed assets (js, css with hash in name)
      if (filePath.match(/\.(js|css)$/) && filePath.match(/\.[a-f0-9]{8}\./)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Long cache for images and fonts
      else if (filePath.match(/\.(woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
      }
      // Short cache for HTML
      else if (filePath.match(/\.html?$/)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  // Explicit manifest.json route (some hosts block direct JSON file access)
  app.get("/manifest.json", (req: Request, res: Response) => {
    const manifestPath = path.resolve(distPath, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      res.setHeader('Content-Type', 'application/manifest+json');
      res.sendFile(manifestPath);
    } else {
      // Return a basic manifest if file doesn't exist
      res.setHeader('Content-Type', 'application/manifest+json');
      res.json({
        name: "Resellers Hub Pro GH",
        short_name: "ResellersHub",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000"
      });
    }
  });

  // Root route - serve index.html
  app.get("/", (req: Request, res: Response) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send("Application not built properly");
    }
  });

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req: Request, res: Response) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send("Application not built properly");
    }
  });
}

const app = express();
const httpServer = createServer(app);

// Export app for Hostinger Express framework compatibility
export { app };
export default app;

// ========================
// ADVANCED RATE LIMITING
// ========================
interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const createRateLimiter = (maxRequests: number, windowMs: number, options?: { blockDurationMs?: number }) => {
  const blockDurationMs = options?.blockDurationMs || windowMs;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      let record = rateLimitMap.get(ip);
      
      // Check if IP is temporarily blocked
      if (record?.blockedUntil && now < record.blockedUntil) {
        const remainingTime = Math.ceil((record.blockedUntil - now) / 1000);
        res.set('Retry-After', String(Math.ceil(remainingTime / 60)));
        return res.status(429).json({
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
          retryAfter: remainingTime
        });
      }
      
      // Reset if window expired
      if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      // Check request limit
      if (record.count >= maxRequests) {
        record.blockedUntil = now + blockDurationMs;
        const remainingTime = Math.ceil(blockDurationMs / 1000);
        res.set('Retry-After', String(Math.ceil(remainingTime / 60)));
        return res.status(429).json({
          error: "Rate limit exceeded",
          message: `Too many requests from this IP. Blocked for ${Math.ceil(remainingTime / 60)} minute(s).`,
          retryAfter: remainingTime
        });
      }
      
      record.count++;
      next();
    } catch (error) {
      // On error, allow request to pass through
      next();
    }
  };
};

// Async cleanup for old rate limit entries - optimized for shared hosting
const startRateLimitCleanup = () => {
  setInterval(async () => {
    try {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetTime && (!record.blockedUntil || now > record.blockedUntil)) {
          rateLimitMap.delete(ip);
          cleaned++;
        }
      }
      
      // Prevent memory bloat on shared hosting - limit to 2000 IPs for 1000+ users
      if (rateLimitMap.size > 2000) {
        const entriesToDelete = rateLimitMap.size - 2000;
        const iterator = rateLimitMap.keys();
        for (let i = 0; i < entriesToDelete; i++) {
          const key = iterator.next().value;
          if (key) rateLimitMap.delete(key);
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 5 * 60 * 1000); // Run every 5 minutes for shared hosting
};

// Start cleanup on server init
startRateLimitCleanup();

// Security headers middleware (non-blocking async)
app.use(async (req, res, next) => {
  try {
    // Set timeout for this request
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request timeout" });
        req.socket.destroy();
      }
    }, REQUEST_TIMEOUT_MS);
    
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://api.paystack.co https://checkout.paystack.com https://h.online-metrix.net; script-src-elem 'self' 'unsafe-inline' https://js.paystack.co https://api.paystack.co https://checkout.paystack.com https://h.online-metrix.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.paystack.co https://js.paystack.co https://checkout.paystack.com https://h.online-metrix.net https://jddstfppigucldetsxws.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com; frame-src https://js.paystack.co https://checkout.paystack.com; object-src 'none'; base-uri 'self'; form-action 'self';");
    // Disable all caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  } catch (error) {
    next();
  }
});

// Public health check endpoint (must be before rate limiting middleware)
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    rateLimitDisabled: process.env.DISABLE_RATE_LIMIT === 'true'
  });
});

// Database health check endpoint
app.get('/api/health/db', async (_req: Request, res: Response) => {
  try {
    const { pool } = await import('./db.js');
    if (!pool) {
      return res.status(503).json({ status: 'error', message: 'Database pool not initialized' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      client.release();
      res.status(200).json({ 
        status: 'ok', 
        message: 'Database connection healthy',
        timestamp: result.rows[0]?.now 
      });
    } catch (err: any) {
      client.release();
      res.status(503).json({ 
        status: 'error', 
        message: 'Database query failed',
        error: err.message 
      });
    }
  } catch (error: any) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Database pool error',
      error: error.message 
    });
  }
});

// Database connection monitor middleware
app.use(async (req, res, next) => {
  try {
    const { pool } = await import('./db.js');
    
    // Attach pool to request for potential use in routes
    (req as any).dbPool = pool;
    
    // Check if pool is healthy
    if (pool && pool.totalCount > 0) {
      // Monitor pool status
      const idleCount = pool.idleCount || 0;
      const totalCount = pool.totalCount || 0;
      
    }
    
    next();
  } catch (error) {
    next(); // Continue anyway
  }
});

// Optional toggle to disable rate limiting for local testing
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true';
if (!disableRateLimit) {
  // Apply advanced rate limiting to sensitive routes (strict)
  app.use('/api/auth/login', createRateLimiter(10, 15 * 60 * 1000, { blockDurationMs: 30 * 60 * 1000 })); // 10 req/15min, block for 30min
  app.use('/api/auth/register', createRateLimiter(10, 30 * 60 * 1000, { blockDurationMs: 60 * 60 * 1000 })); // 10 req/30min, block for 1hr
  app.use('/api/agent/register', createRateLimiter(10, 30 * 60 * 1000, { blockDurationMs: 60 * 60 * 1000 })); // 10 req/30min, block for 1hr

  // Higher limits for frequently-called read-only endpoints (prevents 429 errors) - OPTIMIZED FOR 1000+ USERS
  app.use('/api/auth/me', createRateLimiter(600, 60 * 1000)); // 600 req/min - called on every page
  app.use('/api/announcements', createRateLimiter(500, 60 * 1000)); // 500 req/min - polled frequently
  app.use('/api/break-settings', createRateLimiter(500, 60 * 1000)); // 500 req/min - checked often
  app.use('/api/products', createRateLimiter(400, 60 * 1000)); // 400 req/min - product listings
  app.use('/api/bundles', createRateLimiter(400, 60 * 1000)); // 400 req/min - bundle listings
  app.use('/api/user/stats', createRateLimiter(500, 60 * 1000)); // 500 req/min - dashboard stats
  app.use('/api/transactions', createRateLimiter(400, 60 * 1000)); // 400 req/min - transaction history
  app.use('/api/agent', createRateLimiter(400, 60 * 1000)); // 400 req/min - agent endpoints

  // General API rate limit (300 req/min - significantly increased for shared hosting with 1000+ users)
  app.use('/api/', createRateLimiter(300, 60 * 1000));
}

// Development-only endpoint to clear rate limits
if (process.env.NODE_ENV !== "production") {
  app.post('/api/dev/clear-rate-limits', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    rateLimitMap.delete(ip);
    res.json({ message: `Rate limits cleared for ${ip}` });
  });
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Async logging middleware (non-blocking)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    // Use setImmediate to defer logging to next iteration
    setImmediate(() => {
      try {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          log(logLine);
        }
      } catch (error) {
        // Ignore logging errors
      }
    });
  });

  next();
});

// Compression middleware for better performance on shared hosting
// Must be applied before static files and routes
import compression from "compression";
app.use(compression({
  level: 6, // Balanced compression level (1-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if no-transform is set
    if (req.headers['cache-control']?.includes('no-transform')) {
      return false;
    }
    // Use default filter for other cases
    return compression.filter(req, res);
  }
}));

// Use different upload target in production (dist/public/assets) vs dev (client/public/assets)
const assetsUploadPath = process.env.NODE_ENV === "production"
  ? path.join(process.cwd(), "dist", "public", "assets")
  : path.join(process.cwd(), "client", "public", "assets");

// Ensure upload directory exists
try {
  if (!fs.existsSync(assetsUploadPath)) {
    fs.mkdirSync(assetsUploadPath, { recursive: true });
  }
} catch (error) {
  // Don't fail the server startup
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assetsUploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "_" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Make upload available globally
declare global {
  var upload: multer.Multer;
}
global.upload = upload;

// CORS configuration
// Determine allowed frontend origin using environment variable or sensible defaults
const FRONTEND_URL = process.env.APP_URL
  || (process.env.NODE_ENV === "production"
    ? "https://resellershubprogh.com"
    : process.env.NODE_ENV === "development"
      ? "http://localhost:5173"
      : `http://localhost:${process.env.PORT || 10000}`);

// Allow multiple origins for flexibility
const allowedOrigins = [
  FRONTEND_URL,
  "https://resellershubprogh.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
].filter(Boolean);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow localhost origins in development
    if (origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    return callback(new Error(`Not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Expires'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
}));

// Session configuration
const SessionStore = MemoryStore(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret-key-in-production",
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    await registerRoutes(httpServer, app);

    // Global async error handler (non-blocking)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      setImmediate(async () => {
        try {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          
          if (!res.headersSent) {
            res.status(status).json({ message });
          }
        } catch (error) {
          // Ignore error handler failures
        }
      });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }

    // ========================
    // CONFIGURE TIMEOUTS
    // ========================
    httpServer.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
    httpServer.headersTimeout = KEEP_ALIVE_TIMEOUT_MS + 5000;

    // Set socket timeout
    httpServer.on('connection', (socket) => {
      socket.setTimeout(SOCKET_TIMEOUT_MS);
      socket.on('timeout', () => {
        socket.destroy();
      });
    });

    // PORT configuration:
    // - Hostinger typically uses port 3000 for Node.js apps
    // - Other providers (Render, Railway) set PORT env var
    // - Local development defaults to 3000
    const PORT = Number(process.env.PORT) || 3000;
    const HOST = "0.0.0.0";
    
    httpServer.listen(
      {
        port: PORT,
        host: HOST,
      },
      async () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
        
        // Warm up database connection pool for faster first queries
        try {
          const { warmupDatabaseConnection } = await import('./db.js');
          await warmupDatabaseConnection();
        } catch (dbErr: any) {
          console.error('[Startup] Database warmup failed:', dbErr.message);
        }
      },
    );
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
})();

// ========================
// GLOBAL ERROR HANDLERS (Non-blocking)
// ========================
process.on('uncaughtException', (err) => {
  // Log but don't expose details
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  // Ignore in production to prevent crashes
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  httpServer.close(() => {
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', async () => {
  httpServer.close(() => {
    process.exit(0);
  });
});
