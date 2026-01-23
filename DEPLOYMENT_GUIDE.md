# 🚀 Hostinger Deployment Guide

## Prerequisites
- Node.js 18+ installed locally
- Hostinger hPanel access
- Git repository up to date

## Step-by-Step Deployment

### 1️⃣ Build Application Locally

```bash
npm run build
```

This will:
- Build client files → `dist/public/`
- Compile server TypeScript → `dist/`
- Generate all production assets

### 2️⃣ Upload Files to Hostinger

Upload these files/folders to `public_html/`:

**Required Files:**
```
public_html/
├── dist/
│   └── public/          # Client build (HTML, CSS, JS, assets)
├── app.js               # Server entry point
├── routes/              # API routes
├── controllers/         # Business logic
├── package.json         # Dependencies
├── package-lock.json    # Lock file
└── node_modules/        # (Install via hPanel or upload)
```

**Upload Methods:**
- **File Manager** (hPanel) - drag & drop
- **FTP/SFTP** - use FileZilla or similar
- **Git** - clone repository directly on server

### 3️⃣ Configure Node.js App in hPanel

**Navigation:**
`hPanel → Advanced → Node.js`

**Settings:**
- **App root:** `public_html`
- **Startup file:** `app.js`
- **Node version:** `18.x` (or latest LTS)
- **Application mode:** `Production`

**Environment Variables:**
Set in hPanel Node.js App settings:
```
NODE_ENV=production
DATABASE_URL=<your-database-url>
PAYSTACK_SECRET_KEY=<your-key>
SKYTECH_API_KEY=<your-key>
SKYTECH_API_SECRET=<your-secret>
SESSION_SECRET=<random-string>
```

### 4️⃣ Install Dependencies

In hPanel Terminal or SSH:
```bash
cd public_html
npm install --production
```

### 5️⃣ Start Application

- Click **"Start Application"** in hPanel Node.js section
- Monitor logs for any errors
- Test your domain: `https://yourdomain.com`

## 📋 Deployment Checklist

- [ ] Local build completed successfully
- [ ] All files uploaded to `public_html/`
- [ ] Node.js app configured in hPanel
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Application started
- [ ] Domain accessible
- [ ] Database connected
- [ ] API endpoints working

## 🔧 Post-Deployment

### Verify Application
```bash
# Check if app is running
curl https://yourdomain.com/api/health

# Check database connection
curl https://yourdomain.com/api/status
```

### Common Issues

**App won't start:**
- Check Node version (18+)
- Verify `app.js` path is correct
- Review error logs in hPanel

**Static files not loading:**
- Ensure `dist/public/` is in correct location
- Check file permissions (644 for files, 755 for folders)

**Database errors:**
- Verify `DATABASE_URL` environment variable
- Check database host/port accessibility
- Run migrations if needed

## 🔄 Update/Redeploy

1. Make changes locally
2. Commit and push to GitHub
3. Rebuild: `npm run build`
4. Upload only changed files
5. Restart app in hPanel

## 📞 Support

- **Hostinger:** hPanel → Support
- **App Logs:** hPanel → Node.js → View Logs
- **Repository:** [GitHub](https://github.com/BlusMotif/SMART-DATA-STORE-GH)

---

**Last Updated:** January 23, 2026
**Deployed By:** BlusMotif
