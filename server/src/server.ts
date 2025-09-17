import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import loanRoutes from './routes/loans';
import studentRoutes from './routes/students';
import exportRoutes from './routes/export';
import database from './database/database-prod';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.CLIENT_URL || 'https://gameoflife-frontend.onrender.com',
        'https://gameoflife-5jf4.onrender.com'
      ] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    const schemaPath = join(__dirname, 'database', 'schema-postgres.sql');
    console.log('📁 Schema path:', schemaPath);
    
    const schema = readFileSync(schemaPath, 'utf8');
    await database.query(schema);
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Error details:', error.message);
    // Don't exit, just log the error - the database might already be initialized
  }
}

// Start server
async function startServer() {
  // Initialize database in background, don't block server startup
  initializeDatabase().catch(console.error);
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Game of Life Classroom Simulation API`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);
