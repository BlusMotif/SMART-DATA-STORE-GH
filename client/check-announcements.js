const { db } = require('./src/server/db.js');
const { sql } = require('drizzle-orm');

async function checkAnnouncements() {
  const result = await db.execute(sql`SELECT id, title, audiences FROM announcements ORDER BY created_at DESC LIMIT 5`);
  console.log('Recent announcements:');
  result.rows.forEach(row => {
    console.log(`ID: ${row.id}`, Title: ${row.title}`, Audiences: ${row.audiences}`);
  });
  process.exit(0);
}

checkAnnouncements().catch(console.error);
