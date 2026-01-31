#!/bin/bash

# Hostinger Resellers Hub - Startup Script
# Run this to start the Node.js server

cd "$(dirname "$0")/public_html" || exit 1

echo "Starting Resellers Hub Server..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found in public_html/"
    echo "Create .env file with DATABASE_URL and other environment variables"
    exit 1
fi

# Check if dist/server/index.js exists
if [ ! -f dist/server/index.js ]; then
    echo "❌ ERROR: dist/server/index.js not found"
    echo "Run: npm run build"
    exit 1
fi

# Kill any existing node process on port 3000
pkill -f "node dist/server/index.js" 2>/dev/null

# Start server with nohup (background process)
echo "Starting server in background..."
nohup node dist/server/index.js > server.log 2>&1 &

sleep 2

# Check if process is running
if pgrep -f "node dist/server/index.js" > /dev/null; then
    echo "✅ Server started successfully!"
    echo "Log file: public_html/server.log"
    echo "Check logs: tail -f public_html/server.log"
else
    echo "❌ Failed to start server"
    echo "Check error log: cat public_html/server.log"
    exit 1
fi
