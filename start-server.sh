#!/bin/bash

# ============================================
# Hostinger Business Plan - Startup Script
# ============================================
# This script starts the Node.js server on Hostinger
# Run: ./start-server.sh
# 
# For Hostinger, typically you set in hPanel:
#   Entry Point: index.js
#   Start Command: npm start
# ============================================

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Resellers Hub - Server Startup"
echo "============================================"
echo ""
echo "📍 Working Directory: $(pwd)"
echo "📦 Node version: $(node -v 2>/dev/null || echo 'Not found')"
echo "📦 NPM version: $(npm -v 2>/dev/null || echo 'Not found')"
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed or not in PATH"
    exit 1
fi

# Check for required files
check_file() {
    if [ ! -f "$1" ]; then
        echo "❌ ERROR: $1 not found"
        echo "   Run: npm run build"
        exit 1
    fi
    echo "✅ Found: $1"
}

echo "Checking required files..."
check_file "index.js"
check_file "dist/server/index.js"
check_file "dist/public/index.html"

# Check for environment files
echo ""
echo "Checking environment configuration..."
if [ -f ".env.production" ]; then
    echo "✅ Found: .env.production"
elif [ -f ".env" ]; then
    echo "✅ Found: .env"
else
    echo "⚠️  No .env file found"
    echo "   Environment variables should be set in Hostinger hPanel"
fi

# Export production mode
export NODE_ENV=production

echo ""
echo "============================================"
echo "  Starting Server..."
echo "============================================"

# Check if running in background mode
if [ "$1" = "--daemon" ] || [ "$1" = "-d" ]; then
    # Kill any existing node process on the configured port
    if [ -n "$PORT" ]; then
        echo "Stopping any existing process on port $PORT..."
        fuser -k "$PORT/tcp" 2>/dev/null || true
    fi
    
    # Start server with nohup (background process)
    echo "Starting server in background mode..."
    nohup node index.js > server.log 2>&1 &
    SERVER_PID=$!
    
    sleep 3
    
    # Check if process is running
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "✅ Server started successfully! PID: $SERVER_PID"
        echo "📄 Log file: $(pwd)/server.log"
        echo ""
        echo "To view logs: tail -f server.log"
        echo "To stop: kill $SERVER_PID"
    else
        echo "❌ Failed to start server"
        echo "Check logs: cat server.log"
        exit 1
    fi
else
    # Foreground mode (default for Hostinger)
    exec node index.js
fi
