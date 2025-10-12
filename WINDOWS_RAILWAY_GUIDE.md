# 🪟 Railway Deployment Guide for Windows Users

Special instructions for deploying Game of Life to Railway on Windows PowerShell.

## ⚠️ PowerShell vs Bash Differences

Windows PowerShell doesn't support the `<` redirection operator used in Unix/Linux. This guide provides Windows-compatible commands.

## 🗄️ Database Schema Import (Windows)

### ✅ Method 1: Railway Dashboard (Recommended - Easiest!)

1. **Open Railway Dashboard**
   - Go to: https://railway.app/dashboard
   - Click on your project (`bankoflife`)
   - Click on **"Postgres"** service

2. **Open Query Interface**
   - Click the **"Data"** tab at the top
   - Click **"Query"** button
   
3. **Copy the SQL Schema**
   - Open `server/src/database/schema-postgres.sql` in VS Code
   - Press `Ctrl+A` to select all
   - Press `Ctrl+C` to copy

4. **Execute the Schema**
   - Paste into Railway's query box
   - Click **"Run Query"**
   - You should see success messages for all tables

### ✅ Method 2: PowerShell Compatible Command

```powershell
# Instead of: railway run psql < file.sql
# Use this:
Get-Content server/src/database/schema-postgres.sql | railway run psql
```

**Note**: This requires `psql` to be installed on your machine.

### ✅ Method 3: Using pgAdmin (GUI Tool)

1. **Download pgAdmin**
   - Go to: https://www.pgadmin.org/download/
   - Download and install pgAdmin 4

2. **Get Connection Details**
   ```powershell
   railway variables --service Postgres
   ```
   
   Or use Railway dashboard → Postgres service → Connect tab

3. **Connect in pgAdmin**
   - Right-click "Servers" → "Register" → "Server"
   - **General Tab**:
     - Name: `Railway - Bank of Life`
   - **Connection Tab**:
     - Host: `switchback.proxy.rlwy.net`
     - Port: `27530` (your specific port)
     - Database: `railway`
     - Username: `postgres`
     - Password: (get from Railway dashboard)
   
4. **Run Schema**
   - Right-click on database → "Query Tool"
   - Open `schema-postgres.sql`
   - Click Execute (F5)

### ✅ Method 4: Using DBeaver (Free Alternative)

1. **Download DBeaver**
   - Go to: https://dbeaver.io/download/
   - Download Community Edition

2. **Create Connection**
   - New Database Connection → PostgreSQL
   - Use the PUBLIC_URL from Railway
   
3. **Import SQL**
   - Right-click database → SQL Editor
   - Open and execute `schema-postgres.sql`

## 🚀 Windows PowerShell Commands

### Railway CLI Commands (Work on Windows)

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Check status
railway status

# View logs
railway logs

# Deploy
railway up

# Open dashboard
railway open

# Get environment variables
railway variables

# Set environment variable
railway variables --set KEY=VALUE
```

### Git Commands (Windows)

```powershell
# Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Deploy to Railway"
git push origin main

# Check status
git status

# View recent commits
git log --oneline -5
```

## 🔧 Windows-Specific Tips

### Use Git Bash for Unix Commands

If you have Git installed, you can use Git Bash:

1. Right-click in project folder
2. Select "Git Bash Here"
3. Now you can use Unix commands:
   ```bash
   railway run psql < server/src/database/schema-postgres.sql
   ```

### Path Separators

Windows uses backslashes `\`, but forward slashes `/` work in most Node.js tools:

```powershell
# Both work:
cd server\src\database
cd server/src/database
```

### Environment Variables

In PowerShell:
```powershell
# Set temporarily (current session only)
$env:NODE_ENV = "production"

# View
echo $env:NODE_ENV

# In .env files, use same format as Unix
NODE_ENV=production
```

## 📁 File Paths in Windows

### VS Code Terminal

In VS Code, you can switch terminal types:
1. Open Terminal (`Ctrl+``)
2. Click dropdown next to `+` button
3. Choose "Git Bash" or "PowerShell"

### Quick File Copy

```powershell
# Copy file contents to clipboard (Windows)
Get-Content server/src/database/schema-postgres.sql | Set-Clipboard

# Now paste in Railway dashboard with Ctrl+V
```

## 🎯 Complete Windows Deployment Checklist

### 1. Prerequisites
- [ ] Node.js installed (check: `node --version`)
- [ ] Git installed (check: `git --version`)
- [ ] Railway CLI installed (check: `railway --version`)
- [ ] Code pushed to GitHub

### 2. Railway Setup
```powershell
# Login to Railway
railway login

# Link to project
railway link

# Verify connection
railway status
```

### 3. Database Setup (Choose one method)
- [ ] **Option A**: Railway Dashboard → Data → Query → Paste SQL
- [ ] **Option B**: Use pgAdmin with connection details
- [ ] **Option C**: Use DBeaver with PUBLIC_URL
- [ ] **Option D**: Git Bash: `railway run psql < schema.sql`

### 4. Deploy Services

Your services will auto-deploy from GitHub. Check status:
```powershell
# View deployment logs
railway logs
```

### 5. Configure Environment Variables

In Railway Dashboard or via CLI:
```powershell
# Backend service
railway variables --service backend --set NODE_ENV=production
railway variables --service backend --set JWT_SECRET=your-secret-here
railway variables --service backend --set CLIENT_URL=https://your-frontend.up.railway.app

# Frontend service  
railway variables --service frontend --set NODE_ENV=production
railway variables --service frontend --set VITE_API_URL=https://your-backend.up.railway.app
```

## 🐛 Windows-Specific Troubleshooting

### Issue: Railway CLI not recognized

```powershell
# Solution 1: Restart terminal after installation
# Close and reopen PowerShell

# Solution 2: Install locally in project
npm install @railway/cli
npx railway login

# Solution 3: Use npx
npx @railway/cli login
```

### Issue: Permission denied

```powershell
# Run PowerShell as Administrator
# Right-click PowerShell → "Run as Administrator"
```

### Issue: Execution policy

```powershell
# If you get execution policy errors:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then retry your command
```

### Issue: Path too long

```powershell
# Enable long paths in Windows
# Run as Administrator:
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### Issue: Line endings (CRLF vs LF)

```powershell
# Configure Git to handle line endings
git config --global core.autocrlf true
```

## 📱 Useful Windows Tools

### Recommended Tools
1. **VS Code** - Best editor for web development
2. **Windows Terminal** - Better than default PowerShell
3. **Git Bash** - Unix commands on Windows
4. **pgAdmin** - PostgreSQL GUI client
5. **Postman** - API testing

### Windows Terminal (Recommended)

Download from Microsoft Store: "Windows Terminal"

Benefits:
- Multiple tabs
- Better colors
- Copy/paste works better
- Git Bash integration

## 🎨 Quick Copy-Paste SQL

Here's the complete schema for easy copy-paste:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher')),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    class VARCHAR(10),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    from_account_id INTEGER REFERENCES accounts(id),
    to_account_id INTEGER REFERENCES accounts(id),
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'loan_disbursement', 'loan_repayment', 'salary', 'fine')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    term_months INTEGER NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'active', 'paid_off')),
    outstanding_balance DECIMAL(10,2) NOT NULL,
    monthly_payment DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    due_date DATE
);

-- Loan payments table
CREATE TABLE IF NOT EXISTS loan_payments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
```

**To use**: Press `Ctrl+A` on this block, `Ctrl+C` to copy, then paste in Railway Query interface.

## 🎉 Success!

Once your schema is imported and services are deployed:

1. **Check backend health**:
   ```powershell
   curl https://your-backend.up.railway.app/api/health
   ```

2. **Open frontend**:
   ```powershell
   start https://your-frontend.up.railway.app
   ```

3. **View logs**:
   ```powershell
   railway logs
   ```

---

**Windows-specific help complete!** 🪟✅

For general Railway instructions, see [RAILWAY_QUICKSTART.md](./RAILWAY_QUICKSTART.md)

