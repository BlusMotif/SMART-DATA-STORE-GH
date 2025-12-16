# Smart Data Store

A full-stack web application for managing data bundles and result checkers, built with React, TypeScript, Express, and PostgreSQL.

## Features

- User authentication and authorization
- Data bundle management
- Result checker inventory
- Agent storefront system
- Payment processing with Paystack
- Admin dashboard
- PWA support

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- React Query for state management
- Wouter for routing

### Backend
- Express.js with TypeScript
- PostgreSQL database (via Supabase)
- Drizzle ORM for type-safe queries
- Session-based authentication
- bcryptjs for password hashing

### Database
- PostgreSQL
- Drizzle Kit for migrations

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   SUPABASE_URL=https://[project-ref].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SESSION_SECRET=your_session_secret
   PAYSTACK_SECRET_KEY=your_paystack_secret_key
   PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Project Structure

```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and API client
├── server/                 # Backend Express server
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── db.ts               # Database connection
├── shared/                 # Shared types and schemas
└── migrations/             # Database migrations
```

## Deployment

### Render Deployment

1. **Connect to GitHub:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository: `https://github.com/BlusMotif/SMART-DATA-STORE-GH.git`

2. **Configure Build Settings:**
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

3. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://[your-supabase-connection-string]
   SUPABASE_URL=https://[your-project-ref].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   SESSION_SECRET=[generate-a-secure-random-string]
   PAYSTACK_SECRET_KEY=[your-paystack-secret-key]
   PAYSTACK_PUBLIC_KEY=[your-paystack-public-key]
   NODE_ENV=production
   ```

4. **Database Setup:**
   - Ensure your Supabase database is set up and accessible
   - Run database migrations if needed: `npm run db:push`

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be available at the generated URL

### Alternative Platforms

The application can also be deployed to:
- Vercel + Railway/PlanetScale
- Heroku
- DigitalOcean App Platform

## License

MIT