#!/usr/bin/env node

// Entry point for Hostinger with startup checks
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting ResellersHub Pro GH...');
console.log('📁 Working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Check if server build exists
const serverPath = resolve(__dirname, 'dist/server/index.js');
console.log('🔍 Looking for server at:', serverPath);

if (!existsSync(serverPath)) {
  console.error('❌ Server build not found at:', serverPath);
  console.error('💡 Run: npm run build:server');
  process.exit(1);
}

console.log('✅ Server build found, starting...');

// Check critical environment variables
const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET', 'SUPABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
  console.warn('⚠️  Server may not function correctly');
}

// Start the server
import('./dist/server/index.js')
  .then(() => {
    console.log('✅ Server imported successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });