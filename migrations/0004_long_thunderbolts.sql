CREATE TABLE "admin_base_prices" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar(36) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "custom_pricing" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar(36) NOT NULL,
	"role_owner_id" varchar(36) NOT NULL,
	"role" text NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profit_wallets" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"available_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"pending_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_earned" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_base_prices" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" varchar(36) NOT NULL,
	"role" text NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_topup_transactions" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"admin_id" varchar(36) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text,
	"transaction_id" varchar(36),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_custom_pricing" RENAME TO "profit_transactions";--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "settings_key_unique";--> statement-breakpoint
ALTER TABLE "profit_transactions" DROP CONSTRAINT "agent_custom_pricing_agent_id_agents_id_fk";
--> statement-breakpoint
ALTER TABLE "profit_transactions" DROP CONSTRAINT "agent_custom_pricing_bundle_id_data_bundles_id_fk";
--> statement-breakpoint
ALTER TABLE "withdrawals" DROP CONSTRAINT "withdrawals_agent_id_agents_id_fk";
--> statement-breakpoint
DROP INDEX "agent_custom_pricing_agent_idx";--> statement-breakpoint
DROP INDEX "agent_custom_pricing_bundle_idx";--> statement-breakpoint
DROP INDEX "agent_custom_pricing_unique";--> statement-breakpoint
DROP INDEX "withdrawals_agent_idx";--> statement-breakpoint
ALTER TABLE "settings" ADD PRIMARY KEY ("key");--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "customer_phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profit_transactions" ADD COLUMN "user_id" varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE "profit_transactions" ADD COLUMN "order_id" varchar(36);--> statement-breakpoint
ALTER TABLE "profit_transactions" ADD COLUMN "product_id" varchar(36);--> statement-breakpoint
ALTER TABLE "profit_transactions" ADD COLUMN "selling_price" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "profit_transactions" ADD COLUMN "base_price" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "profit_transactions" ADD COLUMN "profit" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "profit_transactions" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "whatsapp_support_link" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "whatsapp_channel_link" text;--> statement-breakpoint
ALTER TABLE "data_bundles" ADD COLUMN "master_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "data_bundles" ADD COLUMN "admin_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "delivery_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "user_id" varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "approved_by" varchar(36);--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_wallets" ADD CONSTRAINT "profit_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_base_prices" ADD CONSTRAINT "role_base_prices_bundle_id_data_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."data_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_topup_transactions" ADD CONSTRAINT "wallet_topup_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_topup_transactions" ADD CONSTRAINT "wallet_topup_transactions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_topup_transactions" ADD CONSTRAINT "wallet_topup_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_base_prices_product_idx" ON "admin_base_prices" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "admin_base_prices_unique" ON "admin_base_prices" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "announcements_active_idx" ON "announcements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "announcements_created_at_idx" ON "announcements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_keys_user_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_key_idx" ON "api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "api_keys_active_idx" ON "api_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "custom_pricing_product_idx" ON "custom_pricing" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "custom_pricing_role_owner_idx" ON "custom_pricing" USING btree ("role_owner_id");--> statement-breakpoint
CREATE INDEX "custom_pricing_role_idx" ON "custom_pricing" USING btree ("role");--> statement-breakpoint
CREATE INDEX "custom_pricing_unique" ON "custom_pricing" USING btree ("product_id","role_owner_id","role");--> statement-breakpoint
CREATE INDEX "profit_wallets_user_idx" ON "profit_wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "role_base_prices_bundle_idx" ON "role_base_prices" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "role_base_prices_role_idx" ON "role_base_prices" USING btree ("role");--> statement-breakpoint
CREATE INDEX "role_base_prices_unique" ON "role_base_prices" USING btree ("bundle_id","role");--> statement-breakpoint
CREATE INDEX "wallet_topup_transactions_user_idx" ON "wallet_topup_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_topup_transactions_admin_idx" ON "wallet_topup_transactions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "wallet_topup_transactions_transaction_idx" ON "wallet_topup_transactions" USING btree ("transaction_id");--> statement-breakpoint
ALTER TABLE "profit_transactions" ADD CONSTRAINT "profit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_transactions" ADD CONSTRAINT "profit_transactions_order_id_transactions_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profit_transactions_user_idx" ON "profit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profit_transactions_order_idx" ON "profit_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "profit_transactions_status_idx" ON "profit_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "withdrawals_user_idx" ON "withdrawals" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "profit_transactions" DROP COLUMN "agent_id";--> statement-breakpoint
ALTER TABLE "profit_transactions" DROP COLUMN "bundle_id";--> statement-breakpoint
ALTER TABLE "profit_transactions" DROP COLUMN "custom_price";--> statement-breakpoint
ALTER TABLE "profit_transactions" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "data_bundles" DROP COLUMN "cost_price";--> statement-breakpoint
ALTER TABLE "result_checkers" DROP COLUMN "cost_price";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "cost_price";--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN "agent_id";--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN "recipient_code";--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN "transfer_reference";--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN "transfer_code";--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN "processed_by";--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN "processed_at";