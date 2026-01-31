#!/bin/bash
# Hostinger deployment script for GitHub Actions

# Exit on error
set -e

echo "Starting deployment to Hostinger Business Plan..."

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build frontend
echo "Building frontend..."
cd client
npm install
npm run build
cd ..

# Ensure dist directory exists
if [ ! -d "dist" ]; then
  mkdir -p dist
fi

# Copy frontend build to dist/public
if [ -d "client/dist" ]; then
  rm -rf dist/public
  cp -r client/dist dist/public
fi

# Build server
echo "Building server..."
npm run build

# Verify build
if [ ! -f "dist/server/index.js" ]; then
  echo "Build failed - dist/server/index.js not found"
  exit 1
fi

if [ ! -d "dist/public" ]; then
  echo "Build failed - dist/public not found"
  exit 1
fi

echo "Build completed successfully"
echo "dist/server/index.js size: $(wc -c < dist/server/index.js) bytes"
echo "dist/public files: $(find dist/public -type f | wc -l) files"

# Test that build is valid JavaScript
node -c dist/server/index.js && echo "✓ Server code syntax valid"

echo "Deployment preparation completed successfully"
