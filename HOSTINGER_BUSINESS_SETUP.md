# 🚀 Hostinger Business Plan - Complete Setup Guide

## Architecture for Business Plan

```
Main Domain (yourdomain.com)
├── public_html/                    → React Frontend (static files)
│   ├── index.html
│   ├── assets/
│   └── .htaccess

Subdomain (api.yourdomain.com) 
└── Node.js Application              → Express API Server
    ├── index.js
    ├── dist/
    ├── node_modules/
    └── package.json
```

## 📋 Step-by-Step Setup

### Step 1: Create Subdomain for API

1. **Login to Hostinger hPanel**
2. Go to **Domains** → **Subdomains**
3. Create subdomain: `api` (will be `api.yourdomain.com`)
4. Point to a directory (e.g., `/domains/yourdomain.com/api`)

### Step 2: Setup Node.js Application

1. **Go to Advanced** → **Node.js**
2. **Create Application**:
   - **Application Mode**: Production
   - **Application URL**: Select `api.yourdomain.com`
   - **Application Root**: `/domains/yourdomain.com/api`
   - **Application Startup File**: `index.js`
   - **Node.js Version**: `20.x`

3. **Click Create**

### Step 3: Clone & Setup Backend

SSH into your server:

```bash
# SSH into Hostinger
ssh u123456789@yourdomain.com

# Navigate to API directory
cd ~/domains/yourdomain.com/api

# Clone your repository
git clone https://github.com/yourusername/SMART-DATA-STORE-GH.git .

# Install dependencies
npm install

# Build will run automatically via postinstall script
```

### Step 4: Configure Environment Variables

In **hPanel → Node.js → Your App → Environment Variables**, add:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NODE_ENV=production
SESSION_SECRET=your-random-secret-minimum-32-characters
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Step 5: Start the Application

In hPanel → Node.js:
- Click **Run npm install** (if not done)
- Click **Start** or **Restart**

Verify it's running:
```bash
curl https://api.yourdomain.com/api/health
```

### Step 6: Build & Deploy Frontend

On your **local machine**:

```bash
# Navigate to client directory
cd client

# Create production environment file
cat > .env.production << EOL
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOL

# Build the frontend
npm install
npm run build
```

### Step 7: Upload Frontend to Main Domain

#### Option A: Via File Manager (Recommended for first time)

1. Go to **File Manager** in hPanel
2. Navigate to `/domains/yourdomain.com/public_html`
3. **Delete everything** in public_html
4. **Upload all contents** from your local `client/dist/` folder
5. Create `.htaccess` file:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

#### Option B: Via SSH (Advanced)

```bash
# On your server
cd ~/domains/yourdomain.com/public_html

# Clone just for building (or SFTP upload)
# Then move dist contents here
```

### Step 8: Update CORS in Backend

Make sure your server allows your domain. Check `src/server/index.ts`:

```typescript
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    process.env.ALLOWED_ORIGINS?.split(',')
  ].flat().filter(Boolean),
  credentials: true
}));
```

Then rebuild and restart:
```bash
cd ~/domains/yourdomain.com/api
npm run build:server
# Restart via hPanel
```

### Step 9: Test Your Application

1. **Visit**: `https://yourdomain.com`
   - Should load React frontend
   
2. **Check API**: `https://api.yourdomain.com/api/health`
   - Should return JSON health check

3. **Test Login**: Try logging in from the frontend
   - Should connect to API successfully

## 🔧 Common Business Plan Issues & Fixes

### Issue 1: "Cannot GET /" on subdomain

**Solution**: Restart the Node.js app in hPanel

### Issue 2: CORS errors

**Solution**: 
```bash
# Add to environment variables
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Then update CORS config and restart.

### Issue 3: Database connection fails

**Solution**: 
- Make sure DATABASE_URL is correct
- Hostinger Business can connect to external databases (Supabase, Railway, etc.)
- Check firewall rules on your database provider

### Issue 4: Port already in use

**Solution**: Hostinger assigns the port automatically. Make sure your code uses:
```javascript
const PORT = process.env.PORT || 3000;
```

### Issue 5: App crashes after restart

**Solution**:
```bash
# Check logs
cd ~/domains/yourdomain.com/api
cat logs/error.log

# Usually it's:
# 1. Missing environment variables
# 2. Failed database connection
# 3. Missing dist/ folder (not built)
```

Fix and restart via hPanel.

## 🎯 Auto-Deploy Setup (Optional)

### Enable GitHub Auto-Deploy

1. In **hPanel → Node.js → Your App**
2. Go to **Git** tab
3. **Connect Repository**
4. Configure:
   - **Branch**: main
   - **Auto Deploy**: Enabled
   - **Build Command**: `npm run build:server`
   - **Start Command**: `npm start`

Now every push to main will:
1. Pull latest code
2. Run `npm install`
3. Run build command
4. Restart the app

### Frontend Auto-Deploy

For frontend, you'll need GitHub Actions:

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Hostinger

on:
  push:
    branches: [main]
    paths:
      - 'client/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Build Frontend
        run: |
          cd client
          npm install
          npm run build
      
      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ftp.yourdomain.com
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./client/dist/
          server-dir: /domains/yourdomain.com/public_html/
```

Add secrets in GitHub: Settings → Secrets → New repository secret

## ✅ Verification Checklist

- [ ] Subdomain created (api.yourdomain.com)
- [ ] Node.js app configured and running
- [ ] Environment variables set
- [ ] Backend responding at https://api.yourdomain.com/api/health
- [ ] Frontend deployed to public_html
- [ ] .htaccess created for SPA routing
- [ ] Frontend loads at https://yourdomain.com
- [ ] Can login and make API calls
- [ ] CORS configured correctly
- [ ] SSL certificates active (both main and subdomain)

## 📊 Performance Tips for Business Plan

### 1. Enable Caching
Already included in .htaccess above

### 2. Use PM2 for Process Management (Advanced)
```bash
npm install -g pm2
pm2 start index.js --name api
pm2 startup
pm2 save
```

### 3. Monitor Resources
```bash
pm2 monit
# or
top
```

### 4. Database Connection Pooling
Already configured in your db.ts with Pool

## 🆘 Support

If issues persist:
1. Check logs: `~/domains/yourdomain.com/api/logs/`
2. Test locally first: `npm run dev`
3. Verify all environment variables are set
4. Check Hostinger status page
5. Contact Hostinger support (Business plan has priority support)

## 📝 Quick Commands Reference

```bash
# SSH into server
ssh u123456789@yourdomain.com

# Navigate to API
cd ~/domains/yourdomain.com/api

# Pull latest changes
git pull

# Rebuild
npm run build:server

# View logs
tail -f logs/error.log

# Check process
ps aux | grep node

# Check port
netstat -tlnp | grep node
```

Restart via hPanel is preferred over manual process management.
