---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.You are working inside a production Vite + React + Node/Express + TypeScript project
that is deployed on Render.com.

Your task is to audit, fix, and harden the entire project so that:
1. It NEVER redirects users to localhost in production
2. It ALWAYS works on Render hosting without failed deploys
3. Routing, CSS, assets, ports, and environment variables are handled correctly
4. The app works identically in development and production (except base URLs)

STRICT REQUIREMENTS (DO NOT IGNORE):

### SERVER & PORT CONFIGURATION
- The backend MUST always bind to process.env.PORT
- Never hardcode ports like 3000, 5173, or 10000
- Use:
  const PORT = Number(process.env.PORT) || 3000
- Render injects PORT automatically — respect it everywhere
- Ensure only ONE server listens on the port

### ENVIRONMENT-AWARE URL HANDLING
- NEVER use "http://localhost" anywhere in production code
- Detect environment using:
  import.meta.env.PROD (frontend)
  process.env.NODE_ENV === "production" (backend)
- All redirects, callbacks, and API URLs must:
  - Use relative paths (preferred), OR
  - Dynamically resolve base URLs using environment variables
- Payment redirects MUST return to the deployed Render URL, not localhost

### ROUTING (VERY IMPORTANT)
- Fix all routing so that:
  - No page reloads redirect to localhost
  - SPA routing works on refresh (no 404 on direct URL access)
- Configure the backend to serve index.html for ALL non-API routes
- Ensure React Router (or equivalent) uses BrowserRouter correctly
- Do NOT use absolute URLs for internal navigation

### VITE CONFIGURATION (vite.config.ts)
- Ensure:
  - Correct base path ("/")
  - Assets and CSS load correctly in production
  - No preview-only config is required for production
- Fix any CSS or asset path issues causing distorted layouts
- Ensure build output is consistent with Render expectations

### CSS & ASSETS
- Fix all broken or missing CSS imports
- Ensure global styles are loaded once (main.tsx / index.tsx)
- Remove any CSS paths that depend on localhost or dev-only behavior
- Verify Tailwind / PostCSS / plain CSS builds correctly in production

### BUILD & OUTPUT
- Ensure TypeScript builds without errors
- Ensure build output directories match what the server expects
- Do NOT reference files that don’t exist after build
- Confirm the production start command runs the built server correctly

### RENDER SAFETY CHECKLIST (MANDATORY)
Before making changes, ALWAYS verify:
- Build command works on a clean install
- Start command points to the correct compiled file
- No dev-only dependencies are required at runtime
- No preview server is used in production
- No hardcoded hosts, ports, or localhost URLs exist

### DEPLOY-SAFE RULE
If any change might cause a Render deploy failure:
- STOP
- Fix the configuration first
- Prefer safe, standard, production patterns over hacks

### FINAL ACTION
- Apply fixes directly in the codebase
- Explain what was fixed and why
- Ensure the app deploys successfully on Render without manual intervention

DO NOT:
- Introduce localhost redirects
- Use vite preview in production
- Hardcode URLs, ports, or hosts
- Break existing production routing

Proceed carefully and professionally.
