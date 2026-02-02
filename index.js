#!/usr/bin/env node

// Start the pre-built server
import('./dist/server/index.js').catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});