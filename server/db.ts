// Database connection for CLECTECH - PostgreSQL with Drizzle ORM
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
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

export const db = drizzle(pool, { schema });
