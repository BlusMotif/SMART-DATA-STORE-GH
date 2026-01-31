#!/usr/bin/env node

// Entry point for Hostinger that builds and runs the server
import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('Building TypeScript server...');
try {
  // Build the TypeScript code
  execSync('npm run build:server', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Check if dist exists
if (!existsSync('./dist/server/index.js')) {
  console.error('Compiled server file not found after build');
  process.exit(1);
}

// Import and run the compiled server
console.log('Starting server...');
import('./dist/server/index.js');