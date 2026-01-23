#!/usr/bin/env node
import { existsSync } from 'fs';
import { execSync } from 'child_process';

// Check if dist/server directory already exists
if (existsSync('./dist/server')) {
  console.log('✓ Server already built, skipping TypeScript compilation...');
  process.exit(0);
}

// If not, compile the server
console.log('Building server...');
try {
  execSync('npx tsc --project . --skipLibCheck', { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
