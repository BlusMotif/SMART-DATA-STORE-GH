// Database connection for CLECTECH - PostgreSQL or SQLite with Drizzle ORM
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from '../shared/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.development'), override: true });
}

console.log('DATABASE_URL in db.ts:', process.env.DATABASE_URL);
console.log('SKIP_DB:', process.env.SKIP_DB);

let db: any;
let pool: any;

// Conditionally import based on DATABASE_URL
if (process.env.SKIP_DB === 'true') {
  console.log('SKIP_DB=true — skipping database connection');
  db = null;
  pool = undefined;
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('Using database type:', process.env.DATABASE_URL.startsWith('sqlite:') ? 'SQLite' : 'PostgreSQL');

  if (process.env.DATABASE_URL.startsWith('sqlite:')) {
    // Use SQLite for development
    console.log('Initializing SQLite...');
    const Database = (await import('better-sqlite3')).default;
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const sqlite = new Database(process.env.DATABASE_URL.replace('sqlite:', ''));
    db = drizzle(sqlite, { schema });
    pool = sqlite; // For compatibility
    console.log('SQLite database connection established successfully');
  } else {
    // Use PostgreSQL for production
    console.log('Initializing PostgreSQL...');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { Pool } = await import('pg');
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
  }
}

export { db, pool };
