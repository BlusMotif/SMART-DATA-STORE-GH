// Database connection for CLECTECH - PostgreSQL with Drizzle ORM
import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { Pool } from "pg";
import Database from "better-sqlite3";
import * as schema from "../shared/schema.js";
import dotenv from "dotenv";

let db: any;
let pool: Pool | undefined;

// Use SQLite for development, PostgreSQL for production
if (process.env.NODE_ENV !== 'production') {
  console.log('🔄 Using SQLite database for development');
  const sqlite = new Database('./dev.db');

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  db = drizzleSqlite(sqlite);

  // Initialize basic tables if they don't exist
  try {
    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'guest' NOT NULL,
        wallet_balance DECIMAL(12, 2) DEFAULT '0.00' NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Create agents table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        storefront_slug TEXT UNIQUE NOT NULL,
        business_name TEXT NOT NULL,
        business_description TEXT,
        custom_pricing_markup DECIMAL(5,2) DEFAULT '0.00' NOT NULL,
        balance DECIMAL(12,2) DEFAULT '0.00' NOT NULL,
        total_sales DECIMAL(12,2) DEFAULT '0.00' NOT NULL,
        total_profit DECIMAL(12,2) DEFAULT '0.00' NOT NULL,
        is_approved BOOLEAN DEFAULT false NOT NULL,
        payment_pending BOOLEAN DEFAULT true NOT NULL,
        activation_fee DECIMAL(10,2) DEFAULT '60.00',
        whatsapp_support_link TEXT,
        whatsapp_channel_link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create transactions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        reference TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        product_id TEXT,
        product_name TEXT NOT NULL,
        network TEXT,
        amount DECIMAL(12,2) NOT NULL,
        profit DECIMAL(12,2) NOT NULL,
        customer_phone TEXT,
        customer_email TEXT,
        phone_numbers TEXT,
        is_bulk_order BOOLEAN DEFAULT false,
        payment_method TEXT DEFAULT 'paystack' NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        delivery_status TEXT DEFAULT 'pending' NOT NULL,
        payment_reference TEXT,
        payment_status TEXT DEFAULT 'pending' NOT NULL,
        agent_id TEXT,
        agent_profit DECIMAL(12,2) DEFAULT '0.00',
        api_response TEXT,
        delivered_pin TEXT,
        delivered_serial TEXT,
        sms_status TEXT,
        failure_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        completed_at DATETIME,
        FOREIGN KEY (agent_id) REFERENCES agents(id)
      )
    `);

    // Create settings table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Create withdrawals table
    sqlite.exec(`
      DROP TABLE IF EXISTS withdrawals;
      CREATE TABLE withdrawals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        payment_method TEXT DEFAULT 'bank' NOT NULL,
        bank_name TEXT,
        bank_code TEXT,
        account_number TEXT NOT NULL,
        account_name TEXT NOT NULL,
        admin_note TEXT,
        rejection_reason TEXT,
        approved_by TEXT,
        approved_at TEXT,
        paid_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('✅ SQLite database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize SQLite database:', error);
  }
} else {
  // Connection pool with optimized settings for high-traffic fintech app
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Wait max 10s for connection
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // Add error handling for the pool
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit the process, just log the error
  });

  // Test the connection on startup (but don't fail if it doesn't work immediately)
  if (process.env.DATABASE_URL) {
    pool.connect()
      .then(() => {
        console.log('✅ Database connection established successfully');
      })
      .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        // Don't exit in production, just log the error
        if (process.env.NODE_ENV !== 'production') {
          console.error('Exiting due to database connection failure in development');
          process.exit(1);
        }
      });
  }

  db = drizzle(pool, { schema });
}

export { db };
export { pool };
