# Smartdatastoregh - Deployment Guide

## 🚀 Deploy to Render (Full-Stack) + Supabase Database

### Prerequisites

1. **Supabase Account:** Create a free account at [supabase.com](https://supabase.com)
2. **Render Account:** Create a free account at [render.com](https://render.com)

### Database Setup (Supabase)

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and region
   - Set project name: `smartdatastoregh-db`
   - Set database password (save this securely)

2. **Get your database connection details:**
   - Go to Project Settings → Database
   - Copy the "Connection pooling" connection string
   - It should look like: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

3. **Run database migrations:**
   - In your Supabase dashboard, go to the SQL Editor
   - Copy and run the migration SQL from your `drizzle/` folder
   - Or use the Drizzle CLI if you have it set up locally

### Full-Stack Deployment (Render)

1. **Create a new Web Service on Render:**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository: `BlusMotif/SMART-DATA-STORE-GH`

2. **Configure Build Settings:**
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

3. **Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   SESSION_SECRET=your_secure_session_secret_here_generate_a_random_string
   PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
   PORT=10000
   ```

4. **Deploy:**
   - Render will automatically build and deploy your full-stack application
   - Your app will be available at: `https://your-service-name.onrender.com`
   - Both frontend and backend will be served from the same domain

### Post-Deployment Configuration

1. **Update your Supabase settings:**
   - In Supabase Dashboard → Authentication → Settings
   - Configure your site URL: `https://your-render-service.onrender.com`
   - Add redirect URLs if needed for OAuth

2. **Test your deployment:**
   - Visit your Render URL
   - Try registering a new user
   - Test the login functionality
   - Verify database connections are working

### Troubleshooting

- **Database Connection Issues:** Double-check your `DATABASE_URL` in Render environment variables
- **Build Failures:** Ensure all dependencies are listed in `package.json`
- **Static Files Not Loading:** The build process bundles everything together automatically
- **Session Issues:** Make sure `SESSION_SECRET` is set and secure

### Optional: Custom Domain

1. **On Render:**
   - Go to your service settings
   - Add your custom domain
   - Update DNS records as instructed

2. **Update Supabase:**
   - Add your custom domain to the site URL in Authentication settings

### Monitoring & Logs

- **Render Logs:** View real-time logs in your Render dashboard
- **Supabase Logs:** Monitor database queries and performance in Supabase dashboard
- **Error Tracking:** Consider adding error tracking services like Sentry for production monitoring

### Database Setup

1. **Create Supabase Database:**
   - Follow the steps in the "Database Setup (Supabase)" section above
   - Get your connection pooling URL

2. **Run Database Migrations:**
   - Use the GitHub Actions workflow created in `.github/workflows/migrate.yml`
   - Or run locally: `npx drizzle-kit push`

3. **Seed Initial Data (Optional):**
   ```bash
   npx tsx script/seed-products.ts
   ```

## 🔧 Production Configuration

### Environment Variables Required:
- `DATABASE_URL`: Supabase connection pooling URL
- `SESSION_SECRET`: Secure random string for sessions
- `PAYSTACK_SECRET_KEY`: Your Paystack secret key
- `NODE_ENV`: Set to `production`
- `PORT`: Set to `10000` (Render's default)

### Environment File:
- Copy `.env.example` to `.env` for local development
- Set the environment variables in Render dashboard for production

### Build Process:
- `npm run build`: Builds both client and server
- `npm start`: Runs the production server
- Static files are served from the built client automatically

## 🌐 Domain Configuration

1. **Custom Domain (Optional):**
   - Add your domain in Render service settings
   - Update DNS records as instructed by Render

2. **Update Supabase Settings:**
   - Add your custom domain to the site URL in Supabase Authentication settings

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