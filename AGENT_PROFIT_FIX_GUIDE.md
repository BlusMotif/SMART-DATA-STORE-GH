# Agent Profit Balance Fix Guide

## Problem
Agent profit balance shows 0.00 even though agents have transactions with profits recorded. Console shows:
```
totalProfit: 0, totalTransactions: 8, todayProfit: 10
```

## Root Cause
Before the code fix, when agents made purchases using wallet payment, the transaction was created with `agent_id = user.id` instead of `agent_id = agent.id`. This caused:

1. **Transactions not credited to correct agent**: Profit was recorded in `transaction.agent_profit` but with wrong agent ID
2. **Agent.total_profit never updated**: The `updateAgentBalance()` was called with wrong agent ID, so `agent.total_profit` stayed at 0

## Solution Steps

### Step 1: Verify the Issue (Supabase SQL Editor)
Run the first SELECT query in [fix-agent-transactions.sql](fix-agent-transactions.sql) to see which agents need fixing:

```sql
SELECT 
  a.id as agent_id,
  ...
```

This will show agents with mismatched `current_total_profit` vs `calculated_total_profit`.

### Step 2: Apply the Fix
In your Supabase SQL Editor:

1. Copy the UPDATE statement from the "STEP 2" section
2. Uncomment it (remove the `/* */` surrounding it)
3. **Review the query carefully**
4. Click "Run" to execute

**What this does:**
- Recalculates each agent's total profit from their actual transactions
- Updates `agent.total_profit` to match the sum of `agent_profit` from completed/paid transactions

### Step 3: Verify Success
Run the verification query in "STEP 3" to confirm all agents now have matching profit values:

```sql
SELECT 
  a.id as agent_id,
  ...
  CASE 
    WHEN total_profit = transactions_total_profit THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status
```

All rows should show `✓ MATCH`.

### Step 4: Test in Application
1. Hard refresh the browser (Ctrl+Shift+R)
2. Navigate to Agent Wallet page
3. Check that "Agent Profit Balance" card now shows the correct amount
4. The sidebar "Profit Balance" should also update

## Prevention for Future
The code has been fixed to use the correct agent ID for all new transactions:
- ✅ Direct purchases by agents: Uses `agent.id` from `getAgentByUserId()`
- ✅ Storefront purchases: Already uses correct agent ID
- ✅ Profit wallet is credited: Added for bulk purchases

All new agent purchases after the fix will automatically credit profit correctly.

## Files Modified
- `src/server/routes.ts`: Fixed agent ID handling in bulk wallet payment endpoint
- `fix-agent-transactions.sql`: Migration script to recalculate existing agent profits
