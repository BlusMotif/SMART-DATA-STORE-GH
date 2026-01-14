# Fix for 500 Internal Server Error on /api/profile and /api/agent/withdrawals

## Problem
The `/api/profile` and `/api/agent/withdrawals` endpoints are throwing 500 errors because they're trying to access a `profitWallet` that may not exist for users.

## Root Cause
The code was calling `storage.getProfitWallet(dbUser.id)` which returns `undefined` if the profit wallet doesn't exist, then trying to access properties on `undefined`.

## Solution
The profit wallet system is not being used. Instead, the system uses:
- `agent.totalProfit` - Total profit earned by the agent
- `withdrawals` table - Track all withdrawals (approved/paid)
- **Profit Balance = totalProfit - sum(approved/paid withdrawals)**

## Changes Needed

### 1. Fix `/api/agent/withdrawals` endpoint (around line 2100)

Replace the profit wallet validation:
```typescript
// OLD CODE (REMOVE):
const profitWallet = await storage.getProfitWallet(dbUser.id);
if (!profitWallet) {
  return res.status(400).json({ error: "Profit wallet not found" });
}
const availableBalance = parseFloat(profitWallet.availableBalance);

// NEW CODE (ADD):
// Calculate available balance from agent's total profit minus withdrawals
const withdrawals = await storage.getWithdrawals({ userId: dbUser.id });
const withdrawnTotal = withdrawals
  .filter(w => w.status === 'approved' || w.status === 'paid')
  .reduce((s, w) => s + parseFloat((w.amount as any) || 0), 0);

const totalProfit = parseFloat(agent.totalProfit || '0');
const availableBalance = Math.max(0, totalProfit - withdrawnTotal);

console.log("Withdrawal validation:", {
  totalProfit,
  withdrawnTotal,
  availableBalance,
  requestedAmount: data.amount
});
```

Then update the error message:
```typescript
if (availableBalance < data.amount) {
  return res.status(400).json({
    error: "Insufficient profit balance",  // Changed from "Insufficient profit wallet balance"
    balance: availableBalance.toFixed(2),
    requested: data.amount.toFixed(2)
  });
}
```

### 2. Add better error logging to `/api/profile` endpoint (around line 1800)

In the catch block, add more details:
```typescript
catch (error: any) {
  console.error("Profile error:", error);
  console.error("Error stack:", error.stack);
  res.status(500).json({ 
    error: "Failed to load profile", 
    details: process.env.NODE_ENV === 'development' ? error.message : undefined 
  });
}
```

### 3. Add better error logging to `/api/agent/withdrawals` endpoint

In the catch block:
```typescript
catch (error: any) {
  console.error("Withdrawal error:", error);
  console.error("Error stack:", error.stack);
  res.status(400).json({ 
    error: error.message || "Withdrawal failed",
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

## Testing
After applying these changes:
1. Restart the server
2. Login as an agent
3. Navigate to the profile page - should load without 500 error
4. Try to create a withdrawal - should validate against calculated profit balance

## Why This Works
- Removes dependency on `profitWallet` table which may not exist
- Uses existing `agent.totalProfit` field which is already being updated
- Calculates available balance on-the-fly from withdrawals
- Provides better error messages for debugging
