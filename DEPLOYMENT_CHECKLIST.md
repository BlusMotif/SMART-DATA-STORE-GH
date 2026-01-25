# ✅ GitHub to Hostinger Deployment Checklist

## Pre-Deployment (Local)

### Code Quality & Testing
- [ ] Run `npm run check` - TypeScript compilation check passes
- [ ] Run `npm run dev` - Development server starts without errors
- [ ] Test all features locally
- [ ] Check browser console for warnings/errors
- [ ] Test API endpoints with Postman/curl

### Build Verification
- [ ] Run `npm run build` - Production build completes successfully
- [ ] Verify `dist/` folder exists with compiled code
- [ ] Verify `client/dist/` has `index.html` and all assets
- [ ] Verify `dist/server/index.js` exists (compiled from TypeScript)

### Git & GitHub
- [ ] All code committed: `git status` shows no uncommitted changes
- [ ] Create `.gitignore` excludes:
  - [ ] `.env` and `.env.*.local`
  - [ ] `node_modules/`
  - [ ] `dist/`
  - [ ] `.env.production` (secrets!)
- [ ] GitHub repo created and configured
- [ ] Branch is `main` (not master)
- [ ] Latest code pushed: `git push origin main`

### Environment Setup
- [ ] `.env.development` configured locally
- [ ] `.env.production.example` created as template
- [ ] Sensitive data removed from all files (no hardcoded API keys)
- [ ] Database URL uses environment variable

---

## Hostinger Setup

### Node.js Application Creation
- [ ] Log in to Hostinger hPanel
- [ ] Navigate to Advanced → Node.js
- [ ] Create new Node app with settings:
  - [ ] **App Name**: `resellers-hub-api`
  - [ ] **Node Version**: `20.x` or higher
  - [ ] **App Root**: `/server`
  - [ ] **Startup File**: `index.js`

### GitHub Integration
- [ ] Connect GitHub repository to Node app
- [ ] Select `main` branch
- [ ] Enable **Auto-Deploy**
- [ ] Set **Build Command**: `npm run build:server`
- [ ] Set **Start Command**: `npm start`
- [ ] Test first deploy (should succeed)

### Environment Variables (Hostinger)
- [ ] Add `DATABASE_URL`
- [ ] Add `SUPABASE_URL`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Add `NODE_ENV=production`
- [ ] Add `SESSION_SECRET` (long random string)
- [ ] Add `PAYSTACK_PUBLIC_KEY`
- [ ] Add `PAYSTACK_SECRET_KEY`
- [ ] Add `APP_URL=https://yourdomain.com`
- [ ] Restart Node app after adding variables

### Domain Configuration
- [ ] Main domain (`yourdomain.com`) → points to `public_html/` ✅ (default)
- [ ] Create subdomain `api.yourdomain.com` → points to Node app
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Verify both domains resolve: `nslookup yourdomain.com`

### Frontend Deployment
- [ ] Build client locally: `npm run build:client`
- [ ] Upload `client/dist/*` contents to `public_html/`
- [ ] Create `.htaccess` in `public_html/` for SPA routing:
  ```apache
  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} !-f
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [QSA,L]
  </IfModule>
  ```
- [ ] Verify `public_html/index.html` exists
- [ ] Clear browser cache or test in incognito mode

---

## Post-Deployment Verification

### Backend API Testing
- [ ] Test health endpoint: `curl https://api.yourdomain.com/api/health`
- [ ] Check response status is 200
- [ ] Monitor logs in Hostinger for errors
- [ ] Check error logs: Hostinger hPanel → Node app → View logs

### Frontend Testing
- [ ] Visit `https://yourdomain.com` in browser
- [ ] Check page loads without 404 errors
- [ ] Open DevTools → Network tab
- [ ] Verify CSS and JS files load (status 200, not 404)
- [ ] Check Console for JavaScript errors

### API Integration Testing
- [ ] Test login endpoint works
- [ ] Test data retrieval (list products, agents, etc.)
- [ ] Check browser Network tab - API calls succeed
- [ ] Monitor for CORS errors (shouldn't be any)

### Database Connectivity
- [ ] Run test query through API
- [ ] Verify data is returned correctly
- [ ] Check database credentials are correct
- [ ] Monitor Supabase dashboard for connection status

---

## Troubleshooting During Deployment

### Node App Not Starting
```
❌ Error: "Cannot find module" or similar
```
- [ ] Check logs: Hostinger → Node app → View logs
- [ ] Verify `npm install` runs during deploy
- [ ] Check `package.json` has all dependencies
- [ ] Verify `npm start` points to correct file

### API Returns 404 or 500
```
❌ Error: "Cannot GET /api/health"
```
- [ ] Verify Node app is **Running** (not stopped)
- [ ] Check `dist/server/index.js` exists locally
- [ ] Verify build command `npm run build:server` succeeds
- [ ] Check startup file is set to `index.js`

### Frontend Shows 404
```
❌ Error: "Cannot GET /"
```
- [ ] Verify `public_html/index.html` exists
- [ ] Check `.htaccess` SPA routing is present
- [ ] Verify `public_html/` has CSS and JS files
- [ ] Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

### CORS Errors in Browser
```
❌ Error: "Access to XMLHttpRequest blocked by CORS"
```
- [ ] Check frontend URL matches `ALLOWED_ORIGINS` in server
- [ ] Verify `APP_URL` environment variable is set
- [ ] Check `origin` in CORS middleware includes your domain
- [ ] Restart Node app after updating CORS settings

### Env Variables Not Loaded
```
❌ Error: "undefined" when accessing process.env variables
```
- [ ] Verify variables are set in Hostinger (not in .env file)
- [ ] Restart Node app after adding environment variables
- [ ] Check variable names exactly match (case-sensitive)
- [ ] Confirm variables are loaded during startup (check logs)

### Database Connection Failed
```
❌ Error: "connection refused" or "connection timeout"
```
- [ ] Verify `DATABASE_URL` is correct format
- [ ] Check database is accessible from Hostinger IP
- [ ] Verify database credentials are correct
- [ ] Test connection with `psql` or similar tool locally first

---

## Ongoing Maintenance

### Weekly Checks
- [ ] Monitor error logs in Hostinger
- [ ] Check disk space usage
- [ ] Verify backups are running
- [ ] Test critical user flows

### Monthly Checks
- [ ] Update Node.js dependencies: `npm update`
- [ ] Review security logs
- [ ] Test disaster recovery plan
- [ ] Optimize database queries if needed

### Security
- [ ] Never commit `.env` files to GitHub
- [ ] Rotate `SESSION_SECRET` periodically
- [ ] Monitor API rate limiting
- [ ] Keep Node.js version updated
- [ ] Review CORS allowed origins regularly

---

## Rollback Plan

If something goes wrong:

1. **Immediate**: Stop Node app in Hostinger (to prevent further errors)
2. **Revert**: Push previous working code to GitHub (`git revert` or `git checkout`)
3. **Wait**: Hostinger auto-deploys updated code (5-10 minutes)
4. **Restart**: Start Node app in Hostinger
5. **Verify**: Test endpoints again

Keep backup branches on GitHub for quick rollback!

---

## Success Indicators ✅

Your deployment is **successful** when:

- ✅ `https://yourdomain.com` loads your React app
- ✅ `https://api.yourdomain.com/api/health` returns `{"status": "ok"}`
- ✅ Browser console has no errors or CORS warnings
- ✅ API endpoints return correct data
- ✅ User login/authentication works
- ✅ Database queries execute successfully
- ✅ Static files (CSS, JS, images) load correctly
- ✅ Navigation in React app doesn't cause 404 errors
- ✅ No errors in Hostinger Node app logs

---

**Last Updated**: January 23, 2026  
**Status**: Ready to Deploy
