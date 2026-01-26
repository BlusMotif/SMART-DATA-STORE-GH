# Transaction History Debugging Guide

## Issue Summary
Logged-in users (e.g., klenam@gmail.com) making Paystack purchases cannot see their transactions in order history. The system captures the beneficiary phone number but is not properly linking transactions to the user's email.

## Changes Made

### 1. Added Authentication Detection (routes.ts lines 2044-2072)
When a logged-in user initiates a checkout, we now:
- Extract the user's email from their JWT token
- Store it in `authenticatedUserEmail` variable
- Auto-update the user's phone number in their profile if they don't have one

### 2. Enhanced Email Resolution (routes.ts line 2075)
```typescript
const customerEmail = data.customerEmail || authenticatedUserEmail;
```
- If frontend sends `customerEmail` in the request, use it
- Otherwise, fall back to the authenticated user's email from JWT

### 3. Added Debug Logging
Two new console.log statements will help us verify:

**After email resolution (routes.ts ~line 2078):**
```typescript
console.log('[Checkout] Email resolution:', {
  'data.customerEmail': data.customerEmail,
  'authenticatedUserEmail': authenticatedUserEmail,
  'resolved customerEmail': customerEmail,
  'normalized phone': normalizedPhone
});
```

**After transaction creation (routes.ts ~line 2459):**
```typescript
console.log(`[Checkout] Created transaction ${transaction.id} with customerEmail: ${customerEmail}, customerPhone: ${normalizedPhone}, agentId: ${agentId}, agentProfit: ${totalAgentProfit.toFixed(2)}, providerId: ${providerId}`);
```

### 4. Frontend Already Sends Email
Verified that `client/src/pages/agent/bundles.tsx` already sends:
```typescript
customerEmail: user?.email || undefined,
```

## Testing Steps

### Step 1: Restart Server
```bash
cd c:\Users\LENOVO\Desktop\SMART-DATA-STORE-GH
npm start
```

### Step 2: Login as Test User
1. Open browser to your app
2. Login with: klenam@gmail.com (or any test account)
3. Verify you're logged in (check user profile/dashboard)

### Step 3: Make a Test Purchase
1. Go to Data Bundles page
2. Select any bundle (e.g., MTN 1GB)
3. Enter beneficiary phone number: 0241234567
4. Select payment method: **Paystack**
5. Click "Proceed to Payment"

### Step 4: Check Server Logs
Look for these two log entries in your terminal:

**Expected Log 1:**
```
[Checkout] Email resolution: {
  'data.customerEmail': 'klenam@gmail.com',
  'authenticatedUserEmail': 'klenam@gmail.com',
  'resolved customerEmail': 'klenam@gmail.com',
  'normalized phone': '233241234567'
}
```

**Expected Log 2:**
```
[Checkout] Created transaction abc123 with customerEmail: klenam@gmail.com, customerPhone: 233241234567, agentId: xyz, agentProfit: 1.50, providerId: abc
```

### Step 5: Verify Database
If the transaction ID from the log is (for example) `abc123`, run this SQL query:
```sql
SELECT 
  id,
  reference,
  customerEmail,
  customerPhone,
  status,
  paymentStatus,
  createdAt
FROM transactions
WHERE id = 'abc123';
```

Check:
- ✅ `customerEmail` should be `klenam@gmail.com`
- ✅ `customerPhone` should be `233241234567`
- ✅ Both fields should NOT be NULL

### Step 6: Check Order History
1. Navigate to Order History page
2. Check browser console for frontend logs:
```
[User History] Fetched transactions: [...]
[User History] Filtered transactions: X out of Y
```
3. Verify the transaction appears in the list

## Possible Issues & Solutions

### Issue 1: authenticatedUserEmail is undefined
**Symptoms:** Log shows `'authenticatedUserEmail': undefined`

**Causes:**
- User not logged in (but they should be)
- JWT token not being sent in Authorization header
- Token is invalid/expired

**Solution:**
- Check if frontend is sending `Authorization: Bearer <token>` header
- Check browser localStorage/sessionStorage for auth token
- Try logging out and back in

### Issue 2: customerEmail is undefined
**Symptoms:** Log shows `'resolved customerEmail': undefined`

**Causes:**
- Frontend not sending `customerEmail` in request body
- User object is null in frontend

**Solution:**
- Check `client/src/pages/agent/bundles.tsx` line 183/266/316
- Verify `user?.email` has a value in frontend
- Add frontend console.log before sending request

### Issue 3: Transaction saved with NULL email
**Symptoms:** Database query shows `customerEmail: NULL`

**Causes:**
- `customerEmail` variable is undefined at time of transaction creation
- Variable got overwritten somewhere between line 2075 and line 2445

**Solution:**
- Add more console.logs between email resolution and transaction creation
- Check if there's any code that modifies `customerEmail` variable

### Issue 4: Transaction saved but not appearing in history
**Symptoms:** 
- Database has correct email
- Frontend console shows "Fetched transactions: 0 out of 0"

**Causes:**
- `/api/transactions` endpoint not querying correctly
- User's email in profile doesn't match transaction's customerEmail
- Filtering logic hiding the transaction

**Solution:**
- Check the `/api/transactions` endpoint logs (routes.ts lines 5711-5742)
- Verify user's email in database: `SELECT email, phone FROM users WHERE email = 'klenam@gmail.com';`
- Check if transaction exists: `SELECT * FROM transactions WHERE customerEmail = 'klenam@gmail.com';`

## Next Steps

1. **Test Now:** Follow steps 1-6 above and share the logs
2. **Report Findings:** Share:
   - Both console.log outputs
   - Database query result
   - Whether transaction appeared in order history
3. **We'll Adjust:** Based on what we see, we can:
   - Add more targeted logging
   - Fix specific issues identified
   - Implement alternative solutions if needed

## Quick Verification Commands

### Check User Profile
```sql
SELECT id, email, phone, role FROM users WHERE email = 'klenam@gmail.com';
```

### Check Recent Transactions
```sql
SELECT 
  id,
  reference,
  customerEmail,
  customerPhone,
  status,
  amount,
  createdAt
FROM transactions
WHERE customerEmail = 'klenam@gmail.com'
   OR customerPhone LIKE '%241234567%'
ORDER BY createdAt DESC
LIMIT 10;
```

### Check Transaction Count by Email
```sql
SELECT 
  customerEmail,
  COUNT(*) as count
FROM transactions
WHERE customerEmail IS NOT NULL
GROUP BY customerEmail
ORDER BY count DESC
LIMIT 20;
```
