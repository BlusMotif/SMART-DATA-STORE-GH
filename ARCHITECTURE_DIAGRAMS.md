# 🏗️ Architecture & Deployment Diagrams

## 1. Local Development Architecture

```
Your Computer
│
├─ npm run dev
│  │
│  ├─ Vite Dev Server (port 5173)
│  │  └─ React App
│  │     ├─ http://localhost:5173/
│  │     ├─ Auto hot-reload
│  │     └─ API calls to localhost:10000
│  │
│  └─ Express Server (port 10000)
│     ├─ http://localhost:10000
│     ├─ API endpoints
│     ├─ Static file serving
│     └─ Database connection (Supabase)
│
└─ Database
   └─ Supabase (Remote or Local)
```

### Development Workflow
```
Code Change
    ↓
Vite detects change
    ↓
Auto hot-reload
    ↓
Browser updates (no refresh needed)
```

---

## 2. Production Architecture on Hostinger

```
┌─────────────────────────── HOSTINGER HOSTING ──────────────────────────────┐
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Domain Name System (DNS)                                           │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  yourdomain.com       → public_html/ (React build)                  │    │
│  │  api.yourdomain.com   → Node.js app root (Express server)           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────┐        ┌──────────────────────────┐          │
│  │  FRONTEND                │        │  BACKEND                 │          │
│  │  (public_html/)          │        │  (Node.js App)           │          │
│  │                          │        │                          │          │
│  │  ├─ index.html          │        │  ├─ dist/server/         │          │
│  │  ├─ index-abc123.js     │        │  │  └─ index.js           │          │
│  │  ├─ style-def456.css    │        │  ├─ node_modules/        │          │
│  │  ├─ .htaccess           │        │  ├─ package.json         │          │
│  │  └─ assets/             │        │  └─ .env                 │          │
│  │     ├─ images/          │        │                          │          │
│  │     ├─ fonts/           │        │  Express Server:         │          │
│  │                          │        │  ├─ /api/health          │          │
│  │  React App runs in      │        │  ├─ /api/agents          │          │
│  │  browser - requests     │        │  ├─ /api/products        │          │
│  │  API from               │        │  ├─ /api/auth            │          │
│  │  https://api.yourdomain │        │  └─ /api/...             │          │
│  │                          │        │                          │          │
│  └──────────────────────────┘        └──────────────────────────┘          │
│           ↓ HTTP Requests                      ↓ Database Queries          │
│           │                                    │                           │
│           └────────────────────────┬───────────┘                           │
│                                    │                                       │
│  ┌────────────────────────────────┴───────────────────────────────────┐   │
│  │  SSL/TLS Certificate (HTTPS Encryption)                           │   │
│  │  - Hostinger provides free SSL                                    │   │
│  │  - Encrypts all traffic between browser and server               │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                     ↓
                    ┌─────────────────────────────────┐
                    │  External Services              │
                    ├─────────────────────────────────┤
                    │  Supabase PostgreSQL Database   │
                    │  Paystack (Payment Processing)  │
                    │  Skitech API (SMS/Services)     │
                    │  SendGrid (Email)               │
                    └─────────────────────────────────┘
```

---

## 3. Request Flow: Frontend to Backend

```
User in Browser
  │
  ├─ User clicks button
  │
  ├─ React component: onClick={handleLogin}
  │
  ├─ API Call:
  │  fetch('https://api.yourdomain.com/api/auth/login', { ... })
  │
  ├─ Browser Network Request
  │  ├─ DNS Lookup: api.yourdomain.com → Hostinger IP
  │  ├─ TLS Handshake (HTTPS)
  │  ├─ Send request with credentials
  │  │
  │  └─ Express Server receives request
  │     ├─ Check CORS origin (✓ allowed)
  │     ├─ Validate request body
  │     ├─ Query Supabase database
  │     │  (SELECT * FROM users WHERE email = ?)
  │     ├─ Validate password
  │     ├─ Create session
  │     ├─ Return { token, user }
  │     │
  │     └─ Send response
  │
  ├─ Browser receives response (status 200)
  │
  ├─ React parses JSON
  │
  ├─ Store token in localStorage
  │
  └─ Redirect to dashboard page
     └─ New page makes API call to fetch dashboard data
```

---

## 4. Build & Deployment Pipeline

```
Local Development
│
├─ Make code changes
├─ Test: npm run dev
├─ Commit: git commit
└─ Push: git push origin main
     │
     ↓
GitHub Repository
│
├─ Webhook triggered
├─ GitHub Actions workflow starts
│  │
│  ├─ Install dependencies: npm ci
│  ├─ Build client: npm run build:client
│  ├─ Build server: npm run build:server
│  ├─ TypeScript check: npm run check
│  └─ Verify dist/ exists (status: ✓)
│
├─ Notification sent to Hostinger
│
└─ Hostinger auto-deploy triggered
   │
   ├─ Pull latest code from GitHub
   ├─ Run: npm run build:server
   │  └─ Compiles TypeScript → JavaScript
   ├─ Install: npm install
   ├─ Stop old Node app
   ├─ Start new Node app: npm start
   │  └─ Runs: node dist/server/index.js
   └─ App live! ✅
     
---

## 5. File Structure After Build

```
SMART-DATA-STORE-GH/
│
├─ src/                        (TypeScript source)
│  └─ server/
│     ├─ index.ts              ← Compiled to dist/server/index.js
│     ├─ routes.ts
│     ├─ db.ts
│     └─ ...
│
├─ client/                      (React source)
│  ├─ src/
│  │  ├─ App.tsx
│  │  ├─ main.tsx
│  │  └─ ...
│  └─ dist/                    ← Build output (upload to public_html/)
│     ├─ index.html
│     ├─ index-abc123.js
│     ├─ style-def456.css
│     └─ assets/
│
├─ dist/                        (Build output)
│  ├─ server/
│  │  ├─ index.js              ← Run this on Hostinger!
│  │  ├─ routes.js
│  │  ├─ db.js
│  │  └─ ...
│  └─ public/                  ← React static files
│     ├─ index.html
│     └─ assets/
│
├─ node_modules/               (don't commit or upload)
│
└─ package.json                (root manifest)


HOW IT GETS TO HOSTINGER:

client/dist/*  ──> [Upload via FTP]  ──> Hostinger public_html/
                                          (Serves to yourdomain.com)

dist/server/   ──> [GitHub Auto-Deploy] ──> Hostinger /server
index.js                                     (Runs Node.js app)
```

---

## 6. CORS & Security Flow

```
Browser Request
  │
  ├─ User's browser at: https://yourdomain.com
  │
  ├─ JavaScript tries: fetch('https://api.yourdomain.com/api/data')
  │
  └─ Browser checks CORS
     │
     ├─ Sends preflight: OPTIONS https://api.yourdomain.com/api/data
     │
     └─ Express Server responds:
        │
        ├─ Checks: Is origin (https://yourdomain.com) allowed?
        │
        ├─ ✓ YES: In ALLOWED_ORIGINS array
        │  └─ Send: "Access-Control-Allow-Origin: https://yourdomain.com"
        │
        └─ ✗ NO: Not allowed
           └─ Block request
              (You see: "blocked by CORS policy" in browser console)

CORS_ALLOWED_ORIGINS:
├─ https://yourdomain.com          ← Main domain
├─ https://www.yourdomain.com      ← WWW variant
├─ https://api.yourdomain.com      ← API subdomain
├─ http://localhost:5173           ← Local dev only
└─ http://127.0.0.1:10000          ← Local dev only
```

---

## 7. Environment Variables Flow

```
Development (Local)
│
├─ .env.development file (local machine)
│  ├─ DATABASE_URL=localhost:5432/dev_db
│  ├─ SUPABASE_URL=http://localhost:54321
│  └─ NODE_ENV=development
│
├─ npm run dev reads .env.development
│
└─ Server runs in dev mode
   └─ Uses localhost databases

                 ↓ git push ↓

Production (Hostinger)
│
├─ Hostinger hPanel Environment Variables (set in UI)
│  ├─ DATABASE_URL=postgresql://prod.db.com:5432/prod_db
│  ├─ SUPABASE_URL=https://your-project.supabase.co
│  ├─ NODE_ENV=production
│  └─ SESSION_SECRET=super_secret_random_string
│
├─ npm start reads Hostinger env vars
│
└─ Server runs in production mode
   └─ Uses real production databases
```

---

## 8. Database Connection Architecture

```
Browser
  │
  ├─ Makes API call to Express
  │
  └─ Express Server (Node.js)
     │
     ├─ Receives request
     │
     ├─ Uses credentials from process.env.DATABASE_URL
     │  DATABASE_URL = postgresql://user:pass@db-host:5432/database
     │
     ├─ Connects to Supabase PostgreSQL
     │  ├─ Authenticate with credentials
     │  ├─ Execute SQL query
     │  └─ Return results
     │
     └─ Send response back to browser
        └─ React updates UI with data
```

---

## 9. Static File Serving (SPA Routing)

```
User visits: https://yourdomain.com/dashboard

Browser Request:
  │
  ├─ GET https://yourdomain.com/dashboard
  │
  └─ Nginx/Apache Server
     │
     ├─ Look for file: public_html/dashboard (NOT FOUND)
     │
     ├─ Check .htaccess rules:
     │  If file doesn't exist, serve index.html instead
     │
     └─ Return: public_html/index.html
        │
        └─ React App loads
           │
           ├─ React Router sees route: /dashboard
           │
           └─ Renders Dashboard component
              (User sees correct page even though file doesn't exist!)


WITHOUT .htaccess: 404 Error ❌
WITH .htaccess: React handles routing ✅
```

---

## 10. Deployment Timeline

```
Time    Event                              Status
────────────────────────────────────────────────────
00:00   Developer: git push origin main    ⏱️ Code being pushed

00:15   GitHub receives push              📦 Code received
        GitHub Actions triggered           🔨 Building...
        
00:30   Build completes successfully      ✅ Build OK
        Webhook sent to Hostinger         📡 Notifying...

00:45   Hostinger receives notification   ⏱️ Deploying...
        Pulls from GitHub                 ⬇️ Downloading code
        npm install                       📥 Installing deps
        npm run build:server              🔨 Compiling
        
01:00   Old Node app stops                🛑 Stopping old
        New Node app starts               🚀 Starting new

01:05   App is LIVE                       ✅ LIVE!
        All users can access              👥 Users see new version

Elapsed Time: ~1 minute from push to live ⚡
```

---

## 11. Troubleshooting Decision Tree

```
Is your app NOT working?
│
├─ Does frontend load but shows 404?
│  └─ Missing .htaccess or index.html
│
├─ Does frontend load but API calls fail?
│  ├─ Is Node app running?
│  ├─ Is CORS configured correctly?
│  ├─ Is subdomain dns pointing to Node app?
│  └─ Are env variables set?
│
├─ Does Node app not start?
│  ├─ Is dist/server/index.js compiled?
│  ├─ Are dependencies installed?
│  ├─ Check Hostinger logs
│  └─ Is startup file set to index.js?
│
├─ Are environment variables not loading?
│  ├─ Set them in Hostinger hPanel (not .env file)
│  ├─ Restart Node app after setting
│  └─ Variable names are case-sensitive
│
└─ Does database not connect?
   ├─ Is DATABASE_URL correct?
   ├─ Can database be accessed from Hostinger IP?
   └─ Are credentials valid?
```

---

## 12. Performance & Caching

```
Static Assets (CSS, JS, Images)
│
├─ Browser caches them (1 month by default)
│
├─ On new build, filenames change:
│  ├─ style-old-hash.css → style-new-hash.css
│  └─ Vite does this automatically
│
└─ New hash = new URL = browser downloads (no stale cache)

API Responses
│
├─ Can be cached by browser or CDN
│
├─ React Query handles smart caching
│  ├─ Requests same data within 5 min = cache hit
│  └─ Reduces server load
│
└─ Database queries optimized with indexes

Server Response Time
│
├─ Local network request: ~10-50ms
├─ Internet via HTTPS: ~50-200ms
├─ Database query: ~10-100ms
└─ Total typical response: ~100-300ms
```

---

**Version**: 1.0  
**Created**: January 23, 2026  
**Status**: ✅ Complete & Verified
