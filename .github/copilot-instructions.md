# Smart Data Store Ghana - AI Agent Instructions

## Architecture Overview
This is a monorepo full-stack application with separate client and server builds:
- **Client**: React 18 + TypeScript + Vite (SPA in `client/` folder)
- **Server**: Express.js + TypeScript (API in `server/` folder)
- **Shared**: TypeScript schemas and types (`shared/schema.ts`)
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Auth**: Supabase JWT-based authentication
- **Payments**: Paystack integration
- **Deployment**: Render (production server)

## Key Components & Data Flow
```
Client (React/Vite) → Express API → Storage Layer → Drizzle ORM → PostgreSQL
                      ↓
                 Supabase Auth (JWT validation)
                      ↓
               Paystack API (payments)
```

## Critical Developer Workflows

### Build & Run Commands
- `npm run dev`: Start development server (tsx watches server/, Vite serves client/)
- `npm run build`: Build both client (to `dist/public/`) and server (to `dist/server/`)
- `npm start`: Run production server from `dist/server/index.js`
- `npm run db:push`: Apply database schema changes via Drizzle

### ESM Module System
- All imports must use `.js` extensions in TypeScript source files
- Example: `import { apiRequest } from "./queryClient.js";`
- Server compiles from `server/` to `dist/server/` with proper extensions

### Environment Configuration
- Use `process.env.VARIABLE_NAME` for server-side config
- Client-side: Define constants in `client/src/lib/constants.ts`
- Never hardcode URLs - use environment variables or `window.location.origin`

## Project-Specific Patterns

### Role-Based System
User roles: `guest` → `user` → `agent` → `dealer` → `super_dealer` → `admin`
- Role-based pricing: Data bundles have `basePrice`, `agentPrice`, `dealerPrice`, `superDealerPrice`
- Access control: Check `user?.role` before rendering features
- Example: `if (user?.role === 'admin') { /* admin features */ }`

### File Organization
- **Client components**: `client/src/components/` (ui/, layout/, products/, user/)
- **Pages**: `client/src/pages/` (admin/, agent/, user/, products/)
- **Server routes**: All API endpoints in `server/routes.ts`
- **Database operations**: `server/storage.ts` (CRUD operations)
- **Shared types**: `shared/schema.ts` (Drizzle schemas, Zod validation)

### API Patterns
- RESTful endpoints with role-based middleware (`requireAuth`, `requireAdmin`)
- Error handling: Return JSON `{ error: "message" }` with appropriate status codes
- Authentication: JWT tokens via Supabase, validated in middleware

### Database Patterns
- Use Drizzle ORM for type-safe queries
- Relations defined in schema files
- Migrations in `migrations/` folder
- Example: `await storage.getDataBundles({ network, isActive: true })`

### Payment Integration
- Wallet system: Users have balances, instant deductions
- Paystack: External payments with webhooks
- Always validate amounts and user balances before transactions

## Common Pitfalls to Avoid
- Don't import without `.js` extensions in server TypeScript files
- Don't hardcode localhost URLs - use environment variables
- Don't mix client and server code - keep them separate
- Don't forget to update both client and server when changing shared types
- Don't deploy without running `npm run build` first

## Key Files to Reference
- `shared/schema.ts`: All database schemas, types, and validations
- `server/routes.ts`: API endpoint definitions and business logic
- `server/storage.ts`: Database operations and queries
- `client/src/lib/constants.ts`: Client-side configuration
- `package.json`: Build scripts and dependencies