# Checkout Success Page - Blank/Offline Issue Fix

## Problem
After Paystack payment, users are redirected to `/checkout/success` but see a blank page with "Offline - Please check your connection" error.

## Root Cause
The backend server is not running. The checkout success page needs to call `/api/transactions/verify/{reference}` to:
1. Verify the payment with Paystack
2. Complete the transaction
3. Display order details

In development, the frontend (`localhost:5173`) proxies API calls to the backend (`localhost:10000`). If the backend isn't running, API calls fail.

## Solution

### For Development (localhost)

1. **Start the backend server:**
   ```powershell
   npm run dev
   ```
   This starts the backend on port 10000.

2. **In a separate terminal, start the frontend:**
   ```powershell
   cd client
   npm run dev
   ```
   This starts the frontend on port 5173.

3. **Make a test purchase** and complete payment. You should now be redirected to a working success page.

### For Production (Hostinger)

1. **Ensure both are deployed:**
   - Frontend: `dist/public/` → `public_html/`
   - Backend: Running via Node.js application

2. **Check backend is accessible:**
   ```
   curl https://resellershubprogh.com/api/transactions/verify/TEST-REF
   ```
   Should return JSON (even if error), not 502/504.

3. **Verify proxy/routing:**
   - Frontend and backend must be on same domain OR
   - CORS must be properly configured

## Changes Made

Updated [checkout-success.tsx](client/src/pages/checkout-success.tsx):
- ✅ Uses TanStack Query's default `queryFn` (proper auth headers)
- ✅ Better error handling with retry logic (3 attempts with exponential backoff)
- ✅ Shows helpful error message when backend is unreachable
- ✅ Polls every 5 seconds until transaction completes
- ✅ Proper loading states

## Quick Test

To verify the fix works:

1. Start both servers (dev mode)
2. Navigate to: `http://localhost:5173/checkout/success?reference=TEST-123`
3. Should see either:
   - Transaction details (if TEST-123 exists)
   - "Transaction not found" error (expected for fake reference)
   - NOT "Offline" error (means backend is running)

## Production Deployment

After deploying, test with a real transaction:
1. Buy a small data bundle
2. Complete Paystack payment
3. Should redirect to success page showing transaction details
4. For result checkers, PDF should auto-download

If issues persist, check:
- Backend logs for errors
- Paystack webhook is hitting `/api/transactions/webhook`
- Database connection is working
