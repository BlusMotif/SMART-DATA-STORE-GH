// Load environment variables FIRST - before any imports that might use them
import dotenv from "dotenv";
dotenv.config();

// Initialize Supabase immediately after loading environment variables
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServerInstance: SupabaseClient | null = null;

function initializeSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Supabase initialization:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceRoleKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseServiceRoleKey?.length
  });

  if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseServerInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('✅ Supabase server client initialized successfully');
  } else {
    console.error('❌ Supabase server client failed to initialize - missing environment variables');
  }
  
  return supabaseServerInstance;
}

export function getSupabaseServer(): SupabaseClient | null {
  return supabaseServerInstance;
}

// For backward compatibility
export let supabaseServer: SupabaseClient | null = null;

initializeSupabase();

import express, { type Request, Response, NextFunction, type Express } from "express";
// @ts-ignore
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes.js";
import { createServer } from "http";
// @ts-ignore
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get the directory path - use import.meta.url for correct path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../../dist/public");
  console.log(`Serving static files from: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory: ${distPath}`);
    console.error("Static file serving will not work properly. Make sure to build the client first.");
    // Don't throw error in production - just log and continue
    if (process.env.NODE_ENV === "production") {
      return;
    } else {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`,
      );
    }
  }

  // Serve static files
  app.use(express.static(distPath));

  // Root route - serve index.html
  app.get("/", (req: Request, res: Response) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`Could not find index.html at: ${indexPath}`);
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
      console.error(`Could not find index.html at: ${indexPath}`);
      res.status(500).send("Application not built properly");
    }
  });
}

const app = express();
const httpServer = createServer(app);

// Simple rate limiting (in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      const remainingTime = Math.ceil((record.resetTime - now) / 1000 / 60); // minutes
      return res.status(429).json({ 
        error: "Too many requests. Please try again later.",
        message: `You've exceeded the rate limit. Please wait ${remainingTime} minute(s) before trying again.`,
        retryAfter: remainingTime
      });
    }
    
    record.count++;
    next();
  };
};

// Cleanup old rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((record, ip) => {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  });
}, 60 * 60 * 1000);

// Security headers middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Disable all caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Apply rate limiting to sensitive routes
// Note: These limits are lenient for development. Adjust for production as needed.
app.use('/api/auth/login', rateLimit(10, 15 * 60 * 1000)); // 10 requests per 15 minutes
app.use('/api/auth/register', rateLimit(10, 30 * 60 * 1000)); // 10 requests per 30 minutes
app.use('/api/agent/register', rateLimit(10, 30 * 60 * 1000)); // 10 requests per 30 minutes

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

// Configure multer for file uploads
// Use different upload target in production (dist/public/assets) vs dev (client/public/assets)
const assetsUploadPath = process.env.NODE_ENV === "production"
  ? path.join(process.cwd(), "dist", "public", "assets")
  : path.join(process.cwd(), "client", "public", "assets");

// Ensure upload directory exists
try {
  if (!fs.existsSync(assetsUploadPath)) {
    fs.mkdirSync(assetsUploadPath, { recursive: true });
    console.log(`Created upload directory: ${assetsUploadPath}`);
  }
} catch (error) {
  console.error(`Failed to create upload directory ${assetsUploadPath}:`, error);
  // Don't fail the server startup, just log the error
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
    ? "https://smartdatastoregh.onrender.com"
    : `http://localhost:${process.env.PORT || 10000}`);

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// Session configuration
const SessionStore = MemoryStore(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "clectech-secret-key-change-in-production",
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
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Express error:", err);
    res.status(status).json({ message });
    // Don't throw the error - just log it
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

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Use the provided PORT when available (Render sets this). Fall back to 10000
  // for local development so the app still runs without additional env config.
  const PORT = Number(process.env.PORT) || 10000;
  httpServer.listen(
    {
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${PORT}`);
    },
  );
})();

// Global error handlers to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});
