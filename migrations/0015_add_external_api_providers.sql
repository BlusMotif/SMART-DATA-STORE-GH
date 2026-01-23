-- Create external API providers table
CREATE TABLE IF NOT EXISTS external_api_providers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  network_mappings TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_external_api_providers_active ON external_api_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_external_api_providers_default ON external_api_providers(is_default);

-- Insert default SkyTech provider
INSERT INTO external_api_providers (name, provider, api_key, api_secret, endpoint, is_active, is_default, network_mappings)
VALUES (
  'SkyTech GH',
  'skytech',
  '39616c47d95b7f2ce67b4184',
  'tok_53615840937d20b212ef551cc9388a932fc8fd8d',
  'https://skytechgh.com/api/v1/orders',
  true,
  true,
  '{"mtn": "MTN", "telecel": "TELECEL", "at_bigtime": "AT_BIGTIME", "at_ishare": "AT_ISHARE", "airteltigo": "AIRTELTIGO"}'
) ON CONFLICT DO NOTHING;