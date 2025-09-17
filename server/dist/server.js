"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = require("fs");
const path_1 = require("path");
const auth_1 = __importDefault(require("./routes/auth"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const loans_1 = __importDefault(require("./routes/loans"));
const students_1 = __importDefault(require("./routes/students"));
const export_1 = __importDefault(require("./routes/export"));
const database_prod_1 = __importDefault(require("./database/database-prod"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? [
            process.env.CLIENT_URL || 'https://gameoflife-frontend.onrender.com',
            'https://gameoflife-5jf4.onrender.com'
        ]
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api/loans', loans_1.default);
app.use('/api/students', students_1.default);
app.use('/api/export', export_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, req, res, next) => {
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
        const schemaPath = (0, path_1.join)(__dirname, 'database', 'schema-postgres.sql');
        console.log('📁 Schema path:', schemaPath);
        const schema = (0, fs_1.readFileSync)(schemaPath, 'utf8');
        await database_prod_1.default.query(schema);
        console.log('✅ Database initialized successfully');
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
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
//# sourceMappingURL=server.js.map