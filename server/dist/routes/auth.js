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
// Get list of active schools (public endpoint for school picker)
router.get('/schools', async (req, res) => {
    try {
        const schools = await database_prod_1.default.query('SELECT id, name, code FROM schools WHERE archived = false ORDER BY name');
        res.json(schools);
    }
    catch (error) {
        console.error('Failed to fetch schools:', error);
        res.status(500).json({ error: 'Failed to fetch schools' });
    }
});
// Register new user
// SECURITY: Only students can self-register. Teachers must be created by other teachers.
router.post('/register', [
    (0, express_validator_1.body)('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
        .custom((value) => {
        if (value && value.includes(' ')) {
            throw new Error('Username cannot contain spaces');
        }
        return true;
    }),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('confirmPassword').notEmpty().withMessage('Password confirmation is required').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    (0, express_validator_1.body)('role').custom((value) => {
        // SECURITY: Block self-registration as teacher - must use /auth/register-teacher endpoint
        if (value === 'teacher') {
            throw new Error('Teacher registration requires admin authorization');
        }
        if (value !== 'student') {
            throw new Error('Invalid role');
        }
        return true;
    }),
    (0, express_validator_1.body)('first_name').optional().custom((value) => {
        if (value && value.length < 1) {
            throw new Error('First name must be at least 1 character');
        }
        return true;
    }),
    (0, express_validator_1.body)('last_name').optional().custom((value) => {
        if (value && value.length < 1) {
            throw new Error('Last name must be at least 1 character');
        }
        return true;
    }),
    (0, express_validator_1.body)('school_id').notEmpty().withMessage('School selection is required').isInt().withMessage('Invalid school ID'),
    (0, express_validator_1.body)('class').optional().custom((value) => {
        if (value && value.length > 0 && !['6A', '6B', '6C'].includes(value)) {
            throw new Error('Class must be 6A, 6B, or 6C');
        }
        return true;
    }),
    (0, express_validator_1.body)('email').optional().custom((value) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new Error('Valid email is required');
        }
        return true;
    })
], async (req, res) => {
    try {
        console.log('🔍 Registration attempt:', req.body);
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, password, role, first_name, last_name, class: studentClass, email, school_id } = req.body;
        // Validate school exists and is active
        const school = await database_prod_1.default.get('SELECT * FROM schools WHERE id = $1 AND archived = false', [school_id]);
        if (!school) {
            return res.status(400).json({ error: 'Invalid or inactive school' });
        }
        // Validate class against school settings
        const schoolSettings = school.settings || {};
        const allowedClasses = schoolSettings.classes || ['6A', '6B', '6C'];
        if (studentClass && !allowedClasses.includes(studentClass)) {
            return res.status(400).json({ error: `Class must be one of: ${allowedClasses.join(', ')}` });
        }
        // Validate email domain against school settings
        const allowedEmailDomains = schoolSettings.allowed_email_domains || [];
        if (email && allowedEmailDomains.length > 0) {
            const emailDomain = '@' + email.split('@')[1];
            if (!allowedEmailDomains.includes(emailDomain)) {
                return res.status(400).json({ error: `Email must end with one of: ${allowedEmailDomains.join(', ')}` });
            }
        }
        // Handle empty strings as null for optional fields
        const firstName = first_name && first_name.trim() ? first_name.trim() : null;
        const lastName = last_name && last_name.trim() ? last_name.trim() : null;
        const studentClassName = studentClass && studentClass.trim() ? studentClass.trim() : null;
        const emailAddress = email && email.trim() ? email.trim() : null;
        // Check if user already exists (within the same school)
        const existingUser = await database_prod_1.default.get('SELECT id FROM users WHERE username = $1 AND school_id = $2', [username, school_id]);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists in this school' });
        }
        // Check if email already exists (if provided)
        if (emailAddress) {
            const existingEmail = await database_prod_1.default.get('SELECT id FROM users WHERE email = $1 AND school_id = $2', [emailAddress, school_id]);
            if (existingEmail) {
                return res.status(400).json({ error: 'Email address is already registered in this school. Please use a different email.' });
            }
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Set status: students need approval, teachers are auto-approved
        const userStatus = role === 'student' ? 'pending' : 'approved';
        // Create user with school_id
        const result = await database_prod_1.default.run('INSERT INTO users (username, password_hash, role, first_name, last_name, class, email, status, school_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id', [username, passwordHash, role, firstName, lastName, studentClassName, emailAddress, userStatus, school_id]);
        const userId = result.lastID;
        // Create bank account for student (only if approved, but we'll create it anyway for pending students)
        if (role === 'student') {
            const accountNumber = `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
            console.log('🏦 Creating account for student:', userId, accountNumber);
            await database_prod_1.default.run('INSERT INTO accounts (user_id, account_number, balance, school_id) VALUES ($1, $2, $3, $4)', [userId, accountNumber, 0.00, school_id]);
            console.log('✅ Account created successfully');
        }
        // For pending students, don't generate a token - they need approval first
        if (role === 'student' && userStatus === 'pending') {
            res.status(201).json({
                message: 'Registration successful. Your account is pending teacher approval. You will be able to log in once a teacher approves your account.',
                requires_approval: true
            });
            return;
        }
        // Generate JWT token for approved users (include schoolId and role)
        const tokenPayload = {
            userId,
            schoolId: school_id,
            role: role
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        // Get user data
        const user = await database_prod_1.default.get('SELECT id, username, role, first_name, last_name, class, email, status, school_id, created_at, updated_at FROM users WHERE id = $1', [userId]);
        // Get account data for students
        let account = null;
        if (role === 'student') {
            account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
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
        // Handle specific database errors
        if (error.code === '23505') { // PostgreSQL unique violation
            if (error.constraint === 'users_username_key' || error.detail?.includes('username')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            if (error.constraint === 'users_email_key' || error.detail?.includes('email')) {
                return res.status(400).json({ error: 'Email address is already registered' });
            }
            return res.status(400).json({ error: 'A user with these details already exists' });
        }
        // Log the full error for debugging
        console.error('Full registration error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint
        });
        res.status(500).json({ error: 'Registration failed. Please try again or contact support.' });
    }
});
// Register teacher (requires existing teacher authentication)
// SECURITY: Only authenticated teachers can create new teacher accounts
router.post('/register-teacher', [
    (0, express_validator_1.body)('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('first_name').optional().isString(),
    (0, express_validator_1.body)('last_name').optional().isString(),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Valid email required')
], auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, password, first_name, last_name, email } = req.body;
        // Check if user already exists
        const existingUser = await database_prod_1.default.get('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Create teacher user (use same school_id as creating teacher)
        const creatingTeacherSchoolId = req.user?.school_id;
        if (!creatingTeacherSchoolId) {
            return res.status(400).json({ error: 'Teacher must belong to a school' });
        }
        const result = await database_prod_1.default.run('INSERT INTO users (username, password_hash, role, first_name, last_name, email, school_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [username, passwordHash, 'teacher', first_name || null, last_name || null, email || null, creatingTeacherSchoolId]);
        const userId = result.lastID;
        const user = await database_prod_1.default.get('SELECT id, username, role, first_name, last_name, email, created_at, updated_at FROM users WHERE id = $1', [userId]);
        console.log(`✅ Teacher account created by ${req.user?.username}: ${username}`);
        res.status(201).json({ message: 'Teacher account created successfully', user });
    }
    catch (error) {
        console.error('Teacher registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Login
router.post('/login', [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    (0, express_validator_1.body)('school_id').optional().isInt().withMessage('Invalid school ID')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, password, school_id } = req.body;
        // First, try to find user by username only (to check if super_admin)
        let user = await database_prod_1.default.get('SELECT * FROM users WHERE username = $1', [username]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // If user is super_admin, school_id is not required (should be NULL)
        if (user.role === 'super_admin') {
            if (user.school_id !== null) {
                // Fix super_admin users that have school_id set incorrectly
                await database_prod_1.default.run('UPDATE users SET school_id = NULL WHERE id = $1', [user.id]);
                user.school_id = null;
            }
            // school_id from request is ignored for super_admin
        }
        else {
            // For non-super_admin users, school_id is required
            if (!school_id) {
                return res.status(400).json({ error: 'School selection is required' });
            }
            // Validate school exists and is active
            const school = await database_prod_1.default.get('SELECT * FROM schools WHERE id = $1 AND archived = false', [school_id]);
            if (!school) {
                return res.status(400).json({ error: 'Invalid or inactive school' });
            }
            // Verify user belongs to the selected school
            if (user.school_id !== school_id) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }
        // Check if student account is pending approval
        if (user.role === 'student' && user.status === 'pending') {
            return res.status(403).json({ error: 'Your account is pending teacher approval. Please wait for a teacher to approve your account before logging in.' });
        }
        // Check if account was denied
        if (user.status === 'denied') {
            return res.status(403).json({ error: 'Your account has been denied. Please contact a teacher for assistance.' });
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token (include schoolId and role)
        // For super_admin, schoolId is null
        const tokenPayload = {
            userId: user.id,
            schoolId: user.role === 'super_admin' ? null : user.school_id,
            role: user.role
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        // Log login event for analytics (only for students and teachers, not super_admin)
        if (user.role !== 'super_admin') {
            try {
                const ipAddress = req.ip || req.socket.remoteAddress || null;
                const userAgent = req.get('user-agent') || null;
                await database_prod_1.default.run('INSERT INTO login_events (user_id, school_id, ip_address, user_agent) VALUES ($1, $2, $3, $4)', [user.id, user.school_id, ipAddress, userAgent]);
            }
            catch (loginEventError) {
                // Don't fail login if event logging fails (table might not exist yet)
                console.log('Failed to log login event (non-critical):', loginEventError);
            }
        }
        // Get account data for students
        let account = null;
        if (user.role === 'student') {
            account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [user.id]);
        }
        const response = {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                school_id: user.school_id,
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
        // Get user with full job information
        const userWithJob = await database_prod_1.default.get(`SELECT u.*, 
              j.name as job_name, 
              j.description as job_description, 
              j.salary as job_salary,
              j.requirements as job_requirements,
              j.company_name as job_company_name,
              j.location as job_location
       FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id
       WHERE u.id = $1`, [req.user.id]);
        // Get account data for students
        let account = null;
        if (req.user.role === 'student') {
            account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
        }
        res.json({
            user: userWithJob,
            account
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Student agrees to app rules (required before accessing enabled plugins)
router.post('/rules-agree', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        await database_prod_1.default.run('UPDATE users SET rules_agreed_at = COALESCE(rules_agreed_at, CURRENT_TIMESTAMP) WHERE id = $1', [req.user.id]);
        const updated = await database_prod_1.default.get('SELECT rules_agreed_at FROM users WHERE id = $1', [req.user.id]);
        res.json({ rules_agreed_at: updated.rules_agreed_at });
    }
    catch (error) {
        console.error('Rules agree error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map