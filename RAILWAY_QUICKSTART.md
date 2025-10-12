# 🚂 Railway Quick Start Guide

Deploy your Game of Life app to Railway in under 10 minutes!

## Prerequisites
- ✅ GitHub account
- ✅ Railway account (sign up at [railway.app](https://railway.app))
- ✅ Code pushed to GitHub

## 🎯 Step-by-Step Deployment

### 1️⃣ Create New Project (2 minutes)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `gameoflife` repository
5. Railway will create a project

### 2️⃣ Add PostgreSQL Database (1 minute)

1. In your project, click **"New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically provisions the database
4. Click on the database service
5. Go to **"Connect"** tab and note the connection details

### 3️⃣ Initialize Database Schema (2 minutes)

**Option A: Using Railway's Data Tab**
1. Click on your PostgreSQL service
2. Go to **"Data"** tab
3. Click **"Query"**
4. Copy the entire content from `server/src/database/schema-postgres.sql`
5. Paste and click **"Run Query"**

**Option B: Using Command Line**
```bash
# Get DATABASE_URL from Railway dashboard
railway link
railway run psql < server/src/database/schema-postgres.sql
```

### 4️⃣ Configure Backend Service (3 minutes)

1. Click on your web service (auto-created)
2. Rename it to **"gameoflife-backend"**
3. Go to **"Variables"** tab
4. Click **"New Variable"** and add:

```env
NODE_ENV=production
JWT_SECRET=change-this-to-a-secure-random-string-minimum-32-characters
CLIENT_URL=https://your-frontend-will-go-here.up.railway.app
```

5. Add database connection:
   - Click **"New Variable"**
   - Select **"Add Reference"**
   - Choose your PostgreSQL database
   - Select `DATABASE_URL`

6. Go to **"Settings"** tab:
   - **Root Directory**: Leave empty or `/`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - Click **"Save"**

7. Go to **"Settings"** → **"Networking"**:
   - Click **"Generate Domain"**
   - Copy your backend URL (e.g., `https://gameoflife-production.up.railway.app`)

### 5️⃣ Add Frontend Service (2 minutes)

1. In your project, click **"New"**
2. Select **"GitHub Repo"** → Choose same repository
3. Rename service to **"gameoflife-frontend"**
4. Go to **"Variables"** tab and add:

```env
NODE_ENV=production
VITE_API_URL=https://your-backend-url.up.railway.app
```

5. Go to **"Settings"** tab:
   - **Root Directory**: `/client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`
   - Click **"Save"**

6. Go to **"Settings"** → **"Networking"**:
   - Click **"Generate Domain"**
   - Copy your frontend URL

### 6️⃣ Update Backend CORS (1 minute)

1. Go back to **gameoflife-backend** service
2. Open **"Variables"** tab
3. Update `CLIENT_URL` with your actual frontend URL
4. The service will automatically redeploy

### 7️⃣ Test Your Deployment! 🎉

1. Visit your frontend URL
2. Click **"Register"** → Create teacher account
3. Login and create some students
4. Test transactions and loans

## 🔍 Verify Deployment

### Health Check
```bash
curl https://your-backend-url.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## 📋 Environment Variables Checklist

### Backend (`gameoflife-backend`)
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET=<your-secure-secret>`
- [ ] `CLIENT_URL=<your-frontend-url>`
- [ ] `DATABASE_URL=<reference-to-postgres>`
- [ ] `PORT` (automatically set by Railway)

### Frontend (`gameoflife-frontend`)
- [ ] `NODE_ENV=production`
- [ ] `VITE_API_URL=<your-backend-url>`
- [ ] `PORT` (automatically set by Railway)

### Database (`PostgreSQL`)
- [ ] Schema initialized ✓
- [ ] Connected to backend ✓

## 🎨 Optional: Custom Domain

1. Go to service **"Settings"** → **"Networking"**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `gameoflife.yourschool.com`)
4. Update your DNS:
   ```
   CNAME: your-domain → your-service.up.railway.app
   ```
5. Wait for DNS propagation (5-30 minutes)

## 🔄 Auto-Deploy

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway handles:
- ✅ Building both services
- ✅ Zero-downtime deployment
- ✅ Rollback on failure
- ✅ Health checks

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs in Railway dashboard
# Verify DATABASE_URL is set
# Ensure schema is initialized
```

### CORS errors
```bash
# Verify CLIENT_URL matches frontend domain exactly
# Check backend logs for origin rejections
# Update CLIENT_URL and redeploy
```

### Database connection failed
```bash
# Verify DATABASE_URL reference is correct
# Check PostgreSQL service is running
# Review database connection logs
```

### Build failures
```bash
# Check build logs in Railway dashboard
# Verify package.json scripts are correct
# Ensure all dependencies are listed
```

## 💰 Cost Estimate

**Hobby Plan (Free Trial)**
- $5 credit/month included
- Enough for classroom use
- ~500 hours of runtime

**Typical Usage for 1 Class**
- Backend: ~$3/month
- Frontend: ~$1/month
- Database: Included
- **Total: ~$4/month**

## 📞 Get Help

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Status Page**: https://status.railway.app

## ✅ Success Checklist

- [ ] PostgreSQL database created and schema initialized
- [ ] Backend deployed with all environment variables
- [ ] Frontend deployed with API URL configured
- [ ] Backend health check returns 200 OK
- [ ] Can register and login as teacher
- [ ] Can create students
- [ ] Can perform transactions
- [ ] Can apply for loans

## 🎓 Next Steps

1. **Share the frontend URL** with your students
2. **Create teacher accounts** for other instructors
3. **Set up student accounts** or let them self-register
4. **Monitor usage** in Railway dashboard
5. **Set up backups** (Railway auto-backs up database)

---

**Congratulations! Your Game of Life Classroom Simulation is live! 🎉**

For detailed documentation, see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

