"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Register new user
router.post('/register', [
    (0, express_validator_1.body)('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('role').isIn(['student', 'teacher']).withMessage('Role must be student or teacher')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, password, role } = req.body;
        // Check if user already exists
        const existingUser = await database_prod_1.default.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const result = await database_prod_1.default.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, passwordHash, role]);
        const userId = result.lastID;
        // Create bank account for student
        if (role === 'student') {
            const accountNumber = `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
            await database_prod_1.default.run('INSERT INTO accounts (user_id, account_number, balance) VALUES (?, ?, ?)', [userId, accountNumber, 0.00]);
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
        // Get user data
        const user = await database_prod_1.default.get('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?', [userId]);
        // Get account data for students
        let account = null;
        if (role === 'student') {
            account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = ?', [userId]);
        }
        const response = {
            token,
            user,
            account
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Login
router.post('/login', [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, password } = req.body;
        // Find user
        const user = await database_prod_1.default.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
        // Get account data for students
        let account = null;
        if (user.role === 'student') {
            account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = ?', [user.id]);
        }
        const response = {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                created_at: user.created_at,
                updated_at: user.updated_at
            },
            account
        };
        res.json(response);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get current user profile
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Get account data for students
        let account = null;
        if (req.user.role === 'student') {
            account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = ?', [req.user.id]);
        }
        res.json({
            user: req.user,
            account
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map