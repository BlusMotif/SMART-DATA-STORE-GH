import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAgentProfit() {
  try {
    // Get all transactions with agentId and agentProfit
    const result = await pool.query(`
      SELECT 
        id,
        reference,
        agent_id,
        agent_profit,
        status,
        payment_status,
        created_at
      FROM transactions 
      WHERE agent_id IS NOT NULL 
      AND agent_profit IS NOT NULL 
      AND CAST(agent_profit AS NUMERIC) > 0
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log('\n=== Recent Transactions with Agent Profit ===\n');
    console.log(`Found ${result.rows.length} transactions:\n`);
    
    result.rows.forEach((tx, i) => {
      console.log(`${i + 1}. Transaction ${tx.reference}`);
      console.log(`   Agent ID: ${tx.agent_id}`);
      console.log(`   Agent Profit: GH₵${tx.agent_profit}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Payment Status: ${tx.payment_status}`);
      console.log(`   Created: ${tx.created_at}`);
      console.log('');
    });

    // Calculate total profit
    const totalResult = await pool.query(`
      SELECT 
        agent_id,
        COUNT(*) as transaction_count,
        SUM(CAST(agent_profit AS NUMERIC)) as total_profit
      FROM transactions 
      WHERE agent_id IS NOT NULL 
      AND (status = 'completed' OR payment_status = 'paid')
      GROUP BY agent_id
    `);

    console.log('\n=== Profit Summary by Agent ===\n');
    totalResult.rows.forEach((row) => {
      console.log(`Agent ID: ${row.agent_id}`);
      console.log(`  Transactions: ${row.transaction_count}`);
      console.log(`  Total Profit: GH₵${Number(row.total_profit).toFixed(2)}`);
      console.log('');
    });

    // Check agent table
    const agentResult = await pool.query(`
      SELECT 
        id,
        user_id,
        total_profit,
        total_sales,
        balance
      FROM agents 
      LIMIT 5
    `);

    console.log('\n=== Agent Records ===\n');
    agentResult.rows.forEach((agent) => {
      console.log(`Agent ID: ${agent.id}`);
      console.log(`  User ID: ${agent.user_id}`);
      console.log(`  Total Profit: GH₵${agent.total_profit}`);
      console.log(`  Total Sales: GH₵${agent.total_sales}`);
      console.log(`  Balance: GH₵${agent.balance}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAgentProfit();
