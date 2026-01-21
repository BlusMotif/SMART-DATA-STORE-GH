# SkyTech API Production Configuration Guide

## Issue: Orders work locally but not in production

This guide helps diagnose and fix SkyTech API connectivity issues in production environments.

## Environment Variables Required

Add these environment variables to your production server:

```bash
# SkyTech API Configuration
SKYTECH_API_KEY=your_actual_api_key_here
SKYTECH_API_SECRET=your_actual_api_secret_here
SKYTECH_API_ENDPOINT=https://skytechgh.com/api/v1/orders

# Other required variables
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## Common Issues and Solutions

### 1. Missing Environment Variables
**Symptoms:** API calls fail with "No external API provider configured"
**Solution:** Ensure all three SkyTech environment variables are set in production

### 2. Invalid API Credentials
**Symptoms:** API returns authentication errors
**Solution:** Verify credentials with SkyTech support, ensure they're not expired

### 3. Network/Firewall Restrictions
**Symptoms:** Connection timeouts or DNS resolution failures
**Solution:** Check if production server can reach `skytechgh.com`:
```bash
curl -I https://skytechgh.com/api/v1/balance
```

### 4. Database Configuration Issues
**Symptoms:** Provider not found in database
**Solution:** Run the migration to set up the external API provider:
```sql
INSERT INTO external_api_providers (name, provider, api_key, api_secret, endpoint, is_active, is_default, network_mappings)
VALUES (
  'SkyTech GH',
  'skytech',
  'your_api_key',
  'your_api_secret',
  'https://skytechgh.com/api/v1/orders',
  true,
  true,
  '{"mtn": "MTN", "telecel": "TELECEL", "at_bigtime": "AIRTELTIGO", "at_ishare": "AIRTELTIGO", "airteltigo": "AIRTELTIGO"}'
) ON CONFLICT DO NOTHING;
```

## Testing the Configuration

Run the diagnostic script in production:

```bash
node test_skitech_api.js
```

This will test:
- Environment variable configuration
- Database connectivity
- API balance check
- Network connectivity

## Debugging Steps

1. **Check server logs** during order fulfillment attempts
2. **Verify API credentials** are correct and active
3. **Test network connectivity** from production server
4. **Confirm environment variables** are properly loaded
5. **Check database** has the correct provider configuration

## Alternative Configuration

If environment variables don't work, you can configure via database:

1. Connect to your production database
2. Insert/update the external API provider record
3. Ensure the provider is marked as active and default

## Support

If issues persist:
1. Run the diagnostic script and share the output
2. Check server logs for detailed error messages
3. Contact SkyTech API support to verify credentials
4. Verify production server network configuration