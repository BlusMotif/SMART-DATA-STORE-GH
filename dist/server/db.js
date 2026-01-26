// Database connection - PostgreSQL with Drizzle ORM
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Load environment variables with same logic as index.ts
dotenv.config();
if (process.env.NODE_ENV === 'development') {
    dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env.development'), override: true });
}
// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Determine database type based on DATABASE_URL
const usePostgreSQL = process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'));
let db;
let pool;
if (usePostgreSQL) {
    // Use PostgreSQL
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
    }
    // Connection pool with enhanced settings for stability
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        min: 2, // Keep minimum connections ready
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 30000, // 30s statement timeout
        query_timeout: 30000, // 30s query timeout
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    // Add comprehensive error handling for the pool
    pool.on('error', (err) => {
        console.error('[DB Pool] Unexpected error on idle client:', err);
    });
    pool.on('connect', () => {
        console.log('[DB Pool] Client connected to database');
    });
    pool.on('acquire', () => {
        console.log('[DB Pool] Client acquired from pool');
    });
    pool.on('release', () => {
        console.log('[DB Pool] Client released back to pool');
    });
    pool.on('remove', () => {
        console.log('[DB Pool] Client removed from pool');
    });
    db = drizzle(pool, { schema });
}
else {
    // Use SQLite
    const sqlite = new Database(path.resolve(__dirname, '../../dev.db'));
    db = drizzleSqlite(sqlite, { schema });
    console.log('SQLite database connection established successfully');
}
export { db, pool };
