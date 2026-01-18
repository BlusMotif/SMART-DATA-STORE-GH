// Force development mode and clear DATABASE_URL before importing db
process.env.NODE_ENV = 'development';
delete process.env.DATABASE_URL;

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as path from 'path';
import { sql } from 'drizzle-orm';

// Create SQLite connection directly
const sqlite = new Database(path.resolve(process.cwd(), 'dev.db'));
const db = drizzle(sqlite);

async function checkAndCreateTables() {
  try {
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Checking database tables...');

    // Check existing tables
    const result = await db.execute(sql`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('support_chats', 'chat_messages');`);
    console.log('Existing tables result:', result);

    console.log('Creating support chat tables if they don\'t exist...');

    // Create support_chats table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "support_chats" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "user_id" varchar(36) NOT NULL,
        "user_email" text NOT NULL,
        "user_name" text NOT NULL,
        "status" text DEFAULT 'open' NOT NULL,
        "last_message_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "assigned_to_admin_id" varchar(36),
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "closed_at" timestamp
      );
    `);

    // Create chat_messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "chat_id" varchar(36) NOT NULL,
        "sender_id" varchar(36) NOT NULL,
        "sender_type" text NOT NULL,
        "message" text NOT NULL,
        "is_read" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "support_chats_user_idx" ON "support_chats" ("user_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "support_chats_status_idx" ON "support_chats" ("status");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "support_chats_assigned_admin_idx" ON "support_chats" ("assigned_to_admin_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "chat_messages_chat_idx" ON "chat_messages" ("chat_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "chat_messages_sender_idx" ON "chat_messages" ("sender_id");`);

    console.log('Support chat tables created successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAndCreateTables();