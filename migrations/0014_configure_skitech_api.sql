-- Configure SkyTech GH API credentials
-- Migration: 0014_configure_skitech_api.sql

-- Insert or update the external API settings
INSERT INTO settings (key, value, description) VALUES
  ('external_api.key', '39616c47d95b7f2ce67b4184', 'SkyTech GH API Key ID'),
  ('external_api.secret', 'tok_53615840937d20b212ef551cc9388a932fc8fd8d', 'SkyTech GH API Secret for HMAC signing'),
  ('external_api.endpoint', 'https://skytechgh.com/api/v1/orders', 'SkyTech GH API endpoint for order creation')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the settings were inserted
SELECT key, LEFT(value, 10) || '...' as value_preview, description
FROM settings
WHERE key LIKE 'external_api.%';