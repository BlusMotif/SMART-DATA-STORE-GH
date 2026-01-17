import { pool } from './src/server/db.js';

async function enableClaudeHaiku() {
  try {
    const sql = `INSERT INTO settings (key, value, description, updated_at) VALUES ('claude_haiku_4_5_enabled', 'true', 'Enable Claude Haiku 4.5 for all clients', NOW()) ON CONFLICT (key) DO UPDATE SET value = 'true', description = 'Enable Claude Haiku 4.5 for all clients', updated_at = NOW();`;

    await pool.query(sql);
    console.log('✅ Claude Haiku 4.5 enabled for all clients');
  } catch (error) {
    console.error('❌ Failed to enable Claude Haiku 4.5:', error);
  } finally {
    await pool.end();
  }
}

enableClaudeHaiku();