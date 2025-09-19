"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_prod_1 = __importDefault(require("../database/database-prod"));
const auth_1 = require("../middleware/auth");
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
// Transfer money between students
router.post('/transfer', [
    (0, express_validator_1.body)('to_username').notEmpty().withMessage('Recipient username is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    (0, express_validator_1.body)('description').optional().isString()
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
        // Get sender's account
        const fromAccount = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
        if (!fromAccount) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // Check sufficient balance
        if (fromAccount.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        // Get recipient's account
        const toUser = await database_prod_1.default.get('SELECT * FROM users WHERE username = $1 AND role = $2', [to_username, 'student']);
        if (!toUser) {
            return res.status(404).json({ error: 'Recipient not found' });
        }
        const toAccount = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [toUser.id]);
        if (!toAccount) {
            return res.status(404).json({ error: 'Recipient account not found' });
        }
        // Prevent self-transfer
        if (fromAccount.id === toAccount.id) {
            return res.status(400).json({ error: 'Cannot transfer to yourself' });
        }
        // Start transaction
        await database_prod_1.default.run('BEGIN TRANSACTION');
        try {
            // Update sender's balance
            await database_prod_1.default.run('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [amount, fromAccount.id]);
            // Update recipient's balance
            await database_prod_1.default.run('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [amount, toAccount.id]);
            // Record transaction
            await database_prod_1.default.run('INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)', [fromAccount.id, toAccount.id, amount, 'transfer', description || `Transfer to ${to_username}`]);
            await database_prod_1.default.run('COMMIT');
            res.json({ message: 'Transfer successful' });
        }
        catch (error) {
            await database_prod_1.default.run('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Transfer error:', error);
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
exports.default = router;
//# sourceMappingURL=transactions.js.map