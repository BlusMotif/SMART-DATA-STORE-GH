const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing /api/agent/withdrawals endpoint...\n');

const routesPath = path.join(__dirname, 'src', 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// The exact code to replace
const oldCode = `        // Validate user has sufficient profit wallet balance
        const profitWallet = await storage.getProfitWallet(dbUser.id);
        if (!profitWallet) {
          return res.status(400).json({ error: "Profit wallet not found" });
        }
        const availableBalance = parseFloat(profitWallet.availableBalance);`;

const newCode = `        
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

if (content.includes('const profitWallet = await storage.getProfitWallet(dbUser.id);')) {
  content = content.replace(oldCode, newCode);
  console.log('✅ Replaced profitWallet code with calculation logic');
  
  // Also update the error message
  content = content.replace(
    'error: "Insufficient profit balance"',
    'error: "Insufficient profit balance"'
  );
  
  fs.writeFileSync(routesPath, content, 'utf8');
  console.log('✅ File saved successfully!\n');
  console.log('📝 Changes:');
  console.log('   - Removed getProfitWallet() dependency');
  console.log('   - Calculate balance from agent.totalProfit - withdrawals');
  console.log('   - Added validation logging\n');
  console.log('🔄 Next: Restart server with: npm run dev');
} else {
  console.log('⚠️  profitWallet code not found - may already be fixed');
}
