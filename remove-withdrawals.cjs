const fs = require('fs');
const path = require('path');

console.log('🗑️  Removing withdrawal system from the application...\n');

const routesPath = path.join(__dirname, 'src', 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// 1. Remove withdrawal calculation from /api/profile endpoint
console.log('1. Removing withdrawal calculations from /api/profile...');
content = content.replace(
  /\/\/ Compute withdrawals sum[\s\S]*?console\.log\("Calculated profit balance:", profitBalance\);/,
  '// Profit balance = totalProfit (withdrawals removed)\n            const profitBalance = parseFloat(agent.totalProfit || \'0\');'
);

content = content.replace(
  /totalWithdrawals: withdrawnTotal,/g,
  '// totalWithdrawals removed'
);

// 2. Remove /api/agent/withdrawals GET endpoint
console.log('2. Removing GET /api/agent/withdrawals endpoint...');
content = content.replace(
  /app\.get\("\/api\/agent\/withdrawals"[\s\S]*?}\s*\}\s*\);/,
  '// Withdrawal GET endpoint removed'
);

// 3. Remove /api/agent/withdrawals POST endpoint
console.log('3. Removing POST /api/agent/withdrawals endpoint...');
content = content.replace(
  /app\.post\("\/api\/agent\/withdrawals"[\s\S]*?}\s*\}\s*\);/,
  '// Withdrawal POST endpoint removed'
);

// 4. Remove /api/admin/withdrawals endpoint
console.log('4. Removing /api/admin/withdrawals endpoint...');
content = content.replace(
  /app\.get\("\/api\/admin\/withdrawals"[\s\S]*?}\s*\}\s*\);/,
  '// Admin withdrawals endpoint removed'
);

// 5. Remove /api/agent/wallet endpoint (also uses withdrawals)
console.log('5. Removing /api/agent/wallet endpoint...');
content = content.replace(
  /app\.get\("\/api\/agent\/wallet"[\s\S]*?}\s*\}\s*\);/,
  '// Agent wallet endpoint removed'
);

// 6. Remove withdrawal-related imports
console.log('6. Cleaning up imports...');
content = content.replace(
  /withdrawalRequestSchema,\s*/g,
  ''
);
content = content.replace(
  /WithdrawalStatus,\s*/g,
  ''
);

fs.writeFileSync(routesPath, content, 'utf8');

console.log('\n✅ Withdrawal system removed from routes.ts');
console.log('\n📝 Summary of changes:');
console.log('   - Removed withdrawal calculations from /api/profile');
console.log('   - Removed GET /api/agent/withdrawals');
console.log('   - Removed POST /api/agent/withdrawals');
console.log('   - Removed /api/admin/withdrawals');
console.log('   - Removed /api/agent/wallet');
console.log('   - Cleaned up imports');
console.log('\n🔄 Next: Restart server with: npm run dev');
