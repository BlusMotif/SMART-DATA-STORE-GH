CREATE TABLE IF NOT EXISTS "agent_custom_pricing" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(36) NOT NULL,
	"bundle_id" varchar(36) NOT NULL,
	"custom_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" varchar(36) NOT NULL,
	"sender_id" varchar(36) NOT NULL,
	"sender_type" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_chats" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"user_email" text NOT NULL,
	"user_name" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"assigned_to_admin_id" varchar(36),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint 
ALTER TABLE "agents" DROP CONSTRAINT "agents_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "withdrawals" DROP CONSTRAINT "withdrawals_agent_id_agents_id_fk";
--> statement-breakpoint
ALTER TABLE "withdrawals" ALTER COLUMN "bank_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "payment_pending" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "activation_fee" numeric(10, 2) DEFAULT '60.00';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "phone_numbers" jsonb;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "is_bulk_order" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_method" text DEFAULT 'paystack' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_balance" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "payment_method" text DEFAULT 'bank' NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "bank_code" text;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "recipient_code" text;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "transfer_reference" text;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "transfer_code" text;--> statement-breakpoint
ALTER TABLE "agent_custom_pricing" ADD CONSTRAINT "agent_custom_pricing_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_custom_pricing" ADD CONSTRAINT "agent_custom_pricing_bundle_id_data_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."data_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_custom_pricing_agent_idx" ON "agent_custom_pricing" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_custom_pricing_bundle_idx" ON "agent_custom_pricing" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "agent_custom_pricing_unique" ON "agent_custom_pricing" USING btree ("agent_id","bundle_id");--> statement-breakpoint
CREATE INDEX "chat_messages_chat_idx" ON "chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_messages_sender_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "support_chats_user_idx" ON "support_chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_chats_status_idx" ON "support_chats" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_chats_assigned_admin_idx" ON "support_chats" USING btree ("assigned_to_admin_id");--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;