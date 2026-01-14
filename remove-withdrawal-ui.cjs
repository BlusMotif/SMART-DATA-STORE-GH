const fs = require('fs');
const path = require('path');

console.log('🗑️  Removing withdrawal UI components...\n');

// 1. Delete withdrawal pages
console.log('1. Deleting withdrawal pages...');
const agentWithdrawalsPath = path.join(__dirname, 'client', 'src', 'pages', 'agent', 'withdrawals.tsx');
const adminWithdrawalsPath = path.join(__dirname, 'client', 'src', 'pages', 'admin', 'withdrawals.tsx');

if (fs.existsSync(agentWithdrawalsPath)) {
  fs.unlinkSync(agentWithdrawalsPath);
  console.log('   ✓ Deleted client/src/pages/agent/withdrawals.tsx');
} else {
  console.log('   ⚠ client/src/pages/agent/withdrawals.tsx not found');
}

if (fs.existsSync(adminWithdrawalsPath)) {
  fs.unlinkSync(adminWithdrawalsPath);
  console.log('   ✓ Deleted client/src/pages/admin/withdrawals.tsx');
} else {
  console.log('   ⚠ client/src/pages/admin/withdrawals.tsx not found');
}

// 2. Update agent sidebar to remove withdrawal link
console.log('\n2. Updating agent sidebar...');
const sidebarPath = path.join(__dirname, 'client', 'src', 'components', 'layout', 'agent-sidebar.tsx');
if (fs.existsSync(sidebarPath)) {
  let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  
  // Remove withdrawal import
  sidebarContent = sidebarContent.replace(/import.*Wallet.*from.*lucide-react.*;\n?/g, '');
  
  // Remove withdrawal navigation item
  sidebarContent = sidebarContent.replace(
    /\{[\s\S]*?href: "\/agent\/withdrawals"[\s\S]*?\},?\n?/g,
    ''
  );
  
  fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
  console.log('   ✓ Updated agent-sidebar.tsx');
} else {
  console.log('   ⚠ agent-sidebar.tsx not found');
}

// 3. Update agent sidebar v2
console.log('\n3. Updating agent sidebar v2...');
const sidebarV2Path = path.join(__dirname, 'client', 'src', 'components', 'layout', 'agent-sidebar-v2.tsx');
if (fs.existsSync(sidebarV2Path)) {
  let sidebarContent = fs.readFileSync(sidebarV2Path, 'utf8');
  
  // Remove withdrawal import
  sidebarContent = sidebarContent.replace(/import.*Wallet.*from.*lucide-react.*;\n?/g, '');
  
  // Remove withdrawal navigation item
  sidebarContent = sidebarContent.replace(
    /\{[\s\S]*?href: "\/agent\/withdrawals"[\s\S]*?\},?\n?/g,
    ''
  );
  
  fs.writeFileSync(sidebarV2Path, sidebarContent, 'utf8');
  console.log('   ✓ Updated agent-sidebar-v2.tsx');
} else {
  console.log('   ⚠ agent-sidebar-v2.tsx not found');
}

// 4. Update App.tsx to remove withdrawal routes
console.log('\n4. Updating App.tsx routes...');
const appPath = path.join(__dirname, 'client', 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  
  // Remove withdrawal route imports
  appContent = appContent.replace(/import.*Withdrawals.*from.*pages\/agent\/withdrawals.*;\n?/g, '');
  appContent = appContent.replace(/import.*AdminWithdrawals.*from.*pages\/admin\/withdrawals.*;\n?/g, '');
  
  // Remove withdrawal routes
  appContent = appContent.replace(
    /<Route path="\/agent\/withdrawals".*\/>/g,
    ''
  );
  appContent = appContent.replace(
    /<Route path="\/admin\/withdrawals".*\/>/g,
    ''
  );
  
  fs.writeFileSync(appPath, appContent, 'utf8');
  console.log('   ✓ Updated App.tsx');
} else {
  console.log('   ⚠ App.tsx not found');
}

console.log('\n✅ Withdrawal UI components removed successfully!');
console.log('\n📝 Summary:');
console.log('   - Deleted agent withdrawals page');
console.log('   - Deleted admin withdrawals page');
console.log('   - Updated agent sidebars');
console.log('   - Updated App.tsx routes');
console.log('\n🔄 Next: Restart the development server');
