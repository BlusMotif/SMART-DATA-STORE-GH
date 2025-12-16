CREATE TABLE "agents" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"storefront_slug" text NOT NULL,
	"business_name" text NOT NULL,
	"business_description" text,
	"custom_pricing_markup" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"balance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_sales" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_profit" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agents_storefront_slug_unique" UNIQUE("storefront_slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36),
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" varchar(36),
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_bundles" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"network" text NOT NULL,
	"data_amount" text NOT NULL,
	"validity" text NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"cost_price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"api_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "result_checkers" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"year" integer NOT NULL,
	"serial_number" text NOT NULL,
	"pin" text NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"cost_price" numeric(10, 2) NOT NULL,
	"is_sold" boolean DEFAULT false NOT NULL,
	"sold_at" timestamp,
	"sold_to_phone" text,
	"transaction_id" varchar(36),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "result_checkers_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sms_logs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" varchar(36) NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp,
	"sent_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"type" text NOT NULL,
	"product_id" varchar(36),
	"product_name" text NOT NULL,
	"network" text,
	"amount" numeric(12, 2) NOT NULL,
	"cost_price" numeric(12, 2) NOT NULL,
	"profit" numeric(12, 2) NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_reference" text,
	"agent_id" varchar(36),
	"agent_profit" numeric(12, 2) DEFAULT '0.00',
	"api_response" jsonb,
	"delivered_pin" text,
	"delivered_serial" text,
	"sms_status" text,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "transactions_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"role" text DEFAULT 'guest' NOT NULL,
	"firebase_uid" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(36) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_name" text NOT NULL,
	"admin_note" text,
	"processed_by" varchar(36),
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_user_id_idx" ON "agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agents_slug_idx" ON "agents" USING btree ("storefront_slug");--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "data_bundles_network_idx" ON "data_bundles" USING btree ("network");--> statement-breakpoint
CREATE INDEX "data_bundles_active_idx" ON "data_bundles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "result_checkers_type_idx" ON "result_checkers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "result_checkers_sold_idx" ON "result_checkers" USING btree ("is_sold");--> statement-breakpoint
CREATE INDEX "result_checkers_year_idx" ON "result_checkers" USING btree ("year");--> statement-breakpoint
CREATE INDEX "sms_logs_transaction_idx" ON "sms_logs" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "sms_logs_status_idx" ON "sms_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_reference_idx" ON "transactions" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_agent_idx" ON "transactions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_firebase_idx" ON "users" USING btree ("firebase_uid");--> statement-breakpoint
CREATE INDEX "withdrawals_agent_idx" ON "withdrawals" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "withdrawals_status_idx" ON "withdrawals" USING btree ("status");