import Database from 'better-sqlite3';

const db = new Database('./dev.db');

try {
  // Check if users table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
  if (tables.length > 0) {
    // Check if wallet_balance column exists
    const columns = db.prepare('PRAGMA table_info(users)').all();
    const hasWalletBalance = columns.some(col => col.name === 'wallet_balance');

    if (!hasWalletBalance) {
      console.log('Adding wallet_balance column to users table...');
      db.exec("ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT '0.00'");
      console.log('wallet_balance column added successfully');
    } else {
      console.log('wallet_balance column already exists');
    }
  } else {
    console.log('users table does not exist');
  }
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}