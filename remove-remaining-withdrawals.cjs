const fs = require('fs');
const path = require('path');

console.log('🗑️  Removing remaining withdrawal endpoints...\n');

const routesPath = path.join(__dirname, 'src', 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// Remove admin withdrawal management endpoints
console.log('Removing admin withdrawal management endpoints...');

// Remove PATCH /api/admin/withdrawals/:id
content = content.replace(
  /app\.patch\("\/api\/admin\/withdrawals\/:id"[\s\S]*?}\s*\}\s*\);/,
  '// Admin withdrawal PATCH endpoint removed'
);

// Remove POST /api/admin/withdrawals/:id/approve
content = content.replace(
  /app\.post\("\/api\/admin\/withdrawals\/:id\/approve"[\s\S]*?}\s*\}\s*\);/,
  '// Admin withdrawal approve endpoint removed'
);

// Remove POST /api/admin/withdrawals/:id/reject
content = content.replace(
  /app\.post\("\/api\/admin\/withdrawals\/:id\/reject"[\s\S]*?}\s*\}\s*\);/,
  '// Admin withdrawal reject endpoint removed'
);

// Remove POST /api/admin/withdrawals/:id/mark_paid
content = content.replace(
  /app\.post\("\/api\/admin\/withdrawals\/:id\/mark_paid"[\s\S]*?}\s*\}\s*\);/,
  '// Admin withdrawal mark_paid endpoint removed'
);

fs.writeFileSync(routesPath, content, 'utf8');

console.log('✅ All remaining withdrawal endpoints removed!');
console.log('\n📝 Removed:');
console.log('   - PATCH /api/admin/withdrawals/:id');
console.log('   - POST /api/admin/withdrawals/:id/approve');
console.log('   - POST /api/admin/withdrawals/:id/reject');
console.log('   - POST /api/admin/withdrawals/:id/mark_paid');
