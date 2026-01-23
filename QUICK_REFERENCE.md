# 🚀 Hostinger Deployment Quick Reference

## Folder Structure After Build

```
SMART-DATA-STORE-GH/
├── dist/
│   ├── server/
│   │   └── index.js          ← Run this on Hostinger Node app
│   └── public/
│       ├── index.html
│       └── assets/
├── client/
│   └── dist/                 ← Upload this to public_html/
│       ├── index.html
│       └── assets/
└── package.json
```

---

## Build Commands

```bash
# Full production build
npm run build

# Frontend only
npm run build:client

# Server only  
npm run build:server

# Verify TypeScript compiles
npm run check
```

---

## Hostinger Node App Settings

| Setting | Value |
|---------|-------|
| **App Root** | `/server` |
| **Startup File** | `index.js` |
| **Node Version** | 20.x |
| **Port** | Auto (process.env.PORT) |
| **Build Cmd** | `npm run build:server` |
| **Start Cmd** | `npm start` |

---

## Environment Variables (Must Set in Hostinger)

### Backend (Absolute Minimum)
```
NODE_ENV=production
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
APP_URL=https://yourdomain.com
```

### Frontend (During Build)
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Domain Setup

| URL | Points To | Hostinger Setting |
|-----|-----------|-------------------|
| `https://yourdomain.com` | React app | `public_html/` |
| `https://api.yourdomain.com` | Node.js app | Node.js app root |

---

## Frontend Deployment (3 Steps)

```bash
# 1. Build locally
npm run build:client

# 2. Upload client/dist/* contents to public_html/
# (Use Hostinger File Manager or FTP)

# 3. Create .htaccess in public_html/
```

**`.htaccess` Content** (for SPA routing):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} !-f
  RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [QSA,L]
</IfModule>
```

---

## Backend Auto-Deploy (GitHub)

1. **Hostinger** → Node.js app → **Git**
2. **Connect** your GitHub repo
3. **Branch**: `main`
4. **Auto-Deploy**: ON
5. Every `git push` auto-deploys! 🎉

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **API returns 404** | Node app stopped? Check logs. Is startup file `index.js`? |
| **Frontend shows 404** | Missing `.htaccess`? File uploaded to `public_html/`? |
| **CORS errors** | `APP_URL` env var set? Matches your domain? |
| **Env vars not loading** | Restarted Node app after setting them? Variables are case-sensitive. |
| **Database won't connect** | `DATABASE_URL` correct? Database accessible from Hostinger? |

---

## Testing After Deploy

```bash
# Health check
curl https://api.yourdomain.com/api/health

# Frontend
Open https://yourdomain.com in browser

# API call
curl -H "Authorization: Bearer TOKEN" \
  https://api.yourdomain.com/api/agents
```

---

## Key Differences from Local Development

| Local | Production (Hostinger) |
|-------|------------------------|
| `http://localhost:5173` | `https://yourdomain.com` |
| `http://localhost:10000` | `https://api.yourdomain.com` |
| `.env.development` | Hostinger env vars + `.env.production.example` |
| Relative URLs `/api/...` | Full URLs `https://api.yourdomain.com/api/...` |
| No CORS check | CORS strictly enforced |

---

## Git Workflow for Deployment

```bash
# Make changes locally
nano src/server/index.ts

# Test
npm run dev
npm run check

# Commit
git add .
git commit -m "Feature: add new endpoint"

# Deploy (automatic!)
git push origin main

# Hostinger automatically:
# 1. Pulls new code from GitHub
# 2. Runs: npm run build:server
# 3. Restarts Node app
# ✅ Live in ~5 minutes!
```

---

## Critical Files

| File | Purpose | Deployment |
|------|---------|-----------|
| `package.json` | Root scripts | GitHub (auto) |
| `src/server/index.ts` | Server code | GitHub (auto) |
| `dist/server/index.js` | Compiled server | Auto-compiled by Hostinger |
| `client/dist/*` | React build | Upload to `public_html/` |
| `public_html/index.html` | React entry | Required for SPA |
| `public_html/.htaccess` | SPA routing | Required for all routes |
| `.env.production` | Server secrets | Set in Hostinger (not GitHub!) |

---

## ⚠️ Common Mistakes (Avoid!)

- ❌ Commit `.env` files to GitHub
- ❌ Hardcode `localhost` URLs in code
- ❌ Forget `.htaccess` in `public_html/`
- ❌ Upload to wrong folder
- ❌ Not set `process.env.PORT`
- ❌ Forget to restart Node app after env changes
- ❌ Use HTTP instead of HTTPS for API_URL
- ❌ Set CORS origin to `*` (security risk!)

---

## Success Checklist ✅

- ✅ Both domains resolve with HTTPS
- ✅ Frontend loads without 404s
- ✅ API health check responds
- ✅ Browser Network tab shows 200 responses
- ✅ No CORS errors in console
- ✅ Static assets (CSS, JS) load
- ✅ Database queries work
- ✅ Navigation doesn't break SPA

---

**Need Help?** Check `HOSTINGER_DEPLOYMENT.md` for detailed steps.
