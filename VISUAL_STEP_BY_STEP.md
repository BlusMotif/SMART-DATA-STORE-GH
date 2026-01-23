# 🎬 Visual Deployment Step-by-Step Guide

## For Visual Learners

This guide shows each step with ASCII diagrams and visual representations.

---

## STEP 1: Prepare Your Computer

```
┌─────────────────────────────────────┐
│  Your Computer                      │
│                                     │
│  ✅ Node.js 20+ installed          │
│  ✅ Git installed                   │
│  ✅ GitHub account                  │
│  ✅ Project code ready              │
│  ✅ npm dependencies installed      │
│                                     │
│  └─ Run: npm install               │
└─────────────────────────────────────┘
```

### Verification
```bash
node --version      # Should be 20.x
npm --version       # Should be 10.x
git --version       # Should be installed
npm run build       # Should succeed
```

---

## STEP 2: Create GitHub Repository

```
Your Local Code
    │
    └─→ GitHub Repository
         ├─ Settings ✓
         ├─ Secrets ✓
         └─ Actions ✓
```

### Process

```
1. Go to github.com/new

2. Create repository
   ┌──────────────────────────────────┐
   │ Repository name: my-app          │
   │ Description: [your description]  │
   │ Public / Private: Private        │
   │ Initialize: NO (skip)            │
   └──────────────────────────────────┘

3. Get repository URL
   URL: https://github.com/you/my-app.git
```

---

## STEP 3: Push Code to GitHub

```
┌─ Local Computer ──────────────────────────────────────────┐
│                                                             │
│  $ git init                                                │
│  $ git add .                                               │
│  $ git commit -m "Initial commit: Ready for deployment"   │
│                                                             │
│  $ git branch -M main                                      │
│  $ git remote add origin https://github.com/you/my-app.git│
│  $ git push -u origin main                                 │
│                                                             │
│  ↓ (code uploading...)                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─ GitHub Server ────────────────────────────────────────────┐
│                                                             │
│  ✅ Repository created                                    │
│  ✅ Code uploaded                                          │
│  ✅ Ready for deployment                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What You See
```
Counting objects: 100%
Delta compression using up to 8 threads
Compressing objects: 100%
Writing objects: 100%
Creating deltas: 100%
...
To https://github.com/you/my-app.git
 * [new branch]      main -> main
```

---

## STEP 4: Create Hostinger Node App

```
Hostinger Dashboard
│
├─ hPanel
│  │
│  └─ Advanced ← Click here
│     │
│     └─ Node.js ← Click here
│        │
│        └─ Create new Node app
│           │
│           ├─ App name: resellers-hub-api
│           ├─ Node version: 20.x
│           ├─ App root: /server
│           ├─ Startup file: index.js
│           │
│           └─ ✅ Create
```

### Settings Table

```
┌──────────────────────┬──────────────────────┐
│ Setting              │ Value                │
├──────────────────────┼──────────────────────┤
│ Node Version         │ 20.x (or higher)     │
│ App Root             │ /server              │
│ Startup File         │ index.js             │
│ Port                 │ (auto)               │
│ Package Manager      │ npm                  │
└──────────────────────┴──────────────────────┘
```

---

## STEP 5: Connect GitHub to Hostinger

```
┌─────────────────────────────────────┐
│  Hostinger Node.js App              │
│  ┌─────────────────────────────────┐│
│  │ Git ← Click here                ││
│  │                                 ││
│  │ Connect GitHub                  ││
│  │ ┌───────────────────────────┐   ││
│  │ │ Repository: you/my-app    │   ││
│  │ │ Branch: main              │   ││
│  │ │ Auto-Deploy: ON ✓         │   ││
│  │ │                           │   ││
│  │ │ Build Command:            │   ││
│  │ │ npm run build:server      │   ││
│  │ │                           │   ││
│  │ │ Start Command:            │   ││
│  │ │ npm start                 │   ││
│  │ │                           │   ││
│  │ │ ✅ Connect & Deploy       │   ││
│  │ └───────────────────────────┘   ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
                ↓
        (waiting to deploy)
                ↓
        ✅ First deployment starts
```

### What Happens Automatically
```
1. Hostinger connects to your GitHub repo
2. Downloads code from main branch
3. Runs: npm run build:server
4. Compiles TypeScript to JavaScript
5. Runs: npm start
6. Server starts on port 3000 (or env PORT)
7. App is LIVE ✅
```

---

## STEP 6: Set Environment Variables

```
Hostinger hPanel
│
└─ Node.js App
   │
   └─ Environment Variables ← Click here
      │
      ├─ DATABASE_URL
      │  Value: your_postgres_url
      │  ✅ Add
      │
      ├─ SUPABASE_URL
      │  Value: your_supabase_url
      │  ✅ Add
      │
      ├─ SUPABASE_SERVICE_ROLE_KEY
      │  Value: your_secret_key
      │  ✅ Add
      │
      ├─ NODE_ENV
      │  Value: production
      │  ✅ Add
      │
      ├─ SESSION_SECRET
      │  Value: long_random_string_here
      │  ✅ Add
      │
      └─ APP_URL
         Value: https://yourdomain.com
         ✅ Add
```

### Checklist
```
┌─────────────────────────────────────┐
│ Environment Variables Set:          │
│ □ DATABASE_URL                      │
│ □ SUPABASE_URL                      │
│ □ SUPABASE_SERVICE_ROLE_KEY         │
│ □ NODE_ENV                          │
│ □ SESSION_SECRET                    │
│ □ APP_URL                           │
│                                     │
│ ⚠️ After adding, restart app!      │
└─────────────────────────────────────┘
```

---

## STEP 7: Build & Deploy Frontend

```
┌─ Step 7a: Build locally ──────────────────┐
│                                            │
│ Your Computer:                             │
│ $ npm run build:client                     │
│                                            │
│ ↓ (compiling React...)                   │
│                                            │
│ Output: client/dist/                       │
│ ├─ index.html ✓                           │
│ ├─ index-abc123.js ✓                      │
│ ├─ style-def456.css ✓                     │
│ └─ assets/ ✓                              │
│                                            │
└────────────────────────────────────────────┘

┌─ Step 7b: Upload to Hostinger ────────────┐
│                                            │
│ Hostinger File Manager:                    │
│ Navigate to: public_html/                  │
│                                            │
│ Upload client/dist/* contents here:        │
│ ├─ index.html                              │
│ ├─ index-abc123.js                         │
│ ├─ style-def456.css                        │
│ ├─ assets/                                 │
│ └─ .htaccess (create new file)             │
│                                            │
└────────────────────────────────────────────┘

┌─ Step 7c: Add .htaccess ──────────────────┐
│                                            │
│ Create file: public_html/.htaccess         │
│                                            │
│ Content:                                   │
│ ┌──────────────────────────────────────┐   │
│ │ <IfModule mod_rewrite.c>             │   │
│ │   RewriteEngine On                   │   │
│ │   RewriteCond %{REQUEST_FILENAME} !-f│   │
│ │   RewriteCond %{REQUEST_FILENAME} !-d│   │
│ │   RewriteRule ^ index.html [QSA,L]   │   │
│ │ </IfModule>                          │   │
│ └──────────────────────────────────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

---

## STEP 8: Setup Domain Pointing

```
Current Status:
│
├─ yourdomain.com  ──→ public_html/ (React)
│  ✅ Already setup (default)
│
└─ api.yourdomain.com ──→ ? (Node app)
   ❌ Need to configure

Create Subdomain:
│
├─ Hostinger hPanel
├─ Domains → Subdomains
├─ Create subdomain
│  ├─ Name: api
│  ├─ Points to: your-node-app
│  └─ ✅ Create
│
└─ ⏳ Wait 5-10 minutes for DNS propagation
   └─ ✅ https://api.yourdomain.com works
```

---

## STEP 9: Verify Everything Works

```
Test #1: Frontend Loads
┌──────────────────────────────────────┐
│ Open browser: https://yourdomain.com │
│                                      │
│ ✅ Page loads without errors        │
│ ✅ CSS/JS files load (Network tab)  │
│ ✅ No 404 errors                    │
│ ✅ No console errors                │
└──────────────────────────────────────┘

Test #2: Backend Health Check
┌──────────────────────────────────────┐
│ Terminal:                            │
│ $ curl \                             │
│   https://api.yourdomain.com/api/health
│                                      │
│ Response:                            │
│ {"status": "ok"} ✅                  │
└──────────────────────────────────────┘

Test #3: API Data Retrieval
┌──────────────────────────────────────┐
│ Browser console:                     │
│ fetch('https://api.yourdomain.com/api/data')
│   .then(r => r.json())              │
│   .then(d => console.log(d))         │
│                                      │
│ ✅ Data returned successfully        │
└──────────────────────────────────────┘

Test #4: Database Connection
┌──────────────────────────────────────┐
│ Try user login on frontend           │
│                                      │
│ ✅ Login works                       │
│ ✅ Data from database returned       │
│ ✅ No connection errors              │
└──────────────────────────────────────┘
```

---

## STEP 10: Daily Workflow (After Deployment)

```
Daily Development Cycle:

┌─────────────────────────────────────┐
│ 1. Make code changes                │
│    $ nano src/server/index.ts       │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. Test locally                     │
│    $ npm run dev                    │
│    Opens http://localhost:5173      │
│    Opens http://localhost:10000     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. Commit to Git                    │
│    $ git add .                      │
│    $ git commit -m "Feature: ..."   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. Push to GitHub                   │
│    $ git push origin main           │
└─────────────────────────────────────┘
           ↓ (GitHub Actions starts)
┌─────────────────────────────────────┐
│ 5. Hostinger Auto-Deploys           │
│    ✓ Pulls from GitHub              │
│    ✓ npm run build:server           │
│    ✓ npm start                      │
│    ⏱️  ~5 minutes                   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 6. Live on Production! 🎉           │
│    https://yourdomain.com           │
│    https://api.yourdomain.com       │
└─────────────────────────────────────┘
```

---

## Error Flows

### If Frontend Shows 404

```
Browser: https://yourdomain.com
Result: 404 Not Found ❌

Troubleshooting:
│
├─ Check 1: Is public_html/index.html there?
│  └─ Hostinger File Manager → public_html/
│
├─ Check 2: Is .htaccess present?
│  └─ Should be in public_html/
│
├─ Check 3: Clear cache
│  └─ Ctrl+Shift+Delete or Cmd+Shift+Delete
│
└─ If still failing:
   └─ Contact Hostinger support
```

### If API Returns 404

```
Browser API call fails:
fetch('https://api.yourdomain.com/api/data')
Result: 404 Not Found ❌

Troubleshooting:
│
├─ Check 1: Is Node app Running?
│  └─ Hostinger hPanel → Node app → Status
│
├─ Check 2: Check error logs
│  └─ Hostinger → Node app → View logs
│
├─ Check 3: Is /server the app root?
│  └─ Verify in Node app settings
│
├─ Check 4: Does dist/server/index.js exist?
│  └─ Manually check file
│
└─ If still failing:
   └─ Restart Node app
```

### If CORS Error Appears

```
Browser Console Error:
Access to XMLHttpRequest blocked by CORS ❌

Solution:
│
├─ Check CORS origin in src/server/index.ts
│  ├─ Does it include https://yourdomain.com?
│  └─ Update if needed
│
├─ Add environment variable
│  └─ APP_URL=https://yourdomain.com
│
├─ Restart Node app
│  └─ Hostinger hPanel → Restart
│
└─ Test again
   └─ ✅ Should work now
```

---

## Success Indicators ✅

```
Checklist of Success:

Frontend (https://yourdomain.com)
  ✅ Page loads
  ✅ CSS applied (styled correctly)
  ✅ JavaScript runs (interactive)
  ✅ Navigation works
  ✅ No console errors
  
Backend (https://api.yourdomain.com)
  ✅ Health check responds: 200 OK
  ✅ API endpoints return data
  ✅ Database queries work
  ✅ No connection errors
  
Integration
  ✅ Frontend calls API successfully
  ✅ Data flows correctly
  ✅ User authentication works
  ✅ No CORS errors
  
Security
  ✅ HTTPS enabled
  ✅ Environment variables set
  ✅ No console errors about security
  ✅ Logs look normal
```

---

## 🎬 Video Script (If Filming)

### Scene 1: Local Development
```
"Here's the project on my computer. 
 I run npm run dev to test locally.
 Both frontend and backend work perfectly.
 Now let's deploy it."
```

### Scene 2: GitHub Setup
```
"I create a GitHub repository and push my code.
 I can see the code is now on GitHub.
 All commits are tracked."
```

### Scene 3: Hostinger Setup
```
"In Hostinger, I create a Node.js app.
 I connect my GitHub repository.
 I enable auto-deploy so every push deploys automatically."
```

### Scene 4: Environment Setup
```
"I add all environment variables in Hostinger.
 Database credentials, API keys, everything.
 Then restart the Node app."
```

### Scene 5: Frontend Deploy
```
"I build the React app locally.
 Then upload the dist folder to public_html.
 I add the .htaccess file for SPA routing."
```

### Scene 6: Testing
```
"Let me test the deployment.
 Opening the website... it works!
 Calling the API... data returned!
 Checking the database... all connected!"
```

### Scene 7: Daily Workflow
```
"After deployment, the workflow is simple.
 Make changes locally, test with npm run dev.
 Commit with git, push to GitHub.
 Hostinger automatically deploys within 5 minutes."
```

---

**Estimated Total Time: 1-2 hours**  
**Difficulty Level: Intermediate**  
**Success Rate: 95%+ (with this guide)**

Good luck! 🚀
