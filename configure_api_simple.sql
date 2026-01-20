-- Simple SkyTech GH API Configuration (works with most SQL databases)
-- Run these commands one by one in your database

-- Delete existing settings if they exist
DELETE FROM settings WHERE key IN ('external_api.key', 'external_api.secret', 'external_api.endpoint');

-- Insert the new API credentials
INSERT INTO settings (key, value, description) VALUES
  ('external_api.key', '39616c47d95b7f2ce67b4184', 'SkyTech GH API Key ID');

INSERT INTO settings (key, value, description) VALUES
  ('external_api.secret', 'tok_53615840937d20b212ef551cc9388a932fc8fd8d', 'SkyTech GH API Secret for HMAC signing');

INSERT INTO settings (key, value, description) VALUES
  ('external_api.endpoint', 'https://skytechgh.com/api/v1/orders', 'SkyTech GH API endpoint for order creation');

-- Verify the settings
SELECT key, value, description, updated_at
FROM settings
WHERE key LIKE 'external_api.%'
ORDER BY key;