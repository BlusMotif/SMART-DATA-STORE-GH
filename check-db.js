import { db } from './src/server/db.js';
import { sql } from 'drizzle-orm';

async function checkAnnouncements() {
  try {
    const result = await db.execute(sql`SELECT id, title, audiences FROM announcements ORDER BY created_at DESC LIMIT 5`);
    console.log('Recent announcements from DB:');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAnnouncements();
