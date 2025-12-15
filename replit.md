# CLECTECH

## Overview

CLECTECH is a fintech-style web application for selling digital products in Ghana, specifically mobile data bundles (MTN, Telecel, AirtelTigo) and WAEC examination result checkers (BECE/WASSCE). The platform supports three user roles: guests who can purchase products, agents who run their own storefronts and earn commissions, and admins who manage the entire system. Payments are processed through Paystack integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, with session-based authentication
- **UI Framework**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens following fintech design principles (Inter font, white backgrounds, trust-focused layouts)
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Session Management**: Express sessions with connect-pg-simple for PostgreSQL session storage
- **Authentication**: Session-based auth with bcryptjs password hashing, optional Firebase integration for Google OAuth
- **API Design**: RESTful endpoints under `/api` prefix with role-based middleware (requireAuth, requireAdmin, requireAgent)

### Data Storage
- **Primary Database**: PostgreSQL accessed via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod validation schemas
- **Key Entities**: Users, Agents, DataBundles, ResultCheckers, Transactions, Withdrawals, SmsLogs, AuditLogs, Settings

### Authentication Flow
- Session-based authentication stored in PostgreSQL
- Three user roles: admin, agent, guest
- Role-based route protection via middleware
- Optional Google OAuth through Firebase Authentication

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Database Migrations**: Drizzle Kit for schema push (`npm run db:push`)

## External Dependencies

### Payment Processing
- **Paystack**: Primary payment gateway for processing transactions in Ghana

### Authentication (Optional)
- **Firebase Authentication**: Google OAuth sign-in support when configured with environment variables

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### SMS (Planned)
- SMS delivery system for sending result checker credentials to customers (referenced in schema)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `VITE_FIREBASE_API_KEY`: Firebase API key (optional, for Google OAuth)
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID (optional)
- `VITE_FIREBASE_APP_ID`: Firebase app ID (optional)