// Database connection - PostgreSQL with Drizzle ORM
// Uses lazy initialization to ensure env vars are loaded first
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy-initialized database instances
let _db: any = null;
let _pool: Pool | null = null;
let _initialized = false;

/**
 * Initialize the database connection
 * Called lazily on first access to ensure env vars are loaded
 */
function initializeDatabase(): void {
  if (_initialized) return;
  
  const usePostgreSQL = process.env.DATABASE_URL && 
    (process.env.DATABASE_URL.startsWith('postgresql://') || 
     process.env.DATABASE_URL.startsWith('postgres://'));

  if (usePostgreSQL) {
    if (!process.env.DATABASE_URL) {
      throw new Error('[DB] DATABASE_URL environment variable is required');
    }
    
    // Connection pool with enhanced settings for stability
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Error handling for the pool (keep this for production debugging)
    _pool.on('error', (err: Error) => {
      console.error('[DB Pool] Connection error');
    });

    _db = drizzle(_pool, { schema });
  } else {
    // Use SQLite for local development
    const sqlite = new Database(path.resolve(__dirname, '../../dev.db'));
    _db = drizzleSqlite(sqlite, { schema });
  }

  _initialized = true;
}

// Getter for db - initializes on first access
export const db = new Proxy({} as any, {
  get(target, prop) {
    if (!_initialized) {
      initializeDatabase();
    }
    return (_db as any)[prop];
  }
});

// Getter for pool
export function getPool(): Pool | null {
  if (!_initialized) {
    initializeDatabase();
  }
  return _pool;
}

// For backward compatibility
export const pool = new Proxy({} as any, {
  get(target, prop) {
    const p = getPool();
    return p ? (p as any)[prop] : undefined;
  }
});

// Force initialization (call after env vars are loaded)
export function ensureDbInitialized(): void {
  if (!_initialized) {
    initializeDatabase();
  }
}
