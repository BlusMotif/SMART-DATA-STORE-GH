# Enable Node.js on Hostinger - Step-by-Step

## Go to Hostinger Control Panel

1. Visit: https://hpanel.hostinger.com/
2. Log in with your credentials
3. Select your hosting account (resellershubprogh.com)

## Enable Node.js

### Location: Advanced → Node.js

**Path in control panel:**
```
Dashboard → Your Domain → Advanced → Node.js
```

### Settings

1. **Status**: Toggle to **ON/Enabled**
2. **Node.js Version**: Select **20.x** (or latest 20.x)
3. **Application startup file**: 
   ```
   dist/server/index.js
   ```
4. **Application root**: 
   ```
   public_html
   ```
5. **Port**: Keep as default (usually 3000)
6. **Click Save/Apply**

## Wait for Setup

Hostinger will take 1-2 minutes to:
- Install Node.js 20.x
- Set up the application
- Start your server automatically

## Verify

After 2 minutes, SSH back and test:

```bash
node --version
npm --version
```

Should show something like:
```
v20.x.x
10.x.x
```

## Check Status

In Hostinger control panel, Node.js section should show:
- ✅ Status: Running
- ✅ Version: 20.x.x
- ✅ Port: 3000

## Visit Your App

Once enabled and running:

```
https://u519881843.resellershubprogh.com
```

---

## If It Doesn't Work

1. Check Node.js status in control panel (should say "Running")
2. Look for error logs in control panel
3. SSH and check: `pm2 status` or `pm2 logs`
4. If port conflicts, try different port in control panel

**Do this now and let me know once Node.js shows as running in the control panel!**
