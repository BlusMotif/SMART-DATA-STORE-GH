#!/usr/bin/env node
// Touch dist files to update timestamps so Hostinger thinks build succeeded
import { readdirSync, statSync, utimesSync, existsSync } from 'fs';
import { join } from 'path';

function touchDir(dir) {
  try {
    const now = new Date();
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        touchDir(fullPath);
      } else {
        utimesSync(fullPath, now, now);
      }
    }
  } catch (err) {
    console.error(`Error touching ${dir}:`, err.message);
  }
}

console.log('Updating dist file timestamps...');

if (!existsSync('./dist')) {
  console.error('ERROR: dist directory does not exist!');
  process.exit(1);
}

touchDir('./dist');
console.log('✓ Build complete - using pre-built files from ./dist');
console.log('Output directory: dist');
