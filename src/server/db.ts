// Database connection for CLECTECH - PostgreSQL with Drizzle ORM
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let db: any;
let pool: Pool | undefined;

// Use PostgreSQL for all environments
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Connection pool with optimized settings for high-traffic fintech app
pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Wait max 10s for connection
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Use SSL in production
});

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process, just log the error
});

// Test the connection on startup
pool.connect()
  .then(() => {
    console.log('PostgreSQL database connection established successfully');
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

db = drizzle(pool, { schema });

export { db, pool };
