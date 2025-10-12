# 🚀 Quick Reference Card

## 🎯 What You Need to Know

### Railway Services to Create
1. **PostgreSQL Database** - `gameoflife-db`
2. **Backend Service** - `gameoflife-backend`
3. **Frontend Service** - `gameoflife-frontend`

### Environment Variables

#### Backend (`gameoflife-backend`)
```env
NODE_ENV=production
JWT_SECRET=your-32-character-minimum-secret-here
DATABASE_URL=${{gameoflife-db.DATABASE_URL}}
CLIENT_URL=https://gameoflife-frontend-production.up.railway.app
```

#### Frontend (`gameoflife-frontend`)
```env
NODE_ENV=production
VITE_API_URL=https://gameoflife-backend-production.up.railway.app
```

### Service Configuration

#### Backend
- **Root Directory**: `/`
- **Build Command**: `npm run install:all && npm run build`
- **Start Command**: `npm start`
- **Health Check**: `/api/health`

#### Frontend
- **Root Directory**: `/client`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npx serve -s dist -l $PORT`

### Database Setup
1. Create PostgreSQL in Railway
2. Copy contents of `server/src/database/schema-postgres.sql`
3. Run in Railway's Data → Query tab

### URLs to Update
1. After backend deploys → Copy URL → Update `VITE_API_URL` in frontend
2. After frontend deploys → Copy URL → Update `CLIENT_URL` in backend

### Test URLs
```bash
# Health check
curl https://your-backend.up.railway.app/api/health

# Frontend
open https://your-frontend.up.railway.app
```

### Quick Commands
```bash
# View backend logs
railway logs --service gameoflife-backend

# View frontend logs
railway logs --service gameoflife-frontend

# Redeploy
git push origin main
```

### Cost
- ~$4/month for normal classroom use
- $5/month credit included with Hobby plan

### Support
- Docs: [RAILWAY_QUICKSTART.md](./RAILWAY_QUICKSTART.md)
- Railway: https://docs.railway.app
- Discord: https://discord.gg/railway

---

**Print this page and keep it handy during deployment!** 📄

