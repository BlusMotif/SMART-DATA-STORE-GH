@echo off
REM Hostinger Resellers Hub - Windows Startup Script
REM Use this to start the Node.js server locally

cd /d "%~dp0"

echo Starting Resellers Hub Server...
node --version
npm --version

REM Check if .env exists
if not exist "public_html\.env" (
    echo ERROR: .env file not found in public_html
    pause
    exit /b 1
)

REM Check if dist/server/index.js exists
if not exist "public_html\dist\server\index.js" (
    echo ERROR: dist/server/index.js not found
    pause
    exit /b 1
)

REM Start server
echo Starting server...
cd public_html
node dist/server/index.js

pause
