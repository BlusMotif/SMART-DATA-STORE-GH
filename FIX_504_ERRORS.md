# 🚨 504 Error Fix - Node.js App is Down

## Immediate Actions:

### Step 1: Check App Status in hPanel
1. Go to **Advanced** → **Node.js**
2. Find your app
3. **Check Status:**
   - 🔴 **STOPPED** → Click **"Start"** button
   - ⚠️ **RESTARTING** → Wait 30 seconds
   - 🟡 **BUILDING** → Wait for build to complete
   - ✅ **RUNNING** → Continue to Step 2

### Step 2: View Logs (CRITICAL)
1. In your Node.js app, click **"Logs"** or **"View Logs"**
2. **Copy ALL error messages** you see
3. Look for patterns like:
   ```
   Error: connect ECONNREFUSED
   Error: Database connection failed
   Error: Cannot find module
   Error: Port already in use
   TypeError: Cannot read property
   ```

### Step 3: Force Restart
1. Click **"Stop"** (wait 5 seconds)
2. Click **"Start"** 
3. Wait 30 seconds
4. Check logs again

### Step 4: Verify Environment Variables
**Click on your app → look for "Environment Variables" section**

Must have these (DO NOT SKIP):
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL=postgresql://...`
- [ ] `SUPABASE_URL=https://...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=eyJ...`
- [ ] `SESSION_SECRET=...` (32+ characters)
- [ ] `PAYSTACK_SECRET_KEY=sk_...`
- [ ] `PAYSTACK_PUBLIC_KEY=pk_...`
- [ ] `ALLOWED_ORIGINS=https://resellershubprogh.com`

**If any are missing:**
1. Click **"Add Variable"**
2. Add the missing one
3. Click **"Save"**
4. **Restart** the app

### Step 5: Check Node.js Version
- Verify Node.js version is **20.x**
- If different, update in app settings

---

## Common 504 Causes & Fixes:

### Cause 1: Database Connection Timeout
**Signs:**
- App starts but logs show "Connecting to database..."
- Hangs for 30+ seconds

**Fix:**
```
1. Verify DATABASE_URL is correct
2. Check if Supabase database is online
3. Go to https://jddstfppigucldetsxws.supabase.co (login to Supabase)
4. Check database is "Active" (not suspended)
5. Restart app
```

### Cause 2: Missing Environment Variables
**Signs:**
- Logs show "TypeError: Cannot read property 'split' of undefined"
- Or "Database URL not found"

**Fix:**
- Add ALL 8 environment variables listed above
- Restart app

### Cause 3: Compilation Error
**Signs:**
- Logs show TypeScript error
- "dist/server/index.js not found"

**Fix:**
```bash
# SSH into server
ssh your-username@resellershubprogh.com

# Navigate to app
cd ~/domains/resellershubprogh.com/your-app

# Rebuild manually
npm run build:server

# Check if built
ls -la dist/server/index.js
```

Then restart via hPanel.

### Cause 4: Port in Use
**Signs:**
- Logs show "EADDRINUSE" or "Port 3000 already in use"

**Fix:**
- Click **"Restart"** in hPanel (not just Stop/Start)
- Wait 60 seconds

### Cause 5: Memory Issues
**Signs:**
- App crashes after 5-10 minutes
- No error messages

**Fix:**
- Upgrade Hostinger plan (unlikely on Business plan)
- Check for memory leaks in code

---

## What to Do Right Now:

1. **Go to hPanel → Node.js → Your App**
2. **Take screenshot of:**
   - App status (is it Running/Stopped?)
   - Environment Variables section (all 8 variables set?)
   - Logs section (paste any errors here)

3. **Copy and share with me:**
   - App status
   - Any error messages from logs
   - Whether environment variables are set

**Then I can give you the exact fix!**

---

## Quick Command to Test (if you have SSH access):

```bash
ssh your-username@resellershubprogh.com

# Go to app directory
cd ~/domains/resellershubprogh.com/your-app

# Check if app exists
ls -la package.json

# Check if built
ls -la dist/server/index.js

# Check environment
printenv | grep DATABASE_URL

# Try to start manually
node index.js
```

Share what you see!

---

## 🆘 If Everything is Confusing:

**Just answer these 3 questions:**

1. In hPanel → Node.js, is your app showing:
   - **"Running"** ✅ 
   - **"Stopped"** 🔴
   - **"Building"** ⚠️

2. Can you access hPanel → Node.js → Your App → **"Logs"**?
   - What's the last line you see?

3. In hPanel → Node.js → Your App → **Environment Variables**:
   - Do you see all 8 variables listed?
   - Or is the section empty?

Answer these and I'll fix it!
