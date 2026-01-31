# 🎯 Hostinger Business Plan - Step-by-Step Deployment

Follow these steps **in order**. Don't skip any step.

---

## ✅ STEP 1: Create API Subdomain

### 1.1 Login to Hostinger
- Go to https://hpanel.hostinger.com
- Login with your credentials

### 1.2 Navigate to Domains
- On the left sidebar, click **"Domains"**
- You'll see your domain(s) listed

### 1.3 Create Subdomain
- Click on **"Subdomains"** tab at the top
- Click **"Create Subdomain"** button
- Fill in:
  - **Subdomain**: `api`
  - **Domain**: Select your main domain (e.g., `yourdomain.com`)
  - **Document Root**: Leave default or set to `/domains/yourdomain.com/api`
- Click **"Create"**

### 1.4 Wait for DNS Propagation (2-10 minutes)
- The subdomain `api.yourdomain.com` needs to propagate
- You can check with: https://dnschecker.org/#A/api.yourdomain.com

✅ **Checkpoint**: You should be able to visit `https://api.yourdomain.com` (it will show a default page or error - that's OK)

---

## ✅ STEP 2: Setup Node.js Application

### 2.1 Go to Node.js Section
- In hPanel left sidebar, click **"Advanced"**
- Click **"Node.js"**

### 2.2 Create New Application
- Click **"Create Application"** button (purple/blue button at top right)

### 2.3 Configure Application
Fill in these **exact** settings:

- **Application Mode**: `Production`
- **Application URL**: Select `api.yourdomain.com` from dropdown
- **Application Root**: `/domains/yourdomain.com/api`
- **Application Startup File**: `index.js`
- **Node.js version**: `20.18.1` or latest `20.x`
- **Application Name**: `resellers-hub-api` (or any name you like)

### 2.4 Create the Application
- Click **"Create"** button at the bottom
- Wait for the application to be created (30 seconds - 1 minute)

✅ **Checkpoint**: You should see your app in the Node.js applications list with status "Stopped" (that's normal)

---

## ✅ STEP 3: Clone Repo & Install Dependencies via SSH

### 3.1 Get SSH Access Details
- In hPanel, go to **"Advanced"** → **"SSH Access"**
- You'll see:
  - **SSH Username**: (e.g., `u123456789`)
  - **SSH Host**: (e.g., `ssh.yourdomain.com` or IP address)
  - **SSH Port**: Usually `22` or `65002`
  
### 3.2 Generate/Use SSH Password
- If you haven't set SSH password, click **"Change SSH password"**
- Set a strong password and save it

### 3.3 Connect via SSH

**On Windows (PowerShell or CMD):**
```powershell
ssh u123456789@yourdomain.com -p 65002
# Replace with your actual username, domain, and port
# Enter password when prompted
```

**If you get SSH error, try:**
```powershell
ssh u123456789@123.456.78.90 -p 65002
# Use IP address instead of domain
```

### 3.4 Navigate to API Directory
Once connected, run:
```bash
cd ~/domains/yourdomain.com/api
pwd
# Should show: /home/u123456789/domains/yourdomain.com/api
```

### 3.5 Clone Your Repository
```bash
# If directory has files, remove them first
rm -rf *
rm -rf .git

# Clone your repo
git clone https://github.com/BlusMotif/SMART-DATA-STORE-GH.git .
# Note the DOT (.) at the end - important!

# Verify files are there
ls -la
# You should see: package.json, index.js, src/, client/, etc.
```

### 3.6 Install Dependencies
```bash
# Install Node.js dependencies
npm install

# This will take 2-5 minutes
# The postinstall script will automatically build the server
```

### 3.7 Verify Build
```bash
# Check if dist folder was created
ls -la dist/server/

# You should see index.js inside dist/server/
ls -la dist/server/index.js
```

✅ **Checkpoint**: You should see `dist/server/index.js` exists

---

## ✅ STEP 4: Set Environment Variables in hPanel

### 4.1 Go Back to hPanel
- Go to **"Advanced"** → **"Node.js"**
- Find your application (`resellers-hub-api`)
- Click on it to open settings

### 4.2 Add Environment Variables
- Look for **"Environment Variables"** section
- Click **"Add Variable"** or **"Edit Variables"**

### 4.3 Add Each Variable

Add these variables **one by one**:

**Variable 1:**
- Name: `NODE_ENV`
- Value: `production`

**Variable 2:**
- Name: `DATABASE_URL`
- Value: `your_actual_database_url_here`
  - Example: `postgresql://user:password@host.supabase.co:5432/postgres`

**Variable 3:**
- Name: `SESSION_SECRET`
- Value: Generate a random 32+ character string
  - Example: `7f8a9d6c5e4b3a2f1e0d9c8b7a6f5e4d`

**Variable 4:**
- Name: `SUPABASE_URL`
- Value: `https://xxxxx.supabase.co`

**Variable 5:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `your_service_role_key_here`

**Variable 6:**
- Name: `PAYSTACK_SECRET_KEY`
- Value: `sk_live_xxxxx` or `sk_test_xxxxx`

**Variable 7:**
- Name: `PAYSTACK_PUBLIC_KEY`
- Value: `pk_live_xxxxx` or `pk_test_xxxxx`

**Variable 8:**
- Name: `ALLOWED_ORIGINS`
- Value: `https://yourdomain.com,https://www.yourdomain.com`
  - Replace `yourdomain.com` with your actual domain

### 4.4 Save Variables
- Click **"Save"** or **"Update"** button

✅ **Checkpoint**: All 8 environment variables should be visible in the list

---

## ✅ STEP 5: Start the Node.js Application

### 5.1 Start Application
- Still in the Node.js application settings
- Look for **"Start"** or **"Run"** button
- Click **"Start"**
- Wait 10-20 seconds

### 5.2 Check Status
- Status should change to **"Running"** with a green indicator

### 5.3 View Logs
- Click **"View Logs"** or **"Logs"** button
- Check for errors
- You should see something like:
  ```
  Server running on port 3000
  Database connected
  ```

### 5.4 Test API
Open a browser or use curl:
```
https://api.yourdomain.com/api/health
```

You should get a JSON response like:
```json
{"status":"ok","timestamp":"..."}
```

✅ **Checkpoint**: API is responding at `https://api.yourdomain.com`

---

## ✅ STEP 6: Build Frontend Locally

### 6.1 Open PowerShell/Terminal on Your Computer
Navigate to your project:
```powershell
cd C:\Users\LENOVO\Desktop\SMART-DATA-STORE-GH\client
```

### 6.2 Create Production Environment File
```powershell
# Create .env.production file
@"
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
"@ | Out-File -FilePath .env.production -Encoding utf8
```

**Replace:**
- `api.yourdomain.com` with your actual subdomain
- `https://xxxxx.supabase.co` with your Supabase URL
- `your_anon_key_here` with your Supabase anon key

### 6.3 Install Dependencies (if not done)
```powershell
npm install
```

### 6.4 Build Frontend
```powershell
npm run build
```

This creates `client/dist/` folder with your built frontend.

### 6.5 Verify Build
```powershell
dir dist
# You should see: index.html, assets/, etc.
```

✅ **Checkpoint**: `client/dist/` folder exists with files inside

---

## ✅ STEP 7: Upload Frontend to Main Domain

### Method A: Using hPanel File Manager (Recommended)

#### 7.1 Open File Manager
- In hPanel, go to **"Files"** → **"File Manager"**
- Click **"Open"**

#### 7.2 Navigate to public_html
- Navigate to: `/domains/yourdomain.com/public_html/`

#### 7.3 Backup Existing Files (Optional)
- Select all files in `public_html`
- Right-click → **"Compress"** → Save as `backup-old-site.zip`

#### 7.4 Delete Old Files
- Select all files in `public_html` (except backup if you made one)
- Right-click → **"Delete"**
- Confirm deletion

#### 7.5 Upload New Files
- Click **"Upload"** button at top
- Navigate to your local `C:\Users\LENOVO\Desktop\SMART-DATA-STORE-GH\client\dist\` folder
- **Select ALL files and folders** inside `dist/`
  - `index.html`
  - `assets/` folder
  - `vite.svg` (if exists)
  - Any other files
- Click **"Open"** to upload
- Wait for upload to complete (1-3 minutes depending on size)

#### 7.6 Verify Files Uploaded
In File Manager, `public_html/` should now contain:
- `index.html`
- `assets/` folder with CSS and JS files
- Other static files

---

## ✅ STEP 8: Create .htaccess for React Router

### 8.1 Create .htaccess File
- Still in File Manager in `public_html/`
- Click **"New File"**
- Name: `.htaccess`
- Click **"Create"**

### 8.2 Edit .htaccess
- Right-click on `.htaccess`
- Click **"Edit"**
- Paste this content:

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
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/json "access plus 1 week"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

### 8.3 Save .htaccess
- Click **"Save & Close"**

✅ **Checkpoint**: `.htaccess` file exists in `public_html/`

---

## ✅ STEP 9: Test Everything

### 9.1 Test Frontend
- Open browser
- Go to: `https://yourdomain.com`
- **Expected**: React app loads successfully
- **If error**: Clear browser cache (Ctrl+F5) and try again

### 9.2 Test API from Frontend
- Try to login or register on the frontend
- **Expected**: Should work without CORS errors

### 9.3 Check Browser Console
- Press **F12** (Developer Tools)
- Go to **Console** tab
- **Expected**: No red errors
- **If CORS error**: Check environment variables and restart Node.js app

### 9.4 Test Direct API Access
```
https://api.yourdomain.com/api/health
```
**Expected**: JSON response

### 9.5 Test Different Routes
Try navigating to different pages:
- `https://yourdomain.com/dashboard`
- `https://yourdomain.com/bundles`
- All should load (not 404)

✅ **Checkpoint**: Everything works!

---

## 🎉 DEPLOYMENT COMPLETE!

Your application is now live:
- **Frontend**: https://yourdomain.com
- **API**: https://api.yourdomain.com
- **Admin Panel**: https://yourdomain.com/admin

---

## 🔧 Common Issues & Quick Fixes

### Issue: API Returns 502 Bad Gateway
**Fix:**
1. Go to hPanel → Node.js → Your App
2. Check logs for errors
3. Restart the application
4. Verify environment variables are set

### Issue: Frontend Shows Blank Page
**Fix:**
1. Check File Manager - make sure files uploaded correctly
2. Check browser console for errors (F12)
3. Verify `.env.production` had correct API URL
4. Rebuild: `npm run build` and re-upload

### Issue: CORS Errors
**Fix:**
1. Go to hPanel → Node.js → Environment Variables
2. Check `ALLOWED_ORIGINS` includes your domain
3. Restart Node.js app

### Issue: Cannot SSH Connect
**Fix:**
1. Use IP address instead of domain name
2. Verify SSH password is set
3. Check port number (usually 65002 or 22)
4. Try: `ssh -v username@host` for verbose output

### Issue: API Health Check Returns 404
**Fix:**
1. SSH into server: `cd ~/domains/yourdomain.com/api`
2. Check if dist exists: `ls -la dist/server/index.js`
3. If not, run: `npm run build:server`
4. Restart app in hPanel

---

## 📝 Quick Commands Reference

```bash
# SSH into server
ssh u123456789@yourdomain.com -p 65002

# Navigate to API
cd ~/domains/yourdomain.com/api

# Pull latest changes
git pull origin main

# Install and build
npm install

# Check if built
ls -la dist/server/index.js

# View logs
tail -f logs/error.log

# Check what's running
ps aux | grep node
```

Then restart via hPanel → Node.js → Restart

---

## 🚀 Updating Your Application

### When You Make Changes:

**Backend Changes:**
1. Push to GitHub
2. SSH into server
3. `cd ~/domains/yourdomain.com/api`
4. `git pull origin main`
5. `npm install` (if package.json changed)
6. Restart in hPanel

**Frontend Changes:**
1. Update code locally
2. `cd client`
3. `npm run build`
4. Upload `dist/` contents to `public_html/` via File Manager

---

## ✅ Final Checklist

- [ ] API subdomain created and accessible
- [ ] Node.js app created and running
- [ ] Repo cloned in `/domains/yourdomain.com/api`
- [ ] Dependencies installed (`node_modules/` exists)
- [ ] Server built (`dist/server/index.js` exists)
- [ ] All 8 environment variables set
- [ ] API responding at `https://api.yourdomain.com/api/health`
- [ ] Frontend built locally (`client/dist/` exists)
- [ ] Frontend uploaded to `public_html/`
- [ ] `.htaccess` created in `public_html/`
- [ ] Main site loads at `https://yourdomain.com`
- [ ] Can login/register from frontend
- [ ] No CORS errors in browser console
- [ ] SSL certificates active (green padlock in browser)

**All checked?** 🎉 Your application is fully deployed!

---

Need help with any step? Check the error logs and refer to the troubleshooting section above.
