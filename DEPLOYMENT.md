# 🚀 Render Deployment Guide

## Prerequisites
1. GitHub account
2. Render account (free at render.com)
3. Your code pushed to GitHub

## Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

## Step 2: Deploy Backend (API)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the backend service**:
   - **Name**: `gameoflife-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

5. **Add Environment Variables**:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `your-super-secret-jwt-key-change-in-production`
   - `CLIENT_URL` = `https://your-frontend-url.onrender.com` (update after frontend deploy)

6. **Add PostgreSQL Database**:
   - Click "New +" → "PostgreSQL"
   - **Name**: `gameoflife-db`
   - **Plan**: Free
   - Copy the `DATABASE_URL` and add it as an environment variable

7. **Deploy!** Click "Create Web Service"

## Step 3: Deploy Frontend

1. **Click "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure the frontend service**:
   - **Name**: `gameoflife-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
   - **Plan**: Free

4. **Deploy!** Click "Create Static Site"

## Step 4: Update Environment Variables

1. **Get your frontend URL** from Render dashboard
2. **Update backend environment variable**:
   - Go to backend service settings
   - Update `CLIENT_URL` to your frontend URL
   - Redeploy the backend

## Step 5: Initialize Database

1. **Connect to your PostgreSQL database**
2. **Run the schema**:
   ```sql
   -- Copy and paste the contents of server/src/database/schema-postgres.sql
   ```

## Step 6: Test Your Deployment

1. **Visit your frontend URL**
2. **Register as a teacher**
3. **Register as a student**
4. **Test all features**

## Environment Variables Summary

### Backend (API)
- `NODE_ENV` = `production`
- `JWT_SECRET` = `your-secret-key`
- `DATABASE_URL` = `postgresql://...` (from Render database)
- `CLIENT_URL` = `https://your-frontend.onrender.com`

### Frontend
- `NODE_ENV` = `production`

## Troubleshooting

### Common Issues:
1. **CORS errors**: Make sure `CLIENT_URL` is set correctly
2. **Database connection**: Check `DATABASE_URL` is correct
3. **Build failures**: Check build commands and dependencies

### Logs:
- Check Render dashboard for build and runtime logs
- Backend logs: Service → Logs
- Frontend logs: Static Site → Logs

## Cost
- **Free tier**: Perfect for classroom use
- **Backend**: 750 hours/month free
- **Frontend**: Unlimited static hosting
- **Database**: 1GB storage free

## Custom Domain (Optional)
1. Go to service settings
2. Add your custom domain
3. Update DNS records as instructed

---

**Your Game of Life Classroom Simulation is now live! 🎉**

Share the frontend URL with your students and start the financial literacy simulation!
