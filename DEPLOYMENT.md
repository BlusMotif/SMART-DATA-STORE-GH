# Smartdatastoregh - Deployment Guide

## 🚀 Deploy to Render + Vercel

### Backend Deployment (Render)

1. **Create a new Web Service on Render:**
   - Go to https://render.com
   - Click "New" → "Web Service"
   - Connect your GitHub repository: `BlusMotif/SMART-DATA-STORE-GH`

2. **Configure Build Settings:**
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

3. **Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://your_database_url_here
   SESSION_SECRET=your_secure_session_secret_here
   PORT=10000
   ```

4. **Deploy:**
   - Render will automatically build and deploy your application
   - Your API will be available at: `https://your-service-name.onrender.com`

### Frontend Deployment (Vercel)

1. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Environment Variables:**
   ```
   VITE_API_URL=https://your-render-service.onrender.com
   ```

4. **Deploy:**
   - Vercel will build and deploy your React app
   - Your frontend will be available at: `https://your-project.vercel.app`

### Database Setup

1. **Create PostgreSQL Database:**
   - Use Render's PostgreSQL service or Supabase
   - Get the connection string

2. **Run Database Migrations:**
   - Use the GitHub Actions workflow created in `.github/workflows/migrate.yml`
   - Or run locally: `npx drizzle-kit push`

3. **Seed Initial Data (Optional):**
   ```bash
   npx tsx script/seed-products.ts
   ```

## 🔧 Production Configuration

### Environment Variables Required:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure random string for sessions
- `NODE_ENV`: Set to `production`
- `PORT`: Set to `10000` (Render's default)

### Build Process:
- `npm run build`: Builds both client and server
- `npm start`: Runs the production server
- Static files are served from the built client

## 🌐 Domain Configuration

1. **Custom Domain (Optional):**
   - Add your domain in Vercel for the frontend
   - Add your domain in Render for the API

2. **CORS Configuration:**
   - The backend is configured to work with the frontend
   - Update CORS origins if needed in `server/index.ts`

## 📊 Monitoring & Logs

- **Render Dashboard:** View logs and metrics for the backend
- **Vercel Dashboard:** View logs and analytics for the frontend
- **Database:** Monitor queries and performance

## 🚨 Troubleshooting

### Common Issues:
1. **Build Failures:** Check that all dependencies are in `package.json`
2. **Database Connection:** Ensure `DATABASE_URL` is correct
3. **CORS Issues:** Verify API URLs are correctly configured
4. **Static Assets:** Ensure Vite build outputs to correct directory

### Debug Commands:
```bash
# Test build locally
npm run build

# Test production server locally
npm start

# Check database connection
npx drizzle-kit push
```

## 🎯 Deployment Checklist

- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] Database created and migrations run
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] API URLs configured correctly
- [ ] Custom domain (optional)
- [ ] SSL certificates (automatic)
- [ ] Testing completed

---

**Your Smartdatastoregh application will be live and ready for users!** 🎉