# 🔧 Hostinger Server Fix - Deployment Steps

## Changes Made

Fixed the server startup issues with these changes:

1. **Simplified [index.js](index.js)** - Removed complex build logic, now just starts the pre-built server
2. **Updated [package.json](package.json)**:
   - Changed `start` script to use `index.js` 
   - Added `postinstall` script to automatically build TypeScript after npm install
   - Removed `heroku-postbuild` (not needed for Hostinger)

## 🚀 Deploy to Hostinger - Step by Step

### 1. Pull Latest Changes on Hostinger

SSH into your Hostinger server and navigate to your app directory:

```bash
cd ~/domains/yourdomain.com/public_html  # or wherever your app is
git pull origin main
```

### 2. Install Dependencies & Build

```bash
npm install
```

The `postinstall` script will automatically run `npm run build:server` after installation.

### 3. Verify Build

Check that the compiled server exists:

```bash
ls -la dist/server/index.js
```

You should see the compiled file.

### 4. Restart the Application

In Hostinger hPanel:
- Go to **Node.js** section
- Find your application
- Click **Restart** or **Stop** then **Start**

### 5. Check Logs

Monitor the logs to ensure the server starts successfully:

```bash
tail -f logs/error.log
# or check in hPanel → Node.js → Your App → View Logs
```

## ✅ Expected Behavior

After restart, you should see:
- Server starting on the assigned PORT
- Database connection established
- No TypeScript compilation errors

## 🔍 If Still Not Working

### Check Environment Variables

Ensure these are set in hPanel → Node.js → Your App → Environment Variables:

```
DATABASE_URL=your_postgres_connection_string
NODE_ENV=production
PORT=3000  (Hostinger usually sets this automatically)
SESSION_SECRET=your_secret_key
PAYSTACK_SECRET_KEY=your_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Verify Node Version

```bash
node --version  # Should be v20.x
```

If different, update in hPanel → Node.js → Your App → Settings → Node Version

### Manual Build (if needed)

```bash
npm run build:server
node index.js
```

### Check Process

```bash
ps aux | grep node
```

You should see your Node.js process running.

## 📝 What These Changes Do

**Old Setup (broken)**:
- `start` ran `dist/server/index.js` directly
- `index.js` tried to build during startup (slow and error-prone)
- No automatic build after install

**New Setup (fixed)**:
- `start` runs `index.js` which imports the pre-built server
- `postinstall` builds TypeScript automatically after `npm install`
- Clean separation: build happens once, startup is fast

## 🎯 Result

Your server will now:
1. Build automatically when you run `npm install`
2. Start quickly using the pre-built files
3. Work correctly with Hostinger's Node.js hosting environment
