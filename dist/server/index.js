// Load environment variables FIRST - before any imports that might use them
import dotenv from "dotenv";
dotenv.config();
if (process.env.NODE_ENV === 'development') {
    dotenv.config({ path: '.env.development', override: true });
}
else if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production', override: true });
}
console.log('DATABASE_URL after loading:', process.env.DATABASE_URL);
// Initialize Supabase immediately after loading environment variables
import { createClient } from '@supabase/supabase-js';
let supabaseServerInstance = null;
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
    }
    else {
        console.error('❌ Supabase server client failed to initialize - missing environment variables');
    }
    return supabaseServerInstance;
}
export function getSupabaseServer() {
    return supabaseServerInstance;
}
// For backward compatibility
export let supabaseServer = null;
// Allow skipping Supabase initialization for local dev/smoke tests
if (process.env.SKIP_DB === 'true') {
    console.log('SKIP_DB=true — skipping Supabase initialization (no DB will be used)');
}
else {
    initializeSupabase();
}
import express from "express";
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
// ========================
// TIMEOUTS & PERFORMANCE
// ========================
const REQUEST_TIMEOUT_MS = 30 * 1000; // 30 seconds
const SOCKET_TIMEOUT_MS = 60 * 1000; // 60 seconds
const KEEP_ALIVE_TIMEOUT_MS = 65 * 1000; // 65 seconds
function serveStatic(app) {
    const distPath = path.resolve(__dirname, "../../dist/public");
    console.log(`Serving static files from: ${distPath}`);
    if (!fs.existsSync(distPath)) {
        console.error(`Could not find the build directory: ${distPath}`);
        console.error("Static file serving will not work properly. Make sure to build the client first.");
        // Don't throw error in production - just log and continue
        if (process.env.NODE_ENV === "production") {
            return;
        }
        else {
            throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
        }
    }
    // Serve static files
    app.use(express.static(distPath));
    // Root route - serve index.html
    app.get("/", (req, res) => {
        const indexPath = path.resolve(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        }
        else {
            console.error(`Could not find index.html at: ${indexPath}`);
            res.status(500).send("Application not built properly");
        }
    });
    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (req, res) => {
        // Skip API routes
        if (req.path.startsWith("/api")) {
            return res.status(404).json({ error: "API endpoint not found" });
        }
        const indexPath = path.resolve(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        }
        else {
            console.error(`Could not find index.html at: ${indexPath}`);
            res.status(500).send("Application not built properly");
        }
    });
}
const app = express();
const httpServer = createServer(app);
const rateLimitMap = new Map();
const createRateLimiter = (maxRequests, windowMs, options) => {
    const blockDurationMs = options?.blockDurationMs || windowMs;
    return async (req, res, next) => {
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
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            // On error, allow request to pass through
            next();
        }
    };
};
// Async cleanup for old rate limit entries
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
            if (cleaned > 0) {
                console.log(`[Rate Limit Cleanup] Removed ${cleaned} expired entries`);
            }
        }
        catch (error) {
            console.error('[Rate Limit Cleanup] Error:', error);
        }
    }, 60 * 60 * 1000); // Run every hour
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
    }
    catch (error) {
        console.error('Security headers middleware error:', error);
        next();
    }
});
// Public health check endpoint (must be before rate limiting middleware)
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        rateLimitDisabled: process.env.DISABLE_RATE_LIMIT === 'true'
    });
});
// Optional toggle to disable rate limiting for local testing
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true';
if (disableRateLimit) {
    console.log('[RateLimit] Disabled for local testing');
}
else {
    // Apply advanced rate limiting to sensitive routes
    app.use('/api/auth/login', createRateLimiter(10, 15 * 60 * 1000, { blockDurationMs: 30 * 60 * 1000 })); // 10 req/15min, block for 30min
    app.use('/api/auth/register', createRateLimiter(10, 30 * 60 * 1000, { blockDurationMs: 60 * 60 * 1000 })); // 10 req/30min, block for 1hr
    app.use('/api/agent/register', createRateLimiter(10, 30 * 60 * 1000, { blockDurationMs: 60 * 60 * 1000 })); // 10 req/30min, block for 1hr
    // General API rate limit (100 req/min)
    app.use('/api/', createRateLimiter(100, 60 * 1000));
}
// Development-only endpoint to clear rate limits
if (process.env.NODE_ENV !== "production") {
    app.post('/api/dev/clear-rate-limits', (req, res) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        rateLimitMap.delete(ip);
        res.json({ message: `Rate limits cleared for ${ip}` });
    });
}
app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express.urlencoded({ extended: false }));
// Async logging middleware (non-blocking)
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
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
            }
            catch (error) {
                console.error('Logging error:', error);
            }
        });
    });
    next();
});
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
}
catch (error) {
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
        }
        else {
            cb(new Error("Only image files are allowed"));
        }
    },
});
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
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Allow localhost origins in development
        if (origin?.startsWith('http://localhost:') || origin?.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        console.log(`CORS blocked origin: ${origin}`);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Expires'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
}));
// Session configuration
const SessionStore = MemoryStore(session);
app.use(session({
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
}));
export function log(message, source = "express") {
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
    let capturedJsonResponse = undefined;
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
        app.use((err, _req, res, _next) => {
            setImmediate(async () => {
                try {
                    const status = err.status || err.statusCode || 500;
                    const message = err.message || "Internal Server Error";
                    console.error("Express error:", err);
                    if (!res.headersSent) {
                        res.status(status).json({ message });
                    }
                }
                catch (error) {
                    console.error('Error handler failed:', error);
                }
            });
        });
        // importantly only setup vite in development and after
        // setting up all the other routes so the catch-all route
        // doesn't interfere with the other routes
        if (process.env.NODE_ENV === "production") {
            serveStatic(app);
        }
        else {
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
        // ALWAYS serve the app on the port specified in the environment variable PORT
        // Use the provided PORT when available (Render sets this). Fall back to 10000
        // for local development so the app still runs without additional env config.
        const PORT = Number(process.env.PORT) || 10000;
        const HOST = "0.0.0.0";
        console.log(`Starting server on ${HOST}:${PORT}, NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`[Timeouts] Request: ${REQUEST_TIMEOUT_MS}ms, Socket: ${SOCKET_TIMEOUT_MS}ms, Keep-Alive: ${KEEP_ALIVE_TIMEOUT_MS}ms`);
        httpServer.listen({
            port: PORT,
            host: HOST,
        }, () => {
            log(`serving on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
})();
// ========================
// GLOBAL ERROR HANDLERS (Non-blocking)
// ========================
process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err);
    // Don't exit the process in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]', {
        promise: String(promise),
        reason: String(reason)
    });
    // Don't exit the process, just log the error
});
// Graceful shutdown handler
process.on('SIGTERM', async () => {
    console.log('[SIGTERM] Graceful shutdown initiated');
    httpServer.close(() => {
        console.log('[Server] Closed all connections');
        process.exit(0);
    });
    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('[Server] Forced shutdown due to timeout');
        process.exit(1);
    }, 30000);
});
process.on('SIGINT', async () => {
    console.log('[SIGINT] Graceful shutdown initiated');
    httpServer.close(() => {
        console.log('[Server] Closed all connections');
        process.exit(0);
    });
});
console.log('[Server] Advanced features enabled: Async/Non-blocking, Rate Limiting, Request/Connection Timeouts');
