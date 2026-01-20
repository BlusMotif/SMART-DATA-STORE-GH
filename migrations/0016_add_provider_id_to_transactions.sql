-- Add provider_id field to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS provider_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_provider_id ON transactions(provider_id);