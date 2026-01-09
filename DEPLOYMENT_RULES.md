# 🚨 Render Deployment Rules (DO NOT BREAK)

## Server
- Must listen on process.env.PORT
- Must bind to 0.0.0.0
- Start command must match build output

## Build
- TypeScript output → dist/
- Start → node dist/server/index.js
- No src/dist or src/src/dist paths

## URLs
- NO localhost in production
- Use env vars for all URLs

## Routing
- Express serves API routes
- React handles frontend routes
- SPA fallback enabled

## CSS
- Tailwind properly configured
- No missing imports
- No dev-only paths

## Final Rule
If deployment fails → check START PATH first