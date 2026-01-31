# ✅ GitHub Deployment Verification Checklist

Since you deployed via GitHub, follow these steps to verify everything works:

---

## 1️⃣ Check Node.js App Status

### In Hostinger hPanel:
1. Go to **Advanced** → **Node.js**
2. Find your app (should show your GitHub repo name)
3. **Check Status:**
   - ✅ Green "Running" = Good
   - 🔴 Red "Stopped" = Need to start it
   - ⚠️ Yellow "Building" = Wait for it to finish

### If Status is "Stopped":
- Click **"Start"** button
- Wait 10-20 seconds
- Status should turn green

---

## 2️⃣ Check Build Logs

### View Logs:
1. In Node.js app page, click **"Logs"** or **"View Logs"**
2. Look for these success messages:
   ```
   ✓ TypeScript compiled successfully
   ✓ Server running on port XXXX
   ✓ Database connected
   ```

### If You See Errors:

**Error: "Cannot find module"**
```
Fix: npm install didn't run
Solution: Click "Run npm install" in hPanel
```

**Error: "dist/server/index.js not found"**
```
Fix: Build didn't run
Solution: Check if Build Command is set to: npm run build:server
```

**Error: "Database connection failed"**
```
Fix: Missing environment variables
Solution: Go to Environment Variables section (Step 3 below)
```

**Error: "Port already in use"**
```
Fix: Old process still running
Solution: Click "Restart" (or Stop then Start)
```

---

## 3️⃣ Verify Environment Variables

### In hPanel → Node.js → Your App → Environment Variables

**Must have these 8 variables:**

1. ✅ `NODE_ENV` = `production`
2. ✅ `DATABASE_URL` = `postgresql://...`
3. ✅ `SESSION_SECRET` = `your-secret-key`
4. ✅ `SUPABASE_URL` = `https://xxxxx.supabase.co`
5. ✅ `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...`
6. ✅ `PAYSTACK_SECRET_KEY` = `sk_live_...` or `sk_test_...`
7. ✅ `PAYSTACK_PUBLIC_KEY` = `pk_live_...` or `pk_test_...`
8. ✅ `ALLOWED_ORIGINS` = `https://yourdomain.com,https://www.yourdomain.com`

### If Missing:
1. Click **"Add Variable"**
2. Add each missing variable
3. Click **"Save"**
4. Click **"Restart"** app

---

## 4️⃣ Test API Endpoint

### Test 1: Health Check
Open browser and go to:
```
https://api.yourdomain.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-31T..."
}
```

### Test 2: Direct Domain Check
```
https://api.yourdomain.com/
```

**Expected:** Should return something (not 404 or 502)

### If You Get Errors:

**502 Bad Gateway:**
- Server crashed or not running
- Fix: Check logs, restart app

**404 Not Found:**
- App not deployed to subdomain correctly
- Fix: Verify Application URL is set to `api.yourdomain.com`

**SSL Certificate Error:**
- SSL not activated yet
- Fix: Wait 5-10 minutes or activate SSL in hPanel

**Connection Refused:**
- App not started
- Fix: Click "Start" in hPanel

---

## 5️⃣ Check GitHub Auto-Deploy Settings

### In hPanel → Node.js → Your App → Git Tab:

**Should show:**
- ✅ **Repository**: Connected to your GitHub repo
- ✅ **Branch**: `main`
- ✅ **Auto Deploy**: Enabled (ON)
- ✅ **Build Command**: `npm run build:server`
- ✅ **Start Command**: `npm start`

### If Build Command is Missing:
1. Click **"Edit"**
2. Add Build Command: `npm run build:server`
3. Save
4. Click **"Redeploy"** or push a new commit

---

## 6️⃣ Frontend Deployment

### You still need to deploy the frontend separately!

**Quick Frontend Deploy:**

1. **Build locally:**
   ```powershell
   cd C:\Users\LENOVO\Desktop\SMART-DATA-STORE-GH\client
   npm install
   npm run build
   ```

2. **Upload to public_html:**
   - Go to hPanel → File Manager
   - Navigate to `/domains/yourdomain.com/public_html/`
   - Delete all existing files
   - Upload everything from `client/dist/`

3. **Create .htaccess:**
   - In `public_html/`, create new file `.htaccess`
   - Paste content from DEPLOYMENT_STEPS.md Step 8.2

4. **Test:**
   - Visit `https://yourdomain.com`
   - Should show your React app

---

## 7️⃣ Test Full Flow

### Login Test:
1. Go to `https://yourdomain.com`
2. Try to login
3. Should work without CORS errors

### Check Browser Console:
1. Press **F12**
2. Go to **Console** tab
3. Should see no red errors

### Check Network Tab:
1. Press **F12** → **Network** tab
2. Try an action (like login)
3. Check API calls go to `https://api.yourdomain.com`
4. Status should be `200 OK`

---

## 🔧 Quick Fixes

### App Won't Start After Deploy:
```bash
1. Check logs for specific error
2. Verify all environment variables are set
3. Click "Run npm install" in hPanel
4. Click "Restart"
```

### CORS Errors:
```bash
1. Add ALLOWED_ORIGINS environment variable
2. Value: https://yourdomain.com,https://www.yourdomain.com
3. Restart app
```

### Build Keeps Failing:
```bash
1. Check if Build Command is: npm run build:server
2. Try manual build in SSH:
   cd ~/domains/yourdomain.com/api
   npm install
   npm run build:server
3. Check if dist/server/index.js was created
```

---

## 📊 Current Status Summary

Fill this out as you go:

- [ ] Node.js app shows "Running" status
- [ ] No errors in logs
- [ ] All 8 environment variables set
- [ ] API health check returns JSON: `https://api.yourdomain.com/api/health`
- [ ] GitHub auto-deploy configured
- [ ] Frontend built locally (`client/dist/` exists)
- [ ] Frontend uploaded to `public_html/`
- [ ] `.htaccess` created
- [ ] Main site loads: `https://yourdomain.com`
- [ ] Can login from frontend
- [ ] No CORS errors

**All checked?** 🎉 You're fully deployed!

---

## 🚀 Next Time You Update Code:

**Backend:**
1. Make changes locally
2. `git add .`
3. `git commit -m "Update message"`
4. `git push`
5. Hostinger auto-deploys (if enabled)

**Frontend:**
1. Make changes locally
2. `cd client && npm run build`
3. Upload `client/dist/` to `public_html/` via File Manager

---

## Need Help?

**Check these in order:**
1. hPanel → Node.js → Your App → Logs
2. Browser Console (F12)
3. `https://api.yourdomain.com/api/health`

**Still stuck?** Share:
- Error message from logs
- Screenshot of Node.js app page
- Browser console errors
