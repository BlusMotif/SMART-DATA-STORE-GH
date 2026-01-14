const fs = require('fs');
const path = require('path');

console.log('🔧 Applying fix for /api/profile and /api/agent/withdrawals endpoints...\n');

const routesPath = path.join(__dirname, 'src', 'server', 'routes.ts');

// Read the file
let content = fs.readFileSync(routesPath, 'utf8');

// Fix 1: Replace profitWallet validation in /api/agent/withdrawals
const oldWithdrawalCode = `      // Validate user has sufficient profit wallet balance
      const profitWallet = await storage.getProfitWallet(dbUser.id);
      if (!profitWallet) {
        return res.status(400).json({ error: "Profit wallet not found" });
      }
      const availableBalance = parseFloat(profitWallet.availableBalance);`;

const newWithdrawalCode = `      
      // Calculate available balance from agent's total profit minus withdrawals
      const withdrawals = await storage.getWithdrawals({ userId: dbUser.id });
      const withdrawnTotal = withdrawals
        .filter(w => w.status === 'approved' || w.status === 'paid')
        .reduce((s, w) => s + parseFloat((w.amount as any) || 0), 0);
      
      const totalProfit = parseFloat(agent.totalProfit || '0');
      const availableBalance = Math.max(0, totalProfit - withdrawnTotal);
      
      console.log("Withdrawal validation:", {
        totalProfit,
        withdrawnTotal,
        availableBalance,
        requestedAmount: data.amount
      });
      `;

if (content.includes(oldWithdrawalCode)) {
  content = content.replace(oldWithdrawalCode, newWithdrawalCode);
  console.log('✅ Fixed /api/agent/withdrawals endpoint');
} else {
  console.log('⚠️  Could not find exact match for withdrawal code - may already be fixed');
}

// Fix 2: Update error message
content = content.replace(
  'error: "Insufficient profit wallet balance"',
  'error: "Insufficient profit balance"'
);

// Fix 3: Add better error logging to catch blocks
content = content.replace(
  /catch \(error: any\) \{\s+console\.error\("Withdrawal error:", error\);\s+res\.status\(400\)\.json\(\{ error: error\.message \|\| "Withdrawal failed" \}\);/g,
  `catch (error: any) {
      console.error("Withdrawal error:", error);
      console.error("Error stack:", error.stack);
      res.status(400).json({ error: error.message || "Withdrawal failed", details: process.env.NODE_ENV === 'development' ? error.stack : undefined });`
);

content = content.replace(
  /catch \(error: any\) \{\s+console\.error\("Profile error:", error\);\s+console\.error\("Error stack:", error\.stack\);\s+res\.status\(500\)\.json\(\{ error: "Failed to load profile" \}\);/g,
  `catch (error: any) {
      console.error("Profile error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Failed to load profile", details: process.env.NODE_ENV === 'development' ? error.message : undefined });`
);

// Write the fixed content back
fs.writeFileSync(routesPath, content, 'utf8');

console.log('\n✅ Fix applied successfully!');
console.log('\n📝 Changes made:');
console.log('   1. Removed profitWallet dependency in /api/agent/withdrawals');
console.log('   2. Calculate balance from agent.totalProfit - withdrawals');
console.log('   3. Updated error messages');
console.log('   4. Added better error logging');
console.log('\n🔄 Next steps:');
console.log('   1. Restart the server: npm run dev');
console.log('   2. Test the /api/profile endpoint');
console.log('   3. Test withdrawal creation');
