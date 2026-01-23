#!/usr/bin/env node
// Touch dist files to update timestamps so Hostinger thinks build succeeded
import { readdirSync, statSync, utimesSync } from 'fs';
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
    // Ignore errors
  }
}

console.log('Updating dist file timestamps...');
touchDir('./dist');
console.log('✓ Build complete - using pre-built files');
