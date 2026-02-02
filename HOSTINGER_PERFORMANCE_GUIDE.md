# Hostinger Shared Hosting Performance Guide

## Optimized for 1000+ Users

This guide documents all optimizations made for running the application on Hostinger shared hosting with 1000+ concurrent users.

---

## 1. Rate Limiting Optimizations

### Backend Rate Limits (src/server/index.ts)

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/auth/login` | 10 req | 15 min | Prevent brute force |
| `/api/auth/register` | 10 req | 30 min | Prevent spam accounts |
| `/api/auth/me` | 600 req | 1 min | High-traffic auth check |
| `/api/announcements` | 500 req | 1 min | Polled frequently |
| `/api/break-settings` | 500 req | 1 min | Checked often |
| `/api/products` | 400 req | 1 min | Product listings |
| `/api/bundles` | 400 req | 1 min | Bundle listings |
| `/api/user/stats` | 500 req | 1 min | Dashboard stats |
| `/api/transactions` | 400 req | 1 min | Transaction history |
| `/api/agent` | 400 req | 1 min | Agent endpoints |
| `/api/*` (general) | 300 req | 1 min | All other API calls |

### Rate Limit Map Size
- Increased from 500 to **2000 IPs** to handle 1000+ users
- Cleanup runs every 5 minutes

### Disable Rate Limiting (Emergency)
Set environment variable:
```bash
DISABLE_RATE_LIMIT=true
```

---

## 2. Database Connection Pool (src/server/db.ts)

```typescript
{
  max: 10,                    // 10 connections (Hostinger allows 10-15)
  min: 2,                     // Keep 2 connections warm
  idleTimeoutMillis: 30000,   // 30s idle timeout
  connectionTimeoutMillis: 20000,  // 20s connection timeout
  statement_timeout: 45000,   // 45s statement timeout
  query_timeout: 45000,       // 45s query timeout
}
```

---

## 3. Frontend Polling Optimizations

### Query Client Defaults (client/src/lib/queryClient.ts)
```typescript
{
  staleTime: 2 * 60 * 1000,      // 2 minutes
  gcTime: 10 * 60 * 1000,        // 10 minutes cache
  retry: 1,                       // Single retry
  retryDelay: 1000,              // 1s retry delay
  refetchOnWindowFocus: false,
  refetchOnMount: false,
}
```

### Auth Hook (client/src/hooks/use-auth.ts)
```typescript
{
  staleTime: 10 * 60 * 1000,  // 10 minutes
  gcTime: 30 * 60 * 1000,     // 30 minutes cache
  refetchOnMount: false,
}
```

### Polling Intervals Changed

| Page/Component | Before | After | Reduction |
|----------------|--------|-------|-----------|
| User Dashboard | 10s | 30s | 66% |
| User Wallet | 10s | 30s | 66% |
| User History | 10s | 30s | 66% |
| Dealer Dashboard | 10s | 30s | 66% |
| Master Dashboard | 10s | 30s | 66% |
| Super Dealer Dashboard | 10s | 30s | 66% |
| Admin Dashboard Stats | 10s | 45s | 77% |
| Admin Transactions | 15s | 45s | 66% |
| Admin Chat (count) | 5s | 15s | 66% |
| Admin Chat (list) | 10s | 20s | 50% |
| Admin Chat (messages) | 5s | 10s | 50% |

---

## 4. Compression (NEW)

Added gzip compression middleware:
```typescript
compression({
  level: 6,           // Balanced compression
  threshold: 1024,    // Only compress > 1KB
})
```

**Benefits:**
- Reduces bandwidth by 60-80%
- Faster page loads
- Lower server load

---

## 5. Static Asset Caching

### Cache Headers by File Type:
| File Type | Cache Duration |
|-----------|---------------|
| Hashed JS/CSS (*.abc123.js) | 1 year (immutable) |
| Images, Fonts | 30 days |
| HTML | No cache |
| Other | 1 day |

---

## 6. Server Timeouts

```typescript
REQUEST_TIMEOUT_MS = 30 * 1000;      // 30 seconds
SOCKET_TIMEOUT_MS = 60 * 1000;       // 60 seconds
KEEP_ALIVE_TIMEOUT_MS = 65 * 1000;   // 65 seconds
```

---

## 7. Required Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Paystack
PAYSTACK_SECRET_KEY=sk_live_...

# Optional
NODE_ENV=production
PORT=3000
DISABLE_RATE_LIMIT=false
```

---

## 8. Deployment Checklist

- [ ] Run `npm install` to get compression package
- [ ] Run `npm run build` to create production bundle
- [ ] Set all environment variables in Hostinger panel
- [ ] Ensure Node.js 20.x is selected
- [ ] Test rate limits don't block legitimate users
- [ ] Monitor memory usage (should stay under 512MB)
- [ ] Check database connections don't exceed 10

---

## 9. Monitoring

### Health Check Endpoints:
- `GET /api/health` - Server status
- `GET /api/health/db` - Database connection

### What to Monitor:
1. **Memory usage** - Should stay under 512MB
2. **CPU usage** - Spikes during build, should be low after
3. **Database connections** - Should not exceed 10
4. **Response times** - Should be < 500ms for most API calls
5. **Error rate** - Watch for 429 (rate limit) and 503 (overload)

---

## 10. Troubleshooting

### Users getting 429 Too Many Requests
1. Check if rate limit is too low
2. Temporarily disable: `DISABLE_RATE_LIMIT=true`
3. Increase limits in `src/server/index.ts`

### Slow API responses
1. Check database connection pool (`/api/health/db`)
2. Increase pool `max` connections (up to 15)
3. Check for slow queries in PostgreSQL

### High memory usage
1. Reduce rate limit map size
2. Restart the application
3. Check for memory leaks in logs

### Database connection errors
1. Check connection string
2. Verify SSL settings
3. Check if connections exceeded limit

---

## Performance Estimates

With these optimizations, the system should handle:

| Metric | Capacity |
|--------|----------|
| Concurrent users | 1000+ |
| Requests/minute | 3000+ |
| Database connections | 10 max |
| Memory usage | < 512MB |
| Response time | < 500ms avg |

---

*Last Updated: February 2026*
