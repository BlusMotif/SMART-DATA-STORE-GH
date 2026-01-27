-- Create wallet_deduction_transactions table if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'wallet_deduction_transactions'
  ) THEN
    CREATE TABLE "wallet_deduction_transactions" (
      "id" text PRIMARY KEY,
      "user_id" text NOT NULL,
      "admin_id" text NOT NULL,
      "amount" text NOT NULL,
      "reason" text,
      "transaction_id" text,
      "created_at" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "wallet_deduction_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
      CONSTRAINT "wallet_deduction_transactions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
      CONSTRAINT "wallet_deduction_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action
    );
  END IF;
END$$;

-- Indexes (create only if missing)
CREATE INDEX IF NOT EXISTS "wallet_deduction_transactions_user_idx" ON "wallet_deduction_transactions" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "wallet_deduction_transactions_admin_idx" ON "wallet_deduction_transactions" USING btree ("admin_id");
CREATE INDEX IF NOT EXISTS "wallet_deduction_transactions_transaction_idx" ON "wallet_deduction_transactions" USING btree ("transaction_id");
