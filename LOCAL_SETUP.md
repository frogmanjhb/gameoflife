# Local Development Setup Guide

This guide will help you set up the application for local testing before deploying to Railway.

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- PostgreSQL (for production-like testing) OR SQLite (simpler setup)

## Option 1: Quick Setup with SQLite (Simpler)

### Step 1: Install Dependencies

```bash
npm run install:all
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp env.example .env
```

Edit `server/.env` and set:
```env
PORT=5000
NODE_ENV=development
DB_PATH=./gameoflife.db
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-chars
CLIENT_URL=http://localhost:3000
```

### Step 3: Run Database Migrations

The server will automatically run migrations on startup. If you need to run them manually:

```bash
cd server
node migrate.js
```

### Step 4: Seed the Database

```bash
cd server
node seed-town-hub.js
```

### Step 5: Start Development Servers

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:3000` (or next available port)

## Option 2: Setup with PostgreSQL (Production-like)

### Step 1: Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Install and remember your postgres user password

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE gameoflife;

# Exit
\q
```

### Step 3: Set Up Environment Variables

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/gameoflife
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-chars
CLIENT_URL=http://localhost:3000
```

Replace `your_password` with your PostgreSQL password.

### Step 4: Install Dependencies

```bash
npm run install:all
```

### Step 5: Run Migrations

The server will auto-run migrations, or manually:

```bash
cd server
psql $DATABASE_URL < migrations/002_town_hub_tables.sql
psql $DATABASE_URL < migrations/003_job_applications.sql
```

**Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/gameoflife"
Get-Content server/migrations/002_town_hub_tables.sql | psql $env:DATABASE_URL
Get-Content server/migrations/003_job_applications.sql | psql $env:DATABASE_URL
```

### Step 6: Seed Database

```bash
cd server
node seed-town-hub.js
```

### Step 7: Start Development Servers

```bash
npm run dev
```

## Accessing the Application

- **Frontend:** http://localhost:3000 (or the port shown in terminal)
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/health

## Default Login Credentials

After seeding:
- **Teacher:** `teacher1` / `teacher123`
- **Students:** `student1`, `student2`, `student3` / `student123`

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is in use:
- Change `PORT` in `server/.env`
- Vite will automatically use the next available port

### Database Connection Issues

**PostgreSQL:**
- Check PostgreSQL is running: `pg_isready` or `brew services list`
- Verify DATABASE_URL format
- Check firewall settings

**SQLite:**
- Ensure write permissions in server directory
- Check DB_PATH in .env

### CORS Errors

- Ensure `CLIENT_URL` in `.env` matches your frontend URL
- Check browser console for exact error

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules server/node_modules client/node_modules
npm run install:all
```

## Development Workflow

1. Make code changes
2. Both servers auto-reload (thanks to `tsx watch` and Vite)
3. Test in browser at http://localhost:3000
4. Check backend logs in terminal
5. When ready, commit and push to Railway

## Stopping Servers

Press `Ctrl+C` in the terminal running `npm run dev`

## Next Steps

Once local testing is complete:
1. Commit your changes
2. Push to GitHub
3. Railway will auto-deploy
4. Or manually deploy: `railway up`

