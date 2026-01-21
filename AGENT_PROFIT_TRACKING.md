# Agent Profit Tracking System

## Overview
This document explains how agent profits are tracked when customers purchase from an agent's public storefront.

## How It Works

### 1. **Customer Visits Agent Storefront**
- URL format: `/store/agent/{agentSlug}`
- The storefront displays products with agent's custom pricing
- Agent slug is stored in localStorage: `localStorage.setItem("agentStore", slug)`

### 2. **Customer Makes Purchase**
When a customer clicks on a network (e.g., MTN, Telecel):
- They are redirected to: `/store/{agentSlug}/{network}`
- The `network.tsx` component uses `agentSlug` from URL params or localStorage
- Both single and bulk purchases include `agentSlug` in the checkout payload

**Files Updated:**
- `client/src/pages/products/network.tsx` - Now passes `agentSlug` to backend
- `client/src/pages/agent/public-storefront.tsx` - Already passes `agentSlug` correctly

### 3. **Backend Calculates Profit**
Location: `src/server/routes.ts` - `/api/checkout/initialize` endpoint

**For Single Purchases:**
```typescript
if (data.agentSlug) {
  const agent = await storage.getAgentBySlug(data.agentSlug);
  const resolvedPrice = await storage.getResolvedPrice(data.productId, agent.id, 'agent');
  const adminBasePrice = await storage.getAdminBasePrice(data.productId);
  agentProfit = Math.max(0, resolvedPrice - adminBasePrice);
}
```

**For Bulk Purchases:**
```typescript
for (const item of data.orderItems) {
  const resolvedPrice = await storage.getResolvedPrice(bundle.id, storefrontAgent.id, 'agent');
  const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
  const profit = resolvedPrice - adminBasePrice;
  computedAgentProfit += Math.max(0, profit);
}
```

### 4. **Transaction Created with Profit**
The transaction is stored with:
- `agentId`: The agent's ID (from agentSlug)
- `agentProfit`: The calculated profit amount
- Status: `pending` initially

### 5. **Payment Webhook Credits Agent**
Location: `src/server/routes.ts` - `/api/webhook/paystack` endpoint

When payment is successful:
```typescript
if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
  // Credit agent's wallet balance
  await storage.updateAgentBalance(transaction.agentId, agentProfitValue, true);
  
  // Credit agent's profit wallet (for withdrawals)
  await storage.updateProfitWallet(agent.userId, {
    availableBalance: newAvailableBalance,
    totalEarned: newTotalEarned,
  });
}
```

### 6. **Profit Appears on Dashboard**
Location: `src/server/routes.ts` - `/api/agent/stats` endpoint

The dashboard calculates:
- **Total Profit**: Sum of all `agent_profit` from completed/paid transactions
- **Today's Profit**: Sum of today's completed/paid transactions
- **Transaction Count**: Number of completed/paid transactions

```typescript
const totalProfitResult = await db.select({
  total: sql`coalesce(sum(cast(agent_profit as decimal(10,2))), 0)`
}).from(transactions).where(and(
  eq(transactions.agentId, agent.id),
  or(
    eq(transactions.status, 'completed'),
    eq(transactions.paymentStatus, 'paid')
  )
));
```

## Profit Calculation Example

**Scenario:**
- Admin base price for MTN 1GB bundle: GH₵2.00
- Agent sets custom price: GH₵3.00
- Customer buys 1 bundle

**Calculation:**
- Agent Profit = GH₵3.00 - GH₵2.00 = GH₵1.00
- Agent receives: GH₵1.00 profit
- Platform receives: GH₵2.00 (admin price)

## Key Files

### Frontend
1. **`client/src/pages/agent/public-storefront.tsx`**
   - Agent's public storefront homepage
   - Passes `agentSlug` to checkout

2. **`client/src/pages/products/network.tsx`**
   - Network-specific product page (e.g., MTN bundles)
   - Gets `agentSlug` from URL params or localStorage
   - Passes `agentSlug` to backend for both single and bulk purchases

3. **`client/src/pages/agent/dashboard.tsx`**
   - Displays agent stats including total profit
   - Fetches from `/api/agent/stats`

### Backend
1. **`src/server/routes.ts`**
   - `/api/checkout/initialize` - Calculates and stores agent profit
   - `/api/webhook/paystack` - Credits agent when payment succeeds
   - `/api/agent/stats` - Returns profit statistics

## Testing the System

### 1. Set Agent Pricing
1. Login as agent
2. Go to Pricing page
3. Set custom prices for bundles (must be higher than admin price to earn profit)

### 2. Make a Test Purchase
1. Visit agent storefront: `/store/agent/{agentSlug}`
2. Click on a network (e.g., MTN)
3. Select a bundle and enter phone number
4. Complete payment via Paystack

### 3. Verify Profit on Dashboard
1. Login as agent
2. Go to Dashboard
3. Check "Total Profit" card - should increase by the profit amount
4. Check "Today's Profit" - should show today's earnings
5. Go to Transactions page - verify `agent_profit` column shows the profit

### 4. Check Console Logs
Backend logs will show:
```
[Checkout] Bulk order computed agent profit: X.XX
[Checkout] Created transaction {id} with agentId: {agentId}, agentProfit: X.XX
[Webhook] Crediting agent {agentId} with profit: X.XX
[Agent Stats] totalProfit calculated: X.XX
```

Frontend logs will show:
```
[PublicStorefront] Purchase initiated for agent: {slug}, bundle: {id}, amount: X.XX
[PublicStorefront] Payload: { agentSlug: "...", ... }
```

## Troubleshooting

### Profit Not Showing on Dashboard
1. **Check transaction has agentId and agentProfit:**
   - Query: `SELECT id, agent_id, agent_profit, status FROM transactions WHERE agent_id IS NOT NULL;`

2. **Verify transaction is completed:**
   - Profit only counts when `status='completed'` OR `paymentStatus='paid'`

3. **Check agent pricing is set:**
   - Agent must have custom prices set in pricing table
   - Custom price must be higher than admin base price

4. **Check webhook processed:**
   - Look for webhook logs: `[Webhook] Crediting agent...`
   - Verify profit wallet was updated

### AgentSlug Not Being Passed
1. **Check localStorage:**
   - Open browser console: `localStorage.getItem("agentStore")`
   - Should return the agent slug

2. **Check URL parameters:**
   - URL should include agent slug: `/store/{agentSlug}/{network}`

3. **Check payload in network requests:**
   - Open Network tab in DevTools
   - Find POST to `/api/checkout/initialize`
   - Verify `agentSlug` is in the payload

## Database Schema

### Transactions Table
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  agent_id TEXT,  -- References agents.id
  agent_profit TEXT DEFAULT '0.00',  -- Profit for this transaction
  status TEXT,  -- 'pending', 'completed', 'failed'
  payment_status TEXT,  -- 'pending', 'paid'
  -- ... other fields
);
```

### Profit Wallets Table
```sql
CREATE TABLE profit_wallets (
  user_id TEXT PRIMARY KEY,  -- References users.id
  available_balance TEXT DEFAULT '0.00',  -- Available for withdrawal
  pending_balance TEXT DEFAULT '0.00',  -- Locked until transaction completes
  total_earned TEXT DEFAULT '0.00',  -- All-time earnings
);
```

## Summary

The agent profit tracking system works automatically:

1. ✅ Customer visits agent storefront
2. ✅ Agent slug is captured and stored
3. ✅ Purchase includes agent slug in payload
4. ✅ Backend calculates profit (agent price - admin price)
5. ✅ Transaction created with agent ID and profit
6. ✅ Webhook credits agent when payment succeeds
7. ✅ Dashboard displays updated profit statistics

**No manual intervention needed** - profits are tracked and credited automatically!
