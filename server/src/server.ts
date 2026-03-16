// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import loanRoutes from './routes/loans';
import studentRoutes from './routes/students';
import exportRoutes from './routes/export';
import mathGameRoutes from './routes/math-game';
import wordleGameRoutes from './routes/wordle-game';
import architectGameRoutes from './routes/jobchallenges/architect-game';
import accountantGameRoutes from './routes/jobchallenges/accountant-game';
import softwareEngineerGameRoutes from './routes/jobchallenges/software-engineer-game';
import marketingManagerGameRoutes from './routes/jobchallenges/marketing-manager-game';
import graphicDesignerGameRoutes from './routes/jobchallenges/graphic-designer-game';
import journalistGameRoutes from './routes/jobchallenges/journalist-game';
import eventPlannerGameRoutes from './routes/jobchallenges/event-planner-game';
import financialManagerGameRoutes from './routes/jobchallenges/financial-manager-game';
import hrDirectorGameRoutes from './routes/jobchallenges/hr-director-game';
import policeLieutenantGameRoutes from './routes/jobchallenges/police-lieutenant-game';
import lawyerGameRoutes from './routes/jobchallenges/lawyer-game';
import townPlannerGameRoutes from './routes/jobchallenges/town-planner-game';
import electricalEngineerGameRoutes from './routes/jobchallenges/electrical-engineer-game';
import civilEngineerGameRoutes from './routes/jobchallenges/civil-engineer-game';
import principalGameRoutes from './routes/jobchallenges/principal-game';
import teacherGameRoutes from './routes/jobchallenges/teacher-game';
import nurseGameRoutes from './routes/jobchallenges/nurse-game';
import doctorGameRoutes from './routes/jobchallenges/doctor-game';
import retailManagerGameRoutes from './routes/jobchallenges/retail-manager-game';
import entrepreneurGameRoutes from './routes/jobchallenges/entrepreneur-game';
import pluginRoutes from './routes/plugins';
import announcementRoutes from './routes/announcements';
import townRoutes from './routes/town';
import jobRoutes from './routes/jobs';
import businessProposalsRoutes from './routes/business-proposals';
import landRoutes from './routes/land';
import tenderRoutes from './routes/tenders';
import townRulesRoutes from './routes/town-rules';
import winkelRoutes from './routes/winkel';
import insuranceRoutes from './routes/insurance';
import pizzaTimeRoutes from './routes/pizza-time';
import leaderboardRoutes from './routes/leaderboard';
import wordleLeaderboardRoutes from './routes/wordle-leaderboard';
import suggestionsBugsRoutes from './routes/suggestions-bugs';
import disastersRoutes from './routes/disasters';
import adminRoutes from './routes/admin';
import superAdminRoutes from './routes/super-admin';
import teacherAnalyticsRoutes from './routes/teacher-analytics';
import database from './database/database-prod';

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
app.use('/api/wordle-game', wordleGameRoutes);
app.use('/api/architect-game', architectGameRoutes);
app.use('/api/accountant-game', accountantGameRoutes);
app.use('/api/software-engineer-game', softwareEngineerGameRoutes);
app.use('/api/marketing-manager-game', marketingManagerGameRoutes);
app.use('/api/graphic-designer-game', graphicDesignerGameRoutes);
app.use('/api/journalist-game', journalistGameRoutes);
app.use('/api/event-planner-game', eventPlannerGameRoutes);
app.use('/api/financial-manager-game', financialManagerGameRoutes);
app.use('/api/hr-director-game', hrDirectorGameRoutes);
app.use('/api/police-lieutenant-game', policeLieutenantGameRoutes);
app.use('/api/lawyer-game', lawyerGameRoutes);
app.use('/api/town-planner-game', townPlannerGameRoutes);
app.use('/api/electrical-engineer-game', electricalEngineerGameRoutes);
app.use('/api/civil-engineer-game', civilEngineerGameRoutes);
app.use('/api/principal-game', principalGameRoutes);
app.use('/api/teacher-game', teacherGameRoutes);
app.use('/api/nurse-game', nurseGameRoutes);
app.use('/api/doctor-game', doctorGameRoutes);
app.use('/api/retail-manager-game', retailManagerGameRoutes);
app.use('/api/entrepreneur-game', entrepreneurGameRoutes);
app.use('/api/plugins', pluginRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/town', townRoutes);
app.use('/api/jobs/business-proposals', businessProposalsRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/land', landRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/town-rules', townRulesRoutes);
app.use('/api/winkel', winkelRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/pizza-time', pizzaTimeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/wordle-leaderboard', wordleLeaderboardRoutes);
app.use('/api/suggestions-bugs', suggestionsBugsRoutes);
app.use('/api/disasters', disastersRoutes);
app.use('/api/teacher-analytics', teacherAnalyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', superAdminRoutes);

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
        ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS hide_from_leaderboards BOOLEAN DEFAULT FALSE
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
    
    // Run Job Applications migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '003_job_applications.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Job Applications migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Job Applications migration may have already been applied:', migrationError);
    }
    
    // Run Bank Settings migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '004_bank_settings.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Bank Settings migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Bank Settings migration may have already been applied:', migrationError);
    }
    
    // Run Land Registry migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '005_land_registry.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Land Registry migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Land Registry migration may have already been applied:', migrationError);
    }

    // Run Tenders migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '007_tenders.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Tenders migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Tenders migration may have already been applied:', migrationError);
    }

    // Run Tender Payments migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '008_tender_payments.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Tender Payments migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Tender Payments migration may have already been applied:', migrationError);
    }

    // Run Town Rules migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '009_town_rules.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Town Rules migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Town Rules migration may have already been applied:', migrationError);
    }

    // Run Winkel Shop migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '010_winkel_shop.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Winkel Shop migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Winkel Shop migration may have already been applied:', migrationError);
    }

    // Run Shop Balance migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '012_shop_balance.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Shop Balance migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Shop Balance migration may have already been applied:', migrationError);
    }

    // Seed Shop Items
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '013_seed_shop_items.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Shop items seeded');
      }
    } catch (migrationError) {
      console.log('⚠️ Shop items may have already been seeded:', migrationError);
    }

    // Run Pizza Time migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '014_pizza_time.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Pizza Time migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Pizza Time migration may have already been applied:', migrationError);
    }

    // Add missing plugins (Town Rules and The Winkel)
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '011_add_winkel_and_town_rules_plugins.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Missing plugins added');
      }
    } catch (migrationError) {
      console.log('⚠️ Plugin migration may have already been applied:', migrationError);
    }

    // Add Pizza Time plugin
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '015_add_pizza_time_plugin.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Pizza Time plugin added');
      }
    } catch (migrationError) {
      console.log('⚠️ Pizza Time plugin may have already been added:', migrationError);
    }

    // Run User Approval Status migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '016_add_user_approval_status.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ User approval status migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ User approval status migration may have already been applied:', migrationError);
    }

    // Run Announcement customization migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '017_add_announcement_customization.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Announcement customization migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Announcement customization migration may have already been applied:', migrationError);
    }

    // Add Leaderboard plugin
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '018_add_leaderboard_plugin.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Leaderboard plugin added');
      }
    } catch (migrationError) {
      console.log('⚠️ Leaderboard plugin may have already been added:', migrationError);
    }

    // Run Profile Emoji migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '019_profile_emoji_system.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Profile emoji migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Profile emoji migration may have already been applied:', migrationError);
    }

    // Run Suggestion Box tables migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '020_suggestion_box.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Suggestions & bug reports tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Suggestions & bug reports tables may have already been applied:', migrationError);
    }

    // Add Suggestions & Bugs plugin
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '021_add_suggestions_bugs_plugin.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Suggestions & Bugs plugin added');
      }
    } catch (migrationError) {
      console.log('⚠️ Suggestions & Bugs plugin may have already been added:', migrationError);
    }

    // Add Disasters plugin
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '022_add_disasters_plugin.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Disasters plugin added');
      }
    } catch (migrationError) {
      console.log('⚠️ Disasters plugin may have already been added:', migrationError);
    }

    // Run Multi-Tenant Schools migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '022_multi_tenant_schools.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Multi-tenant schools migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Multi-tenant schools migration may have already been applied:', migrationError);
    }

    // Run Job Wages Restructuring migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '034_restructure_job_wages.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Job wages restructuring migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Job wages restructuring migration may have already been applied:', migrationError);
    }

    // Run Architect Game Tables Migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '035_add_architect_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Architect game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Architect game tables migration may have already been applied:', migrationError);
    }

    // Run Accountant Game Tables Migration
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '036_add_accountant_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Accountant game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Accountant game tables migration may have already been applied:', migrationError);
    }

    // Add job game daily limit to town_settings (teacher-configurable)
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '037_add_job_game_daily_limit.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Job game daily limit migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Job game daily limit migration may have already been applied:', migrationError);
    }

    // Software Engineer game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '038_add_software_engineer_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Software engineer game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Software engineer game tables migration may have already been applied:', migrationError);
    }

    // Marketing Manager game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '039_add_marketing_manager_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Marketing manager game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Marketing manager game tables migration may have already been applied:', migrationError);
    }

    // Graphic Designer game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '041_add_graphic_designer_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Graphic designer game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Graphic designer game tables migration may have already been applied:', migrationError);
    }

    // Journalist game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '042_add_journalist_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Journalist game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Journalist game tables migration may have already been applied:', migrationError);
    }

    // Event Planner game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '043_add_event_planner_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Event planner game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Event planner game tables migration may have already been applied:', migrationError);
    }

    // Rename jobs to Assistant/Junior entry-level titles (Mayor unchanged)
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '044_rename_jobs_to_assistant_junior_titles.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Job title rename migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Job title rename migration may have already been applied:', migrationError);
    }

    // Show mayor job card on employment board (teacher toggle)
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '045_add_show_mayor_job_card.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Show mayor job card migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Show mayor job card migration may have already been applied:', migrationError);
    }

    // Financial Manager game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '046_add_financial_manager_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Financial manager game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Financial manager game tables migration may have already been applied:', migrationError);
    }

    // HR Director game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '047_add_hr_director_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ HR director game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ HR director game tables migration may have already been applied:', migrationError);
    }

    // Police Lieutenant game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '048_add_police_lieutenant_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Police lieutenant game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Police lieutenant game tables migration may have already been applied:', migrationError);
    }

    // Lawyer game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '049_add_lawyer_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Lawyer game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Lawyer game tables migration may have already been applied:', migrationError);
    }

    // Town planner game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '050_add_town_planner_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Town planner game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Town planner game tables migration may have already been applied:', migrationError);
    }

    // Electrical engineer game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '051_add_electrical_engineer_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Electrical engineer game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Electrical engineer game tables migration may have already been applied:', migrationError);
    }

    // Civil engineer game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '052_add_civil_engineer_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Civil engineer game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Civil engineer game tables migration may have already been applied:', migrationError);
    }

    // Principal game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '053_add_principal_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Principal game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Principal game tables migration may have already been applied:', migrationError);
    }

    // Teacher game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '054_add_teacher_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Teacher game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Teacher game tables migration may have already been applied:', migrationError);
    }

    // Nurse game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '055_add_nurse_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Nurse game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Nurse game tables migration may have already been applied:', migrationError);
    }

    // Doctor game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '056_add_doctor_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Doctor game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Doctor game tables migration may have already been applied:', migrationError);
    }

    // Retail manager game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '057_add_retail_manager_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Retail manager game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Retail manager game tables migration may have already been applied:', migrationError);
    }

    // Business proposals (Entrepreneur job)
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '059_add_business_proposals.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Business proposals migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Business proposals migration may have already been applied:', migrationError);
    }

    // Insurance plugin and insurance_purchases table
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '060_add_insurance_plugin.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Insurance plugin migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Insurance plugin migration may have already been applied:', migrationError);
    }

    // Allow 'insurance' transaction_type in transactions table
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '061_add_insurance_transaction_type.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Insurance transaction type migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Insurance transaction type migration may have already been applied:', migrationError);
    }

    // Entrepreneur (Business Builder) game tables
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '062_add_entrepreneur_game_tables.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Entrepreneur game tables migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Entrepreneur game tables migration may have already been applied:', migrationError);
    }

    // Add paid status to shop purchases (Winkel pending/paid tracking)
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '023_shop_purchases_paid_status.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Shop purchases paid status migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Shop purchases paid status migration may have already been applied:', migrationError);
    }

    // Add Chores plugin
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '023_add_chores_plugin.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Chores plugin added');
      }
    } catch (migrationError) {
      console.log('⚠️ Chores plugin may have already been added:', migrationError);
    }

    // Add extreme difficulty to math game
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '024_add_extreme_difficulty.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Extreme difficulty added');
      }
    } catch (migrationError) {
      console.log('⚠️ Extreme difficulty migration may have already been applied:', migrationError);
    }

    // Add job applications enabled setting
    try {
      const migrationPath = join(__dirname, '..', 'migrations', '025_add_job_applications_enabled.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Job applications enabled setting added');
      }
    } catch (migrationError) {
      console.log('⚠️ Job applications enabled migration may have already been applied:', migrationError);
    }

    try {
      const migrationPath = join(__dirname, '..', 'migrations', '026_add_doubles_day_plugin.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Doubles Day plugin added');
      }
    } catch (migrationError) {
      console.log('⚠️ Doubles Day plugin migration may have already been applied:', migrationError);
    }

    try {
      const migrationPath = join(__dirname, '..', 'migrations', '027_pending_transfers.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Pending transfers table added');
      }
    } catch (migrationError) {
      console.log('⚠️ Pending transfers migration may have already been applied:', migrationError);
    }

    try {
      const migrationPath = join(__dirname, '..', 'migrations', '028_rules_agreed.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Rules agreed migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Rules agreed migration may have already been applied:', migrationError);
    }

    try {
      const migrationPath = join(__dirname, '..', 'migrations', '029_account_frozen.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Account frozen migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Account frozen migration may have already been applied:', migrationError);
    }

    try {
      const migrationPath = join(__dirname, '..', 'migrations', '030_login_events.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Login events migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Login events migration may have already been applied:', migrationError);
    }

    try {
      const migrationPath = join(__dirname, '..', 'migrations', '031_add_analytics_plugin.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Analytics plugin migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Analytics plugin migration may have already been applied:', migrationError);
    }

    try {
      const migrationPath = join(__dirname, '..', 'migrations', '032_pizza_time_school_unique.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Pizza time school unique constraint migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Pizza time school unique migration may have already been applied:', migrationError);
    }

    try {
      const migrationPath = join(__dirname, '..', 'migrations', '033_plugins_route_path_per_school.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Plugins route_path per school migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Plugins route_path per school migration may have already been applied:', migrationError);
    }

    try {
      const migrationPath = join(__dirname, '..', 'migrations', '040_add_wordle_and_chores_toggles.sql');
      if (existsSync(migrationPath)) {
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await database.query(migrationSQL);
        console.log('✅ Wordle and chore toggles migration completed');
      }
    } catch (migrationError) {
      console.log('⚠️ Wordle and chore toggles migration may have already been applied:', migrationError);
    }

    // Sync default plugins (ensures all known plugins exist - no manual script needed)
    try {
      const defaultPlugins: { name: string; route_path: string; icon: string; description: string; enabled?: boolean }[] = [
        { name: 'Chores', route_path: '/chores', icon: '🧹', description: 'Earn money by completing chore challenges at home' },
        { name: 'Doubles Day', route_path: '/doubles-day', icon: '2️⃣', description: 'Double points from chores and double pizza time donations when enabled', enabled: false },
      ];
      for (const p of defaultPlugins) {
        const existing = await database.query('SELECT id FROM plugins WHERE route_path = $1', [p.route_path]);
        if (existing.length === 0) {
          const enabled = p.enabled !== false;
          await database.query(
            `INSERT INTO plugins (name, enabled, route_path, icon, description) VALUES ($1, $2, $3, $4, $5)`,
            [p.name, enabled, p.route_path, p.icon, p.description]
          );
          console.log(`✅ Auto-added plugin: ${p.name}`);
        }
      }
    } catch (syncError) {
      console.log('⚠️ Plugin sync skipped:', syncError instanceof Error ? syncError.message : syncError);
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
  // Run critical startup migrations first (like adding status column)
  await database.runStartupMigrations();
  
  // Initialize database in background, don't block server startup
  initializeDatabase().catch(console.error);
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 CivicLab API`);
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
