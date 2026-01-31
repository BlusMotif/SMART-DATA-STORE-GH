# Server Startup Guide - Hostinger Business Plan

## Quick Start

### Local Testing (Windows)
```powershell
cd C:\Users\LENOVO\Desktop\SMART-DATA-STORE-GH
.\start-server.bat
```

### On Hostinger

#### Step 1: Create .env file
1. Go to Hostinger File Manager
2. Navigate to `public_html/`
3. Create file: `.env`
4. Add your environment variables (see `.env.production` for template)

**Required variables:**
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=your-random-secret
NODE_ENV=production
```

#### Step 2: Upload startup script
1. Upload `start-server.sh` to `public_html/`
2. Make it executable:
   ```
   chmod +x start-server.sh
   ```

#### Step 3: Run the script
Via Terminal (if available in Hostinger):
```bash
cd public_html
./start-server.sh
```

Or use Cron job to run it periodically:
```
*/5 * * * * cd /home/u519881843/public_html && ./start-server.sh
```

---

## Troubleshooting

### Server won't start
```bash
cd public_html
cat server.log    # Check error log
```

### Port already in use
```bash
lsof -i :3000          # Find process using port
kill -9 <PID>          # Kill the process
./start-server.sh      # Try again
```

### .env file not found
Make sure `.env` exists in `public_html/` with all required variables set.

### Database connection failed
- Check `DATABASE_URL` format
- Verify Supabase allows Hostinger IP
- Test connection string locally first

---

## PM2 Alternative (Better)

If Hostinger allows global npm packages:

```bash
npm install -g pm2
cd public_html
pm2 start dist/server/index.js --name "resellershub"
pm2 startup
pm2 save
```

Then server auto-restarts on crash or reboot.

---

## Logs

Check server status:
```bash
cd public_html
tail -f server.log    # Real-time log
pm2 logs              # If using PM2
```

---

## Done!

Server should be running at: `https://u519881843.resellershubprogh.com`
