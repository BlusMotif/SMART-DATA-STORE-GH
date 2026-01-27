# 🚀 Hostinger Deployment - Quick Start Guide
# ResellersHub Pro GH - Build Complete ✅

**Build Date:** January 26, 2026  
**Build Status:** ✅ SUCCESS  
**Ready for Deployment:** YES

---

## 📦 Build Output

### Client (Frontend)
- **Location:** `dist/public/`
- **Entry Point:** `dist/public/index.html`
- **Assets:** Optimized and minified
- **Size:** ~2.6 MB total
- **Chunks:**
  - `index.BkY0H7mz.js` (650 KB)
  - `vendor.DZYVI4bd.js` (1.49 MB)
  - `vendor_jspdf.DXm8kYXM.js` (339 KB)
  - `index.DqneFvht.css` (107 KB)

### Server (Backend)
- **Location:** `dist/server/`
- **Entry Point:** `dist/server/index.js`
- **Status:** Compiled successfully with TypeScript
- **Node Version Required:** 20.x

---

## 🎯 Deployment Options

### Option 1: Quick Deploy (GitHub + Hostinger Auto-Deploy)
**Recommended for continuous deployment**

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production build - ready for deployment"
   git push origin main
   ```

2. **Configure Hostinger:**
   - Go to Hostinger hPanel → Node.js
   - Create application from GitHub repository
   - Set environment variables (see below)
   - Deploy automatically on push

### Option 2: Manual Upload (FTP/File Manager)
**Quick one-time deployment**

1. **Compress build files:**
   ```bash
   # In PowerShell
   Compress-Archive -Path dist/* -DestinationPath resellershub-build.zip
   ```

2. **Upload to Hostinger:**
   - Login to hPanel → File Manager
   - Navigate to your application directory
   - Upload `resellershub-build.zip`
   - Extract files

3. **Upload dependencies:**
   - Upload `package.production.json` as `package.json`
   - Run `npm install --production` via SSH/Terminal

---

## 🔐 Environment Variables Setup

### Step 1: Create .env.production file

Create a file named `.env.production` in Hostinger with these variables:

```env
# ========== DATABASE ==========
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_key_here
SUPABASE_ANON_KEY=eyJhbGc...your_key_here

# ========== NODE ==========
NODE_ENV=production
PORT=3000

# ========== PAYSTACK ==========
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# ========== SKYTECH API ==========
SKYTECH_API_KEY=your_skytech_api_key
SKYTECH_API_URL=https://api.skytech.com

# ========== SECURITY ==========
SESSION_SECRET=generate_random_32_character_string_here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ========== CLIENT BUILD VARS ==========
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your_key_here
```

### Step 2: Set in Hostinger hPanel

**Via hPanel UI:**
1. Go to **Node.js Application** settings
2. Click **Environment Variables**
3. Add each variable from above
4. Save changes

**Via SSH (Alternative):**
```bash
cd /home/yourusername/your-app
nano .env.production
# Paste the variables above
# Press Ctrl+X, then Y, then Enter to save
```

---

## 📝 Hostinger Configuration Steps

### 1. Create Node.js Application

**In Hostinger hPanel:**
1. Go to **Advanced** → **Node.js**
2. Click **Create Application**
3. Fill in:
   - **Application Name:** resellershub-api
   - **Node Version:** 20.x
   - **Application Mode:** Production
   - **Application Root:** `/home/yourusername/resellershub-api`
   - **Application URL:** `https://api.yourdomain.com` or subdomain
   - **Application Startup File:** `dist/server/index.js`

4. Click **Create**

### 2. Upload Files

**Option A: Via GitHub (Recommended)**
```bash
# In your local project
git remote add origin https://github.com/yourusername/resellershub.git
git push -u origin main

# In Hostinger hPanel
# Select "Deploy from GitHub"
# Authorize and select repository
# Set branch to "main"
```

**Option B: Via File Manager**
1. Compress `dist` folder and `package.production.json`
2. Upload via File Manager
3. Extract in application root

**Option C: Via SSH/FTP**
```bash
# Using SCP (if SSH enabled)
scp -r dist/ username@yourdomain.com:/home/username/resellershub-api/
scp package.production.json username@yourdomain.com:/home/username/resellershub-api/package.json
```

### 3. Install Dependencies

**Via SSH Terminal:**
```bash
cd /home/yourusername/resellershub-api
npm install --production
```

**Or via hPanel:**
1. Go to Node.js application
2. Click **Run npm install**
3. Wait for completion

### 4. Configure Static Files

**Setup for React Frontend:**

In Hostinger, you need to serve static files from `dist/public/`:

**Option A: Same Domain (Single Application)**
- The Express server already serves static files from `dist/public`
- Just point your domain to the Node.js app
- URL: `https://yourdomain.com`

**Option B: Separate Domains (API + Frontend)**
1. **Frontend:** Upload `dist/public/*` to separate hosting (PHP hosting)
2. **Backend:** Deploy Node.js app as described above
3. Update CORS in server to allow frontend domain
4. URLs:
   - Frontend: `https://yourdomain.com`
   - API: `https://api.yourdomain.com`

### 5. Start Application

**Via hPanel:**
1. Go to Node.js application
2. Click **Start Application**
3. Monitor logs for errors

**Via SSH:**
```bash
cd /home/yourusername/resellershub-api
node dist/server/index.js
```

**Or use PM2 (Recommended):**
```bash
npm install -g pm2
pm2 start dist/server/index.js --name resellershub
pm2 save
pm2 startup
```

---

## 🔍 Post-Deployment Verification

### 1. Check Server Health
```bash
curl https://api.yourdomain.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Test Frontend
```bash
# Visit in browser
https://yourdomain.com

# Should load React app
# Check console for errors
```

### 3. Test API Endpoints
```bash
# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"test"}'

# Test bundles endpoint
curl https://api.yourdomain.com/api/bundles
```

### 4. Check Database Connection
```bash
# SSH into Hostinger
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### 5. Monitor Logs
```bash
# Via SSH
tail -f /home/yourusername/resellershub-api/logs/app.log

# Or via PM2
pm2 logs resellershub
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"
**Solution:**
```bash
cd /home/yourusername/resellershub-api
rm -rf node_modules package-lock.json
npm install --production
```

### Issue: "Port already in use"
**Solution:**
- Hostinger assigns port automatically
- Don't hardcode PORT in code (already fixed in your setup)
- Restart application via hPanel

### Issue: "CORS error"
**Solution:**
Add your frontend domain to `ALLOWED_ORIGINS` in `.env.production`:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Issue: "Database connection failed"
**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check if database allows connections from Hostinger IP
3. Test connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### Issue: Static files not loading (404)
**Solution:**
- Verify `dist/public/` exists and has files
- Check Express static middleware is configured (already done)
- Clear browser cache

### Issue: "Session secret not set"
**Solution:**
Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to SESSION_SECRET in .env.production
```

---

## 📊 Performance Optimization

### 1. Enable Compression (Already configured in your server)
```javascript
// Already in src/server/index.ts
app.use(compression());
```

### 2. Setup Cloudflare (Optional)
- Point domain to Cloudflare nameservers
- Enable caching for static assets
- Enable minification
- Setup SSL/TLS

### 3. Database Connection Pooling
Your server already uses connection pooling with Supabase.

### 4. Monitor Performance
```bash
# Install PM2 if not already
npm install -g pm2

# Monitor
pm2 monit

# View stats
pm2 show resellershub
```

---

## 🔄 Updating Deployment

### For Code Changes:

**If using GitHub integration:**
```bash
git add .
git commit -m "Update: feature description"
git push origin main
# Hostinger auto-deploys
```

**If using manual upload:**
1. Build locally: `npm run build`
2. Upload new `dist/` folder
3. Restart application via hPanel

### For Environment Variables:
1. Go to hPanel → Node.js → Environment Variables
2. Update values
3. Restart application

### For Dependencies:
1. SSH into server
2. Run `npm install --production`
3. Restart application

---

## 📱 Domain Configuration

### Setup Custom Domain:

1. **In Domain Registrar (Namecheap, GoDaddy, etc.):**
   - Add A Record: `@` → Hostinger IP
   - Add A Record: `www` → Hostinger IP
   - Add A Record: `api` → Hostinger IP (if separate API)

2. **In Hostinger hPanel:**
   - Go to Domains → Add Domain
   - Enter your domain
   - Point to Node.js application
   - Enable SSL (Let's Encrypt)

3. **SSL Certificate:**
   - Hostinger provides free Let's Encrypt SSL
   - Enable in hPanel → SSL/TLS
   - Force HTTPS redirect

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] All environment variables are set
- [ ] Database is accessible and migrations are run
- [ ] Paystack keys are LIVE keys (not test)
- [ ] SkyTech API credentials are production
- [ ] SESSION_SECRET is strong and random
- [ ] ALLOWED_ORIGINS includes production domain
- [ ] SSL certificate is installed and working
- [ ] Domain DNS is configured correctly
- [ ] Application starts without errors
- [ ] All API endpoints are responding
- [ ] Frontend loads and connects to API
- [ ] Test user registration/login
- [ ] Test data bundle purchase
- [ ] Test Paystack payment
- [ ] Test order history display
- [ ] Test admin panel access
- [ ] Monitor logs for errors
- [ ] Setup backup schedule for database
- [ ] Configure monitoring/alerts

---

## 📞 Support & Resources

### Hostinger Documentation:
- [Node.js Hosting Guide](https://support.hostinger.com/en/articles/5799827-how-to-deploy-node-js-application)
- [SSH Access](https://support.hostinger.com/en/articles/1583227-how-to-access-your-hosting-via-ssh)
- [Database Setup](https://support.hostinger.com/en/collections/1752941-databases)

### Your Project Documentation:
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md)

---

## 🎉 You're Ready to Deploy!

Your project is fully built and ready for production. Follow the steps above and you'll have ResellersHub Pro GH live on Hostinger within 30 minutes!

**Need help?** Check the troubleshooting section or review the detailed guides in your project documentation.

---

**Last Updated:** January 26, 2026  
**Build Version:** 1.0.0  
**Node Version:** 20.x
