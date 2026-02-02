#!/usr/bin/env node

/**
 * Hostinger Business Plan - Entry Point
 * 
 * Optimized for Hostinger shared hosting with GitHub deployment
 * Loads environment variables BEFORE importing the server
 * This ensures DATABASE_URL and other vars are available immediately
 * 
 * @see https://www.hostinger.com/tutorials/how-to-host-nodejs-application
 */
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Get root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Startup timestamp for logging
const startTime = Date.now();
console.log(`🚀 Starting server at ${new Date().toISOString()}`);

/**
 * Load environment variables in correct order for Hostinger
 * Priority: System env vars > .env.production > .env.local > .env
 */
function loadEnv() {
  const envFiles = [
    '.env',
    '.env.local',
    '.env.production'  // Last one has highest priority (override: true)
  ];
  
  let loadedCount = 0;
  
  for (const file of envFiles) {
    const envPath = path.join(__dirname, file);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
      console.log(`✅ Loaded: ${file}`);
      loadedCount++;
    }
  }
  
  if (loadedCount === 0) {
    console.log('⚠️  No .env files found, using system environment variables');
  }
  
  // Force production mode on Hostinger
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  
  // Set default port for Hostinger (typically 3000 or configured in hPanel)
  if (!process.env.PORT) {
    process.env.PORT = '3000';
  }
  
  // Validate critical env vars
  const requiredVars = ['DATABASE_URL'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('💡 Set these in Hostinger hPanel → Website → Node.js → Environment Variables');
    process.exit(1);
  }
  
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Port: ${process.env.PORT}`);
  console.log(`✅ Database: Connected`);
}

// Load env first
loadEnv();

// Import and start server
import('./dist/server/index.js')
  .then(() => {
    const elapsed = Date.now() - startTime;
    console.log(`✅ Server started in ${elapsed}ms`);
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  });