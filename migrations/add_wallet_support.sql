-- Add wallet_balance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- Add payment_method column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'paystack';

-- Create index on payment_method for better query performance
CREATE INDEX IF NOT EXISTS transactions_payment_method_idx ON transactions(payment_method);

-- Update existing transactions to have paystack as payment method
UPDATE transactions SET payment_method = 'paystack' WHERE payment_method IS NULL;
