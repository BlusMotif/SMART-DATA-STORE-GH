# Git & GitHub Setup for Hostinger Deployment

## Prerequisites

- [ ] Git installed: `git --version`
- [ ] GitHub account created
- [ ] SSH keys configured (or use HTTPS)
- [ ] All code committed locally

---

## Step 1: Initialize Git (If Not Already Done)

```bash
# Navigate to project root
cd /path/to/SMART-DATA-STORE-GH

# Initialize repository
git init

# Configure git (one-time setup)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Step 2: Prepare Repository

### Create `.gitignore` (if not exists)

```bash
# Files/folders to exclude from Git
cat > .gitignore << 'EOF'
# Environment variables (SECURITY!)
.env
.env.local
.env.*.local
.env.production

# Node modules
node_modules/
package-lock.json

# Build output (can be rebuilt)
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Development
.turbo/
.next/

# Testing
coverage/
.playwright/
test-results/
EOF
```

### Verify Sensitive Files Aren't Tracked

```bash
# Check what would be committed
git status

# Look for .env files - should NOT appear
# If .env files appear in the list, they'll be committed!
```

**IMPORTANT**: If you see `.env` files in `git status`:

```bash
# Remove them from git (but keep locally)
git rm --cached .env
git rm --cached .env.production

# This prevents accidental credential leaks!
```

---

## Step 3: Stage and Commit

```bash
# Add all tracked files
git add .

# Review what's being committed
git status

# Commit with descriptive message
git commit -m "Initial commit: Monorepo ready for Hostinger deployment"
```

### Commit Message Examples

```bash
git commit -m "Setup: Configure deployment for Hostinger"
git commit -m "Feature: Add health check endpoint"
git commit -m "Fix: CORS configuration for production domain"
git commit -m "Docs: Add deployment guides"
```

---

## Step 4: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to https://github.com/new
2. **Repository name**: `resellers-hub-pro-gh` (or your preferred name)
3. **Description**: ResellersHub Pro - Complete platform with React & Express
4. **Public/Private**: Private (for production code)
5. **Skip** initialization (you have code locally)
6. Click **Create repository**

### Option B: Using GitHub CLI

```bash
# Install GitHub CLI if not present
# https://cli.github.com/

gh repo create resellers-hub-pro-gh \
  --private \
  --source=. \
  --remote=origin \
  --push
```

---

## Step 5: Connect Local Repository to GitHub

### Create Main Branch

```bash
# Rename to 'main' (GitHub default)
git branch -M main

# Verify branch name
git branch -v
```

### Add Remote Repository

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/resellers-hub-pro-gh.git

# Verify remote
git remote -v
# Output should show:
# origin  https://github.com/YOUR_USERNAME/resellers-hub-pro-gh.git (fetch)
# origin  https://github.com/YOUR_USERNAME/resellers-hub-pro-gh.git (push)
```

---

## Step 6: Push to GitHub

### First Push (Includes History)

```bash
# Push main branch to GitHub
git push -u origin main

# The -u flag sets up tracking (you can use 'git push' next time)
```

### Verify Success

```bash
# Check if push was successful
git log --oneline -5

# Visit GitHub to verify: https://github.com/YOUR_USERNAME/resellers-hub-pro-gh
```

---

## Step 7: Configure GitHub for Hostinger Integration

### Add Secrets (For Automated Deployment)

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secrets that Hostinger might need:

| Secret Name | Value | Notes |
|------------|-------|-------|
| `HOSTINGER_FTP_USER` | Your FTP username | For frontend upload |
| `HOSTINGER_FTP_PASS` | Your FTP password | Encrypted by GitHub |
| `DATABASE_URL` | Your production DB | Don't expose publicly |

⚠️ **GitHub encrypts these** - they're not visible in the repo.

---

## Step 8: Setup Hostinger Integration

### Enable GitHub Auto-Deploy on Hostinger

1. **Hostinger hPanel** → **Advanced** → **Node.js** → Your App
2. Click **Git** tab
3. **Connect GitHub**:
   - Select repository: `YOUR_USERNAME/resellers-hub-pro-gh`
   - Select branch: `main`
   - **Build Command**: `npm run build:server`
   - **Start Command**: `npm start`
4. Enable **Auto-Deploy**: ON
5. **Connect & Deploy**

Now every `git push` to `main` will trigger auto-deployment! 🎉

---

## Daily Workflow (After Setup)

### Making Changes

```bash
# 1. Make code changes
nano src/server/index.ts

# 2. Test locally
npm run dev

# 3. Stage changes
git add src/server/index.ts

# 4. Commit with message
git commit -m "Feature: add new API endpoint"

# 5. Push to GitHub (triggers Hostinger deploy)
git push origin main

# ✅ Hostinger automatically:
#    - Pulls code from GitHub
#    - Runs npm run build:server
#    - Restarts app
#    - Live in ~5 minutes
```

### Working with Multiple Features

```bash
# Create feature branch
git checkout -b feature/new-dashboard

# Make changes and commit
git add .
git commit -m "Build new dashboard UI"

# Push feature branch
git push origin feature/new-dashboard

# Create Pull Request on GitHub (for review)
# Merge to main when ready

# Delete feature branch (cleanup)
git branch -d feature/new-dashboard
```

---

## Useful Git Commands

```bash
# View commit history
git log --oneline

# Check current branch
git branch -v

# See changes before committing
git diff

# View staged changes
git diff --staged

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Revert to previous commit (discard changes)
git reset --hard HEAD~1

# Stash changes temporarily
git stash

# Apply stashed changes
git stash pop
```

---

## Troubleshooting

### "Permission denied (publickey)"

**Problem**: SSH key not configured

**Solution**:
```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa

# Add public key to GitHub → Settings → SSH Keys
# Copy: ~/.ssh/id_rsa.pub
# Paste in GitHub

# Test connection
ssh -T git@github.com
# Should say: "Hi USERNAME! You've successfully authenticated"
```

### "fatal: 'origin' does not appear to be a 'git' repository"

**Problem**: Remote not configured

**Solution**:
```bash
# Check if remote exists
git remote -v

# If empty, add it
git remote add origin https://github.com/USERNAME/repo.git

# Or change existing
git remote set-url origin https://github.com/USERNAME/repo.git
```

### "branch is behind origin"

**Problem**: Local repo is outdated

**Solution**:
```bash
# Fetch latest changes from GitHub
git fetch origin

# Merge or rebase
git merge origin/main
# or
git rebase origin/main
```

### "Your branch is ahead of origin"

**Problem**: Commits not pushed yet

**Solution**:
```bash
# Push all commits
git push origin main
```

---

## Best Practices

✅ **Do**:
- [ ] Commit frequently with descriptive messages
- [ ] Create branches for new features
- [ ] Review changes before committing
- [ ] Keep `.env` files locally (never commit)
- [ ] Push to `main` only when code is tested
- [ ] Use meaningful commit messages

❌ **Don't**:
- [ ] Commit `.env` or secrets
- [ ] Force push to `main` (`git push --force`)
- [ ] Make huge commits (break into smaller ones)
- [ ] Commit large binary files
- [ ] Commit node_modules/ or dist/ (use .gitignore)

---

## GitHub Actions Workflow (Auto-Deploy)

Your repo includes `.github/workflows/deploy.yml` which:

1. **Triggers on**: Every push to `main`
2. **Runs**:
   - Node setup
   - Install dependencies
   - Build client & server
   - Run TypeScript checks
   - Verify build output
3. **Result**: Green ✅ or Red ❌ badge in GitHub

**Check workflow status**: GitHub repo → **Actions** tab

---

## Support Resources

- Git Basics: https://git-scm.com/book
- GitHub Docs: https://docs.github.com
- Hostinger GitHub Integration: https://support.hostinger.com

---

**Quick Start**:
```bash
git init
git add .
git commit -m "Initial commit: Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/your-repo.git
git push -u origin main
```

Done! 🚀
