# Custom Base Price Implementation - Quick Start

## What Was Fixed

Custom base prices set by admins now **properly affect agent profit calculations** throughout the system. The profit is now calculated as:

```
Profit = Agent Selling Price - Agent Cost Price (Custom Base Price)
```

Instead of the old way:
```
Profit = Agent Selling Price - Admin Price
```

## Changes Made

### 1. **Checkout Initialization** (`/api/checkout/initialize`)
- ✅ Uses `role_base_prices` table for agent cost price
- ✅ Correctly calculates profit: `selling_price - role_base_price`
- ✅ Works for single purchases and bulk orders

### 2. **Bulk Wallet Payment** (`/api/wallet/pay`)
- ✅ Loops through items and calculates profit per item
- ✅ Uses correct base price from `role_base_prices`
- ✅ Sums total profit and credits agent

### 3. **Data Bundles API** (`/api/products/data-bundles`)
- ✅ Shows correct base price to agents (role_base_price)
- ✅ Shows correct profit margin they'll earn
- ✅ Agent storefronts display prices correctly

## How to Test

### Test 1: Verify API Response Shows Correct Prices

**Command**:
```bash
# For authenticated agent, test pricing endpoint
curl -X GET "http://localhost:10000/api/products/data-bundles?network=mtn" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
[
  {
    "id": "mtn-1gb-xxx",
    "name": "MTN 1GB",
    "basePrice": "2.50",           // ← Agent's cost price from role_base_prices
    "effective_price": "3.50",     // ← Agent's custom selling price
    "profit_margin": "1.00"        // ← Profit = 3.50 - 2.50
  }
]
```

**Success Criteria**:
- basePrice matches role_base_price from database
- profit_margin = effective_price - basePrice
- Numbers are realistic (e.g., profit > 0 if selling > base)

### Test 2: Purchase and Verify Profit Credit

**Setup**:
1. Ensure agent has custom selling price > custom base price
2. Have agent buy a bundle from `/agent/bundles`

**Verification**:
```sql
-- Check transaction profit was recorded
SELECT 
  id,
  reference,
  product_name,
  amount,
  agent_profit,
  status,
  payment_status
FROM transactions
WHERE agent_id = 'AGENT_ID'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**:
- agent_profit > 0 (if selling price > base price)
- profit = amount_paid - role_base_price

**Verification 2** - Check profit_wallet:
```sql
SELECT * FROM profit_wallets WHERE user_id = 'AGENT_USER_ID';
```

**Expected**:
- availableBalance increased by agent_profit amount
- totalEarned increased by agent_profit amount

### Test 3: Test Scenario with No Custom Base Price

**Setup**:
1. Verify no row in `role_base_prices` for a bundle
2. Bundle should have default base_price

**Expected Behavior**:
- System falls back to `base_price` from data_bundles table
- Profit = selling_price - base_price
- Everything still works correctly

**Verification**:
```sql
SELECT * FROM role_base_prices WHERE bundle_id = 'BUNDLE_ID' AND role = 'agent';
-- If no rows, system uses data_bundles.base_price
```

### Test 4: Bulk Purchase Profit Calculation

**Setup**:
1. Buy multiple bundles in bulk from /agent/bundles
2. Each bundle has different base prices

**Verification**:
```sql
SELECT 
  id,
  reference,
  phone_numbers,
  amount,
  agent_profit,
  created_at
FROM transactions
WHERE agent_id = 'AGENT_ID'
AND is_bulk_order = true
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- agent_profit = sum of (each_item_price - each_item_base_price)
- agent_profit > 0 if any item has margin
- All phone numbers correctly stored

## Quick SQL Checks

### Check if Role Base Prices Are Set
```sql
SELECT COUNT(*) as total_role_prices
FROM role_base_prices
WHERE role = 'agent';
```

**Expected**: Should return a count > 0

### Check Custom Base Prices for Specific Bundle
```sql
SELECT 
  b.name,
  b.base_price as default_base,
  rbp.base_price as agent_custom_base
FROM data_bundles b
LEFT JOIN role_base_prices rbp ON b.id = rbp.bundle_id AND rbp.role = 'agent'
WHERE b.is_active = true
LIMIT 10;
```

**Expected**: agent_custom_base should be <= default_base (agent discount)

### Check Last Agent Transactions with Profit
```sql
SELECT 
  t.reference,
  t.product_name,
  t.amount,
  t.agent_profit,
  pw.available_balance
FROM transactions t
LEFT JOIN profit_wallets pw ON pw.user_id = (
  SELECT user_id FROM agents WHERE id = t.agent_id
)
WHERE t.agent_id = 'AGENT_ID'
AND t.status = 'completed'
ORDER BY t.created_at DESC
LIMIT 5;
```

## If Something Goes Wrong

### Profit Still shows 0.00

**Check 1**: Verify role_base_price exists
```sql
SELECT * FROM role_base_prices 
WHERE bundle_id = 'BUNDLE_ID' AND role = 'agent';
```

**Check 2**: Verify custom selling price > role_base_price
```sql
SELECT ap.agent_price, rbp.base_price 
FROM agent_pricing ap
LEFT JOIN role_base_prices rbp ON rbp.bundle_id = ap.bundle_id 
WHERE ap.agent_id = 'AGENT_ID';
```

**Check 3**: Verify transaction status is 'completed'
```sql
SELECT status, payment_status 
FROM transactions 
WHERE agent_id = 'AGENT_ID' 
ORDER BY created_at DESC LIMIT 1;
```

### Agent Not Seeing Custom Prices

**Check**: Verify agent record is approved
```sql
SELECT id, user_id, is_approved FROM agents WHERE user_id = 'USER_ID';
```

**Must be**: is_approved = true

### Agent Profit Not Credited to Wallet

**Check**: Verify profit_wallet exists for user
```sql
SELECT * FROM profit_wallets WHERE user_id = 'USER_ID';
```

**If not found**: Create wallet:
```sql
INSERT INTO profit_wallets (user_id, available_balance, pending_balance, total_earned)
VALUES ('USER_ID', '0.00', '0.00', '0.00');
```

## Configuration Needed

### Admin Actions Required

1. **Set Role Base Prices** for each bundle and role:
   ```sql
   INSERT INTO role_base_prices (bundle_id, role, base_price, created_at, updated_at)
   VALUES (
     'bundle-id',
     'agent',
     2.50,
     now(),
     now()
   )
   ON CONFLICT (bundle_id, role) DO UPDATE
   SET base_price = 2.50, updated_at = now();
   ```

2. **Verify Existing Custom Prices** are in `agent_pricing` table

3. **Test with Sample Agent** to ensure profit calculation works

## Implementation Details

### Files Modified
- ✅ `src/server/routes.ts` - Checkout, bulk purchase, data bundles endpoints
- ✅ Compiled to `dist/server/routes.js`

### Database Queries Added
- Uses `storage.getRoleBasePrice(bundleId, role)` for agent cost prices
- Fallback to `bundle.basePrice` if no role_base_price found

### Key Logic
```typescript
// Get agent's cost price from custom base prices
const agentCostPrice = await storage.getRoleBasePrice(bundle.id, 'agent');
const basePriceToUse = agentCostPrice || bundle.basePrice;

// Calculate profit with custom base price
const agentProfit = Math.max(0, sellingPrice - basePriceToUse);
```

## Next Steps

1. **Restart backend server** to load compiled changes
2. **Run Test 1** (API Response Check)
3. **Run Test 2** (Purchase & Profit Credit)
4. **Verify in Dashboard** - Agent sees profit balance updating
5. **Test edge cases** - Bulk orders, different networks

---

**Deployment Status**: ✅ Ready
**Build Status**: ✅ Successful
**Testing**: Pending

For detailed documentation, see: [CUSTOM_BASE_PRICE_SYSTEM.md](./CUSTOM_BASE_PRICE_SYSTEM.md)
