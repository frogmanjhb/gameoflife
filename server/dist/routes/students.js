"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
// TEMPORARY: Diagnose student data issues (teachers only)
router.get('/diagnose/:searchTerm', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { searchTerm } = req.params;
        const searchLower = `%${searchTerm.toLowerCase()}%`;
        // Search for students by name or username (case-insensitive)
        const students = await database_prod_1.default.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.status,
        u.role,
        u.created_at,
        u.password_hash IS NOT NULL as has_password,
        LENGTH(u.password_hash) as password_hash_length,
        a.id as account_id,
        a.account_number,
        a.balance
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE (LOWER(u.first_name) LIKE $1 
         OR LOWER(u.last_name) LIKE $1 
         OR LOWER(u.username) LIKE $1)
        AND u.role = 'student'
    `, [searchLower]);
        // Get additional info for each student found
        const diagnosticInfo = students.map((s) => ({
            ...s,
            username_encoded: encodeURIComponent(s.username || ''),
            username_length: s.username ? s.username.length : 0,
            username_chars: s.username ? s.username.split('').map((c) => `${c}(${c.charCodeAt(0)})`) : [],
            issues: []
        }));
        // Check for potential issues
        diagnosticInfo.forEach((s) => {
            if (!s.username)
                s.issues.push('Missing username');
            if (!s.has_password)
                s.issues.push('Missing password hash');
            if (!s.account_id)
                s.issues.push('Missing bank account');
            if (s.status !== 'approved')
                s.issues.push(`Status is "${s.status}" (not approved)`);
            if (s.username && s.username !== s.username.trim())
                s.issues.push('Username has leading/trailing whitespace');
        });
        res.json({
            searchTerm,
            found: students.length,
            students: diagnosticInfo
        });
    }
    catch (error) {
        console.error('Diagnose student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get students in the same class as the current student
router.get('/classmates', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can access classmates' });
        }
        if (!req.user.class) {
            console.log('⚠️ Student has no class assigned:', req.user.username);
            return res.json([]);
        }
        console.log('🔍 Getting classmates for student:', req.user.username, 'in class:', req.user.class);
        const classmates = await database_prod_1.default.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class
      FROM users u
      WHERE u.role = 'student' 
        AND u.class = $1 
        AND u.id != $2
        AND u.school_id = $3
      ORDER BY u.first_name, u.last_name
    `, [req.user.class, req.user.id, req.user.school_id]);
        console.log('📊 Found classmates:', classmates.length);
        res.json(classmates);
    }
    catch (error) {
        console.error('Get classmates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all students who can receive transfers (any class in same school - for cross-class transfers)
router.get('/transfer-recipients', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can access transfer recipients' });
        }
        const schoolId = req.user.school_id ?? null;
        const recipients = await database_prod_1.default.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class
      FROM users u
      WHERE u.role = 'student' 
        AND u.id != $1
        AND (u.school_id = $2 OR ($2 IS NULL AND u.school_id IS NULL))
      ORDER BY u.class, u.first_name, u.last_name
    `, [req.user.id, schoolId]);
        res.json(recipients);
    }
    catch (error) {
        console.error('Get transfer recipients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all students with their account balances (teachers only)
router.get('/', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        console.log('🔍 Getting students for teacher:', req.user?.username, 'school:', req.schoolId);
        const students = await database_prod_1.default.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.job_id,
        u.status,
        u.account_frozen,
        u.created_at,
        a.account_number,
        a.balance,
        a.updated_at as last_activity,
        j.name as job_name,
        j.salary as job_salary
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE u.role = 'student' AND u.school_id = $1
      ORDER BY u.class, u.last_name, u.first_name
    `, [req.schoolId]);
        console.log('📊 Found students:', students.length);
        console.log('📊 Student data:', JSON.stringify(students, null, 2));
        res.json(students);
    }
    catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get pending students (teachers only)
router.get('/pending', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        console.log('🔍 Getting pending students for teacher:', req.user?.username, 'school:', req.schoolId);
        const pendingStudents = await database_prod_1.default.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.status,
        u.created_at,
        a.account_number,
        a.balance
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE u.role = 'student' AND u.status = 'pending' AND u.school_id = $1
      ORDER BY u.created_at ASC
    `, [req.schoolId]);
        console.log('📊 Found pending students:', pendingStudents.length);
        res.json(pendingStudents);
    }
    catch (error) {
        console.error('Get pending students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Approve a pending student (teachers only)
router.post('/:username/approve', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { username } = req.params;
        // Get student info
        const student = await database_prod_1.default.get(`
      SELECT u.id, u.username, u.role, u.status
      FROM users u
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        if (student.status !== 'pending') {
            return res.status(400).json({ error: `Student is already ${student.status}` });
        }
        // Update student status to approved
        await database_prod_1.default.run('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['approved', student.id]);
        console.log(`✅ Teacher ${req.user?.username} approved student ${username}`);
        res.json({ message: `Student ${username} has been approved successfully` });
    }
    catch (error) {
        console.error('Approve student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Deny a pending student (teachers only)
router.post('/:username/deny', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { username } = req.params;
        const { reason } = req.body;
        // Get student info
        const student = await database_prod_1.default.get(`
      SELECT u.id, u.username, u.role, u.status
      FROM users u
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        if (student.status !== 'pending') {
            return res.status(400).json({ error: `Student is already ${student.status}` });
        }
        // Update student status to denied
        await database_prod_1.default.run('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['denied', student.id]);
        console.log(`❌ Teacher ${req.user?.username} denied student ${username}${reason ? `: ${reason}` : ''}`);
        res.json({ message: `Student ${username} has been denied` });
    }
    catch (error) {
        console.error('Deny student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete a student (teachers only)
router.delete('/:username', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { username } = req.params;
        // Get student info first
        const student = await database_prod_1.default.get(`
      SELECT u.id, u.username, u.role
      FROM users u
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        // Get the student's account
        const account = await database_prod_1.default.get('SELECT id FROM accounts WHERE user_id = $1', [student.id]);
        // Delete related data in order (respecting foreign key constraints)
        // 1. Delete transactions involving this account
        if (account) {
            await database_prod_1.default.run('DELETE FROM transactions WHERE from_account_id = $1 OR to_account_id = $1', [account.id]);
        }
        // 2. Delete loan payments for loans where student is borrower
        await database_prod_1.default.run(`
      DELETE FROM loan_payments WHERE loan_id IN (
        SELECT id FROM loans WHERE borrower_id = $1
      )
    `, [student.id]);
        // 3. Delete loans where student is borrower
        await database_prod_1.default.run('DELETE FROM loans WHERE borrower_id = $1', [student.id]);
        // 4. Delete job applications
        await database_prod_1.default.run('DELETE FROM job_applications WHERE user_id = $1', [student.id]);
        // 5. Delete land purchase requests
        await database_prod_1.default.run('DELETE FROM land_purchase_requests WHERE user_id = $1', [student.id]);
        // 6. Update owned land parcels (set owner to null)
        await database_prod_1.default.run('UPDATE land_parcels SET owner_id = NULL WHERE owner_id = $1', [student.id]);
        // 7. Delete tender applications
        await database_prod_1.default.run('DELETE FROM tender_applications WHERE applicant_id = $1', [student.id]);
        // 8. Delete math game sessions
        await database_prod_1.default.run('DELETE FROM math_game_sessions WHERE user_id = $1', [student.id]);
        // 9. Delete the account
        if (account) {
            await database_prod_1.default.run('DELETE FROM accounts WHERE user_id = $1', [student.id]);
        }
        // 10. Finally, delete the user
        await database_prod_1.default.run('DELETE FROM users WHERE id = $1', [student.id]);
        console.log(`🗑️ Teacher ${req.user?.username} deleted student ${username}`);
        res.json({ message: `Student ${username} has been deleted successfully` });
    }
    catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Freeze/unfreeze a student's account (teachers only)
router.post('/:username/freeze', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { username } = req.params;
        const frozen = req.body?.frozen === true;
        const student = await database_prod_1.default.get('SELECT u.id, u.username FROM users u WHERE u.username = $1 AND u.role = $2 AND u.school_id = $3', [username, 'student', req.schoolId]);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        await database_prod_1.default.run('UPDATE users SET account_frozen = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [frozen, student.id]);
        res.json({ message: frozen ? 'Account frozen' : 'Account unfrozen', frozen });
    }
    catch (error) {
        console.error('Freeze student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Reset student password (teachers only)
router.post('/:username/reset-password', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { username } = req.params;
        const reveal = req.body?.reveal === true;
        // Get student info
        const student = await database_prod_1.default.get(`
      SELECT u.id, u.username, u.role
      FROM users u
      WHERE u.username = $1 AND u.role = 'student' AND u.school_id = $2
    `, [username, req.schoolId]);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        // Generate a temporary password (8 characters, alphanumeric)
        const generateTempPassword = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
            let password = '';
            for (let i = 0; i < 8; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        };
        const temporaryPassword = generateTempPassword();
        const passwordHash = await bcryptjs_1.default.hash(temporaryPassword, 10);
        // Update the student's password
        await database_prod_1.default.run('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, student.id]);
        console.log(`🔑 Teacher ${req.user?.username} reset password for student ${username}`);
        res.json(reveal
            ? {
                message: 'Password reset successfully',
                temporary_password: temporaryPassword,
                username: student.username
            }
            : {
                message: 'Password reset successfully',
                username: student.username
            });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get account details by account number (teachers only) - MUST be before /:username/details to avoid "account" matching as username
router.get('/account/:accountNumber/details', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { accountNumber } = req.params;
        // Get account with user info
        const account = await database_prod_1.default.get(`
      SELECT 
        a.id as account_id,
        a.account_number,
        a.balance,
        a.created_at as account_created_at,
        a.updated_at as last_activity,
        u.id as user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.status,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at,
        u.job_id,
        j.name as job_name,
        j.description as job_description,
        j.salary as job_salary,
        j.company_name as job_company_name
      FROM accounts a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE a.account_number = $1
    `, [accountNumber]);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // If no user associated, return account info only
        if (!account.user_id) {
            return res.json({
                account: {
                    account_number: account.account_number,
                    balance: account.balance,
                    created_at: account.account_created_at,
                    last_activity: account.last_activity,
                    orphaned: true
                },
                student: null,
                transactions: [],
                loans: [],
                landParcels: [],
                mathGameSessions: [],
                pizzaContributions: [],
                shopPurchases: [],
                jobApplications: [],
                suggestions: [],
                bugReports: [],
                stats: {
                    total_transactions: 0,
                    total_transfers_sent: 0,
                    total_transfers_received: 0,
                    total_deposits: 0,
                    total_withdrawals: 0,
                    math_games_played: 0,
                    total_math_earnings: 0,
                    pizza_contributions_total: 0,
                    shop_purchases_total: 0,
                    land_parcels_owned: 0,
                    land_value_total: 0,
                    active_loans: 0,
                    total_loan_debt: 0
                }
            });
        }
        // Get all transactions
        const transactions = await database_prod_1.default.query(`
      SELECT 
        t.*,
        fu.username as from_username,
        fu.first_name as from_first_name,
        fu.last_name as from_last_name,
        tu.username as to_username,
        tu.first_name as to_first_name,
        tu.last_name as to_last_name
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN users fu ON fa.user_id = fu.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN users tu ON ta.user_id = tu.id
      WHERE t.from_account_id = $1 OR t.to_account_id = $2
      ORDER BY t.created_at DESC
    `, [account.account_id, account.account_id]);
        // Get loans
        const loans = await database_prod_1.default.query(`
      SELECT 
        l.*,
        COALESCE(SUM(lp.amount), 0) as total_paid
      FROM loans l
      LEFT JOIN loan_payments lp ON l.id = lp.loan_id
      WHERE l.borrower_id = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [account.user_id]);
        // Get land parcels
        const landParcels = await database_prod_1.default.query(`
      SELECT * FROM land_parcels
      WHERE owner_id = $1
      ORDER BY purchased_at DESC
    `, [account.user_id]);
        // Get math game sessions
        const mathGameSessions = await database_prod_1.default.query(`
      SELECT * FROM math_game_sessions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [account.user_id]);
        // Get pizza contributions (from transactions, same as username route)
        const pizzaContributions = await database_prod_1.default.query(`
      SELECT t.amount, t.description, t.created_at
      FROM transactions t
      JOIN accounts a ON t.from_account_id = a.id
      WHERE a.user_id = $1 AND t.description LIKE '%pizza%'
      ORDER BY t.created_at DESC
    `, [account.user_id]);
        // Get Winkel (shop) purchases (from transactions, same as username route)
        const shopPurchases = await database_prod_1.default.query(`
      SELECT t.amount, t.description, t.created_at
      FROM transactions t
      JOIN accounts a ON t.from_account_id = a.id
      WHERE a.user_id = $1 AND t.description LIKE '%Winkel%'
      ORDER BY t.created_at DESC
    `, [account.user_id]);
        // Get job applications
        const jobApplications = await database_prod_1.default.query(`
      SELECT * FROM job_applications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [account.user_id]);
        // Get suggestions (content field, not title/description)
        const suggestions = await database_prod_1.default.query(`
      SELECT
        id,
        content,
        status,
        reviewed_at,
        reward_paid,
        created_at
      FROM suggestions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [account.user_id]);
        // Get bug reports
        const bugReports = await database_prod_1.default.query(`
      SELECT
        id,
        title,
        description,
        status,
        reviewed_at,
        reward_paid,
        created_at
      FROM bug_reports
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [account.user_id]);
        // Calculate statistics
        const stats = {
            total_transactions: transactions.length,
            total_transfers_sent: transactions.filter((t) => t.transaction_type === 'transfer' && t.from_username === account.username).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            total_transfers_received: transactions.filter((t) => t.transaction_type === 'transfer' && t.to_username === account.username).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            total_deposits: transactions.filter((t) => t.transaction_type === 'deposit').reduce((sum, t) => sum + parseFloat(t.amount), 0),
            total_withdrawals: transactions.filter((t) => t.transaction_type === 'withdrawal').reduce((sum, t) => sum + parseFloat(t.amount), 0),
            math_games_played: mathGameSessions.length,
            total_math_earnings: mathGameSessions.reduce((sum, s) => sum + parseFloat(s.earnings), 0),
            pizza_contributions_total: pizzaContributions.reduce((sum, p) => sum + parseFloat(p.amount), 0),
            shop_purchases_total: shopPurchases.reduce((sum, s) => sum + parseFloat(s.amount), 0),
            land_parcels_owned: landParcels.length,
            land_value_total: landParcels.reduce((sum, l) => sum + parseFloat(l.value), 0),
            active_loans: loans.filter((l) => l.status === 'active').length,
            total_loan_debt: loans.filter((l) => l.status === 'active').reduce((sum, l) => sum + parseFloat(l.outstanding_balance), 0)
        };
        res.json({
            account: {
                account_number: account.account_number,
                balance: account.balance,
                created_at: account.account_created_at,
                last_activity: account.last_activity
            },
            student: {
                id: account.user_id,
                username: account.username,
                first_name: account.first_name,
                last_name: account.last_name,
                class: account.class,
                email: account.email,
                status: account.status,
                created_at: account.user_created_at,
                updated_at: account.user_updated_at,
                job_id: account.job_id,
                job_name: account.job_name,
                job_description: account.job_description,
                job_salary: account.job_salary,
                job_company_name: account.job_company_name,
                account_number: account.account_number,
                balance: account.balance,
                last_activity: account.last_activity
            },
            transactions,
            loans,
            landParcels,
            mathGameSessions,
            pizzaContributions,
            shopPurchases,
            jobApplications,
            suggestions,
            bugReports,
            stats
        });
    }
    catch (error) {
        console.error('Get account details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get comprehensive student details (teachers only)
router.get('/:username/details', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { username } = req.params;
        console.log('🔍 Looking up student details for username:', JSON.stringify(username));
        console.log('🔍 Username length:', username?.length);
        console.log('🔍 Username chars:', username?.split('').map(c => `${c}(${c.charCodeAt(0)})`));
        // Get student info with job details
        const student = await database_prod_1.default.get(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.status,
        u.created_at,
        u.updated_at,
        u.job_id,
        j.name as job_name,
        j.description as job_description,
        j.salary as job_salary,
        j.company_name as job_company_name,
        a.account_number,
        a.balance,
        a.updated_at as last_activity
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE u.username = $1 AND u.role = 'student'
    `, [username]);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);
        // Get all transactions
        let transactions = [];
        if (account) {
            transactions = await database_prod_1.default.query(`
        SELECT 
          t.*,
          fu.username as from_username,
          fu.first_name as from_first_name,
          fu.last_name as from_last_name,
          tu.username as to_username,
          tu.first_name as to_first_name,
          tu.last_name as to_last_name
        FROM transactions t
        LEFT JOIN accounts fa ON t.from_account_id = fa.id
        LEFT JOIN users fu ON fa.user_id = fu.id
        LEFT JOIN accounts ta ON t.to_account_id = ta.id
        LEFT JOIN users tu ON ta.user_id = tu.id
        WHERE t.from_account_id = $1 OR t.to_account_id = $2
        ORDER BY t.created_at DESC
      `, [account.id, account.id]);
        }
        // Get loans
        const loans = await database_prod_1.default.query(`
      SELECT 
        l.*,
        COALESCE(SUM(lp.amount), 0) as total_paid,
        CASE 
          WHEN l.status = 'active' AND l.monthly_payment > 0 THEN 
            GREATEST(0, CEIL(l.outstanding_balance / (l.monthly_payment / 4.33)))
          ELSE 0 
        END as payments_remaining
      FROM loans l
      LEFT JOIN loan_payments lp ON l.id = lp.loan_id
      WHERE l.borrower_id = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [student.id]);
        // Get land parcels owned
        const landParcels = await database_prod_1.default.query(`
      SELECT 
        id,
        grid_code,
        biome_type,
        value,
        risk_level,
        purchased_at
      FROM land_parcels
      WHERE owner_id = $1
      ORDER BY purchased_at DESC
    `, [student.id]);
        // Get math game sessions
        const mathGameSessions = await database_prod_1.default.query(`
      SELECT 
        id,
        difficulty,
        score,
        correct_answers,
        total_problems,
        earnings,
        played_at
      FROM math_game_sessions
      WHERE user_id = $1
      ORDER BY played_at DESC
    `, [student.id]);
        // Get pizza time contributions
        const pizzaContributions = await database_prod_1.default.query(`
      SELECT 
        t.amount,
        t.description,
        t.created_at
      FROM transactions t
      JOIN accounts a ON t.from_account_id = a.id
      WHERE a.user_id = $1 AND t.description LIKE '%pizza%'
      ORDER BY t.created_at DESC
    `, [student.id]);
        // Get Winkel (shop) purchases
        const shopPurchases = await database_prod_1.default.query(`
      SELECT 
        t.amount,
        t.description,
        t.created_at
      FROM transactions t
      JOIN accounts a ON t.from_account_id = a.id
      WHERE a.user_id = $1 AND t.description LIKE '%Winkel%'
      ORDER BY t.created_at DESC
    `, [student.id]);
        // Get job application history
        const jobApplications = await database_prod_1.default.query(`
      SELECT 
        ja.id,
        ja.status,
        ja.created_at,
        ja.reviewed_at,
        j.name as job_name,
        j.salary as job_salary
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = $1
      ORDER BY ja.created_at DESC
    `, [student.id]);
        // Get Suggestions & Bug reports (recent)
        const suggestions = await database_prod_1.default.query(`
      SELECT
        id,
        content,
        status,
        reviewed_at,
        reward_paid,
        created_at
      FROM suggestions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `, [student.id]);
        const bugReports = await database_prod_1.default.query(`
      SELECT
        id,
        title,
        description,
        status,
        reviewed_at,
        reward_paid,
        created_at
      FROM bug_reports
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `, [student.id]);
        // Calculate statistics
        const stats = {
            total_transactions: transactions.length,
            total_transfers_sent: transactions.filter(t => t.transaction_type === 'transfer' && t.from_username === student.username).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            total_transfers_received: transactions.filter(t => t.transaction_type === 'transfer' && t.to_username === student.username).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            total_deposits: transactions.filter(t => t.transaction_type === 'deposit').reduce((sum, t) => sum + parseFloat(t.amount), 0),
            total_withdrawals: transactions.filter(t => t.transaction_type === 'withdrawal').reduce((sum, t) => sum + parseFloat(t.amount), 0),
            math_games_played: mathGameSessions.length,
            total_math_earnings: mathGameSessions.reduce((sum, s) => sum + parseFloat(s.earnings), 0),
            pizza_contributions_total: pizzaContributions.reduce((sum, p) => sum + parseFloat(p.amount), 0),
            shop_purchases_total: shopPurchases.reduce((sum, s) => sum + parseFloat(s.amount), 0),
            land_parcels_owned: landParcels.length,
            land_value_total: landParcels.reduce((sum, l) => sum + parseFloat(l.value), 0),
            active_loans: loans.filter(l => l.status === 'active').length,
            total_loan_debt: loans.filter(l => l.status === 'active').reduce((sum, l) => sum + parseFloat(l.outstanding_balance), 0)
        };
        res.json({
            student,
            transactions,
            loans,
            landParcels,
            mathGameSessions,
            pizzaContributions,
            shopPurchases,
            jobApplications,
            suggestions,
            bugReports,
            stats
        });
    }
    catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete an account by account number (teachers only) - for orphaned accounts
router.delete('/account/:accountNumber', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { accountNumber } = req.params;
        // Get account info
        const account = await database_prod_1.default.get('SELECT id, user_id FROM accounts WHERE account_number = $1', [accountNumber]);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // If account has a user, check if user exists
        let user = null;
        if (account.user_id) {
            user = await database_prod_1.default.get('SELECT id, username, role FROM users WHERE id = $1', [account.user_id]);
        }
        // Delete related data in order (respecting foreign key constraints)
        // 1. Delete transactions involving this account
        await database_prod_1.default.run('DELETE FROM transactions WHERE from_account_id = $1 OR to_account_id = $1', [account.id]);
        // 2. If user exists, delete user-related data
        if (user && user.role === 'student') {
            // Delete loan payments for loans where student is borrower
            await database_prod_1.default.run(`
        DELETE FROM loan_payments WHERE loan_id IN (
          SELECT id FROM loans WHERE borrower_id = $1
        )
      `, [user.id]);
            // Delete loans where student is borrower
            await database_prod_1.default.run('DELETE FROM loans WHERE borrower_id = $1', [user.id]);
            // Delete job applications
            await database_prod_1.default.run('DELETE FROM job_applications WHERE user_id = $1', [user.id]);
            // Delete land purchase requests
            await database_prod_1.default.run('DELETE FROM land_purchase_requests WHERE user_id = $1', [user.id]);
            // Update owned land parcels (set owner to null)
            await database_prod_1.default.run('UPDATE land_parcels SET owner_id = NULL WHERE owner_id = $1', [user.id]);
            // Delete tender applications
            await database_prod_1.default.run('DELETE FROM tender_applications WHERE applicant_id = $1', [user.id]);
            // Delete math game sessions
            await database_prod_1.default.run('DELETE FROM math_game_sessions WHERE user_id = $1', [user.id]);
            // Delete the user
            await database_prod_1.default.run('DELETE FROM users WHERE id = $1', [user.id]);
        }
        // Delete the account
        await database_prod_1.default.run('DELETE FROM accounts WHERE id = $1', [account.id]);
        console.log(`🗑️ Teacher ${req.user?.username} deleted account ${accountNumber}${user ? ` (and associated user ${user.username})` : ' (orphaned account)'}`);
        res.json({
            message: `Account ${accountNumber} has been deleted successfully${user ? ` along with associated student account` : ' (orphaned account)'}`
        });
    }
    catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get student details with loan information (teachers only) - Legacy endpoint
router.get('/:username', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const { username } = req.params;
        // Get student info
        const student = await database_prod_1.default.get(`
      SELECT 
        u.id,
        u.username,
        u.created_at,
        a.account_number,
        a.balance,
        a.updated_at as last_activity
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE u.username = $1 AND u.role = 'student'
    `, [username]);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        // Get student's loans
        const loans = await database_prod_1.default.query(`
      SELECT 
        l.*,
        COALESCE(SUM(lp.amount), 0) as total_paid
      FROM loans l
      LEFT JOIN loan_payments lp ON l.id = lp.loan_id
      WHERE l.borrower_id = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [student.id]);
        // Get recent transactions
        const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);
        let transactions = [];
        if (account) {
            transactions = await database_prod_1.default.query(`
        SELECT 
          t.*,
          fu.username as from_username,
          tu.username as to_username
        FROM transactions t
        LEFT JOIN accounts fa ON t.from_account_id = fa.id
        LEFT JOIN users fu ON fa.user_id = fu.id
        LEFT JOIN accounts ta ON t.to_account_id = ta.id
        LEFT JOIN users tu ON ta.user_id = tu.id
        WHERE t.from_account_id = $1 OR t.to_account_id = $2
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [account.id, account.id]);
        }
        res.json({
            student,
            loans,
            recent_transactions: transactions
        });
    }
    catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=students.js.map