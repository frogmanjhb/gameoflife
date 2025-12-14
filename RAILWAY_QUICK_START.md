# Railway Quick Start - Town Hub

## Quick Steps to Deploy & Initialize

### 1. Deploy to Railway
- Push your code to GitHub
- In Railway: New Project → Deploy from GitHub repo
- Add PostgreSQL database: New → Database → Add PostgreSQL

### 2. Run Migration (Choose ONE method)

**Method A: Railway Dashboard (Easiest)**
1. Railway Dashboard → PostgreSQL service → Data tab → Query
2. Copy/paste contents of `server/migrations/002_town_hub_tables.sql`
3. Click Run

**Method B: Railway CLI**
```bash
railway link
railway run --service backend psql $DATABASE_URL < server/migrations/002_town_hub_tables.sql
```

### 3. Seed Database

```bash
railway run --service backend node server/seed-town-hub.js
```

Or use npm script:
```bash
npm run db:seed
```

### 4. Verify

Visit your Railway app URL and login:
- **Teacher**: `teacher1` / `teacher123`
- **Student**: `student1` / `student123` (Class 6A)

## What Gets Created

✅ 5 Plugins (Bank, Land, Jobs, News, Government)  
✅ 8 Jobs (Teacher, Doctor, Engineer, etc.)  
✅ 3 Towns (6A, 6B, 6C)  
✅ 1 Teacher + 3 Students  

## Troubleshooting

**Migration fails?** Check Railway logs: `railway logs --service backend`

**Seed fails?** Make sure migration ran first, then check `DATABASE_URL` is set

**Need help?** See `TOWN_HUB_DEPLOYMENT.md` for detailed instructions

