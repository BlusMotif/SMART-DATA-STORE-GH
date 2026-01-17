# resellershubprogh

A comprehensive full-stack web application for managing mobile data bundles, result checkers, and agent storefronts. Built with React, TypeScript, Express, PostgreSQL, and Supabase.

## 🌟 Overview

resellershubprogh is a multi-role platform that enables:
- **Users** to purchase data bundles and result checkers with instant delivery
- **Agents** to run their own storefronts and earn commissions
- **Admins** to manage products, approve agents, and monitor the entire system

---

## ✨ Key Features

### User Features
- ✅ Wallet System with instant top-up via Paystack
- ✅ Browse and purchase data bundles for all networks (MTN, Vodafone, AirtelTigo)
- ✅ Buy result checkers (WASSCE, BECE, NVTI)
- ✅ Real-time transaction history
- ✅ Support chat system
- ✅ Multiple payment methods (Wallet Balance, Paystack Card/Bank)
- ✅ PWA support (installable on mobile devices)

### Agent Features
- ✅ Custom storefront with unique URL (`/store/{storename}`)
- ✅ Agent registration with payment (GH₵50)
- ✅ Product catalog management
- ✅ Commission tracking and withdrawal system
- ✅ Real-time sales analytics dashboard
- ✅ Transaction management
- ✅ Business profile customization
- ✅ Secure session management

### Admin Features
- ✅ Agent approval workflow
- ✅ Product management (Data Bundles, Result Checkers)
- ✅ User management
- ✅ Withdrawal request approval
- ✅ Support chat management
- ✅ System-wide analytics and reporting
- ✅ Price and inventory control

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for ultra-fast builds and HMR
- **Tailwind CSS** for styling
- **shadcn/ui** component library (Radix UI primitives)
- **TanStack Query (React Query)** for server state management
- **Wouter** for lightweight routing
- **Recharts** for data visualization
- **PWA** with service worker for offline support

### Backend
- **Express.js** with TypeScript
- **Supabase** for authentication and database
- **PostgreSQL** for data persistence
- **Drizzle ORM** for type-safe database queries
- **bcryptjs** for password hashing
- **Paystack API** for payment processing

### Database
- **PostgreSQL** (via Supabase)
- **Drizzle Kit** for schema management and migrations

---

## 📁 Project Structure

```
Smartdatastoregh/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Header, Footer, Sidebars
│   │   │   ├── products/       # Product cards and badges
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   └── user/           # User-specific components
│   │   ├── pages/
│   │   │   ├── admin/          # Admin dashboard pages
│   │   │   ├── agent/          # Agent dashboard pages
│   │   │   ├── user/           # User dashboard pages
│   │   │   └── products/       # Product browsing pages
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # API client, utils, constants
│   └── public/                 # Static assets and PWA files
├── server/                     # Backend Express server
│   ├── routes.ts               # API route handlers
│   ├── storage.ts              # Database operations layer
│   ├── db.ts                   # Database connection
│   ├── paystack.ts             # Payment integration
│   ├── supabase.ts             # Supabase server client
│   └── index.ts                # Server entry point
├── shared/                     # Shared TypeScript schemas
│   └── schema.ts               # Drizzle schemas and types
├── migrations/                 # Database migrations
└── script/                     # Utility scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (20+ recommended)
- **npm** or **yarn**
- **Supabase account** (free tier works)
- **Paystack account** (for payments)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BlusMotif/SMART-DATA-STORE-GH.git
   cd Smartdatastoregh
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   
   # Supabase
   SUPABASE_URL=https://[project-ref].supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Session
   SESSION_SECRET=generate_a_secure_random_string_here
   
   # Paystack
   PAYSTACK_SECRET_KEY=sk_test_your_secret_key
   PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
   
   # Environment
   NODE_ENV=development
   PORT=10000
   ```

4. **Set up the database:**
   
   Run migrations in Supabase SQL Editor or use Drizzle:
   ```bash
   npm run db:push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `https://resellershubprogh.com`

---

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Production
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio

# Type Checking
npm run check            # Run TypeScript type checking
```

---

## 🔧 System Architecture

### Authentication Flow
1. **Supabase Auth** handles JWT tokens and session management
2. **Local Database** syncs user data automatically
3. **Middleware** validates tokens and enforces role-based access control
4. **Session Persistence** with secure token management

### Payment Processing
1. **Wallet System:**
   - Users top up via Paystack
   - Instant balance updates
   - Zero transaction fees for wallet payments

2. **Direct Paystack:**
   - Card payments
   - Bank transfers
   - Instant verification via webhooks

### Data Flow
```
Client (React) → API (Express) → Storage Layer → Drizzle ORM → PostgreSQL
                    ↓
               Supabase Auth (JWT validation)
                    ↓
             Paystack API (payments)
```

---

## 🔐 Security Features

### Implemented Security Measures
- ✅ **Input Validation:** Comprehensive validation on all API endpoints
- ✅ **Authentication:** JWT-based with Supabase
- ✅ **Authorization:** Role-based access control (User, Agent, Admin)
- ✅ **Password Security:** bcrypt hashing with 10 rounds
- ✅ **SQL Injection Protection:** Parameterized queries via Drizzle ORM
- ✅ **XSS Prevention:** Input sanitization and escaping
- ✅ **Security Headers:**
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
- ✅ **Rate Limiting:** Login and registration endpoints
- ✅ **Session Management:** Secure session storage with token-based authentication
- ✅ **CORS Configuration:** Proper origin restrictions

### Recommended Enhancements
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Implement CAPTCHA on sensitive forms
- [ ] Add IP-based rate limiting
- [ ] Implement audit logging
- [ ] Add email verification enforcement

---

## 💳 Wallet System

### Features
- **Top-Up:** Quick amounts (GH₵10, GH₵20, GH₵50, GH₵100, GH₵200, GH₵500)
- **Instant Payments:** Zero fees for wallet transactions
- **Balance Display:** Real-time balance on dashboard and sidebar
- **Payment Method Selection:** Choose between Wallet or Paystack at checkout
- **Transaction History:** Complete audit trail of all transactions

### Database Schema
```sql
-- Wallet balance column
ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(12, 2) DEFAULT 0.00;

-- Payment method tracking
ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'paystack';
```

### API Endpoints
- `POST /api/wallet/topup/initialize` - Initialize top-up
- `GET /api/wallet/topup/verify/:reference` - Verify payment
- `POST /api/wallet/pay` - Pay with wallet balance

---

## 👥 User Roles & Permissions

### User (Customer)
- Browse products
- Make purchases
- Top up wallet
- View transaction history
- Access support chat

### Agent
- All user permissions
- Create custom storefront
- View sales analytics
- Request withdrawals
- Manage business profile

### Admin
- All agent permissions
- Approve/reject agents
- Manage all products
- View all users and transactions
- Approve withdrawal requests
- Manage support tickets

---

## 🐛 Recent Fixes & Improvements

### Agent Dashboard Issues (RESOLVED)
- ✅ Fixed undefined agent details display
- ✅ Fixed NaN currency display (GH₵0.00 now shows correctly)
- ✅ Added `AgentProfileResponse` type for proper API response handling
- ✅ Fixed storefront link display
- ✅ Fixed business name display

### Session Management (ENHANCED)
- ✅ Secure token-based authentication
- ✅ Session persists across page navigation
- ✅ Manual logout functionality

### Type Safety (IMPROVED)
- ✅ Fixed API response structure mismatch
- ✅ Added proper TypeScript interfaces
- ✅ Numeric type conversion for currency values

---

## 🚢 Deployment

### Render Deployment (Recommended)

1. **Connect Repository:**
   ```
   Repository: https://github.com/BlusMotif/SMART-DATA-STORE-GH.git
   Branch: main
   ```

2. **Build Settings:**
   ```
   Build Command: npm run build
   Start Command: npm start
   ```

3. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://[connection-string]
   SUPABASE_URL=https://[ref].supabase.co
   SUPABASE_ANON_KEY=[key]
   SUPABASE_SERVICE_ROLE_KEY=[key]
   SESSION_SECRET=[secret]
   PAYSTACK_SECRET_KEY=[key]
   PAYSTACK_PUBLIC_KEY=[key]
   NODE_ENV=production
   PORT=10000
   ```

4. **Database Setup:**
   - Ensure Supabase project is running
   - Run migrations in SQL Editor
   - Verify connection string

### Alternative Platforms
- **Vercel** (Frontend) + **Railway** (Backend)
- **Heroku** (Full-stack)
- **DigitalOcean App Platform**
- **AWS** (EC2 + RDS)

---

## 📊 Database Schema Highlights

### Core Tables
- **users** - User accounts with wallet balance
- **agents** - Agent profiles and storefront data
- **transactions** - All purchases and payments
- **data_bundles** - Mobile data products
- **result_checkers** - Educational result checker products
- **withdrawals** - Agent withdrawal requests
- **support_messages** - Customer support chats

### Key Relationships
- Users → Agents (One-to-One)
- Users → Transactions (One-to-Many)
- Agents → Transactions (One-to-Many via userId)
- Products → Transactions (One-to-Many)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues:** [Create an issue](https://github.com/BlusMotif/SMART-DATA-STORE-GH/issues)
- **Email:** support@smartdatastore.com

---

## 🎉 Acknowledgments

- Built with ❤️ by BlusMotif
- UI Components by [shadcn/ui](https://ui.shadcn.com/)
- Database by [Supabase](https://supabase.com/)
- Payments by [Paystack](https://paystack.com/)

---

**Made in Ghana 🇬🇭**
