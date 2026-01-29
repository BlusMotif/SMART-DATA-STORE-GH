# Custom Base Price System - Complete Implementation Guide

## Overview

The system now supports **custom base prices** set by admins for different roles (agent, dealer, super_dealer, master). These custom base prices affect how agent profits are calculated, ensuring accurate commission distribution.

## Key Components

### 1. **Database Tables**

#### `role_base_prices`
- **Purpose**: Stores the base cost price for each role (what the role buys at from the company)
- **Columns**:
  - `id`: UUID primary key
  - `bundle_id`: References data_bundle
  - `role`: 'agent', 'dealer', 'super_dealer', 'master'
  - `base_price`: Cost price for that role (GHS)
  - `created_at`, `updated_at`: Timestamps

#### `agent_pricing`
- **Purpose**: Stores custom selling prices for individual agents
- **Columns**:
  - `id`: UUID primary key
  - `agent_id`: References agents table
  - `bundle_id`: References data_bundles
  - `agent_price`: What the agent sells at (GHS)
  - `admin_base_price`: What the agent buys at (GHS) - uses role_base_prices
  - `agent_profit`: Calculated as `agent_price - admin_base_price`
  - `created_at`, `updated_at`: Timestamps

### 2. **Pricing Hierarchy**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRICING HIERARCHY                             │
└─────────────────────────────────────────────────────────────────┘

1. SELLING PRICE (What customer pays)
   └─ Resolved Price (custom agent price if set)
   
2. BASE/COST PRICE (What role pays to company)
   └─ Role Base Price (admin configurable per role)
   └─ Fallback: data_bundles.base_price
   
3. PROFIT (What role earns)
   └─ Profit = Selling Price - Base/Cost Price
   └─ Only > 0 if selling price > base price
```

### 3. **Profit Calculation Flow**

#### For Agent Direct Purchases
```
1. Customer places order via /agent/bundles page
2. System resolves:
   - agent_selling_price = resolve custom price OR role_base_price
   - agent_cost_price = role_base_price for 'agent' role
3. Calculate profit:
   - profit = agent_selling_price - agent_cost_price
4. Store in transaction:
   - transaction.agentProfit = profit
5. Credit to profit_wallet:
   - profit_wallet.availableBalance += profit
```

#### For Agent Storefront Purchases
```
1. Customer buys from agent's storefront
2. System resolves:
   - agent_selling_price = resolve custom price OR role_base_price
   - agent_cost_price = role_base_price for 'agent' role
3. Calculate profit:
   - profit = agent_selling_price - agent_cost_price
4. Store in transaction:
   - transaction.agentProfit = profit
5. Credit to profit_wallet:
   - profit_wallet.availableBalance += profit
```

#### For Bulk Purchases
```
1. For each item in bulk order:
   - item_selling_price = resolve price OR base price
   - item_cost_price = role_base_price (if agent)
   - item_profit = item_selling_price - item_cost_price
2. Sum all item profits:
   - total_agent_profit = sum of all item_profit
3. Store in transaction:
   - transaction.agentProfit = total_agent_profit
4. Credit to profit_wallet with total profit
```

## API Endpoints Affected

### 1. **GET /api/products/data-bundles**
- **Purpose**: Fetch bundles with pricing for authenticated user
- **Changes**:
  - For agents: Uses `role_base_prices` as base price
  - Calculates `profit_margin = selling_price - role_base_price`
  - Shows accurate profit agents will earn
- **Response**:
  ```json
  {
    "id": "bundle-id",
    "name": "MTN 1GB",
    "basePrice": "2.50",           // agent's cost price (role_base_price)
    "effective_price": "3.00",     // what agent sells at
    "profit_margin": "0.50"        // what agent earns (3.00 - 2.50)
  }
  ```

### 2. **POST /api/checkout/initialize**
- **Purpose**: Initiate payment for data bundle purchase
- **Changes**:
  - Calculates agent profit using role_base_price
  - Validates agent has custom prices set
  - Stores correct agentProfit in transaction
- **Profit Calculation**:
  ```typescript
  const agentCostPrice = await storage.getRoleBasePrice(bundle.id, 'agent');
  const agentProfit = Math.max(0, agentSellingPrice - agentCostPrice);
  ```

### 3. **POST /api/wallet/pay** (Bulk Purchase)
- **Purpose**: Process bulk data bundle purchases via wallet
- **Changes**:
  - Loops through each item in order
  - Gets agent cost price from role_base_prices
  - Calculates per-item profit
  - Sums to total agent profit
- **Implementation**:
  ```typescript
  let computedAgentProfit = 0;
  for (const item of orderItems) {
    const agentCostPrice = await storage.getRoleBasePrice(bundle.id, 'agent');
    computedAgentProfit += Math.max(0, itemPrice - agentCostPrice);
  }
  ```

## Storage Layer Methods

### Key Methods in `src/server/storage.ts`

```typescript
// Get the base cost price for a role
getRoleBasePrice(bundleId: string, role: string): Promise<string | null>

// Get resolved selling price (custom or fallback)
getResolvedPrice(bundleId: string, roleOwnerId: string, role: string): Promise<string | null>

// Get admin-set base price (global fallback)
getAdminBasePrice(bundleId: string): Promise<string | null>

// Get custom price for agent
getCustomPrice(bundleId: string, roleOwnerId: string, role: string): Promise<string | null>
```

## Admin Configuration

### Setting Custom Base Prices

1. **Via Admin Dashboard** (if endpoint exists):
   ```
   POST /api/admin/role-base-prices
   {
     "bundleId": "mtn-1gb-id",
     "role": "agent",
     "basePrice": "2.50"    // agents buy at this price
   }
   ```

2. **Via Database**:
   ```sql
   INSERT INTO role_base_prices (bundle_id, role, base_price)
   VALUES ('mtn-1gb-id', 'agent', 2.50)
   ON CONFLICT (bundle_id, role) DO UPDATE
   SET base_price = 2.50;
   ```

### Setting Custom Agent Selling Prices

1. **Via Admin Dashboard** (if endpoint exists):
   ```
   POST /api/admin/agent-pricing
   {
     "agentId": "agent-id",
     "bundleId": "mtn-1gb-id",
     "agentPrice": "3.00"   // agent sells at this price
   }
   ```

2. **Via Database**:
   ```sql
   INSERT INTO agent_pricing (agent_id, bundle_id, agent_price, admin_base_price)
   VALUES ('agent-id', 'mtn-1gb-id', 3.00, 2.50)
   ON CONFLICT (agent_id, bundle_id) DO UPDATE
   SET agent_price = 3.00;
   ```

## Testing Scenarios

### Scenario 1: Agent with Custom Base Price and Custom Selling Price

**Setup**:
- Bundle: MTN 1GB
- Default base_price: 3.00
- Role base_price for agent: 2.50 (admin discount)
- Agent custom selling price: 3.50

**Expected Behavior**:
- Agent sees base price: 2.50 (what they pay)
- Agent sees selling price: 3.50 (what they sell at)
- Agent profit per sale: 3.50 - 2.50 = 1.00
- When agent makes purchase: profit = 1.00 credited to profit_wallet

**API Response**:
```json
{
  "id": "mtn-1gb",
  "name": "MTN 1GB",
  "basePrice": "2.50",
  "effective_price": "3.50",
  "profit_margin": "1.00"
}
```

### Scenario 2: Agent with Custom Base Price, No Custom Selling Price

**Setup**:
- Bundle: MTN 1GB
- Default base_price: 3.00
- Role base_price for agent: 2.50 (admin discount)
- Agent custom selling price: NOT SET (uses role_base_price)

**Expected Behavior**:
- Agent sees base price: 2.50
- Agent sees selling price: 2.50 (no custom price)
- Agent profit per sale: 0.00 (sells at cost)
- When agent makes purchase: profit = 0.00 (no profit credited)

### Scenario 3: Guest User

**Setup**:
- Bundle: MTN 1GB
- base_price: 3.00
- No role_base_price for guests
- No agent setup

**Expected Behavior**:
- Guest sees: base price = 3.00, selling price = 3.00, profit = 0.00
- Guest has no profit mechanism

## Verification Checklist

After deployment, verify:

- [ ] Admin can set role_base_prices for bundles
- [ ] Agents see correct base prices in API responses
- [ ] Agents can set custom selling prices above their base price
- [ ] Profit is calculated as: selling_price - base_price
- [ ] Agents receive correct profit in profit_wallet after purchases
- [ ] /api/profile shows correct profitBalance from profit_wallet
- [ ] Transaction list shows correct profit amounts
- [ ] Bulk purchases calculate profit correctly per item
- [ ] Agent storefronts show and apply profit correctly

## Common Issues & Fixes

### Issue: Profit Shows 0.00 Even With Custom Prices

**Cause**: No role_base_price set for agent, defaults to bundle.basePrice

**Fix**: 
```sql
INSERT INTO role_base_prices (bundle_id, role, base_price)
SELECT id, 'agent', base_price FROM data_bundles WHERE is_active = true;
```

### Issue: Agent Custom Prices Not Applying

**Cause**: getResolvedPrice not finding custom price, OR agent price < base price

**Fix**:
1. Verify custom price exists: `SELECT * FROM custom_pricing WHERE agent_id = ?`
2. Ensure selling_price >= base_price
3. Check agent is approved: `SELECT * FROM agents WHERE id = ? AND is_approved = true`

### Issue: Profit Not Credited to profit_wallet

**Cause**: Transaction not marked as 'completed' or 'paid'

**Fix**:
```sql
SELECT t.id, t.status, t.payment_status, t.agent_profit
FROM transactions t
WHERE t.agent_id = ? AND t.payment_status != 'paid'
ORDER BY t.created_at DESC;
```

## Related Documentation

- [AGENT_PROFIT_FIX_GUIDE.md](./AGENT_PROFIT_FIX_GUIDE.md) - Profit balance display fixes
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions

## Summary of Changes

This implementation ensures:

1. **Transparency**: Agents see exactly what base price they pay and profit they earn
2. **Flexibility**: Admins can set different base prices per role
3. **Accuracy**: Profit calculated from correct base prices, not hardcoded defaults
4. **Consistency**: Profit calculation is same across direct purchases, storefronts, and bulk orders
5. **Auditability**: All profit amounts recorded in transactions and profit_wallet

---

**Last Updated**: January 29, 2026
**Status**: ✅ Implemented and Tested
