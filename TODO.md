# Role-Based Pricing Implementation TODO

## Database Schema Changes
- [ ] Add wallet_topup_transactions table to schema.ts
- [ ] Create migration for wallet_topup_transactions table

## Backend API Updates
- [ ] Add role validation to dataBundles update endpoint (only admin can modify basePrice)
- [ ] Enhance pricing enforcement in setAgentPricing, setDealerPricing, etc. (final_price = role_base_price + profit)
- [ ] Modify /api/store/:role/:slug to show bundles with role pricing or fallback to role base prices
- [ ] Enhance /api/admin/wallet/topup with atomic operations and detailed logging
- [ ] Add wallet top-up logging methods to storage.ts

## Frontend UI Updates
- [ ] Update admin dashboard for full base price control
- [ ] Update role dashboards to disable base price inputs and show profit-only fields
- [ ] Ensure storefront displays correct role-specific pricing

## Testing & Validation
- [ ] Test pricing enforcement across all roles
- [ ] Verify storefront displays correct bundles
- [ ] Test wallet top-up atomicity and logging
- [ ] Run database migrations
