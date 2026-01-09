// Database connection for CLECTECH - PostgreSQL with Drizzle ORM
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";
import dotenv from "dotenv";

const { Pool } = pg;

console.log("DATABASE_URL loaded:", process.env.DATABASE_URL ? 
  `${process.env.DATABASE_URL.substring(0, 50)}...` : 'NOT SET');

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  } else {
    console.warn("DATABASE_URL not set. Running in development mode without database.");
    // In development, we'll handle missing DB gracefully
  }
}

// Connection pool with optimized settings for high-traffic fintech app
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Wait max 10s for connection
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

export const db = drizzle(pool, { schema });
