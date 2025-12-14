import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import loanRoutes from './routes/loans';
import studentRoutes from './routes/students';
import exportRoutes from './routes/export';
import mathGameRoutes from './routes/math-game';
import pluginRoutes from './routes/plugins';
import announcementRoutes from './routes/announcements';
import townRoutes from './routes/town';
import database from './database/database-prod';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Configure CORS for multiple deployment platforms
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.CLIENT_URL || 'https://gameoflife-frontend.onrender.com',
      'https://gameoflife-5jf4.onrender.com',
      // Railway domains
      /\.railway\.app$/,
      /\.up\.railway\.app$/
    ].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed`);
      callback(null, true); // Still allow but log for debugging
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health check (no database dependency) - Railway healthcheck endpoint
app.get('/health', (req, res) => {
  // Allow Railway healthcheck hostname
  const allowedHosts = ['healthcheck.railway.app', 'localhost', '127.0.0.1'];
  const host = req.get('host')?.split(':')[0];
  
  if (host && !allowedHosts.includes(host)) {
    console.log(`Health check request from unexpected host: ${host}`);
  }
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: process.env.PORT || 5000
  });
});

// Detailed health check (must come before other routes)
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const healthStatus: {
    status: string;
    timestamp: string;
    uptime: number;
    database: string;
    responseTime: number;
    error?: string;
  } = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'unknown',
    responseTime: 0
  };

  try {
    // Test database connectivity with timeout
    const dbTestPromise = database.query('SELECT 1 as test');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    );
    
    await Promise.race([dbTestPromise, timeoutPromise]);
    healthStatus.database = 'connected';
    
    res.json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    healthStatus.status = 'ERROR';
    healthStatus.database = 'disconnected';
    healthStatus.error = error instanceof Error ? error.message : String(error);
    
    // Still return 200 for basic health, 500 for critical failures
    const statusCode = error instanceof Error && error.message.includes('timeout') ? 200 : 500;
    res.status(statusCode).json(healthStatus);
  } finally {
    healthStatus.responseTime = Date.now() - startTime;
  }
});

// Debug endpoint to check database state
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await database.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/math-game', mathGameRoutes);
app.use('/api/plugins', pluginRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/town', townRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Serve static files from client/dist in production  
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = join(__dirname, '..', '..', 'client', 'dist');
  console.log('📁 Attempting to serve static files from:', clientDistPath);
  console.log('📁 __dirname is:', __dirname);
  console.log('📁 process.cwd():', process.cwd());
  
  // Check if dist exists
  if (existsSync(clientDistPath)) {
    console.log('✅ Client dist folder exists!');
    const files = readdirSync(clientDistPath);
    console.log('📄 Files in dist:', files);
    app.use(express.static(clientDistPath));
    
    // Handle SPA routing - send index.html for all non-API routes (MUST BE LAST)
    app.get('*', (req, res) => {
      const indexPath = join(clientDistPath, 'index.html');
      console.log('📄 Serving index.html from:', indexPath);
      res.sendFile(indexPath);
    });
  } else {
    console.error('❌ Client dist folder NOT found at:', clientDistPath);
    app.get('*', (req, res) => {
      res.status(500).json({ 
        error: 'Frontend not built', 
        path: clientDistPath,
        cwd: process.cwd()
      });
    });
  }
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Initialize database
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    const schemaPath = join(__dirname, 'database', 'schema-postgres.sql');
    console.log('📁 Schema path:', schemaPath);
    
    // Test database connection first
    await database.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Add new columns if they don't exist (migration)
    try {
      await database.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS class VARCHAR(10),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
        ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL
      `);
      console.log('✅ Database migration completed');
    } catch (migrationError) {
      console.log('⚠️ Migration may have already been applied:', migrationError);
    }
    
    // Run Town Hub migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '002_town_hub_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Town Hub migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Town Hub migration may have already been applied:', migrationError);
    }
    
    const schema = readFileSync(schemaPath, 'utf8');
    await database.query(schema);
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    // Don't exit, just log the error - the database might already be initialized
  }
}

// Start server
async function startServer() {
  // Initialize database in background, don't block server startup
  initializeDatabase().catch(console.error);
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Game of Life Classroom Simulation API`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Detailed health: http://localhost:${PORT}/api/health`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

startServer().catch(console.error);
