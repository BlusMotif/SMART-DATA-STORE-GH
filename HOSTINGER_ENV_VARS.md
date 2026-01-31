# 🔐 Complete Environment Variables for Hostinger

## 📋 Backend Environment Variables (Node.js App in hPanel)

Go to **hPanel → Node.js → Your App → Environment Variables** and add these:

```bash
# Database
DATABASE_URL=postgresql://postgres.jddstfppigucldetsxws:NUNANASMARTDATAGH@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

# Supabase
SUPABASE_URL=https://jddstfppigucldetsxws.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZHN0ZnBwaWd1Y2xkZXRzeHdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgxNDUwNSwiZXhwIjoyMDgxMzkwNTA1fQ.kyQ0An1iAT0N5AJB1AEA3am7SgLcGRaN_BE6ioqAEvw

# Node Environment
NODE_ENV=production

# Session
SESSION_SECRET=df9fac6ba2b7b8f841347c5a1fa8e78a2b91b2dbc862c2f7c97bf1fbc92083f8

# Paystack
PAYSTACK_PUBLIC_KEY=pk_test_7a5255fd9557852d6955e7cdb1c3d5ba5b4d13cf
PAYSTACK_SECRET_KEY=sk_test_7a5255fd9557852d6955e7cdb1c3d5ba5b4d13cf

# CORS
ALLOWED_ORIGINS=https://resellershubprogh.com,https://www.resellershubprogh.com

# Frontend URL (for server redirects)
FRONTEND_URL=https://resellershubprogh.com

# Skytech API
SKYTECH_API_KEY=b0024759b855bbc3b9d29f72
SKYTECH_API_SECRET=tok_571e79e823c6937b8b5b4c0761c50bcb6dbe427c
SKYTECH_API_ENDPOINT=https://skytechgh.com/api/v1/orders
```

---

## 📋 How to Add in Hostinger hPanel

### Step-by-Step:

1. Go to **Advanced** → **Node.js**
2. Click on your application
3. Scroll to **Environment Variables** section
4. Click **"Add Variable"** for each one:

#### Variable 1:
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres.jddstfppigucldetsxws:NUNANASMARTDATAGH@aws-1-eu-west-1.pooler.supabase.com:6543/postgres`

#### Variable 2:
- **Name**: `SUPABASE_URL`
- **Value**: `https://jddstfppigucldetsxws.supabase.co`

#### Variable 3:
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZHN0ZnBwaWd1Y2xkZXRzeHdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgxNDUwNSwiZXhwIjoyMDgxMzkwNTA1fQ.kyQ0An1iAT0N5AJB1AEA3am7SgLcGRaN_BE6ioqAEvw`

#### Variable 4:
- **Name**: `NODE_ENV`
- **Value**: `production`

#### Variable 5:
- **Name**: `SESSION_SECRET`
- **Value**: `df9fac6ba2b7b8f841347c5a1fa8e78a2b91b2dbc862c2f7c97bf1fbc92083f8`

#### Variable 6:
- **Name**: `PAYSTACK_PUBLIC_KEY`
- **Value**: `pk_test_7a5255fd9557852d6955e7cdb1c3d5ba5b4d13cf`

#### Variable 7:
- **Name**: `PAYSTACK_SECRET_KEY`
- **Value**: `sk_test_7a5255fd9557852d6955e7cdb1c3d5ba5b4d13cf`

#### Variable 8:
- **Name**: `ALLOWED_ORIGINS`
- **Value**: `https://resellershubprogh.com,https://www.resellershubprogh.com`

#### Variable 9:
- **Name**: `FRONTEND_URL`
- **Value**: `https://resellershubprogh.com`

#### Variable 10:
- **Name**: `SKYTECH_API_KEY`
- **Value**: `b0024759b855bbc3b9d29f72`

#### Variable 11:
- **Name**: `SKYTECH_API_SECRET`
- **Value**: `tok_571e79e823c6937b8b5b4c0761c50bcb6dbe427c`

#### Variable 12:
- **Name**: `SKYTECH_API_ENDPOINT`
- **Value**: `https://skytechgh.com/api/v1/orders`

5. Click **"Save"** or **"Update"**
6. Click **"Restart"** application

---

## ✅ After Adding All Variables

### Verify They're Set:

In hPanel, you should see all 12 variables listed under "Environment Variables" section.

### Restart the App:

1. Click **"Stop"** (wait 5 seconds)
2. Click **"Start"** (wait 20 seconds)
3. Check **"Logs"** for any errors

### Test:

Open browser:
```
https://resellershubprogh.com/api/health
```

Should return JSON, not 504 error.

---

## 📝 Copy-Paste Format (for quick entry)

If Hostinger allows bulk entry or you're using SSH:

```bash
DATABASE_URL="postgresql://postgres.jddstfppigucldetsxws:NUNANASMARTDATAGH@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
SUPABASE_URL="https://jddstfppigucldetsxws.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZHN0ZnBwaWd1Y2xkZXRzeHdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgxNDUwNSwiZXhwIjoyMDgxMzkwNTA1fQ.kyQ0An1iAT0N5AJB1AEA3am7SgLcGRaN_BE6ioqAEvw"
NODE_ENV="production"
SESSION_SECRET="df9fac6ba2b7b8f841347c5a1fa8e78a2b91b2dbc862c2f7c97bf1fbc92083f8"
PAYSTACK_PUBLIC_KEY="pk_test_7a5255fd9557852d6955e7cdb1c3d5ba5b4d13cf"
PAYSTACK_SECRET_KEY="sk_test_7a5255fd9557852d6955e7cdb1c3d5ba5b4d13cf"
ALLOWED_ORIGINS="https://resellershubprogh.com,https://www.resellershubprogh.com"
FRONTEND_URL="https://resellershubprogh.com"
SKYTECH_API_KEY="b0024759b855bbc3b9d29f72"
SKYTECH_API_SECRET="tok_571e79e823c6937b8b5b4c0761c50bcb6dbe427c"
SKYTECH_API_ENDPOINT="https://skytechgh.com/api/v1/orders"
```

---

## 🎯 Important Notes

### PORT Variable
**DO NOT SET PORT** - Hostinger sets this automatically. Your code already uses `process.env.PORT`.

### Security
- ✅ These are test keys (safe to use for testing)
- ⚠️ For production, use **live** Paystack keys:
  - `pk_live_...`
  - `sk_live_...`

### Database URL
- Uses Supabase connection pooler (port 6543)
- Should work from Hostinger without firewall issues

---

## 🔍 Troubleshooting

### If still getting 504 errors:

1. **Check all 12 variables are set** (count them in hPanel)
2. **Restart the app** (Stop → Start)
3. **Check logs** for specific error messages
4. **Build the frontend**: SSH → `npm run build:client`
5. **Verify dist exists**: `ls -la client/dist/index.html`

### Test individual services:

**Database connection:**
```
https://resellershubprogh.com/api/health
```

**Supabase:**
Try login/register

**Paystack:**
Try making a payment

All should work after setting these variables! 🚀
