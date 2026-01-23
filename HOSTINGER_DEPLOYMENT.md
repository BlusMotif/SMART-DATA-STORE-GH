# 🚀 Hostinger Deployment Guide - ResellersHub Pro GH

## Overview

Your monorepo is structured for optimal Hostinger deployment:

```
SMART-DATA-STORE-GH/
├── client/              → React (Vite) - Static files
├── src/server/          → Express (Node.js) - API server
├── migrations/          → Database migrations
├── package.json         → Root build scripts
└── README.md
```

## ✅ Current Setup Status

Your project is **90% ready** for Hostinger deployment. Here's what's already configured:

### ✅ Server (src/server/index.ts)
- ✅ Listens on `process.env.PORT` (dynamic, not hardcoded)
- ✅ Binds to `0.0.0.0` (accessible from Hostinger)
- ✅ Proper error handling and logging
- ✅ CORS headers configured
- ✅ Static file serving for React build
- ✅ Environment variable support

### ✅ Client (client/)
- ✅ Vite build process (`npm run build`)
- ✅ Environment variable support (`VITE_API_BASE_URL`)
- ✅ API configuration uses env vars

### ❌ Missing/Needs Update
- ❌ Production environment files (`.env.production`)
- ❌ Deployment checklist
- ❌ Hostinger-specific configuration steps

---

## 📋 Pre-Deployment Checklist

### 1. GitHub Repository Setup

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Deployment ready: monorepo structure configured"

# Create main branch
git branch -M main

# Add remote
git remote add origin https://github.com/yourname/your-repo.git

# Push to GitHub
git push -u origin main
```

### 2. Environment Variables Required

#### Server (.env.production in Hostinger)
```env
# Database
DATABASE_URL=your_postgres_url
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Node
NODE_ENV=production
PORT=3000  # Hostinger will override this

# External APIs
PAYSTACK_PUBLIC_KEY=your_paystack_key
PAYSTACK_SECRET_KEY=your_paystack_secret

# Your domain
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# Session
SESSION_SECRET=your_random_secret_key_here
```

#### Client (.env.production in Hostinger)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🔧 Step-by-Step Hostinger Deployment

### Step 1: Create Node.js Application (Backend)

1. **Log in to Hostinger hPanel** → Go to **Advanced** → **Node.js**
2. **Create new Node app**:
   - **App Name**: `resellers-hub-api`
   - **Node Version**: `20.x` (matches your engines in package.json)
   - **App Root**: `/server` ⚠️ **Important!** Hostinger will look for `index.js` here
   - **Startup File**: `index.js`
   - **Port**: Leave default (Hostinger sets `process.env.PORT`)

3. **Install Dependencies**:
   ```bash
   npm install
   npm run build:server
   ```

### Step 2: Build Server for Production

Before deploying, compile TypeScript to JavaScript:

```bash
npm run build:server
```

This creates `dist/server/index.js` which will be run on Hostinger.

⚠️ **Important**: Hostinger's Node app expects JavaScript files in the app root, not TypeScript.

### Step 3: Connect GitHub (Auto-Deploy)

1. In Hostinger hPanel → Node.js app → **Git**
2. **Connect GitHub Repository**:
   - Choose your GitHub repo
   - Select branch: `main`
   - **Build Command**: `npm run build:server`
   - **Start Command**: `npm start`
   - **Enable Auto-Deploy**: ON

This ensures:
- ✅ Code is pulled from GitHub on every push
- ✅ Dependencies are installed
- ✅ TypeScript is compiled
- ✅ Server restarts automatically

### Step 4: Setup CORS (Critical!)

In `src/server/index.ts`, configure CORS for your domain:

```typescript
app.use(cors({
  origin: [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : undefined
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Step 5: Deploy Frontend (React)

#### Option A: Hostinger File Manager (Simple)

1. **Build locally**:
   ```bash
   npm run build:client
   ```

2. **Upload `client/dist/` contents**:
   - Go to Hostinger **File Manager**
   - Navigate to `public_html/`
   - **Upload all files** from `client/dist/`

3. **Create `.htaccess` for SPA routing**:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} !-f
     RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} !-d
     RewriteRule ^ index.html [QSA,L]
   </IfModule>
   ```

#### Option B: GitHub Auto-Deploy (Advanced)

1. Create a GitHub Actions workflow to build & deploy:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Frontend
        run: |
          cd client
          npm install
          npm run build
      
      - name: Deploy to Hostinger (via FTP or SSH)
        env:
          FTP_USER: ${{ secrets.FTP_USER }}
          FTP_PASS: ${{ secrets.FTP_PASS }}
        run: |
          # Use lftp or similar to upload dist/ to public_html/
```

### Step 6: Setup Domain Pointing

#### For Main Domain (Frontend)
1. **Hostinger** → **Domains** → **Manage**
2. Keep pointing to `public_html/`
3. Already done - serves your React app

#### For API Subdomain (Backend)
1. **Hostinger** → **Domains** → **Subdomains**
2. **Create Subdomain**:
   - **Name**: `api`
   - **Points to**: Your Node.js app folder (set in step 1)

Now:
- `https://yourdomain.com` → React (public_html/)
- `https://api.yourdomain.com` → Express (Node.js app)

### Step 7: Update Environment Variables in Client

Create `client/.env.production`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

This will be used during `npm run build` to set API endpoints.

### Step 8: Test Deployment

```bash
# Test API is running
curl https://api.yourdomain.com/api/health

# Should return 200 OK with health status

# Test Frontend is serving
curl https://yourdomain.com
```

---

## 🐛 Troubleshooting

### Backend isn't responding
- Check Hostinger Node app is **Running** (not stopped)
- Check logs: Hostinger hPanel → Node app → **View logs**
- Verify `process.env.PORT` is being read correctly
- Ensure `npm start` runs `node dist/server/index.js`

### CORS errors in browser console
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Update CORS origin in `src/server/index.ts` to match your domain

### Frontend shows 404
- Ensure `public_html/` has `index.html` and static files
- Check `.htaccess` SPA routing is present
- Verify build was completed: `npm run build:client`

### Static files not loading (CSS/JS broken)
- Check `dist/` folder exists after build
- Verify relative paths in Vite config
- Look for 404s in browser Network tab

### Environment variables not loading
- Double-check `.env.production` in Hostinger
- Restart Node app after updating env vars
- Verify variable names match `VITE_*` prefix for client

---

## 📊 Production Architecture Diagram

```
User Browser
    ↓
┌─────────────────────────────────┐
│   Hostinger Server              │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │  yourdomain.com           │  │
│  │  (public_html/)           │  │
│  │  React App (Static)       │  │
│  │  - index.html             │  │
│  │  - app-*.js               │  │
│  │  - style-*.css            │  │
│  │  - .htaccess (SPA routing)│  │
│  └───────────────────────────┘  │
│           ↓ API calls            │
│  ┌───────────────────────────┐  │
│  │  api.yourdomain.com       │  │
│  │  (Node.js App)            │  │
│  │  Express Server           │  │
│  │  - dist/server/index.js   │  │
│  │  - CORS enabled           │  │
│  │  - Process.env.PORT       │  │
│  └───────────────────────────┘  │
│           ↓                      │
│  ┌───────────────────────────┐  │
│  │  External Services        │  │
│  │  - Supabase (DB)          │  │
│  │  - Paystack (Payments)    │  │
│  │  - Skitech API            │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## 🔐 Security Checklist

- [ ] Remove `.env` from git (check `.gitignore`)
- [ ] Set all secrets in Hostinger environment variables
- [ ] Enable HTTPS (Hostinger provides free SSL)
- [ ] Configure CORS to only allow your domain
- [ ] Validate all user inputs
- [ ] Use environment variables for API keys (never hardcode)
- [ ] Enable rate limiting (already in your code!)
- [ ] Monitor error logs regularly
- [ ] Keep Node version updated (currently 20.x)

---

## 📚 Next Steps

1. **Test locally first**:
   ```bash
   npm run dev  # Start development server
   ```

2. **Build production bundles**:
   ```bash
   npm run build  # Builds both client and server
   ```

3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Hostinger deployment"
   git push origin main
   ```

4. **Follow deployment steps** 1-8 above

5. **Monitor logs** during first week of production

---

## 📞 Support Resources

- Hostinger Docs: https://support.hostinger.com
- Express.js: https://expressjs.com
- Vite: https://vitejs.dev
- Supabase: https://supabase.com/docs

---

**Last Updated**: January 23, 2026  
**Status**: ✅ Ready for Hostinger Deployment
