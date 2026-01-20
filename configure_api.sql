-- SkyTech GH API Configuration Script
-- Run this SQL directly in your database

-- Insert the API credentials (PostgreSQL with ON CONFLICT)
INSERT INTO settings (key, value, description)
VALUES
  ('external_api.key', '39616c47d95b7f2ce67b4184', 'SkyTech GH API Key ID'),
  ('external_api.secret', 'tok_53615840937d20b212ef551cc9388a932fc8fd8d', 'SkyTech GH API Secret for HMAC signing'),
  ('external_api.endpoint', 'https://skytechgh.com/api/v1/orders', 'SkyTech GH API endpoint for order creation')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Alternative: If ON CONFLICT doesn't work, use separate INSERT/UPDATE statements:
-- INSERT INTO settings (key, value, description) VALUES ('external_api.key', '39616c47d95b7f2ce67b4184', 'SkyTech GH API Key ID') ON CONFLICT (key) DO NOTHING;
-- UPDATE settings SET value = '39616c47d95b7f2ce67b4184', description = 'SkyTech GH API Key ID', updated_at = CURRENT_TIMESTAMP WHERE key = 'external_api.key';
-- (Repeat for other keys)

-- Verify the settings
SELECT key, value, description, updated_at
FROM settings
WHERE key LIKE 'external_api.%'
ORDER BY key;