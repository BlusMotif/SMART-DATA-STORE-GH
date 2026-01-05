-- Copy and paste this SQL into your Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)

-- Add bulk order support columns
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS phone_numbers JSONB,
ADD COLUMN IF NOT EXISTS is_bulk_order BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS transactions_bulk_order_idx 
ON transactions(is_bulk_order) 
WHERE is_bulk_order = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN transactions.phone_numbers IS 'Array of phone numbers for bulk orders (stored as JSONB array)';
COMMENT ON COLUMN transactions.is_bulk_order IS 'Flag to indicate if this is a bulk order with multiple recipients';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('phone_numbers', 'is_bulk_order');
