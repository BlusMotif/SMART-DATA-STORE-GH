-- Add bulk order support to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS phone_numbers JSONB,
ADD COLUMN IF NOT EXISTS is_bulk_order BOOLEAN DEFAULT FALSE;

-- Create index for faster bulk order queries
CREATE INDEX IF NOT EXISTS transactions_bulk_order_idx ON transactions(is_bulk_order) WHERE is_bulk_order = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN transactions.phone_numbers IS 'Array of phone numbers for bulk orders (stored as JSONB array)';
COMMENT ON COLUMN transactions.is_bulk_order IS 'Flag to indicate if this is a bulk order with multiple recipients';
