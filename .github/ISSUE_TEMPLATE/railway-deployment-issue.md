---
name: Railway Deployment Issue
about: Report a problem with Railway deployment
title: '[Railway] '
labels: deployment, railway
assignees: ''
---

## 🚂 Railway Deployment Issue

### Environment
- [ ] Backend service
- [ ] Frontend service
- [ ] Database
- [ ] Other: __________

### Deployment Stage
- [ ] Initial setup
- [ ] Database initialization
- [ ] Building application
- [ ] Running application
- [ ] Post-deployment
- [ ] Migration from another platform

### Description
<!-- Clear description of the issue -->

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
<!-- What should happen -->

### Actual Behavior
<!-- What actually happens -->

### Railway Logs
```
<!-- Paste relevant logs from Railway dashboard here -->
```

### Environment Variables
<!-- List which environment variables are set (without showing values) -->
- [ ] NODE_ENV
- [ ] JWT_SECRET
- [ ] DATABASE_URL
- [ ] CLIENT_URL
- [ ] VITE_API_URL
- [ ] Other: __________

### Screenshots
<!-- If applicable, add screenshots -->

### Additional Context
<!-- Any other relevant information -->

### Checklist
- [ ] I've read [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md)
- [ ] I've checked [RAILWAY_QUICKSTART.md](../RAILWAY_QUICKSTART.md)
- [ ] I've reviewed the troubleshooting section
- [ ] I've checked Railway logs
- [ ] I've verified environment variables
- [ ] I've tested the health endpoint

### Health Check Response
```bash
curl https://your-backend-url.up.railway.app/api/health
```
<!-- Paste response here -->

