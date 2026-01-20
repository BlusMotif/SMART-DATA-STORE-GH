// Database connection for CLECTECH - PostgreSQL with Drizzle ORM
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine database type based on DATABASE_URL
const usePostgreSQL = process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));

let db: any;
let pool: Pool | undefined;

if (usePostgreSQL) {
  // Use PostgreSQL
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Connection pool
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // Add error handling for the pool
  pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
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
} else {
  // Use SQLite
  const sqlite = new Database(path.resolve(__dirname, '../../dev.db'));
  db = drizzleSqlite(sqlite, { schema });
  console.log('SQLite database connection established successfully');
}
}

export { db, pool };
