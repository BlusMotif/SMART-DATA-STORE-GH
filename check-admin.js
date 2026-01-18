import { pool } from './src/server/db.js';

async function checkAdmin() {
  try {
    const result = await pool.query("SELECT id, email, role FROM users WHERE email = 'eleblununana@gmail.com'");
    console.log('Admin user:', result.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkAdmin();