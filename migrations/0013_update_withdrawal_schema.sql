-- Update withdrawal schema for manual admin approval flow
-- Migration: 0013_update_withdrawal_schema.sql

-- Add new columns
ALTER TABLE "withdrawals" ADD COLUMN "rejection_reason" text;
ALTER TABLE "withdrawals" ADD COLUMN "approved_by" varchar(36);
ALTER TABLE "withdrawals" ADD COLUMN "approved_at" timestamp;
ALTER TABLE "withdrawals" ADD COLUMN "paid_at" timestamp;

-- Remove old columns that are no longer needed
ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "recipient_code";
ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "transfer_reference";
ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "transfer_code";
ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "processed_by";
ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "processed_at";
ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "completed_at";

-- Update status enum values (this will be handled by the application code)
-- Valid statuses: pending, approved, rejected, paid