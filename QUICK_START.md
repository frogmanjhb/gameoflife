# 🚀 Quick Start - Local Development with PostgreSQL

Follow these steps to get the Game of Life running on your local machine.

---

## Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js 18+** - [Download here](https://nodejs.org/)
- ✅ **PostgreSQL** - [Download here](https://www.postgresql.org/download/)
- ✅ **Git** - [Download here](https://git-scm.com/)

To verify your installations, open a terminal and run:
```bash
node --version    # Should show v18.x.x or higher
psql --version    # Should show PostgreSQL version
```

---

## Step 1: Install Dependencies

Open a terminal in the project folder and run:

```bash
npm run install:all
```

> 💡 If you're setting up on a new machine, clone the repo first:
> ```bash
> git clone https://github.com/yourusername/gameoflife.git
> cd gameoflife
> ```

---

## Step 2: Set Up PostgreSQL Database

Choose ONE of these options:

---

### Option A: Use Railway PostgreSQL (Recommended - Easiest!)

No local PostgreSQL installation needed!

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"** → **"Provision PostgreSQL"**
3. Click on the PostgreSQL service
4. Go to **"Variables"** tab
5. Copy the `DATABASE_URL` value (starts with `postgresql://...`)

That's it! You'll paste this in Step 4.

---

### Option B: Use Local PostgreSQL

If you prefer a local database:

**Using pgAdmin (GUI):**
1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name it `gameoflife`
4. Click "Save"

**Using Command Line:**

*Windows (PowerShell):*
```powershell
psql -U postgres
```
When prompted, enter your PostgreSQL password. Then:
```sql
CREATE DATABASE gameoflife;
\q
```

*Mac/Linux:*
```bash
createdb gameoflife
```

---

## Step 3: Create Your Environment File

**Windows (PowerShell):**
```powershell
Copy-Item server\env.example server\.env
```

**Mac/Linux:**
```bash
cp server/env.example server/.env
```

---

## Step 4: Configure Your Environment

Open `server/.env` in a text editor and update these values:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=pick-any-random-string-at-least-32-characters-long
CLIENT_URL=http://localhost:3000
DATABASE_URL=your-database-url-here
```

**For the DATABASE_URL:**

- **If using Railway:** Paste the `DATABASE_URL` you copied from Railway
  ```
  DATABASE_URL=postgresql://postgres:xxxx@containers-us-west-xxx.railway.app:5432/railway
  ```

- **If using local PostgreSQL:** Use your local connection string
  ```
  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/gameoflife
  ```

---

## Step 5: Initialize the Database

The database tables are created automatically when you start the server, but you need to seed it with initial data.

**Windows (PowerShell):**
```powershell
cd server
node seed-town-hub.js
cd ..
```

**Mac/Linux:**
```bash
cd server
node seed-town-hub.js
cd ..
```

You should see output like:
```
✅ Seeding complete!
✅ Created towns for classes: 6A, 6B, 6C
✅ Created 22 jobs
```

---

## Step 6: Start the Development Servers

From the project root directory:

```bash
npm run dev
```

This starts both the frontend and backend. Wait for:
```
✅ Server running on port 5000
  ➜  Local:   http://localhost:3000/
```

---

## Step 7: Open in Browser

🎉 **You're ready!**

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

---

## Default Login Credentials

After seeding, use these accounts:

| Role    | Username   | Password     |
|---------|------------|--------------|
| Teacher | `teacher1` | `teacher123` |
| Student | `student1` | `student123` |
| Student | `student2` | `student123` |
| Student | `student3` | `student123` |

---

## 🛠 Troubleshooting

### "Cannot connect to database"

1. **Is PostgreSQL running?**
   - Windows: Check Services app for "postgresql"
   - Mac: Run `brew services list` or check Activity Monitor
   - Linux: Run `sudo systemctl status postgresql`

2. **Is your password correct in `.env`?**
   - Check `DATABASE_URL` has the right password
   - Try connecting manually: `psql -U postgres -d gameoflife`

3. **Does the database exist?**
   ```bash
   psql -U postgres -c "\l"
   ```
   Look for `gameoflife` in the list.

### "Port 5000 already in use"

Change `PORT` in `server/.env` to another port (e.g., `5001`).

### "Module not found" errors

Clean install dependencies:
```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules, server\node_modules, client\node_modules
npm run install:all

# Mac/Linux
rm -rf node_modules server/node_modules client/node_modules
npm run install:all
```

### "CORS error" in browser

Make sure `CLIENT_URL` in `server/.env` is exactly `http://localhost:3000`

---

## 🔄 Resetting the Database

To start fresh with a clean database:

**Windows (PowerShell):**
```powershell
psql -U postgres -c "DROP DATABASE IF EXISTS gameoflife;"
psql -U postgres -c "CREATE DATABASE gameoflife;"
cd server
node seed-town-hub.js
cd ..
npm run dev
```

**Mac/Linux:**
```bash
psql -U postgres -c "DROP DATABASE IF EXISTS gameoflife;"
psql -U postgres -c "CREATE DATABASE gameoflife;"
cd server && node seed-town-hub.js && cd ..
npm run dev
```

---

## 🛑 Stopping the Servers

Press `Ctrl+C` in the terminal where the servers are running.

---

## Tips

- 💡 Both servers auto-reload when you save changes
- 💡 Check the terminal for backend errors
- 💡 Check browser console (F12) for frontend errors
- 💡 The frontend runs on port 3000, backend on port 5000

---

## Need More Help?

- Check the full [README.md](./README.md) for detailed documentation
- Open an issue on GitHub
