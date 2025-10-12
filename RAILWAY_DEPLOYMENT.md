# 🚂 Railway Deployment Guide

Complete guide to deploying the Game of Life Classroom Simulation on Railway.

## Prerequisites
- GitHub account
- Railway account (free at [railway.app](https://railway.app))
- Your code pushed to GitHub

## 🎯 Deployment Strategy

Railway will host:
1. **Backend API** (Node.js/Express server)
2. **Frontend** (React static site)
3. **PostgreSQL Database**

## 📦 Step 1: Prepare Your Repository

1. **Ensure all files are committed**:
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

## 🗄️ Step 2: Create PostgreSQL Database

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click "New Project"**
3. **Select "Provision PostgreSQL"**
4. **Name it**: `gameoflife-db`
5. **Copy the connection details** (you'll need these later)

### Initialize Database Schema

6. **Click on the PostgreSQL service**
7. **Go to "Data" tab**
8. **Click "Query"**
9. **Copy and paste the entire contents** of `server/src/database/schema-postgres.sql`
10. **Execute the query** to create all tables

Alternatively, you can connect using a PostgreSQL client:
```bash
# Get the DATABASE_URL from Railway dashboard
psql $DATABASE_URL < server/src/database/schema-postgres.sql
```

## 🔧 Step 3: Deploy Backend (API)

1. **In Railway Dashboard, click "New"**
2. **Select "GitHub Repo"**
3. **Connect your repository**
4. **Configure the backend service**:
   - **Name**: `gameoflife-backend`
   - Railway will auto-detect it as a Node.js project

### Set Environment Variables

5. **Click on the service → "Variables" tab**
6. **Add the following variables**:

   ```env
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=${{PORT}}
   DATABASE_URL=${{gameoflife-db.DATABASE_URL}}
   CLIENT_URL=https://your-frontend-url.up.railway.app
   ```

   **Note**: Railway automatically provides `PORT` and you can reference the database URL using `${{gameoflife-db.DATABASE_URL}}`

### Configure Build Settings

7. **Go to "Settings" tab**
8. **Build settings**:
   - **Root Directory**: `/`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`

9. **Click "Deploy"**

### Get Your Backend URL

10. **Go to "Settings" → "Networking"**
11. **Click "Generate Domain"**
12. **Copy your backend URL** (e.g., `https://gameoflife-backend-production.up.railway.app`)

## 🎨 Step 4: Deploy Frontend

### Option A: Deploy as Static Site (Recommended)

1. **In Railway Dashboard, click "New" in your project**
2. **Select "GitHub Repo"** (same repository)
3. **Configure the frontend service**:
   - **Name**: `gameoflife-frontend`

### Configure Frontend Build

4. **Go to "Settings" tab**
5. **Build settings**:
   - **Root Directory**: `/client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`

### Set Environment Variables

6. **Add these variables**:
   ```env
   NODE_ENV=production
   VITE_API_URL=https://your-backend-url.up.railway.app
   PORT=${{PORT}}
   ```

### Generate Frontend Domain

7. **Go to "Settings" → "Networking"**
8. **Click "Generate Domain"**
9. **Copy your frontend URL**

## 🔄 Step 5: Update Backend CORS

1. **Go back to your backend service**
2. **Update the `CLIENT_URL` variable** with your actual frontend URL
3. **Redeploy the backend** (click "Deploy" or push a new commit)

## 🧪 Step 6: Test Your Deployment

1. **Visit your frontend URL**
2. **Register as a teacher** (first user becomes admin)
3. **Create some students**
4. **Test transactions, loans, and transfers**

### Health Check

Your backend should respond at:
```
https://your-backend-url.up.railway.app/api/health
```

## 📋 Environment Variables Summary

### Backend Service (`gameoflife-backend`)
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
PORT=${{PORT}}
DATABASE_URL=${{gameoflife-db.DATABASE_URL}}
CLIENT_URL=https://gameoflife-frontend-production.up.railway.app
```

### Frontend Service (`gameoflife-frontend`)
```env
NODE_ENV=production
VITE_API_URL=https://gameoflife-backend-production.up.railway.app
PORT=${{PORT}}
```

### PostgreSQL Database (`gameoflife-db`)
- Automatically configured by Railway
- Connection string available as `DATABASE_URL`

## 🚀 Alternative: Monorepo Deployment

If you prefer to deploy everything as one service:

1. **Create a single service from your repo**
2. **Use the `railway.toml` configuration** (already included)
3. **Set all environment variables**
4. **Railway will build and serve both frontend and backend**

## 🔍 Monitoring & Logs

### View Logs
1. **Click on any service**
2. **Go to "Deployments" tab**
3. **Click on the latest deployment**
4. **View real-time logs**

### Metrics
- **CPU Usage**: Railway dashboard shows CPU metrics
- **Memory**: Monitor memory usage per service
- **Requests**: Track API requests in logs

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: connect ECONNREFUSED
```
**Solution**: 
- Verify `DATABASE_URL` is set correctly
- Check database service is running
- Ensure schema has been initialized

#### 2. CORS Errors
```
Access to fetch has been blocked by CORS policy
```
**Solution**:
- Update `CLIENT_URL` in backend to match frontend URL
- Redeploy backend after updating

#### 3. Build Failures
```
npm ERR! code ELIFECYCLE
```
**Solution**:
- Check build logs for specific errors
- Verify `package.json` scripts are correct
- Ensure all dependencies are listed

#### 4. 502 Bad Gateway
**Solution**:
- Check if backend is listening on `process.env.PORT`
- Verify start command is correct
- Check logs for startup errors

### Reset Database
If you need to reset the database:
1. **Go to PostgreSQL service**
2. **Variables tab → Delete `DATABASE_URL`**
3. **Click "New Empty Database"**
4. **Re-run the schema SQL**

## 💰 Pricing

### Hobby Plan (Free)
- **$5 credit/month** included
- Perfect for classroom use
- Supports all features
- Automatic deployments

### Pro Plan ($20/month)
- Higher resource limits
- Priority support
- Custom domains
- More environments

## 🌐 Custom Domain (Optional)

1. **Go to service "Settings"**
2. **Click "Networking"**
3. **Add custom domain**
4. **Update DNS records**:
   - Add CNAME record pointing to Railway
   - Wait for DNS propagation (5-30 minutes)

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway will:
1. Detect the push
2. Build your application
3. Deploy automatically
4. Keep previous version running until new one is ready

## 🔐 Security Best Practices

1. **Use strong JWT secrets** (minimum 32 characters)
2. **Enable Railway's automatic SSL**
3. **Use environment variables** for all secrets
4. **Review database backups** regularly
5. **Monitor deployment logs** for suspicious activity

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Discord Community**: https://discord.gg/railway
- **GitHub Issues**: Create issue in your repository
- **Railway Status**: https://status.railway.app

## 🎉 Success!

Your Game of Life Classroom Simulation is now live on Railway!

### Share With Students
1. **Frontend URL**: Where students login
2. **Teacher Credentials**: Create teacher accounts
3. **Student Guide**: Share login instructions

---

**Happy Teaching! 🎓💰**

*Need help? Check the troubleshooting section or create a GitHub issue.*

