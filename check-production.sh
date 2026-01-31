#!/bin/bash
# Quick startup test for production deployment

echo "🚀 Production Readiness Check"
echo "================================"

# Check Node version
echo "✓ Node version:"
node --version

# Check npm version
echo "✓ npm version:"
npm --version

# Check if dist exists
if [ -d "dist" ]; then
  echo "✓ dist/ directory exists"
else
  echo "✗ dist/ directory NOT found"
  exit 1
fi

# Check if server build exists
if [ -f "dist/server/index.js" ]; then
  echo "✓ Server build (dist/server/index.js) exists"
else
  echo "✗ Server build NOT found"
  exit 1
fi

# Check if frontend build exists
if [ -d "dist/public" ]; then
  echo "✓ Frontend build (dist/public) exists"
  echo "  - Files: $(find dist/public -type f | wc -l)"
  echo "  - Size: $(du -sh dist/public | cut -f1)"
else
  echo "✗ Frontend build NOT found"
  exit 1
fi

# Check syntax
echo ""
echo "Checking syntax..."
if node -c dist/server/index.js 2>/dev/null; then
  echo "✓ Server code syntax valid"
else
  echo "✗ Server code has syntax errors"
  exit 1
fi

# Check required env variables
echo ""
echo "Checking environment variables..."
required_vars=("DATABASE_URL" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠ $var not set (required for production)"
  else
    echo "✓ $var is set"
  fi
done

echo ""
echo "✅ Production readiness check PASSED"
echo ""
echo "Next steps:"
echo "1. Copy dist/ and package.json to Hostinger"
echo "2. Set environment variables on Hostinger"
echo "3. Run: npm install --production"
echo "4. Run: node dist/server/index.js"
echo "5. Configure reverse proxy if behind Nginx/Apache"
