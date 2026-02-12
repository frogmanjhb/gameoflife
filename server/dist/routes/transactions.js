"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
// Helper function to check if student can make transactions
async function checkStudentCanTransact(userId) {
    // Check if student has negative balance
    const account = await database_prod_1.default.get('SELECT balance FROM accounts WHERE user_id = $1', [userId]);
    if (account && parseFloat(account.balance) < 0) {
        return {
            canTransact: false,
            reason: 'Your account has a negative balance. Please clear your debt before making any transactions.'
        };
    }
    // Check if student has an active loan with overdue payment
    // Only check if due_date exists and is in the past
    const activeLoan = await database_prod_1.default.get(`SELECT id, monthly_payment, due_date, outstanding_balance 
     FROM loans 
     WHERE borrower_id = $1 AND status = 'active' AND due_date IS NOT NULL AND due_date < CURRENT_DATE`, [userId]);
    if (activeLoan) {
        return {
            canTransact: false,
            reason: 'You have an overdue loan payment. Please make your loan payment before making any other transactions.'
        };
    }
    return { canTransact: true };
}
const router = (0, express_1.Router)();
// Get transaction history
router.get('/history', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        let transactions = [];
        if (req.user.role === 'student') {
            console.log('🔍 Getting transactions for student:', req.user.username);
            // Get student's account
            const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
            console.log('💳 Student account:', account);
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }
            // Get all transactions for this account
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
      `, [account.id, account.id]);
            console.log('📊 Found transactions for student:', transactions.length);
        }
        else {
            // Teacher can see all transactions
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
        ORDER BY t.created_at DESC
      `);
        }
        res.json(transactions);
    }
    catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Transfer request between students (requires teacher approval)
router.post('/transfer', [
    (0, express_validator_1.body)('to_username').notEmpty().withMessage('Recipient username is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('description').notEmpty().trim().withMessage('Description is required')
], auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { to_username, amount, description } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Check if student can make transactions (no negative balance or overdue loans)
        const canTransactResult = await checkStudentCanTransact(req.user.id);
        if (!canTransactResult.canTransact) {
            return res.status(400).json({ error: canTransactResult.reason });
        }
        // Parse and validate transfer amount early
        const transferAmount = parseFloat(amount.toString());
        if (isNaN(transferAmount) || transferAmount <= 0) {
            return res.status(400).json({ error: 'Invalid transfer amount' });
        }
        // Get recipient info
        const toUser = await database_prod_1.default.get('SELECT * FROM users WHERE username = $1 AND role = $2', [to_username, 'student']);
        if (!toUser) {
            return res.status(404).json({ error: 'Recipient not found' });
        }
        // Prevent self-transfer
        if (req.user.id === toUser.id) {
            return res.status(400).json({ error: 'Cannot transfer to yourself' });
        }
        // Ensure both students are in same school
        const schoolId = req.user.school_id ?? null;
        if ((toUser.school_id ?? null) !== schoolId) {
            return res.status(400).json({ error: 'Recipient must be in the same school' });
        }
        // Check sender has sufficient balance (at request time)
        const fromAccount = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
        if (!fromAccount) {
            return res.status(404).json({ error: 'Account not found' });
        }
        const senderBalance = parseFloat(fromAccount.balance);
        if (isNaN(senderBalance) || senderBalance < transferAmount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        // Create pending transfer request (teacher approval required)
        await database_prod_1.default.run(`INSERT INTO pending_transfers (from_user_id, to_user_id, amount, description, status) VALUES ($1, $2, $3, $4, 'pending')`, [req.user.id, toUser.id, transferAmount, description || `Transfer to ${to_username}`]);
        res.json({ message: 'Transfer request submitted. Awaiting teacher approval.' });
    }
    catch (error) {
        console.error('Transfer request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get pending transfers (teachers only, scoped by school)
router.get('/pending-transfers', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        if (!req.user || !req.schoolId) {
            return res.status(403).json({ error: 'School context required' });
        }
        const pending = await database_prod_1.default.query(`
      SELECT pt.*,
        fu.username as from_username, fu.first_name as from_first_name, fu.last_name as from_last_name, fu.class as from_class,
        tu.username as to_username, tu.first_name as to_first_name, tu.last_name as to_last_name, tu.class as to_class,
        rb.username as reviewed_by_username
      FROM pending_transfers pt
      JOIN users fu ON pt.from_user_id = fu.id
      JOIN users tu ON pt.to_user_id = tu.id
      LEFT JOIN users rb ON pt.reviewed_by = rb.id
      WHERE fu.school_id = $1 AND tu.school_id = $1
      ORDER BY pt.created_at DESC
    `, [req.schoolId]);
        res.json(pending);
    }
    catch (error) {
        console.error('Get pending transfers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get my pending transfer requests (students only)
router.get('/my-pending-transfers', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const pending = await database_prod_1.default.query(`
      SELECT pt.*,
        tu.username as to_username, tu.first_name as to_first_name, tu.last_name as to_last_name
      FROM pending_transfers pt
      JOIN users tu ON pt.to_user_id = tu.id
      WHERE pt.from_user_id = $1
      ORDER BY pt.created_at DESC
    `, [req.user.id]);
        res.json(pending);
    }
    catch (error) {
        console.error('Get my pending transfers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Teacher: Approve pending transfer
router.post('/pending-transfers/:id/approve', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid transfer ID' });
        }
        const schoolId = req.user?.school_id ?? req.schoolId ?? null;
        if (schoolId == null) {
            return res.status(403).json({ error: 'School context required' });
        }
        const pending = await database_prod_1.default.get(`
      SELECT pt.*, fu.school_id as from_school_id, tu.school_id as to_school_id
      FROM pending_transfers pt
      JOIN users fu ON pt.from_user_id = fu.id
      JOIN users tu ON pt.to_user_id = tu.id
      WHERE pt.id = $1
    `, [id]);
        if (!pending) {
            return res.status(404).json({ error: 'Transfer request not found' });
        }
        if (pending.status !== 'pending') {
            return res.status(400).json({ error: `Transfer request is already ${pending.status}` });
        }
        if (pending.from_school_id !== schoolId || pending.to_school_id !== schoolId) {
            return res.status(403).json({ error: 'You can only approve transfers within your school' });
        }
        const transferAmount = parseFloat(pending.amount);
        const description = pending.description || `Transfer to ${pending.to_username}`;
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            const fromAccountResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [pending.from_user_id]);
            const fromAccount = fromAccountResult.rows[0];
            if (!fromAccount) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Sender account not found' });
            }
            const senderBalance = parseFloat(fromAccount.balance);
            if (isNaN(senderBalance) || senderBalance < transferAmount) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Sender has insufficient funds. Transfer cannot be approved.' });
            }
            const toAccountResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [pending.to_user_id]);
            const toAccount = toAccountResult.rows[0];
            if (!toAccount) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Recipient account not found' });
            }
            await client.query('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [transferAmount, fromAccount.id]);
            await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [transferAmount, toAccount.id]);
            await client.query('INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)', [fromAccount.id, toAccount.id, transferAmount, 'transfer', description]);
            await client.query(`UPDATE pending_transfers SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [req.user?.id, id]);
            await client.query('COMMIT');
            res.json({ message: 'Transfer approved successfully' });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Approve transfer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Teacher: Deny pending transfer
router.post('/pending-transfers/:id/deny', [
    (0, express_validator_1.body)('denial_reason').optional().trim()
], auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid transfer ID' });
        }
        const schoolId = req.user?.school_id ?? req.schoolId ?? null;
        if (schoolId == null) {
            return res.status(403).json({ error: 'School context required' });
        }
        const pending = await database_prod_1.default.get(`
      SELECT pt.*, fu.school_id as from_school_id, tu.school_id as to_school_id
      FROM pending_transfers pt
      JOIN users fu ON pt.from_user_id = fu.id
      JOIN users tu ON pt.to_user_id = tu.id
      WHERE pt.id = $1
    `, [id]);
        if (!pending) {
            return res.status(404).json({ error: 'Transfer request not found' });
        }
        if (pending.status !== 'pending') {
            return res.status(400).json({ error: `Transfer request is already ${pending.status}` });
        }
        if (pending.from_school_id !== schoolId || pending.to_school_id !== schoolId) {
            return res.status(403).json({ error: 'You can only deny transfers within your school' });
        }
        const denialReason = req.body.denial_reason || undefined;
        await database_prod_1.default.run(`UPDATE pending_transfers SET status = 'denied', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, denial_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [req.user?.id, denialReason, id]);
        res.json({ message: 'Transfer denied' });
    }
    catch (error) {
        console.error('Deny transfer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Teacher: Deposit money to student account
router.post('/deposit', [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('description').optional().isString()
], auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, amount, description } = req.body;
        // Get student's account
        const student = await database_prod_1.default.get('SELECT * FROM users WHERE username = $1 AND role = $2', [username, 'student']);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);
        if (!account) {
            return res.status(404).json({ error: 'Student account not found' });
        }
        // Update balance
        await database_prod_1.default.run('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [amount, account.id]);
        // Record transaction
        await database_prod_1.default.run('INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [account.id, amount, 'deposit', description || `Deposit by teacher`]);
        res.json({ message: 'Deposit successful' });
    }
    catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Teacher: Withdraw money from student account
router.post('/withdraw', [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('description').optional().isString()
], auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, amount, description } = req.body;
        // Get student's account
        const student = await database_prod_1.default.get('SELECT * FROM users WHERE username = $1 AND role = $2', [username, 'student']);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);
        if (!account) {
            return res.status(404).json({ error: 'Student account not found' });
        }
        // Check sufficient balance
        if (account.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        // Update balance
        await database_prod_1.default.run('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [amount, account.id]);
        // Record transaction
        await database_prod_1.default.run('INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [account.id, amount, 'withdrawal', description || `Withdrawal by teacher`]);
        res.json({ message: 'Withdrawal successful' });
    }
    catch (error) {
        console.error('Withdrawal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Teacher: Bulk payment to all students in a class
router.post('/bulk-payment', [
    (0, express_validator_1.body)('class_name').notEmpty().withMessage('Class name is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('description').optional().isString()
], auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { class_name, amount, description } = req.body;
        console.log('🔍 Bulk payment to class:', class_name, 'amount:', amount);
        // Get all students in the class
        const students = await database_prod_1.default.query('SELECT u.id, u.username, a.id as account_id, a.balance FROM users u LEFT JOIN accounts a ON u.id = a.user_id WHERE u.role = $1 AND u.class = $2', ['student', class_name]);
        if (students.length === 0) {
            return res.status(404).json({ error: `No students found in class ${class_name}` });
        }
        console.log('📊 Found students in class:', students.length);
        // Count students with accounts for treasury check
        const studentsWithAccounts = students.filter((s) => s.account_id).length;
        const totalNeeded = studentsWithAccounts * amount;
        // Check treasury has sufficient funds (if class is valid)
        if (['6A', '6B', '6C'].includes(class_name)) {
            const town = await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1', [class_name]);
            const treasuryBalance = parseFloat(town?.treasury_balance || '0');
            if (treasuryBalance < totalNeeded) {
                return res.status(400).json({
                    error: `Insufficient treasury funds. Need R${totalNeeded.toFixed(2)} but only have R${treasuryBalance.toFixed(2)}`
                });
            }
        }
        let updatedCount = 0;
        // Use a single client connection for proper transaction handling
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            for (const student of students) {
                if (student.account_id) {
                    // Update balance
                    await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [amount, student.account_id]);
                    // Record transaction
                    await client.query('INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [student.account_id, amount, 'deposit', description || `Bulk payment to ${class_name}`]);
                    updatedCount++;
                }
            }
            // Deduct from treasury (if class is valid)
            if (['6A', '6B', '6C'].includes(class_name) && updatedCount > 0) {
                const totalPaid = updatedCount * amount;
                const bulkSchoolId = req.user?.school_id ?? req.schoolId ?? null;
                // Update treasury (filtered by school_id)
                if (bulkSchoolId != null) {
                    await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [totalPaid, class_name, bulkSchoolId]);
                }
                else {
                    await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [totalPaid, class_name]);
                }
                // Record treasury transaction
                await client.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [bulkSchoolId, class_name, totalPaid, 'withdrawal', description || `Bulk payment to ${updatedCount} students`, req.user?.id]);
            }
            await client.query('COMMIT');
            console.log('✅ Bulk payment completed for', updatedCount, 'students');
            res.json({ message: 'Bulk payment successful', updated_count: updatedCount });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Bulk payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Teacher: Bulk removal from all students in a class
router.post('/bulk-removal', [
    (0, express_validator_1.body)('class_name').notEmpty().withMessage('Class name is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('description').optional().isString()
], auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { class_name, amount, description } = req.body;
        console.log('🔍 Bulk removal from class:', class_name, 'amount:', amount);
        // Get all students in the class with sufficient balance
        const students = await database_prod_1.default.query('SELECT u.id, u.username, a.id as account_id, a.balance FROM users u LEFT JOIN accounts a ON u.id = a.user_id WHERE u.role = $1 AND u.class = $2 AND a.balance >= $3', ['student', class_name, amount]);
        if (students.length === 0) {
            return res.status(404).json({ error: `No students found in class ${class_name} with sufficient balance` });
        }
        console.log('📊 Found students with sufficient balance:', students.length);
        let updatedCount = 0;
        // Use a single client connection for proper transaction handling
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            for (const student of students) {
                if (student.account_id) {
                    // Update balance
                    await client.query('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [amount, student.account_id]);
                    // Record transaction
                    await client.query('INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [student.account_id, amount, 'withdrawal', description || `Bulk removal from ${class_name}`]);
                    updatedCount++;
                }
            }
            await client.query('COMMIT');
            console.log('✅ Bulk removal completed for', updatedCount, 'students');
            res.json({ message: 'Bulk removal successful', updated_count: updatedCount });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Bulk removal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Check if student can make transactions
router.get('/can-transact', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const result = await checkStudentCanTransact(req.user.id);
        res.json(result);
    }
    catch (error) {
        console.error('Can transact check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get bank settings (teachers only)
router.get('/bank-settings', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const settings = await database_prod_1.default.query('SELECT * FROM bank_settings');
        const settingsMap = settings.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value;
            return acc;
        }, {});
        res.json(settingsMap);
    }
    catch (error) {
        console.error('Get bank settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update bank setting (teachers only)
router.put('/bank-settings/:key', [
    (0, express_validator_1.body)('value').notEmpty().withMessage('Value is required')
], auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { key } = req.params;
        const { value } = req.body;
        await database_prod_1.default.run('UPDATE bank_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE setting_key = $3', [value, req.user?.id, key]);
        res.json({ message: 'Setting updated successfully', key, value });
    }
    catch (error) {
        console.error('Update bank setting error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Pay basic salary to all unemployed students (teachers only)
router.post('/pay-basic-salary', [
    (0, express_validator_1.body)('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Get basic salary amount from settings or use provided amount or default
        let amount = req.body.amount;
        if (!amount) {
            const setting = await database_prod_1.default.get('SELECT setting_value FROM bank_settings WHERE setting_key = $1', ['basic_salary_amount']);
            amount = parseFloat(setting?.setting_value || '1500');
        }
        console.log('💰 Paying basic salary to unemployed students:', amount);
        // Get all students without jobs, including their class
        const students = await database_prod_1.default.query(`SELECT u.id, u.username, u.class, a.id as account_id 
       FROM users u 
       LEFT JOIN accounts a ON u.id = a.user_id 
       WHERE u.role = 'student' AND (u.job_id IS NULL OR u.job_id = 0)`, []);
        if (students.length === 0) {
            return res.json({ message: 'No unemployed students found', updated_count: 0 });
        }
        console.log('📊 Found unemployed students:', students.length);
        // Group students by class to calculate treasury deductions
        const studentsByClass = {};
        for (const student of students) {
            const studentClass = student.class;
            if (studentClass && ['6A', '6B', '6C'].includes(studentClass)) {
                if (!studentsByClass[studentClass]) {
                    studentsByClass[studentClass] = [];
                }
                studentsByClass[studentClass].push(student);
            }
        }
        // Check each class treasury has sufficient funds
        for (const [townClass, classStudents] of Object.entries(studentsByClass)) {
            const totalNeeded = classStudents.filter(s => s.account_id).length * amount;
            const town = await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1', [townClass]);
            const treasuryBalance = parseFloat(town?.treasury_balance || '0');
            if (treasuryBalance < totalNeeded) {
                return res.status(400).json({
                    error: `Insufficient treasury funds for class ${townClass}. Need R${totalNeeded.toFixed(2)} but only have R${treasuryBalance.toFixed(2)}`
                });
            }
        }
        let updatedCount = 0;
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            // Track totals per class for treasury deductions
            const classTotals = {};
            for (const student of students) {
                if (student.account_id) {
                    // Update balance
                    await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [amount, student.account_id]);
                    // Record transaction
                    await client.query('INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [student.account_id, amount, 'salary', 'Basic salary (unemployed)']);
                    // Track class totals
                    const studentClass = student.class;
                    if (studentClass && ['6A', '6B', '6C'].includes(studentClass)) {
                        if (!classTotals[studentClass]) {
                            classTotals[studentClass] = { count: 0, total: 0 };
                        }
                        classTotals[studentClass].count++;
                        classTotals[studentClass].total += amount;
                    }
                    updatedCount++;
                }
            }
            // Deduct from each class treasury (filtered by school_id)
            const basicSchoolId = req.user?.school_id ?? req.schoolId ?? null;
            for (const [townClass, totals] of Object.entries(classTotals)) {
                if (basicSchoolId != null) {
                    await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [totals.total, townClass, basicSchoolId]);
                }
                else {
                    await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [totals.total, townClass]);
                }
                // Record treasury transaction
                await client.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [basicSchoolId, townClass, totals.total, 'withdrawal', `Basic salary payments to ${totals.count} unemployed students`, req.user?.id]);
            }
            // Update last run timestamp
            await client.query('UPDATE bank_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2', [new Date().toISOString(), 'last_basic_salary_run']);
            await client.query('COMMIT');
            console.log('✅ Basic salary paid to', updatedCount, 'unemployed students');
            res.json({ message: 'Basic salary paid successfully', updated_count: updatedCount, amount });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Pay basic salary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get unemployed students count (teachers only)
router.get('/unemployed-students', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const students = await database_prod_1.default.query(`SELECT u.id, u.username, u.first_name, u.last_name, u.class, a.balance, a.account_number
       FROM users u 
       LEFT JOIN accounts a ON u.id = a.user_id 
       WHERE u.role = 'student' AND (u.job_id IS NULL OR u.job_id = 0)
       ORDER BY u.class, u.last_name, u.first_name`, []);
        res.json({ students, count: students.length });
    }
    catch (error) {
        console.error('Get unemployed students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map