// Database connection for CLECTECH - PostgreSQL with Drizzle ORM
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure DATABASE_URL is set and points to Supabase
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (!process.env.DATABASE_URL.includes('supabase.co')) {
  throw new Error('DATABASE_URL must point to Supabase PostgreSQL database');
}

// Connection pool with optimized settings for high-traffic fintech app
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Wait max 10s for connection
  ssl: { rejectUnauthorized: false }, // Always use SSL for Supabase
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
      console.log(' Database connection established successfully');
    })
    .catch((err) => {
      console.error(' Database connection failed:', err.message);
      // Don't exit in production, just log the error
      if (process.env.NODE_ENV !== 'production') {
        console.error('Exiting due to database connection failure in development');
        process.exit(1);
      }
    });
}

export const db = drizzle(pool, { schema });
