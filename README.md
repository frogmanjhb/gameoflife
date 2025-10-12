# 🎮 Game of Life Classroom Simulation

A comprehensive web application designed to teach financial literacy to Grade 6 students through interactive gameplay. Students learn about banking, loans, money management, and peer-to-peer transactions in a safe, virtual environment.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

> 🚂 **Now optimized for Railway deployment!** Deploy in minutes with our [Quick Start Guide](./RAILWAY_QUICKSTART.md) | [Full Guide](./RAILWAY_DEPLOYMENT.md) | [Migration Guide](./MIGRATION_TO_RAILWAY.md)

## ✨ Features

### 🎓 Student Features
- **Virtual Bank Account**: Each student gets a unique account with balance tracking
- **Peer-to-Peer Transfers**: Send money to classmates with descriptions
- **Loan System**: Apply for loans with teacher approval required
- **Transaction History**: View all financial activities
- **Real-time Balance Updates**: See account changes instantly

### 👨‍🏫 Teacher Features
- **Student Management**: View all students and their account balances
- **Money Management**: Deposit salaries, bonuses, or deduct fines
- **Loan Approval**: Review and approve/deny student loan applications
- **Transaction Monitoring**: Track all classroom financial activity
- **Class Analytics**: See top savers and spending patterns

### 🏦 Banking System
- **Secure Authentication**: JWT-based login system
- **Role-based Access**: Separate interfaces for students and teachers
- **Transaction Logging**: Complete audit trail of all financial activities
- **Loan Tracking**: Monitor loan status, payments, and outstanding balances

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gameoflife
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cd server
   cp env.example .env
   # Edit .env with your preferred settings
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🏗️ Project Structure

```
gameoflife/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── database/      # Database schema and connection
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── types/         # TypeScript types
│   └── package.json
└── package.json           # Root package.json
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQLite** database (easily switchable to PostgreSQL)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

## 📊 Database Schema

The application uses a SQLite database with the following tables:

- **users**: Student and teacher accounts
- **accounts**: Bank account information
- **transactions**: All financial transactions
- **loans**: Loan applications and details
- **loan_payments**: Loan payment history

## 🎯 Educational Goals

This application helps students learn:

1. **Financial Responsibility**: Managing virtual money
2. **Banking Concepts**: Accounts, balances, transactions
3. **Loan Understanding**: Interest, payments, debt management
4. **Peer Interaction**: Transferring money between classmates
5. **Decision Making**: When to save, spend, or borrow

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
DB_PATH=./gameoflife.db
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:3000
```

### Database

The application automatically creates the SQLite database and tables on first run. For production, consider switching to PostgreSQL:

1. Install PostgreSQL
2. Update the database connection in `server/src/database/database.ts`
3. Run the schema SQL against your PostgreSQL instance

## 🚀 Deployment

### Railway (Recommended)

This application is optimized for Railway deployment. See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for complete instructions.

**Quick Start:**
1. Push your code to GitHub
2. Connect repository to Railway
3. Provision PostgreSQL database
4. Deploy backend and frontend services
5. Configure environment variables

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

For detailed deployment instructions, see:
- **Railway**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Render**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🎨 Customization

### Styling
- Modify `client/tailwind.config.js` for theme changes
- Update `client/src/index.css` for global styles
- Customize component styles in individual files

### Features
- Add new transaction types in the database schema
- Implement additional loan features
- Create custom dashboards for specific needs

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
1. Check the GitHub Issues page
2. Create a new issue with detailed information
3. Contact the development team

## 🎉 Acknowledgments

- Designed for Grade 6 financial literacy education
- Inspired by real-world banking and loan systems
- Built with modern web technologies for educational use

---

**Happy Learning! 🎓💰**
