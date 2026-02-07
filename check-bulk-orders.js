import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrders() {
  try {
    // Check most recent transactions
    const result = await pool.query(`
      SELECT id, reference, product_name, customer_phone, is_bulk_order, phone_numbers, 
             delivery_status, api_response, payment_status, payment_method, created_at
      FROM transactions 
      WHERE reference LIKE '11404%'
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log("Recent transactions with reference 11403x:");
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Count how many transactions have phoneNumbers (old bulk format)
    const bulkCount = await pool.query(`
      SELECT COUNT(*) as count FROM transactions 
      WHERE is_bulk_order = true AND phone_numbers IS NOT NULL
    `);
    console.log("\nBulk orders with phoneNumbers JSON:", bulkCount.rows[0].count);
    
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

checkOrders();
