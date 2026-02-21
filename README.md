# CivicLab

A comprehensive web application designed to teach financial literacy to Grade 6 students through interactive gameplay. Students learn about banking, loans, money management, and peer-to-peer transactions in a safe, virtual environment.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

> 🚂 **Now optimized for Railway deployment!** Deploy in minutes with our comprehensive guide below.

## ✨ Features

### 🎓 For Students
- **Virtual Bank Account**: Each student gets a personal account with real-time balance tracking
- **Peer-to-Peer Transfers**: Send money to classmates with dropdown selection
- **Loan Applications**: Apply for loans with customizable amounts and purposes
- **Transaction History**: View all account activity with detailed records
- **Financial Dashboard**: Track spending, savings, and loan status

### 👨‍🏫 For Teachers
- **Student Management**: View all students with balances and activity
- **Loan Approval System**: Review and approve/deny student loan applications
- **Class Operations**: Bulk pay or remove money from entire classes
- **Class Filtering**: View statistics for individual classes (6A, 6B, 6C) or all combined
- **Data Export**: Export student, loan, and transaction data as CSV
- **Real-time Monitoring**: Track classroom financial activity

### 🏦 Financial Features
- **Interest-free Loans**: Students can borrow up to $500
- **Automatic Repayments**: Scheduled loan payments with flexible terms
- **Transaction Types**: Deposits, withdrawals, transfers, loan disbursements, and repayments
- **Balance Validation**: Prevents overdrafts and invalid transactions
- **Audit Trail**: Complete transaction history for accountability

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+ and npm 9+
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/gameoflife.git
cd gameoflife

# Install all dependencies (root, server, and client)
npm run install:all

# Start development servers
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### First-Time Setup
1. **Register as a Teacher** first to access admin features
2. **Create student accounts** or let students register themselves
3. **Configure classes** (6A, 6B, 6C) for students
4. **Start the simulation** with initial deposits or loan approvals

## 🚂 Railway Deployment (Production)

### Prerequisites
- GitHub account
- Railway account (free at [railway.app](https://railway.app))
- Code pushed to GitHub

> 🪟 **Windows Users**: See Windows-specific instructions in the deployment section below!

### Quick Deployment (10 minutes)

#### 1️⃣ Create Project & Database
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `gameoflife` repository
4. Click **"New"** → **"Database"** → **"Add PostgreSQL"**

#### 2️⃣ Initialize Database Schema
**Method 1 - Railway Dashboard (Recommended):**
1. Click on the **PostgreSQL** service
2. Go to **"Data"** tab → **"Query"**
3. Copy the entire contents of `server/src/database/schema-postgres.sql`
4. Paste and execute the query

**Method 2 - Command Line:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Link project
railway link

# Import schema
railway run --service backend psql < server/src/database/schema-postgres.sql
```

#### 3️⃣ Deploy Backend
1. In Railway, click **"New"** → **"GitHub Repo"**
2. Select your repository
3. Railway auto-detects Node.js and deploys
4. Add environment variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `your-super-secret-jwt-key-change-this`
   - `DATABASE_URL` = (auto-populated from PostgreSQL service)

#### 4️⃣ Configure Environment
1. **Get your Railway URL** from the deployed service
2. **Update CORS settings** in Railway dashboard if needed
3. **Test the API** at `https://your-app.railway.app/api/health`

### 🪟 Windows-Specific Instructions

**PowerShell Commands:**
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Link project
railway link

# Import schema (Windows method)
Get-Content server/src/database/schema-postgres.sql | railway run --service backend psql

# Or use the dashboard method (recommended)
```

**Database Schema Import (Windows):**
1. Open Railway Dashboard → Your Project → Postgres → Data → Query
2. Copy contents of `server/src/database/schema-postgres.sql`
3. Paste and execute in Railway's query interface

### Environment Variables

#### Backend (Railway)
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
DATABASE_URL=postgresql://... (auto-populated)
CLIENT_URL=https://your-frontend-url.railway.app
```

#### Frontend (if deploying separately)
```env
VITE_API_URL=https://your-backend-url.railway.app
NODE_ENV=production
```

### Troubleshooting

#### Common Issues:
1. **Database Connection**: Verify `DATABASE_URL` is correct
2. **CORS Errors**: Check `CLIENT_URL` matches your frontend domain
3. **Build Failures**: Ensure all dependencies are in `package.json`
4. **Schema Import**: Use Railway dashboard method for Windows users

#### Logs:
```bash
# View Railway logs
railway logs

# View specific service logs
railway logs --service backend
```

## 🎨 Customization

### Styling
- Modify `client/tailwind.config.js` for theme changes
- Update `client/src/index.css` for global styles
- Customize component styles in individual files

### Features
- Add new transaction types in `server/src/database/schema-postgres.sql`
- Implement additional loan features in `server/src/routes/loans.ts`
- Create custom dashboards for specific needs

### Classes
The system supports three classes by default (6A, 6B, 6C). To modify:
1. Update the validation in `server/src/routes/auth.ts`
2. Update the class filter in `client/src/components/TeacherDashboard.tsx`
3. Update the class management in `client/src/components/ClassManagement.tsx`

## 📊 Usage Guide

### For Teachers
1. **Register** as a teacher (first user)
2. **Create student accounts** or let students self-register
3. **Assign classes** (6A, 6B, 6C) to students
4. **Make initial deposits** to student accounts
5. **Monitor loan applications** and approve/deny as needed
6. **Use class operations** for bulk payments or fines
7. **Export data** for grading and analysis

### For Students
1. **Register** with teacher-assigned class
2. **View account balance** and transaction history
3. **Apply for loans** with specific purposes
4. **Transfer money** to classmates using the dropdown
5. **Make loan repayments** when approved
6. **Track financial progress** through the dashboard

## 🔧 Technical Details

### Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT tokens
- **Deployment**: Railway (recommended) or Render

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/students` - Get all students (teachers only)
- `GET /api/students/classmates` - Get classmates (students only)
- `POST /api/transactions/transfer` - Transfer money
- `POST /api/transactions/bulk-payment` - Bulk class payment
- `POST /api/transactions/bulk-removal` - Bulk class removal
- `POST /api/loans/apply` - Apply for loan
- `POST /api/loans/approve` - Approve/deny loan
- `GET /api/export/*` - Export data as CSV

### Database Schema
- **users**: Student and teacher accounts
- **accounts**: Bank account balances
- **transactions**: All financial transactions
- **loans**: Loan applications and details
- **loan_payments**: Scheduled and completed payments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
- Check the [troubleshooting section](#troubleshooting) above
- Review Railway logs: `railway logs`
- Open an issue on GitHub

---

**CivicLab is ready to teach financial literacy! 🎉**

Start with teacher registration, create student accounts, and watch your classroom learn about money management through interactive gameplay.