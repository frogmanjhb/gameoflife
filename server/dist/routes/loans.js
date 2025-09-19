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
// Get all loans (for teachers) or user's loans (for students)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        let loans = [];
        if (req.user.role === 'teacher') {
            // Teachers can see all loans
            loans = await database_prod_1.default.query(`
        SELECT 
          l.*,
          u.username as borrower_username,
          COALESCE(SUM(lp.amount), 0) as total_paid,
          CASE 
            WHEN l.status = 'active' THEN 
              CEIL((l.outstanding_balance - COALESCE(SUM(lp.amount), 0)) / l.monthly_payment)
            ELSE 0 
          END as payments_remaining
        FROM loans l
        JOIN users u ON l.borrower_id = u.id
        LEFT JOIN loan_payments lp ON l.id = lp.loan_id
        GROUP BY l.id, u.username
        ORDER BY l.created_at DESC
      `);
        }
        else {
            // Students can only see their own loans
            loans = await database_prod_1.default.query(`
        SELECT 
          l.*,
          u.username as borrower_username,
          COALESCE(SUM(lp.amount), 0) as total_paid,
          CASE 
            WHEN l.status = 'active' THEN 
              CEIL((l.outstanding_balance - COALESCE(SUM(lp.amount), 0)) / l.monthly_payment)
            ELSE 0 
          END as payments_remaining
        FROM loans l
        JOIN users u ON l.borrower_id = u.id
        LEFT JOIN loan_payments lp ON l.id = lp.loan_id
        WHERE l.borrower_id = $1
        GROUP BY l.id, u.username
        ORDER BY l.created_at DESC
      `, [req.user.id]);
        }
        console.log('📊 Loan statuses:', loans.map(l => ({ id: l.id, status: l.status, borrower: l.borrower_username })));
        res.json(loans);
    }
    catch (error) {
        console.error('Get loans error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Apply for a loan (students only)
router.post('/apply', [
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
    (0, express_validator_1.body)('term_months').isInt({ min: 1, max: 60 }).withMessage('Term must be between 1 and 60 months')
], auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { amount, term_months } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Check if user has any pending, approved, or active loans
        const existingLoan = await database_prod_1.default.get('SELECT id, status FROM loans WHERE borrower_id = $1 AND status IN ($2, $3, $4)', [req.user.id, 'pending', 'approved', 'active']);
        if (existingLoan) {
            const statusMessages = {
                'pending': 'You already have a pending loan application',
                'approved': 'You already have an approved loan that is being processed',
                'active': 'You already have an active loan'
            };
            return res.status(400).json({
                error: statusMessages[existingLoan.status] || 'You already have a loan in progress'
            });
        }
        // Calculate interest rate based on term
        let interestRate;
        if (term_months <= 6) {
            interestRate = 0.05; // 5% for 6 months or less
        }
        else if (term_months <= 12) {
            interestRate = 0.10; // 10% for 12 months
        }
        else if (term_months <= 24) {
            interestRate = 0.12; // 12% for 24 months
        }
        else {
            interestRate = 0.15; // 15% for 48 months
        }
        // Calculate total amount with interest
        const totalAmount = amount * (1 + interestRate);
        const monthlyPayment = totalAmount / term_months;
        // Create loan application
        const result = await database_prod_1.default.run('INSERT INTO loans (borrower_id, amount, term_months, interest_rate, status, outstanding_balance, monthly_payment) VALUES ($1, $2, $3, $4, $5, $6, $7)', [req.user.id, amount, term_months, interestRate, 'pending', totalAmount, monthlyPayment]);
        res.status(201).json({
            message: 'Loan application submitted successfully',
            loan_id: result.lastID
        });
    }
    catch (error) {
        console.error('Loan application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Approve or deny loan (teachers only)
router.post('/approve', [
    (0, express_validator_1.body)('loan_id').isInt().withMessage('Loan ID is required'),
    (0, express_validator_1.body)('approved').isBoolean().withMessage('Approval status is required')
], auth_1.authenticateToken, (0, auth_1.requireRole)(['teacher']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { loan_id, approved } = req.body;
        // Get loan details
        const loan = await database_prod_1.default.get('SELECT * FROM loans WHERE id = $1', [loan_id]);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }
        if (loan.status !== 'pending') {
            return res.status(400).json({ error: 'Loan is not pending approval' });
        }
        const newStatus = approved ? 'approved' : 'denied';
        const dueDate = approved ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;
        // Update loan status to approved first
        await database_prod_1.default.run('UPDATE loans SET status = $1, approved_at = $2, due_date = $3 WHERE id = $4', [newStatus, approved ? new Date().toISOString() : null, dueDate, loan_id]);
        if (approved) {
            // Disburse loan to student's account
            const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [loan.borrower_id]);
            if (account) {
                // Update account balance
                await database_prod_1.default.run('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [loan.amount, account.id]);
                // Record transaction
                await database_prod_1.default.run('INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [account.id, loan.amount, 'loan_disbursement', `Loan disbursement - ${loan.amount}`]);
                // Now update status to active after disbursement
                await database_prod_1.default.run('UPDATE loans SET status = $1 WHERE id = $2', ['active', loan_id]);
            }
        }
        res.json({
            message: `Loan ${approved ? 'approved and activated' : 'denied'} successfully`,
            status: newStatus
        });
    }
    catch (error) {
        console.error('Loan approval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Make loan payment (students only)
router.post('/pay', [
    (0, express_validator_1.body)('loan_id').isInt().withMessage('Loan ID is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], auth_1.authenticateToken, (0, auth_1.requireRole)(['student']), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { loan_id, amount } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Get loan details
        const loan = await database_prod_1.default.get('SELECT * FROM loans WHERE id = $1 AND borrower_id = $2', [loan_id, req.user.id]);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }
        if (loan.status !== 'active') {
            return res.status(400).json({ error: 'Loan is not active' });
        }
        // Get student's account
        const account = await database_prod_1.default.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        console.log('Loan payment debug:', {
            userId: req.user.id,
            accountBalance: account.balance,
            paymentAmount: amount,
            accountId: account.id
        });
        // Check sufficient balance (ensure balance is a number)
        const accountBalance = parseFloat(account.balance);
        if (accountBalance < amount) {
            console.log('Insufficient funds:', { balance: accountBalance, amount, originalBalance: account.balance });
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        // Check if payment exceeds outstanding balance
        const totalPaidResult = await database_prod_1.default.get('SELECT COALESCE(SUM(amount), 0) as total FROM loan_payments WHERE loan_id = $1', [loan_id]);
        const totalPaid = parseFloat(totalPaidResult?.total || 0);
        const outstandingBalance = parseFloat(loan.outstanding_balance);
        const remainingBalance = outstandingBalance - totalPaid;
        console.log('Loan balance debug:', {
            outstandingBalance,
            totalPaid,
            remainingBalance,
            paymentAmount: amount
        });
        if (amount > remainingBalance) {
            return res.status(400).json({ error: 'Payment amount exceeds outstanding balance' });
        }
        // Start transaction
        await database_prod_1.default.run('BEGIN TRANSACTION');
        try {
            // Update account balance
            await database_prod_1.default.run('UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [amount, account.id]);
            // Record loan payment
            await database_prod_1.default.run('INSERT INTO loan_payments (loan_id, amount) VALUES ($1, $2)', [loan_id, amount]);
            // Update outstanding balance
            const newOutstandingBalance = outstandingBalance - amount;
            await database_prod_1.default.run('UPDATE loans SET outstanding_balance = $1 WHERE id = $2', [newOutstandingBalance, loan_id]);
            // Check if loan is fully paid
            if (newOutstandingBalance <= 0) {
                await database_prod_1.default.run('UPDATE loans SET status = $1 WHERE id = $2', ['paid_off', loan_id]);
            }
            // Record transaction
            await database_prod_1.default.run('INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)', [account.id, amount, 'loan_repayment', `Loan payment - ${amount}`]);
            await database_prod_1.default.run('COMMIT');
            res.json({ message: 'Payment successful' });
        }
        catch (error) {
            await database_prod_1.default.run('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Loan payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=loans.js.map