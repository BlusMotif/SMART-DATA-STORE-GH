-- Migration: Add webhook_url column to transactions table
-- Description: Add support for webhook notifications when transaction status changes
-- Date: 2024

-- Add webhook_url column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS transactions_webhook_url_idx ON transactions(webhook_url) WHERE webhook_url IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN transactions.webhook_url IS 'Optional webhook URL to notify when transaction status changes';
