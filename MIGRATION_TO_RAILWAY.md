# 🔄 Migrating to Railway

Complete guide for migrating your existing Game of Life deployment to Railway.

## 📋 Prerequisites

- [ ] Existing deployment (Render, Heroku, etc.)
- [ ] Database backup
- [ ] Environment variables documented
- [ ] Railway account created
- [ ] Railway CLI installed (optional)

## 🗄️ Step 1: Backup Your Database

### Export from Current Platform

**From Render:**
```bash
# Get your current DATABASE_URL from Render dashboard
pg_dump $DATABASE_URL > gameoflife_backup.sql
```

**From Heroku:**
```bash
heroku pg:backups:capture --app your-app-name
heroku pg:backups:download --app your-app-name
```

**Alternatively, export from pgAdmin or any PostgreSQL client**

## 🚂 Step 2: Set Up Railway

### Create Project and Database

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Provision PostgreSQL"**
4. Name it `gameoflife-db`

### Import Your Data

**Option A: Railway Dashboard**
1. Click on PostgreSQL service
2. Go to **"Data"** tab
3. Click **"Query"**
4. Paste your backup SQL
5. Execute

**Option B: Command Line**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Import data
railway run --service gameoflife-db psql < gameoflife_backup.sql
```

## 🔧 Step 3: Deploy Backend

1. **Add GitHub Repository**
   - In Railway, click **"New"**
   - Select **"GitHub Repo"**
   - Choose your repository

2. **Configure Backend Service**
   - Name: `gameoflife-backend`
   - Settings → Root Directory: `/`
   - Build Command: `npm run install:all && npm run build`
   - Start Command: `npm start`

3. **Set Environment Variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=<copy-from-current-deployment>
   DATABASE_URL=${{gameoflife-db.DATABASE_URL}}
   CLIENT_URL=<will-update-after-frontend>
   ```

4. **Generate Domain**
   - Settings → Networking → Generate Domain
   - Copy the URL (e.g., `https://gameoflife-production.up.railway.app`)

## 🎨 Step 4: Deploy Frontend

1. **Add Frontend Service**
   - Click **"New"** in your Railway project
   - Select same **"GitHub Repo"**
   - Name: `gameoflife-frontend`

2. **Configure Frontend**
   - Settings → Root Directory: `/client`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist -l $PORT`

3. **Set Environment Variables**
   ```env
   NODE_ENV=production
   VITE_API_URL=<your-backend-url>
   ```

4. **Generate Domain**
   - Settings → Networking → Generate Domain
   - Copy the URL

## 🔄 Step 5: Update Backend CORS

1. Go to backend service
2. Update `CLIENT_URL` variable with frontend URL
3. Save (auto-redeploys)

## ✅ Step 6: Verify Migration

### Test Functionality
- [ ] Frontend loads correctly
- [ ] Can login with existing accounts
- [ ] All student data is preserved
- [ ] Transactions history intact
- [ ] Loan records present
- [ ] Can create new transactions

### Check Endpoints
```bash
# Health check
curl https://your-backend.up.railway.app/api/health

# User count (should match old deployment)
curl https://your-backend.up.railway.app/api/debug/users
```

## 📊 Step 7: Update DNS (if using custom domain)

### Old Platform
1. Note your current CNAME/A records
2. Keep them active during migration

### Railway
1. Go to frontend service → Settings → Networking
2. Add custom domain
3. Get new CNAME target
4. Update DNS records
5. Wait for propagation (5-30 minutes)

### Switch Traffic
1. Test Railway deployment with temporary URL
2. When ready, update DNS to point to Railway
3. Monitor for issues

## 🔐 Step 8: Update Secrets

Copy all secrets from old platform:
- [ ] JWT_SECRET
- [ ] Any API keys
- [ ] Third-party service credentials
- [ ] Custom environment variables

## 📧 Step 9: Notify Users

Send email/announcement:
```
Subject: System Migration - Game of Life Platform

Dear Students and Teachers,

We've upgraded our Game of Life platform to Railway for better performance and reliability!

✅ All your data has been preserved
✅ New URL: https://your-frontend.up.railway.app
✅ Same username and password
✅ Improved speed and uptime

Please update your bookmarks. If you experience any issues, contact [support email].

Happy learning!
```

## 🔍 Step 10: Monitor and Verify

### First 24 Hours
- Monitor Railway logs for errors
- Check response times
- Verify database queries are working
- Test all features thoroughly

### Railway Monitoring
```bash
# View logs
railway logs --service gameoflife-backend

# View frontend logs  
railway logs --service gameoflife-frontend

# Check metrics in Railway dashboard
```

## 🗑️ Step 11: Cleanup Old Deployment

**After 1 week of stable Railway operation:**

1. **Backup old database one final time**
   ```bash
   pg_dump $OLD_DATABASE_URL > final_backup_$(date +%Y%m%d).sql
   ```

2. **Archive old deployment**
   - Download logs
   - Save configuration files
   - Document any custom settings

3. **Remove old services**
   - Render: Suspend or delete services
   - Heroku: Scale down dynos
   - Update payment methods

4. **Update documentation**
   - Update README with new URLs
   - Change deployment guides
   - Update student/teacher handbooks

## 🐛 Troubleshooting

### Data Discrepancies
```sql
-- Count users
SELECT COUNT(*) FROM users;

-- Count transactions
SELECT COUNT(*) FROM transactions;

-- Compare with old database
```

### Connection Issues
- Verify DATABASE_URL is correct
- Check if database service is running
- Review connection pool settings

### Missing Data
- Re-import backup
- Check for SQL errors during import
- Verify table schemas match

## 💰 Cost Comparison

### Before (Render Example)
- Web Services: $7 × 2 = $14/month
- Database: $7/month
- **Total: $21/month**

### After (Railway)
- All services: ~$4/month
- **Savings: $17/month** 💰

## 📞 Rollback Plan

If issues occur:

1. **Immediate rollback**
   - Re-enable old deployment
   - Update DNS back to old platform
   - Notify users

2. **Data sync**
   ```bash
   # Export new data from Railway
   railway run --service gameoflife-db pg_dump > railway_data.sql
   
   # Import to old database
   psql $OLD_DATABASE_URL < railway_data.sql
   ```

3. **Investigate and retry**
   - Review Railway logs
   - Fix issues
   - Attempt migration again

## ✅ Post-Migration Checklist

- [ ] All users can login
- [ ] Data is complete and accurate
- [ ] Performance is acceptable
- [ ] Custom domains working
- [ ] SSL certificates valid
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Users notified
- [ ] Old deployment archived
- [ ] Costs reduced

## 🎉 Success!

Your Game of Life platform is now running on Railway with:
- ⚡ Better performance
- 💰 Lower costs
- 🚀 Faster deployments
- 📈 Better scalability

---

**Questions?** Check [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) or contact Railway support.

