#!/usr/bin/env node

// Entry point for Hostinger that starts the pre-built server
import('./dist/server/index.js').catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});