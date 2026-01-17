import Database from 'better-sqlite3';

const db = new Database('./dev.db');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));

  if (tables.some(t => t.name === 'users')) {
    const columns = db.prepare('PRAGMA table_info(users)').all();
    console.log('Users columns:', columns.map(c => c.name));
  }
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}