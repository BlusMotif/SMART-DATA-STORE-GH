-- Add support chat tables
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

CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" varchar(36) NOT NULL,
	"sender_id" varchar(36) NOT NULL,
	"sender_type" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "support_chats_user_idx" ON "support_chats" ("user_id");
CREATE INDEX IF NOT EXISTS "support_chats_status_idx" ON "support_chats" ("status");
CREATE INDEX IF NOT EXISTS "support_chats_assigned_admin_idx" ON "support_chats" ("assigned_to_admin_id");
CREATE INDEX IF NOT EXISTS "chat_messages_chat_idx" ON "chat_messages" ("chat_id");
CREATE INDEX IF NOT EXISTS "chat_messages_sender_idx" ON "chat_messages" ("sender_id");
