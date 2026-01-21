#!/usr/bin/env node

/**
 * Cron job script to update order statuses from SkyTech API
 * Run this script periodically (e.g., every 5-10 minutes) using cron
 *
 * Example cron job:
 * *\/5 * * * * cd /path/to/project && node script/update-order-statuses.js
 */

const API_BASE_URL = process.env.FRONTEND_URL || 'https://resellershubprogh.com';

async function updateOrderStatuses() {
  try {
    console.log(`[${new Date().toISOString()}] Starting order status update...`);

    const response = await fetch(`${API_BASE_URL}/api/cron/update-order-statuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`[${new Date().toISOString()}] ✅ Order status update completed: ${result.message}`);
    } else {
      console.error(`[${new Date().toISOString()}] ❌ Order status update failed:`, result.error);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error updating order statuses:`, error.message);
  }
}

async function cleanupFailedOrders() {
  try {
    console.log(`[${new Date().toISOString()}] Starting failed order cleanup...`);

    const response = await fetch(`${API_BASE_URL}/api/cron/cleanup-failed-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`[${new Date().toISOString()}] ✅ Failed order cleanup completed: ${result.message}`);
    } else {
      console.error(`[${new Date().toISOString()}] ❌ Failed order cleanup failed:`, result.error);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error cleaning up failed orders:`, error.message);
  }
}

// Run both update and cleanup
async function main() {
  await updateOrderStatuses();
  await cleanupFailedOrders();
  console.log(`[${new Date().toISOString()}] Cron job completed.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(`[${new Date().toISOString()}] Fatal error:`, error);
  process.exit(1);
});