import { db } from './src/server/db.js';
import { agents } from './src/shared/schema.js';

async function checkAgents() {
  console.log('Checking agents in database...');
  try {
    const allAgents = await db.select().from(agents);
    console.log('Total agents:', allAgents.length);
    allAgents.forEach(agent => {
      console.log(`Agent: ${agent.businessName}, Slug: ${agent.storefrontSlug}, Approved: ${agent.isApproved}, PaymentPending: ${agent.paymentPending}`);
    });
  } catch (error) {
    console.error('Error checking agents:', error);
  }
}

checkAgents();