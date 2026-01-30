import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function testCooldown() {
  try {
    await client.connect();
    
    const phone = '0247064874';
    
    console.log('\n=== Testing Cooldown for:', phone, '===\n');
    
    // Check recent transactions
    const result = await client.query(`
      SELECT 
        reference,
        "customerPhone",
        "paymentStatus",
        "paymentMethod",
        type,
        "createdAt",
        EXTRACT(EPOCH FROM (NOW() - "createdAt")) as seconds_ago
      FROM transactions
      WHERE type = 'data_bundle'
        AND "customerPhone" = $1
      ORDER BY "createdAt" DESC
      LIMIT 5
    `, [phone]);
    
    console.log('Recent transactions for', phone, ':');
    console.log('Count:', result.rows.length);
    console.log('');
    
    result.rows.forEach((row, i) => {
      const minutesAgo = Math.floor(row.seconds_ago / 60);
      console.log(`${i + 1}. Reference: ${row.reference}`);
      console.log(`   Payment Status: ${row.paymentStatus}`);
      console.log(`   Payment Method: ${row.paymentMethod}`);
      console.log(`   Created: ${row.createdAt}`);
      console.log(`   Time Ago: ${minutesAgo} minutes (${Math.floor(row.seconds_ago)} seconds)`);
      console.log('');
    });
    
    if (result.rows.length > 0) {
      const latest = result.rows[0];
      const secondsAgo = parseFloat(latest.seconds_ago);
      const cooldownSeconds = 20 * 60; // 20 minutes
      
      if (secondsAgo < cooldownSeconds) {
        const remainingSeconds = cooldownSeconds - secondsAgo;
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        console.log(`❌ SHOULD BE BLOCKED: ${remainingMinutes} minute(s) remaining`);
      } else {
        console.log(`✅ SHOULD BE ALLOWED: Cooldown expired`);
      }
    } else {
      console.log(`✅ SHOULD BE ALLOWED: No recent transactions`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testCooldown();
