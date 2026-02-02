// Database connection - PostgreSQL with Drizzle ORM
// Optimized for Hostinger shared hosting with fast connection
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { Pool, PoolClient } from 'pg';
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
let _connectionWarmedUp = false;

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
    
    // Connection pool optimized for Hostinger shared hosting with 1000+ users
    // Fast connection with aggressive keepalive for quick response times
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,  // Increased for 1000+ users - Hostinger allows 10-15 connections
      min: 3,   // Keep 3 connections warm for instant response
      idleTimeoutMillis: 60000,  // 60s idle timeout - keep connections alive longer
      connectionTimeoutMillis: 10000,  // 10s fast timeout - fail fast if DB unreachable
      statement_timeout: 30000,  // 30s statement timeout
      query_timeout: 30000,  // 30s query timeout
      allowExitOnIdle: false,  // Keep min connections alive always
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // TCP keepalive to prevent Hostinger/Supabase dropping idle connections
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,  // Start keepalive after 10s
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

/**
 * Warm up database connection pool for faster first queries
 * Call this during server startup to pre-establish connections
 */
export async function warmupDatabaseConnection(): Promise<boolean> {
  if (_connectionWarmedUp) return true;
  
  try {
    const pool = getPool();
    if (!pool) {
      console.log('[DB] No pool available for warmup (using SQLite)');
      _connectionWarmedUp = true;
      return true;
    }
    
    const startTime = Date.now();
    
    // Acquire multiple connections to warm up the pool
    const warmupPromises: Promise<PoolClient>[] = [];
    const warmupCount = Math.min(3, pool.options.min || 2);
    
    for (let i = 0; i < warmupCount; i++) {
      warmupPromises.push(pool.connect());
    }
    
    const clients = await Promise.all(warmupPromises);
    
    // Run a simple query on each connection to verify they work
    await Promise.all(clients.map(client => client.query('SELECT 1')));
    
    // Release all connections back to pool
    clients.forEach(client => client.release());
    
    const elapsed = Date.now() - startTime;
    console.log(`[DB] ✅ Connection pool warmed up (${warmupCount} connections, ${elapsed}ms)`);
    
    _connectionWarmedUp = true;
    return true;
  } catch (error: any) {
    console.error('[DB] ❌ Warmup failed:', error.message);
    return false;
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number }> {
  try {
    const pool = getPool();
    if (!pool) {
      return { healthy: true, latency: 0 }; // SQLite always healthy
    }
    
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    
    return { healthy: true, latency };
  } catch (error) {
    return { healthy: false, latency: -1 };
  }
}
