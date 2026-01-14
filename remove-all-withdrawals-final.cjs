const fs = require('fs');
const path = require('path');

console.log('🗑️  Removing ALL remaining withdrawal code...\n');

const routesPath = path.join(__dirname, 'src', 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// Remove user withdrawal endpoints
console.log('1. Removing user withdrawal endpoints...');

// Remove POST /api/user/withdrawals
content = content.replace(
  /\/\/ Request withdrawal[\s\S]*?app\.post\("\/api\/user\/withdrawals"[\s\S]*?}\s*\}\s*\);/,
  '// User withdrawal POST endpoint removed'
);

// Remove GET /api/user/withdrawals
content = content.replace(
  /\/\/ Get user withdrawals[\s\S]*?app\.get\("\/api\/user\/withdrawals"[\s\S]*?}\s*\}\s*\);/,
  '// User withdrawal GET endpoint removed'
);

// Remove withdrawal-related comments and sections
console.log('2. Cleaning up withdrawal comments...');
content = content.replace(
  /\/\/ PROFIT WALLET & WITHDRAWAL ROUTES[\s\S]*?(?=\/\/ |app\.)/,
  ''
);

content = content.replace(
  /\/\/ Admin routes for withdrawal management[\s\S]*?(?=\/\/ |app\.)/,
  ''
);

// Remove totalWithdrawals from profile response
console.log('3. Removing totalWithdrawals from responses...');
content = content.replace(
  /totalWithdrawals: 0,/g,
  ''
);

fs.writeFileSync(routesPath, content, 'utf8');

console.log('\n✅ All withdrawal code removed!');
console.log('\n📝 Removed:');
console.log('   - POST /api/user/withdrawals');
console.log('   - GET /api/user/withdrawals');
console.log('   - All withdrawal comments and sections');
console.log('   - totalWithdrawals from responses');
console.log('\n🔄 Ready to restart server!');
