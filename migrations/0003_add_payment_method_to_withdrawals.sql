-- Add payment_method column to withdrawals table
ALTER TABLE "withdrawals" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'bank' NOT NULL;

-- Update existing records to have 'bank' as payment method
UPDATE "withdrawals" SET "payment_method" = 'bank' WHERE "payment_method" IS NULL;

-- Make bank_name and bank_code optional for mobile money withdrawals
ALTER TABLE "withdrawals" ALTER COLUMN "bank_name" DROP NOT NULL;