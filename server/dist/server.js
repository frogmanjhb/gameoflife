"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables FIRST, before any other imports
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const fs_1 = require("fs");
const path_1 = require("path");
const auth_1 = __importDefault(require("./routes/auth"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const loans_1 = __importDefault(require("./routes/loans"));
const students_1 = __importDefault(require("./routes/students"));
const export_1 = __importDefault(require("./routes/export"));
const math_game_1 = __importDefault(require("./routes/math-game"));
const wordle_game_1 = __importDefault(require("./routes/wordle-game"));
const architect_game_1 = __importDefault(require("./routes/jobchallenges/architect-game"));
const accountant_game_1 = __importDefault(require("./routes/jobchallenges/accountant-game"));
const software_engineer_game_1 = __importDefault(require("./routes/jobchallenges/software-engineer-game"));
const marketing_manager_game_1 = __importDefault(require("./routes/jobchallenges/marketing-manager-game"));
const graphic_designer_game_1 = __importDefault(require("./routes/jobchallenges/graphic-designer-game"));
const journalist_game_1 = __importDefault(require("./routes/jobchallenges/journalist-game"));
const event_planner_game_1 = __importDefault(require("./routes/jobchallenges/event-planner-game"));
const financial_manager_game_1 = __importDefault(require("./routes/jobchallenges/financial-manager-game"));
const hr_director_game_1 = __importDefault(require("./routes/jobchallenges/hr-director-game"));
const police_lieutenant_game_1 = __importDefault(require("./routes/jobchallenges/police-lieutenant-game"));
const lawyer_game_1 = __importDefault(require("./routes/jobchallenges/lawyer-game"));
const town_planner_game_1 = __importDefault(require("./routes/jobchallenges/town-planner-game"));
const electrical_engineer_game_1 = __importDefault(require("./routes/jobchallenges/electrical-engineer-game"));
const civil_engineer_game_1 = __importDefault(require("./routes/jobchallenges/civil-engineer-game"));
const principal_game_1 = __importDefault(require("./routes/jobchallenges/principal-game"));
const teacher_game_1 = __importDefault(require("./routes/jobchallenges/teacher-game"));
const nurse_game_1 = __importDefault(require("./routes/jobchallenges/nurse-game"));
const doctor_game_1 = __importDefault(require("./routes/jobchallenges/doctor-game"));
const retail_manager_game_1 = __importDefault(require("./routes/jobchallenges/retail-manager-game"));
const entrepreneur_game_1 = __importDefault(require("./routes/jobchallenges/entrepreneur-game"));
const plugins_1 = __importDefault(require("./routes/plugins"));
const announcements_1 = __importDefault(require("./routes/announcements"));
const town_1 = __importDefault(require("./routes/town"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const business_proposals_1 = __importDefault(require("./routes/business-proposals"));
const land_1 = __importDefault(require("./routes/land"));
const tenders_1 = __importDefault(require("./routes/tenders"));
const town_rules_1 = __importDefault(require("./routes/town-rules"));
const winkel_1 = __importDefault(require("./routes/winkel"));
const insurance_1 = __importDefault(require("./routes/insurance"));
const pizza_time_1 = __importDefault(require("./routes/pizza-time"));
const leaderboard_1 = __importDefault(require("./routes/leaderboard"));
const wordle_leaderboard_1 = __importDefault(require("./routes/wordle-leaderboard"));
const suggestions_bugs_1 = __importDefault(require("./routes/suggestions-bugs"));
const disasters_1 = __importDefault(require("./routes/disasters"));
const admin_1 = __importDefault(require("./routes/admin"));
const super_admin_1 = __importDefault(require("./routes/super-admin"));
const teacher_analytics_1 = __importDefault(require("./routes/teacher-analytics"));
const database_prod_1 = __importDefault(require("./database/database-prod"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
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
        }
        else {
            console.warn(`CORS: Origin ${origin} not allowed`);
            callback(null, true); // Still allow but log for debugging
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
    const healthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'unknown',
        responseTime: 0
    };
    try {
        // Test database connectivity with timeout
        const dbTestPromise = database_prod_1.default.query('SELECT 1 as test');
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 5000));
        await Promise.race([dbTestPromise, timeoutPromise]);
        healthStatus.database = 'connected';
        res.json(healthStatus);
    }
    catch (error) {
        console.error('Health check failed:', error);
        healthStatus.status = 'ERROR';
        healthStatus.database = 'disconnected';
        healthStatus.error = error instanceof Error ? error.message : String(error);
        // Still return 200 for basic health, 500 for critical failures
        const statusCode = error instanceof Error && error.message.includes('timeout') ? 200 : 500;
        res.status(statusCode).json(healthStatus);
    }
    finally {
        healthStatus.responseTime = Date.now() - startTime;
    }
});
// Debug endpoint to check database state
app.get('/api/debug/users', async (req, res) => {
    try {
        const users = await database_prod_1.default.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
        res.json({ users, count: users.length });
    }
    catch (error) {
        console.error('Debug users error:', error);
        res.status(500).json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) });
    }
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api/loans', loans_1.default);
app.use('/api/students', students_1.default);
app.use('/api/export', export_1.default);
app.use('/api/math-game', math_game_1.default);
app.use('/api/wordle-game', wordle_game_1.default);
app.use('/api/architect-game', architect_game_1.default);
app.use('/api/accountant-game', accountant_game_1.default);
app.use('/api/software-engineer-game', software_engineer_game_1.default);
app.use('/api/marketing-manager-game', marketing_manager_game_1.default);
app.use('/api/graphic-designer-game', graphic_designer_game_1.default);
app.use('/api/journalist-game', journalist_game_1.default);
app.use('/api/event-planner-game', event_planner_game_1.default);
app.use('/api/financial-manager-game', financial_manager_game_1.default);
app.use('/api/hr-director-game', hr_director_game_1.default);
app.use('/api/police-lieutenant-game', police_lieutenant_game_1.default);
app.use('/api/lawyer-game', lawyer_game_1.default);
app.use('/api/town-planner-game', town_planner_game_1.default);
app.use('/api/electrical-engineer-game', electrical_engineer_game_1.default);
app.use('/api/civil-engineer-game', civil_engineer_game_1.default);
app.use('/api/principal-game', principal_game_1.default);
app.use('/api/teacher-game', teacher_game_1.default);
app.use('/api/nurse-game', nurse_game_1.default);
app.use('/api/doctor-game', doctor_game_1.default);
app.use('/api/retail-manager-game', retail_manager_game_1.default);
app.use('/api/entrepreneur-game', entrepreneur_game_1.default);
app.use('/api/plugins', plugins_1.default);
app.use('/api/announcements', announcements_1.default);
app.use('/api/town', town_1.default);
app.use('/api/jobs/business-proposals', business_proposals_1.default);
app.use('/api/jobs', jobs_1.default);
app.use('/api/land', land_1.default);
app.use('/api/tenders', tenders_1.default);
app.use('/api/town-rules', town_rules_1.default);
app.use('/api/winkel', winkel_1.default);
app.use('/api/insurance', insurance_1.default);
app.use('/api/pizza-time', pizza_time_1.default);
app.use('/api/leaderboard', leaderboard_1.default);
app.use('/api/wordle-leaderboard', wordle_leaderboard_1.default);
app.use('/api/suggestions-bugs', suggestions_bugs_1.default);
app.use('/api/disasters', disasters_1.default);
app.use('/api/teacher-analytics', teacher_analytics_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/admin', super_admin_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Serve static files from client/dist in production  
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'production') {
    const clientDistPath = (0, path_1.join)(__dirname, '..', '..', 'client', 'dist');
    console.log('📁 Attempting to serve static files from:', clientDistPath);
    console.log('📁 __dirname is:', __dirname);
    console.log('📁 process.cwd():', process.cwd());
    // Check if dist exists
    if ((0, fs_1.existsSync)(clientDistPath)) {
        console.log('✅ Client dist folder exists!');
        const files = (0, fs_1.readdirSync)(clientDistPath);
        console.log('📄 Files in dist:', files);
        app.use(express_1.default.static(clientDistPath));
        // Handle SPA routing - send index.html for all non-API routes (MUST BE LAST)
        app.get('*', (req, res) => {
            const indexPath = (0, path_1.join)(clientDistPath, 'index.html');
            console.log('📄 Serving index.html from:', indexPath);
            res.sendFile(indexPath);
        });
    }
    else {
        console.error('❌ Client dist folder NOT found at:', clientDistPath);
        app.get('*', (req, res) => {
            res.status(500).json({
                error: 'Frontend not built',
                path: clientDistPath,
                cwd: process.cwd()
            });
        });
    }
}
else {
    // 404 handler for development
    app.use('*', (req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });
}
// Initialize database
async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database...');
        const schemaPath = (0, path_1.join)(__dirname, 'database', 'schema-postgres.sql');
        console.log('📁 Schema path:', schemaPath);
        // Test database connection first
        await database_prod_1.default.query('SELECT 1');
        console.log('✅ Database connection successful');
        // Add new columns if they don't exist (migration)
        try {
            await database_prod_1.default.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS class VARCHAR(10),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
        ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL
      `);
            console.log('✅ Database migration completed');
        }
        catch (migrationError) {
            console.log('⚠️ Migration may have already been applied:', migrationError);
        }
        // Run Town Hub migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '002_town_hub_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Town Hub migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Town Hub migration may have already been applied:', migrationError);
        }
        // Run Job Applications migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '003_job_applications.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Job Applications migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Job Applications migration may have already been applied:', migrationError);
        }
        // Run Bank Settings migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '004_bank_settings.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Bank Settings migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Bank Settings migration may have already been applied:', migrationError);
        }
        // Run Land Registry migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '005_land_registry.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Land Registry migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Land Registry migration may have already been applied:', migrationError);
        }
        // Run Tenders migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '007_tenders.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Tenders migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Tenders migration may have already been applied:', migrationError);
        }
        // Run Tender Payments migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '008_tender_payments.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Tender Payments migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Tender Payments migration may have already been applied:', migrationError);
        }
        // Run Town Rules migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '009_town_rules.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Town Rules migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Town Rules migration may have already been applied:', migrationError);
        }
        // Run Winkel Shop migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '010_winkel_shop.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Winkel Shop migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Winkel Shop migration may have already been applied:', migrationError);
        }
        // Run Shop Balance migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '012_shop_balance.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Shop Balance migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Shop Balance migration may have already been applied:', migrationError);
        }
        // Seed Shop Items
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '013_seed_shop_items.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Shop items seeded');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Shop items may have already been seeded:', migrationError);
        }
        // Run Pizza Time migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '014_pizza_time.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Pizza Time migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Pizza Time migration may have already been applied:', migrationError);
        }
        // Add missing plugins (Town Rules and The Winkel)
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '011_add_winkel_and_town_rules_plugins.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Missing plugins added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Plugin migration may have already been applied:', migrationError);
        }
        // Add Pizza Time plugin
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '015_add_pizza_time_plugin.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Pizza Time plugin added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Pizza Time plugin may have already been added:', migrationError);
        }
        // Run User Approval Status migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '016_add_user_approval_status.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ User approval status migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ User approval status migration may have already been applied:', migrationError);
        }
        // Run Announcement customization migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '017_add_announcement_customization.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Announcement customization migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Announcement customization migration may have already been applied:', migrationError);
        }
        // Add Leaderboard plugin
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '018_add_leaderboard_plugin.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Leaderboard plugin added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Leaderboard plugin may have already been added:', migrationError);
        }
        // Run Profile Emoji migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '019_profile_emoji_system.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Profile emoji migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Profile emoji migration may have already been applied:', migrationError);
        }
        // Run Suggestion Box tables migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '020_suggestion_box.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Suggestions & bug reports tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Suggestions & bug reports tables may have already been applied:', migrationError);
        }
        // Add Suggestions & Bugs plugin
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '021_add_suggestions_bugs_plugin.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Suggestions & Bugs plugin added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Suggestions & Bugs plugin may have already been added:', migrationError);
        }
        // Add Disasters plugin
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '022_add_disasters_plugin.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Disasters plugin added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Disasters plugin may have already been added:', migrationError);
        }
        // Run Multi-Tenant Schools migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '022_multi_tenant_schools.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Multi-tenant schools migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Multi-tenant schools migration may have already been applied:', migrationError);
        }
        // Run Job Wages Restructuring migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '034_restructure_job_wages.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Job wages restructuring migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Job wages restructuring migration may have already been applied:', migrationError);
        }
        // Run Architect Game Tables Migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '035_add_architect_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Architect game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Architect game tables migration may have already been applied:', migrationError);
        }
        // Run Accountant Game Tables Migration
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '036_add_accountant_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Accountant game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Accountant game tables migration may have already been applied:', migrationError);
        }
        // Add job game daily limit to town_settings (teacher-configurable)
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '037_add_job_game_daily_limit.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Job game daily limit migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Job game daily limit migration may have already been applied:', migrationError);
        }
        // Software Engineer game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '038_add_software_engineer_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Software engineer game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Software engineer game tables migration may have already been applied:', migrationError);
        }
        // Marketing Manager game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '039_add_marketing_manager_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Marketing manager game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Marketing manager game tables migration may have already been applied:', migrationError);
        }
        // Graphic Designer game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '041_add_graphic_designer_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Graphic designer game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Graphic designer game tables migration may have already been applied:', migrationError);
        }
        // Journalist game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '042_add_journalist_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Journalist game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Journalist game tables migration may have already been applied:', migrationError);
        }
        // Event Planner game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '043_add_event_planner_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Event planner game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Event planner game tables migration may have already been applied:', migrationError);
        }
        // Rename jobs to Assistant/Junior entry-level titles (Mayor unchanged)
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '044_rename_jobs_to_assistant_junior_titles.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Job title rename migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Job title rename migration may have already been applied:', migrationError);
        }
        // Show mayor job card on employment board (teacher toggle)
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '045_add_show_mayor_job_card.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Show mayor job card migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Show mayor job card migration may have already been applied:', migrationError);
        }
        // Financial Manager game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '046_add_financial_manager_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Financial manager game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Financial manager game tables migration may have already been applied:', migrationError);
        }
        // HR Director game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '047_add_hr_director_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ HR director game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ HR director game tables migration may have already been applied:', migrationError);
        }
        // Police Lieutenant game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '048_add_police_lieutenant_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Police lieutenant game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Police lieutenant game tables migration may have already been applied:', migrationError);
        }
        // Lawyer game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '049_add_lawyer_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Lawyer game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Lawyer game tables migration may have already been applied:', migrationError);
        }
        // Town planner game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '050_add_town_planner_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Town planner game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Town planner game tables migration may have already been applied:', migrationError);
        }
        // Electrical engineer game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '051_add_electrical_engineer_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Electrical engineer game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Electrical engineer game tables migration may have already been applied:', migrationError);
        }
        // Civil engineer game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '052_add_civil_engineer_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Civil engineer game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Civil engineer game tables migration may have already been applied:', migrationError);
        }
        // Principal game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '053_add_principal_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Principal game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Principal game tables migration may have already been applied:', migrationError);
        }
        // Teacher game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '054_add_teacher_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Teacher game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Teacher game tables migration may have already been applied:', migrationError);
        }
        // Nurse game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '055_add_nurse_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Nurse game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Nurse game tables migration may have already been applied:', migrationError);
        }
        // Doctor game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '056_add_doctor_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Doctor game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Doctor game tables migration may have already been applied:', migrationError);
        }
        // Retail manager game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '057_add_retail_manager_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Retail manager game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Retail manager game tables migration may have already been applied:', migrationError);
        }
        // Business proposals (Entrepreneur job)
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '059_add_business_proposals.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Business proposals migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Business proposals migration may have already been applied:', migrationError);
        }
        // Insurance plugin and insurance_purchases table
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '060_add_insurance_plugin.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Insurance plugin migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Insurance plugin migration may have already been applied:', migrationError);
        }
        // Allow 'insurance' transaction_type in transactions table
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '061_add_insurance_transaction_type.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Insurance transaction type migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Insurance transaction type migration may have already been applied:', migrationError);
        }
        // Entrepreneur (Business Builder) game tables
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '062_add_entrepreneur_game_tables.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Entrepreneur game tables migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Entrepreneur game tables migration may have already been applied:', migrationError);
        }
        // Add paid status to shop purchases (Winkel pending/paid tracking)
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '023_shop_purchases_paid_status.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Shop purchases paid status migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Shop purchases paid status migration may have already been applied:', migrationError);
        }
        // Add Chores plugin
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '023_add_chores_plugin.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Chores plugin added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Chores plugin may have already been added:', migrationError);
        }
        // Add extreme difficulty to math game
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '024_add_extreme_difficulty.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Extreme difficulty added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Extreme difficulty migration may have already been applied:', migrationError);
        }
        // Add job applications enabled setting
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '025_add_job_applications_enabled.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Job applications enabled setting added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Job applications enabled migration may have already been applied:', migrationError);
        }
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '026_add_doubles_day_plugin.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Doubles Day plugin added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Doubles Day plugin migration may have already been applied:', migrationError);
        }
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '027_pending_transfers.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Pending transfers table added');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Pending transfers migration may have already been applied:', migrationError);
        }
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '028_rules_agreed.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Rules agreed migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Rules agreed migration may have already been applied:', migrationError);
        }
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '029_account_frozen.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Account frozen migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Account frozen migration may have already been applied:', migrationError);
        }
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '030_login_events.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Login events migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Login events migration may have already been applied:', migrationError);
        }
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '031_add_analytics_plugin.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Analytics plugin migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Analytics plugin migration may have already been applied:', migrationError);
        }
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '032_pizza_time_school_unique.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Pizza time school unique constraint migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Pizza time school unique migration may have already been applied:', migrationError);
        }
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '033_plugins_route_path_per_school.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Plugins route_path per school migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Plugins route_path per school migration may have already been applied:', migrationError);
        }
        try {
            const migrationPath = (0, path_1.join)(__dirname, '..', 'migrations', '040_add_wordle_and_chores_toggles.sql');
            if ((0, fs_1.existsSync)(migrationPath)) {
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_prod_1.default.query(migrationSQL);
                console.log('✅ Wordle and chore toggles migration completed');
            }
        }
        catch (migrationError) {
            console.log('⚠️ Wordle and chore toggles migration may have already been applied:', migrationError);
        }
        // Sync default plugins (ensures all known plugins exist - no manual script needed)
        try {
            const defaultPlugins = [
                { name: 'Chores', route_path: '/chores', icon: '🧹', description: 'Earn money by completing chore challenges at home' },
                { name: 'Doubles Day', route_path: '/doubles-day', icon: '2️⃣', description: 'Double points from chores and double pizza time donations when enabled', enabled: false },
            ];
            for (const p of defaultPlugins) {
                const existing = await database_prod_1.default.query('SELECT id FROM plugins WHERE route_path = $1', [p.route_path]);
                if (existing.length === 0) {
                    const enabled = p.enabled !== false;
                    await database_prod_1.default.query(`INSERT INTO plugins (name, enabled, route_path, icon, description) VALUES ($1, $2, $3, $4, $5)`, [p.name, enabled, p.route_path, p.icon, p.description]);
                    console.log(`✅ Auto-added plugin: ${p.name}`);
                }
            }
        }
        catch (syncError) {
            console.log('⚠️ Plugin sync skipped:', syncError instanceof Error ? syncError.message : syncError);
        }
        const schema = (0, fs_1.readFileSync)(schemaPath, 'utf8');
        await database_prod_1.default.query(schema);
        console.log('✅ Database schema initialized successfully');
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        // Don't exit, just log the error - the database might already be initialized
    }
}
// Start server
async function startServer() {
    // Run critical startup migrations first (like adding status column)
    await database_prod_1.default.runStartupMigrations();
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
//# sourceMappingURL=server.js.map