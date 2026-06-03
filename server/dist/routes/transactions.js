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
const accountant_assignments_1 = require("../domain/accountant-assignments");
const accountant_transfer_approval_1 = require("../domain/accountant-transfer-approval");
const accountant_advice_1 = require("../domain/accountant-advice");
const accountant_salary_payments_1 = require("../domain/accountant-salary-payments");
const student_transfer_limit_1 = require("../domain/student-transfer-limit");
const transaction_history_visibility_1 = require("../domain/transaction-history-visibility");
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
async function executeTeacherTransferApproval(pending, schoolId, reviewerId) {
    if (pending.status !== 'pending') {
        return {
            success: false,
            error: `Transfer request is already ${pending.status}`,
            httpStatus: 400,
        };
    }
    if (pending.from_school_id !== schoolId || pending.to_school_id !== schoolId) {
        return {
            success: false,
            error: 'You can only approve transfers within your school',
            httpStatus: 403,
        };
    }
    const transferAmount = parseFloat(String(pending.amount));
    const description = pending.description || `Transfer to ${pending.to_username ?? 'student'}`;
    const client = await database_prod_1.default.pool.connect();
    try {
        await client.query('BEGIN');
        const fromAccountResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [pending.from_user_id]);
        const fromAccount = fromAccountResult.rows[0];
        if (!fromAccount) {
            await client.query('ROLLBACK');
            return { success: false, error: 'Sender account not found', httpStatus: 404 };
        }
        const senderBalance = parseFloat(fromAccount.balance);
        if (isNaN(senderBalance) || senderBalance < transferAmount) {
            await client.query('ROLLBACK');
            return {
                success: false,
                error: 'Sender has insufficient funds. Transfer cannot be approved.',
                httpStatus: 400,
            };
        }
        const toAccountResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [pending.to_user_id]);
        const toAccount = toAccountResult.rows[0];
        if (!toAccount) {
            await client.query('ROLLBACK');
            return { success: false, error: 'Recipient account not found', httpStatus: 404 };
        }
        await client.query('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [transferAmount, fromAccount.id]);
        await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [transferAmount, toAccount.id]);
        await client.query('INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)', [fromAccount.id, toAccount.id, transferAmount, 'transfer', description]);
        await client.query(`UPDATE pending_transfers SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [reviewerId, pending.id]);
        await client.query('COMMIT');
        return { success: true };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
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
            const studentClass = req.user.class;
            const schoolId = req.user.school_id ?? req.schoolId ?? null;
            const accountParams = [account.id, account.id];
            const visibility = studentClass && ['6A', '6B', '6C'].includes(studentClass)
                ? (0, transaction_history_visibility_1.studentTownTransactionVisibilitySql)(schoolId, studentClass, accountParams.length + 1, accountParams.length + 2)
                : { fragment: '', params: [] };
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
        WHERE (t.from_account_id = $1 OR t.to_account_id = $2)
        ${visibility.fragment}
        ORDER BY t.created_at DESC
      `, [...accountParams, ...visibility.params]);
            console.log('📊 Found transactions for student:', transactions.length);
        }
        else {
            // Teacher: only transactions where both parties are in the teacher's school
            const schoolId = req.user.school_id ?? req.schoolId ?? null;
            const schoolCondition = schoolId !== null
                ? '(fa.user_id IS NULL OR fu.school_id = $1) AND (ta.user_id IS NULL OR tu.school_id = $1)'
                : '(fa.user_id IS NULL OR fu.school_id IS NULL) AND (ta.user_id IS NULL OR tu.school_id IS NULL)';
            const params = schoolId !== null ? [schoolId] : [];
            const visibility = (0, transaction_history_visibility_1.teacherSchoolTransactionVisibilitySql)(schoolId, params.length + 1);
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
        WHERE ${schoolCondition}
        ${visibility.fragment}
        ORDER BY t.created_at DESC
      `, [...params, ...visibility.params]);
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
        const transferLimitStatus = await (0, student_transfer_limit_1.getStudentTransferLimitStatusForUser)(req.user.id);
        if (!transferLimitStatus.canRequestTransfer) {
            return res.status(400).json({ error: (0, student_transfer_limit_1.dailyTransferLimitReason)() });
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
// Teacher: Approve all pending transfers (school-scoped)
router.post('/pending-transfers/approve-all', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const schoolId = req.user?.school_id ?? req.schoolId ?? null;
        if (schoolId == null) {
            return res.status(403).json({ error: 'School context required' });
        }
        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not found' });
        }
        const pendingList = await database_prod_1.default.query(`
      SELECT pt.*,
        fu.school_id as from_school_id,
        tu.school_id as to_school_id,
        tu.username as to_username
      FROM pending_transfers pt
      JOIN users fu ON pt.from_user_id = fu.id
      JOIN users tu ON pt.to_user_id = tu.id
      WHERE pt.status = 'pending' AND fu.school_id = $1 AND tu.school_id = $1
      ORDER BY pt.created_at ASC
    `, [schoolId]);
        if (pendingList.length === 0) {
            return res.json({
                message: 'No pending transfers to approve',
                approved: 0,
                failed: [],
            });
        }
        const failed = [];
        let approved = 0;
        for (const pending of pendingList) {
            const result = await executeTeacherTransferApproval(pending, schoolId, req.user.id);
            if (result.success) {
                approved += 1;
            }
            else {
                failed.push({ id: pending.id, error: result.error });
            }
        }
        const message = failed.length === 0
            ? `Approved ${approved} transfer${approved !== 1 ? 's' : ''} successfully`
            : `Approved ${approved} transfer${approved !== 1 ? 's' : ''}; ${failed.length} could not be approved`;
        res.json({ message, approved, failed });
    }
    catch (error) {
        console.error('Approve all transfers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Teacher: Deny all pending transfers (school-scoped)
router.post('/pending-transfers/deny-all', auth_1.authenticateToken, tenant_1.requireTenant, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const schoolId = req.user?.school_id ?? req.schoolId ?? null;
        if (schoolId == null) {
            return res.status(403).json({ error: 'School context required' });
        }
        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not found' });
        }
        const pendingList = await database_prod_1.default.query(`
      SELECT pt.id, pt.status, fu.school_id as from_school_id, tu.school_id as to_school_id
      FROM pending_transfers pt
      JOIN users fu ON pt.from_user_id = fu.id
      JOIN users tu ON pt.to_user_id = tu.id
      WHERE pt.status = 'pending' AND fu.school_id = $1 AND tu.school_id = $1
      ORDER BY pt.created_at ASC
    `, [schoolId]);
        if (pendingList.length === 0) {
            return res.json({
                message: 'No pending transfers to deny',
                denied: 0,
                failed: [],
            });
        }
        const failed = [];
        let denied = 0;
        for (const pending of pendingList) {
            if (pending.status !== 'pending') {
                failed.push({ id: pending.id, error: `Transfer request is already ${pending.status}` });
                continue;
            }
            if (pending.from_school_id !== schoolId || pending.to_school_id !== schoolId) {
                failed.push({ id: pending.id, error: 'You can only deny transfers within your school' });
                continue;
            }
            await database_prod_1.default.run(`UPDATE pending_transfers SET status = 'denied', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = 'pending'`, [req.user.id, pending.id]);
            denied += 1;
        }
        const message = failed.length === 0
            ? `Denied ${denied} transfer${denied !== 1 ? 's' : ''} successfully`
            : `Denied ${denied} transfer${denied !== 1 ? 's' : ''}; ${failed.length} could not be denied`;
        res.json({ message, denied, failed });
    }
    catch (error) {
        console.error('Deny all transfers error:', error);
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
        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not found' });
        }
        const pending = await database_prod_1.default.get(`
      SELECT pt.*, fu.school_id as from_school_id, tu.school_id as to_school_id, tu.username as to_username
      FROM pending_transfers pt
      JOIN users fu ON pt.from_user_id = fu.id
      JOIN users tu ON pt.to_user_id = tu.id
      WHERE pt.id = $1
    `, [id]);
        if (!pending) {
            return res.status(404).json({ error: 'Transfer request not found' });
        }
        const result = await executeTeacherTransferApproval(pending, schoolId, req.user.id);
        if (!result.success) {
            return res.status(result.httpStatus).json({ error: result.error });
        }
        res.json({ message: 'Transfer approved successfully' });
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
// Chartered Accountant: Get my pending transfer approvals (students they are responsible for)
router.get('/my-approvals', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        let context;
        try {
            context = await (0, accountant_assignments_1.getAccountantContext)(req.user.id);
        }
        catch (err) {
            if (err instanceof Error && err.message === 'NOT_ACCOUNTANT') {
                return res.status(403).json({ error: 'Only Chartered Accountants can review transfers' });
            }
            throw err;
        }
        const managedClientIds = (0, accountant_assignments_1.getManagedClientUserIds)(context);
        if (!managedClientIds.length) {
            return res.json([]);
        }
        const placeholders = managedClientIds.map((_, idx) => `$${idx + 1}`).join(', ');
        const pending = await database_prod_1.default.query(`
      SELECT pt.*,
        fu.username as from_username, fu.first_name as from_first_name, fu.last_name as from_last_name, fu.class as from_class,
        tu.username as to_username, tu.first_name as to_first_name, tu.last_name as to_last_name, tu.class as to_class,
        rb.username as reviewed_by_username
      FROM pending_transfers pt
      JOIN users fu ON pt.from_user_id = fu.id
      JOIN users tu ON pt.to_user_id = tu.id
      LEFT JOIN users rb ON pt.reviewed_by = rb.id
      WHERE pt.status = 'pending'
        AND pt.from_user_id IN (${placeholders})
      ORDER BY pt.created_at DESC
      `, managedClientIds);
        res.json(pending);
    }
    catch (error) {
        console.error('Get accountant approvals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Chartered Accountant: Get list of students they are responsible for
router.get('/my-approvals/assignments', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        let context;
        try {
            context = await (0, accountant_assignments_1.getAccountantContext)(req.user.id);
        }
        catch (err) {
            if (err instanceof Error && err.message === 'NOT_ACCOUNTANT') {
                return res.status(403).json({ error: 'Only Chartered Accountants can view assignments' });
            }
            throw err;
        }
        const managedClientIds = (0, accountant_assignments_1.getManagedClientUserIds)(context);
        if (!managedClientIds.length) {
            return res.json([]);
        }
        const placeholders = managedClientIds.map((_, idx) => `$${idx + 1}`).join(', ');
        const students = await database_prod_1.default.query(`
      SELECT u.id, u.username, u.first_name, u.last_name, u.class, j.name AS job_name
      FROM users u
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE u.id IN (${placeholders})
      ORDER BY u.class NULLS LAST, u.last_name NULLS LAST, u.first_name NULLS LAST, u.username
      `, managedClientIds);
        res.json(students);
    }
    catch (error) {
        console.error('Get accountant assignments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Chartered Accountant: Approve a pending transfer they are responsible for (1 XP + R500 from treasury)
router.post('/my-approvals/:id/approve', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const transferId = parseInt(req.params.id, 10);
        if (isNaN(transferId)) {
            return res.status(400).json({ error: 'Invalid transfer ID' });
        }
        let context;
        try {
            context = await (0, accountant_assignments_1.getAccountantContext)(req.user.id);
        }
        catch (err) {
            if (err instanceof Error && err.message === 'NOT_ACCOUNTANT') {
                return res.status(403).json({ error: 'Only Chartered Accountants can approve transfers' });
            }
            throw err;
        }
        const { accountant } = context;
        const managedClientIds = (0, accountant_assignments_1.getManagedClientUserIds)(context);
        if (!managedClientIds.length) {
            return res.status(403).json({ error: 'No assigned students or accountants to approve transfers for' });
        }
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            const pendingResult = await client.query(`
        SELECT pt.*,
          fu.school_id as from_school_id,
          tu.school_id as to_school_id
        FROM pending_transfers pt
        JOIN users fu ON pt.from_user_id = fu.id
        JOIN users tu ON pt.to_user_id = tu.id
        WHERE pt.id = $1
        FOR UPDATE
        `, [transferId]);
            if (pendingResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Transfer request not found' });
            }
            const pending = pendingResult.rows[0];
            if (pending.status !== 'pending') {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Transfer request is already ${pending.status}` });
            }
            if (!managedClientIds.includes(pending.from_user_id)) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'You are not responsible for this transfer' });
            }
            if (accountant.school_id !== null) {
                if (pending.from_school_id !== accountant.school_id || pending.to_school_id !== accountant.school_id) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Transfer must be within your school' });
                }
            }
            const transferAmount = parseFloat(pending.amount);
            const description = pending.description || `Transfer to student`;
            const fromAccountResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [pending.from_user_id]);
            const toAccountResult = await client.query('SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE', [pending.to_user_id]);
            const fromAccount = fromAccountResult.rows[0];
            const toAccount = toAccountResult.rows[0];
            if (!fromAccount || !toAccount) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Sender or recipient account not found' });
            }
            const senderBalance = parseFloat(fromAccount.balance);
            if (isNaN(senderBalance) || senderBalance < transferAmount) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Sender has insufficient funds. Transfer cannot be approved.' });
            }
            await client.query('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [transferAmount, fromAccount.id]);
            await client.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [transferAmount, toAccount.id]);
            await client.query('INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)', [fromAccount.id, toAccount.id, transferAmount, 'transfer', description]);
            const statusUpdate = await client.query(`UPDATE pending_transfers
         SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND status = 'pending'`, [req.user.id, transferId]);
            if (!statusUpdate.rowCount) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Transfer request is no longer pending' });
            }
            const townClass = accountant.class;
            if (!townClass) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Town class is not set for your account' });
            }
            const accountantUser = await database_prod_1.default.get('SELECT username FROM users WHERE id = $1', [
                accountant.id,
            ]);
            let reward;
            try {
                reward = await (0, accountant_transfer_approval_1.payTransferApprovalReward)(client, accountant.id, accountantUser?.username || 'accountant', townClass, accountant.school_id ?? null, {
                    transferAmount,
                    toUserId: pending.to_user_id,
                    accountantUserId: accountant.id,
                });
            }
            catch (rewardErr) {
                if (rewardErr instanceof Error && rewardErr.message === 'TREASURY_INSUFFICIENT') {
                    reward = {
                        experience_points: 0,
                        earnings: 0,
                        new_level: null,
                        reward_skipped_reason: 'Town treasury cannot cover the approval reward',
                    };
                }
                else {
                    throw rewardErr;
                }
            }
            await client.query('COMMIT');
            const rewardSuffix = reward.earnings > 0
                ? `You earned ${reward.experience_points} XP and R${reward.earnings.toFixed(2)}.`
                : reward.reward_skipped_reason || '';
            res.json({
                message: rewardSuffix
                    ? `Transfer approved successfully. ${rewardSuffix}`
                    : 'Transfer approved successfully.',
                xp_awarded: reward.experience_points,
                earnings: reward.earnings,
                new_level: reward.new_level,
                reward_skipped_reason: reward.reward_skipped_reason,
            });
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
        console.error('Accountant approve transfer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Chartered Accountant: Deny a pending transfer they are responsible for
router.post('/my-approvals/:id/deny', [
    (0, express_validator_1.body)('denial_reason').optional().trim()
], auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const transferId = parseInt(req.params.id, 10);
        if (isNaN(transferId)) {
            return res.status(400).json({ error: 'Invalid transfer ID' });
        }
        let context;
        try {
            context = await (0, accountant_assignments_1.getAccountantContext)(req.user.id);
        }
        catch (err) {
            if (err instanceof Error && err.message === 'NOT_ACCOUNTANT') {
                return res.status(403).json({ error: 'Only Chartered Accountants can deny transfers' });
            }
            throw err;
        }
        const { accountant } = context;
        const managedClientIds = (0, accountant_assignments_1.getManagedClientUserIds)(context);
        if (!managedClientIds.length) {
            return res.status(403).json({ error: 'No assigned students or accountants to review transfers for' });
        }
        const client = await database_prod_1.default.pool.connect();
        try {
            await client.query('BEGIN');
            const pendingResult = await client.query(`
        SELECT pt.*,
          fu.school_id as from_school_id,
          tu.school_id as to_school_id
        FROM pending_transfers pt
        JOIN users fu ON pt.from_user_id = fu.id
        JOIN users tu ON pt.to_user_id = tu.id
        WHERE pt.id = $1
        FOR UPDATE
        `, [transferId]);
            if (pendingResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Transfer request not found' });
            }
            const pending = pendingResult.rows[0];
            if (pending.status !== 'pending') {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Transfer request is already ${pending.status}` });
            }
            if (!managedClientIds.includes(pending.from_user_id)) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'You are not responsible for this transfer' });
            }
            if (accountant.school_id !== null) {
                if (pending.from_school_id !== accountant.school_id || pending.to_school_id !== accountant.school_id) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Transfer must be within your school' });
                }
            }
            const denialReason = req.body.denial_reason || undefined;
            await client.query(`UPDATE pending_transfers
         SET status = 'denied',
             reviewed_by = $1,
             reviewed_at = CURRENT_TIMESTAMP,
             denial_reason = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`, [req.user.id, denialReason, transferId]);
            await client.query('COMMIT');
            res.json({ message: 'Transfer denied' });
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
        console.error('Accountant deny transfer error:', error);
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
        if (process.env.DEBUG === '1' || process.env.VERBOSE_LOGGING === '1')
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
        if (process.env.DEBUG === '1' || process.env.VERBOSE_LOGGING === '1')
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
        const transferLimitStatus = await (0, student_transfer_limit_1.getStudentTransferLimitStatusForUser)(req.user.id);
        if (result.canTransact && !transferLimitStatus.canRequestTransfer) {
            return res.json({
                canTransact: false,
                reason: `You have used all ${student_transfer_limit_1.STUDENT_TRANSFER_DAILY_LIMIT} transfer requests for today. You can request more tomorrow.`,
                ...transferLimitStatus,
            });
        }
        res.json({ ...result, ...transferLimitStatus });
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
        const schoolId = req.user?.school_id ?? req.schoolId ?? null;
        const schoolFilter = schoolId !== null
            ? 'AND u.school_id = $1'
            : 'AND u.school_id IS NULL';
        const studentParams = schoolId !== null ? [schoolId] : [];
        // Get unemployed students in teacher's school only
        const students = await database_prod_1.default.query(`SELECT u.id, u.username, u.class, a.id as account_id 
       FROM users u 
       LEFT JOIN accounts a ON u.id = a.user_id 
       WHERE u.role = 'student' AND (u.job_id IS NULL OR u.job_id = 0) ${schoolFilter}`, studentParams);
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
        // Check each class treasury has sufficient funds (teacher's school)
        for (const [townClass, classStudents] of Object.entries(studentsByClass)) {
            const totalNeeded = classStudents.filter(s => s.account_id).length * amount;
            const town = schoolId != null
                ? await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
                : await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
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
            for (const [townClass, totals] of Object.entries(classTotals)) {
                if (schoolId != null) {
                    await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [totals.total, townClass, schoolId]);
                }
                else {
                    await client.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [totals.total, townClass]);
                }
                // Record treasury transaction
                await client.query('INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)', [schoolId, townClass, totals.total, 'withdrawal', `Basic salary payments to ${totals.count} unemployed students`, req.user?.id]);
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
// Get unemployed students count (teachers only, school-scoped)
router.get('/unemployed-students', auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const schoolId = req.user?.school_id ?? req.schoolId ?? null;
        const schoolFilter = schoolId !== null
            ? 'AND u.school_id = $1'
            : 'AND u.school_id IS NULL';
        const params = schoolId !== null ? [schoolId] : [];
        const students = await database_prod_1.default.query(`SELECT u.id, u.username, u.first_name, u.last_name, u.class, a.balance, a.account_number
       FROM users u 
       LEFT JOIN accounts a ON u.id = a.user_id 
       WHERE u.role = 'student' AND (u.job_id IS NULL OR u.job_id = 0) ${schoolFilter}
       ORDER BY u.class, u.last_name, u.first_name`, params);
        res.json({ students, count: students.length });
    }
    catch (error) {
        console.error('Get unemployed students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Chartered Accountant: read-only client financial details
router.get('/accountant-clients/:username/details', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        let resolved;
        try {
            resolved = await (0, accountant_advice_1.resolveAccountantClient)(req.user.id, req.params.username);
        }
        catch (err) {
            const code = err instanceof Error ? err.message : '';
            if (code === 'NOT_ACCOUNTANT') {
                return res.status(403).json({ error: 'Only Chartered Accountants can view client details' });
            }
            if (code === 'CLIENT_NOT_FOUND') {
                return res.status(404).json({ error: 'Student not found' });
            }
            if (code === 'CLIENT_IS_ACCOUNTANT') {
                return res.status(400).json({ error: 'This accountant is not assigned to you' });
            }
            if (code === 'NOT_YOUR_CLIENT') {
                return res.status(403).json({ error: 'This student is not assigned to you' });
            }
            throw err;
        }
        const { client } = resolved;
        const student = await database_prod_1.default.get(`SELECT u.id, u.username, u.first_name, u.last_name, u.class, u.job_level, u.job_experience_points,
                j.name AS job_name,
                a.account_number, a.balance, a.updated_at AS last_activity
         FROM users u
         LEFT JOIN jobs j ON u.job_id = j.id
         LEFT JOIN accounts a ON a.user_id = u.id
         WHERE u.id = $1`, [client.id]);
        const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [client.id]);
        let transactions = [];
        if (account) {
            const clientSchoolId = client.school_id ?? req.user.school_id ?? req.schoolId ?? null;
            const clientClass = client.class;
            const accountParams = [account.id, account.id];
            const visibility = clientClass && ['6A', '6B', '6C'].includes(clientClass)
                ? (0, transaction_history_visibility_1.studentTownTransactionVisibilitySql)(clientSchoolId, clientClass, accountParams.length + 1, accountParams.length + 2)
                : { fragment: '', params: [] };
            transactions = await database_prod_1.default.query(`SELECT t.*,
                  fu.username AS from_username,
                  fu.first_name AS from_first_name,
                  fu.last_name AS from_last_name,
                  tu.username AS to_username,
                  tu.first_name AS to_first_name,
                  tu.last_name AS to_last_name
           FROM transactions t
           LEFT JOIN accounts fa ON t.from_account_id = fa.id
           LEFT JOIN users fu ON fa.user_id = fu.id
           LEFT JOIN accounts ta ON t.to_account_id = ta.id
           LEFT JOIN users tu ON ta.user_id = tu.id
           WHERE (t.from_account_id = $1 OR t.to_account_id = $2)
           ${visibility.fragment}
           ORDER BY t.created_at DESC`, [...accountParams, ...visibility.params]);
        }
        const loans = await database_prod_1.default.query(`SELECT l.*, COALESCE(SUM(lp.amount), 0) AS total_paid
         FROM loans l
         LEFT JOIN loan_payments lp ON l.id = lp.loan_id
         WHERE l.borrower_id = $1
         GROUP BY l.id
         ORDER BY l.created_at DESC`, [client.id]);
        let priorAdvice = [];
        if (await (0, accountant_advice_1.tablesReady)()) {
            priorAdvice = await database_prod_1.default.query(`SELECT id, advice_text, created_at
           FROM accountant_client_advice
           WHERE accountant_user_id = $1 AND client_user_id = $2
           ORDER BY created_at DESC
           LIMIT 10`, [req.user.id, client.id]);
        }
        res.json({
            student,
            transactions,
            loans,
            prior_advice: priorAdvice,
            advice_xp_reward: accountant_advice_1.ADVICE_XP_REWARD,
            advice_earnings_reward: accountant_advice_1.ADVICE_EARNINGS_REWARD,
        });
    }
    catch (error) {
        console.error('Get accountant client details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Chartered Accountant: submit advice for a client (10 XP + R500 from treasury)
router.post('/accountant-clients/:username/advice', [
    (0, express_validator_1.body)('advice')
        .trim()
        .isLength({ min: accountant_advice_1.MIN_ADVICE_LENGTH, max: accountant_advice_1.MAX_ADVICE_LENGTH })
        .withMessage(`Advice must be between ${accountant_advice_1.MIN_ADVICE_LENGTH} and ${accountant_advice_1.MAX_ADVICE_LENGTH} characters`),
], auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!(await (0, accountant_advice_1.tablesReady)())) {
            return res.status(503).json({ error: 'Accountant advice is not available yet. Ask your teacher to run the database migration.' });
        }
        let resolved;
        try {
            resolved = await (0, accountant_advice_1.resolveAccountantClient)(req.user.id, req.params.username);
        }
        catch (err) {
            const code = err instanceof Error ? err.message : '';
            if (code === 'NOT_ACCOUNTANT') {
                return res.status(403).json({ error: 'Only Chartered Accountants can submit client advice' });
            }
            if (code === 'CLIENT_NOT_FOUND') {
                return res.status(404).json({ error: 'Student not found' });
            }
            if (code === 'CLIENT_IS_ACCOUNTANT') {
                return res.status(400).json({ error: 'This accountant is not assigned to you' });
            }
            if (code === 'NOT_YOUR_CLIENT') {
                return res.status(403).json({ error: 'This student is not assigned to you' });
            }
            throw err;
        }
        const adviceText = (0, accountant_advice_1.sanitizeAdvice)(String(req.body.advice || ''));
        if (adviceText.length < accountant_advice_1.MIN_ADVICE_LENGTH) {
            return res.status(400).json({ error: `Advice must be at least ${accountant_advice_1.MIN_ADVICE_LENGTH} characters` });
        }
        const { accountant, client } = resolved;
        const townClass = accountant.class || client.class;
        if (!townClass) {
            return res.status(400).json({ error: 'Town class is required to pay advice rewards' });
        }
        const schoolId = accountant.school_id ?? client.school_id ?? null;
        const dbClient = await database_prod_1.default.pool.connect();
        try {
            await dbClient.query('BEGIN');
            await dbClient.query(`INSERT INTO accountant_client_advice (accountant_user_id, client_user_id, school_id, town_class, advice_text)
           VALUES ($1, $2, $3, $4, $5)`, [req.user.id, client.id, schoolId, townClass, adviceText]);
            await dbClient.query('COMMIT');
        }
        catch (error) {
            await dbClient.query('ROLLBACK');
            throw error;
        }
        finally {
            dbClient.release();
        }
        let reward;
        try {
            reward = await (0, accountant_advice_1.payAdviceReward)(req.user.id, req.user.username || '', townClass, schoolId, {
                clientUserId: client.id,
            });
        }
        catch (err) {
            if (err instanceof Error && err.message === 'TREASURY_INSUFFICIENT') {
                return res.status(400).json({
                    error: 'Advice was saved but the town treasury cannot cover the R500 reward right now. Ask your teacher.',
                });
            }
            throw err;
        }
        const rewardSuffix = reward.earnings > 0
            ? `You earned ${reward.experience_points} XP and R${reward.earnings}.`
            : reward.reward_skipped_reason || 'No reward earned for this advice.';
        res.json({
            message: `Advice submitted. ${rewardSuffix}`,
            experience_points: reward.experience_points,
            earnings: reward.earnings,
            new_level: reward.new_level,
            reward_skipped_reason: reward.reward_skipped_reason,
            advice_xp_reward: accountant_advice_1.ADVICE_XP_REWARD,
            advice_earnings_reward: accountant_advice_1.ADVICE_EARNINGS_REWARD,
        });
    }
    catch (error) {
        console.error('Submit accountant client advice error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Chartered Accountant: weekly salary payments dashboard
router.get('/accountant-salary-payments', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (!(await (0, accountant_salary_payments_1.tablesReady)())) {
            return res.status(503).json({ error: 'Salary payment feature is not available yet' });
        }
        let dashboard;
        try {
            dashboard = await (0, accountant_salary_payments_1.getAccountantSalaryDashboard)(req.user.id);
        }
        catch (err) {
            if (err instanceof Error && err.message === 'NOT_ACCOUNTANT') {
                return res.status(403).json({ error: 'Only Chartered Accountants can pay weekly salaries' });
            }
            throw err;
        }
        res.json(dashboard);
    }
    catch (error) {
        console.error('Get accountant salary payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Chartered Accountant: pay weekly salary to one assigned client
router.post('/accountant-salary-payments/:username', auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (!(await (0, accountant_salary_payments_1.tablesReady)())) {
            return res.status(503).json({ error: 'Salary payment feature is not available yet' });
        }
        const { username } = req.params;
        let result;
        try {
            result = await (0, accountant_salary_payments_1.payClientWeeklySalary)(req.user.id, username);
        }
        catch (err) {
            if (!(err instanceof Error)) {
                throw err;
            }
            switch (err.message) {
                case 'NOT_ACCOUNTANT':
                    return res.status(403).json({ error: 'Only Chartered Accountants can pay weekly salaries' });
                case 'CLIENT_NOT_FOUND':
                    return res.status(404).json({ error: 'Student not found' });
                case 'NOT_YOUR_CLIENT':
                    return res.status(403).json({ error: 'This student is not assigned to you' });
                case 'CLIENT_IS_ACCOUNTANT':
                    return res.status(403).json({ error: 'This accountant is not assigned to you' });
                case 'ALREADY_PAID_THIS_WEEK':
                    return res.status(400).json({ error: 'This student has already been paid this week (Mon–Sun)' });
                case 'NO_JOB':
                    return res.status(400).json({ error: 'Student has no job assigned' });
                case 'NO_ACCOUNT':
                    return res.status(400).json({ error: 'Student has no bank account' });
                case 'NO_TOWN_CLASS':
                    return res.status(400).json({ error: 'Town class is not set' });
                case 'TOWN_NOT_FOUND':
                    return res.status(404).json({ error: 'Town settings not found' });
                case 'TREASURY_INSUFFICIENT':
                    return res.status(400).json({ error: 'Town treasury has insufficient funds for this salary payment' });
                default:
                    throw err;
            }
        }
        res.json({
            message: 'Weekly salary paid successfully',
            ...result,
            payment_xp_reward: accountant_salary_payments_1.SALARY_PAYMENT_XP_REWARD,
            payment_earnings_reward: accountant_salary_payments_1.SALARY_PAYMENT_EARNINGS_REWARD,
        });
    }
    catch (error) {
        console.error('Pay accountant client salary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map