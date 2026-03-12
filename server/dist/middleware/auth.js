"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_prod_1 = __importDefault(require("../database/database-prod"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const verboseAuth = process.env.DEBUG === '1' || process.env.VERBOSE_LOGGING === '1';
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (verboseAuth)
        console.log('🔐 Auth attempt - Header:', authHeader ? 'Present' : 'Missing', 'Token:', token ? 'Present' : 'Missing');
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (verboseAuth)
            console.log('🔍 Token decoded, userId:', decoded.userId, 'schoolId:', decoded.schoolId);
        const user = await database_prod_1.default.get('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        // Verify school_id matches (unless super_admin)
        if (user.role !== 'super_admin' && user.school_id !== decoded.schoolId) {
            return res.status(403).json({ error: 'Invalid token - school context mismatch' });
        }
        if (verboseAuth)
            console.log('✅ User authenticated:', user.username, 'Role:', user.role, 'School:', user.school_id);
        req.user = user;
        req.schoolId = user.school_id || null;
        next();
    }
    catch (error) {
        if (verboseAuth)
            console.log('❌ Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map