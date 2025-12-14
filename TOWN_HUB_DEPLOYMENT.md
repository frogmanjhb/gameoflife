# Town Hub Railway Deployment Guide

This guide walks you through deploying the Town Hub to Railway and initializing the PostgreSQL database.

## Prerequisites

- Railway account (free at [railway.app](https://railway.app))
- GitHub repository with your code
- Railway CLI installed (optional, but recommended)

## Step 1: Deploy to Railway

### Option A: Via Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `gameoflife` repository
4. Railway will auto-detect the project and start building

### Option B: Via Railway CLI

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project
railway link

# Deploy
railway up
```

## Step 2: Add PostgreSQL Database

1. In Railway dashboard, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically create a PostgreSQL service
3. The `DATABASE_URL` environment variable will be automatically set

## Step 3: Run Database Migration

You need to run the migration to create the new Town Hub tables. Choose one method:

### Method 1: Railway Dashboard (Easiest)

1. In Railway dashboard, click on your **PostgreSQL** service
2. Go to **"Data"** tab → **"Query"**
3. Copy the entire contents of `server/migrations/002_town_hub_tables.sql`
4. Paste into the query editor
5. Click **"Run"** to execute

### Method 2: Railway CLI

```bash
# Make sure you're linked to the project
railway link

# Run the migration
railway run --service backend psql $DATABASE_URL < server/migrations/002_town_hub_tables.sql
```

**Windows PowerShell:**
```powershell
Get-Content server/migrations/002_town_hub_tables.sql | railway run --service backend psql $env:DATABASE_URL
```

### Method 3: Local Connection (If you have direct DB access)

If Railway provides a direct connection string, you can use `psql` locally:

```bash
# Get your DATABASE_URL from Railway dashboard
# Then run:
psql $DATABASE_URL -f server/migrations/002_town_hub_tables.sql
```

## Step 4: Seed Initial Data

After the migration is complete, seed the database with initial data:

### Method 1: Railway CLI (Recommended)

```bash
# Make sure you're in the project root
cd server

# Run the seed script
railway run --service backend node seed-town-hub.js
```

**Windows PowerShell:**
```powershell
cd server
railway run --service backend node seed-town-hub.js
```

### Method 2: Railway Dashboard

1. In Railway dashboard, go to your **backend** service
2. Click **"Deployments"** → **"New Deployment"**
3. Or use the **"Shell"** tab to run commands interactively

### Method 3: One-time Deploy Script

You can also add a one-time deployment script. Add this to your `package.json`:

```json
"scripts": {
  "railway:seed": "cd server && railway run --service backend node seed-town-hub.js"
}
```

Then run:
```bash
npm run railway:seed
```

## Step 5: Verify Deployment

1. Check that your backend service is running (green status in Railway)
2. Visit your Railway app URL: `https://your-app.railway.app`
3. Test login:
   - **Teacher**: `teacher1` / `teacher123`
   - **Student**: `student1` / `student123` (Class 6A)
   - **Student**: `student2` / `student123` (Class 6B)
   - **Student**: `student3` / `student123` (Class 6C)

## Step 6: Environment Variables

Make sure these environment variables are set in Railway:

1. Go to your **backend** service → **"Variables"** tab
2. Ensure these are set:
   - `DATABASE_URL` (auto-set by Railway when you add PostgreSQL)
   - `JWT_SECRET` (set a strong secret key)
   - `NODE_ENV=production`
   - `CLIENT_URL` (your Railway app URL)

## Troubleshooting

### Migration Fails

If you see errors like "relation already exists":
- The tables may already exist from a previous migration
- This is safe to ignore - the migration uses `CREATE TABLE IF NOT EXISTS`
- You can check existing tables in Railway dashboard → PostgreSQL → Data → Query:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public';
  ```

### Seed Script Fails

If the seed script fails:
1. Check that the migration ran successfully first
2. Verify `DATABASE_URL` is set correctly
3. Check Railway logs: `railway logs --service backend`
4. Common issues:
   - Missing `bcryptjs` dependency (should be in server/package.json)
   - Connection timeout (check Railway database status)

### Tables Not Created

If tables aren't created:
1. Verify the migration SQL file is correct
2. Check Railway logs for errors
3. Try running the migration SQL directly in Railway dashboard query editor
4. Ensure PostgreSQL service is running and accessible

### Cannot Connect to Database

1. Verify `DATABASE_URL` is set in Railway variables
2. Check that PostgreSQL service is running (green status)
3. Try connecting via Railway dashboard → PostgreSQL → Connect

## Quick Reference Commands

```bash
# Link to Railway project
railway link

# View logs
railway logs --service backend

# Run migration
railway run --service backend psql $DATABASE_URL < server/migrations/002_town_hub_tables.sql

# Run seed
railway run --service backend node server/seed-town-hub.js

# Open Railway dashboard
railway open

# Deploy
railway up
```

## What Gets Created

After running the migration and seed:

### Tables Created:
- `plugins` - 5 plugins (Bank, Land, Jobs, News, Government)
- `jobs` - 8 jobs (Teacher, Doctor, Engineer, etc.)
- `town_settings` - 3 towns (6A, 6B, 6C)
- `announcements` - Empty (ready for announcements)
- `users.job_id` - New column added

### Seed Data:
- **Plugins**: 5 plugins, all enabled
- **Jobs**: 8 job types
- **Towns**: 3 towns (one per class)
- **Users**: 
  - 1 teacher: `teacher1` / `teacher123`
  - 3 students: `student1`, `student2`, `student3` / `student123`

## Next Steps

1. **Change default passwords** - Update the seed script or change passwords after first login
2. **Configure town settings** - Log in as teacher and customize town names, mayors, tax rates
3. **Post announcements** - Create welcome announcements for each town
4. **Assign jobs** - Assign jobs to students via the Jobs plugin (when implemented)

## Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Verify database connection in Railway dashboard
3. Test database queries in Railway dashboard → PostgreSQL → Query
4. Check that all environment variables are set correctly

