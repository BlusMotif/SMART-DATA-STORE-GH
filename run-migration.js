import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running bulk order migration...');
    
    // Add phone_numbers column
    await client.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS phone_numbers JSONB,
      ADD COLUMN IF NOT EXISTS is_bulk_order BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Added phone_numbers and is_bulk_order columns');
    
    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS transactions_bulk_order_idx 
      ON transactions(is_bulk_order) 
      WHERE is_bulk_order = TRUE;
    `);
    console.log('✅ Created index for bulk orders');
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
