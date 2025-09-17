import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { LoanRequest, LoanApprovalRequest, LoanWithDetails } from '../types';

const router = Router();

// Get all loans (for teachers) or user's loans (for students)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    let loans: LoanWithDetails[] = [];

    if (req.user.role === 'teacher') {
      // Teachers can see all loans
      loans = await database.query(`
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
    } else {
      // Students can only see their own loans
      loans = await database.query(`
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

    res.json(loans);
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply for a loan (students only)
router.post('/apply', [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('term_months').isInt({ min: 1, max: 60 }).withMessage('Term must be between 1 and 60 months')
], authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, term_months }: LoanRequest = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user has any pending loans
    const pendingLoan = await database.get(
      'SELECT id FROM loans WHERE borrower_id = $1 AND status = $2',
      [req.user.id, 'pending']
    );

    if (pendingLoan) {
      return res.status(400).json({ error: 'You already have a pending loan application' });
    }

    // Check if user has any active loans
    const activeLoan = await database.get(
      'SELECT id FROM loans WHERE borrower_id = $1 AND status = $2',
      [req.user.id, 'active']
    );

    if (activeLoan) {
      return res.status(400).json({ error: 'You already have an active loan' });
    }

    // Calculate monthly payment (simple interest)
    const interestRate = 0.05; // 5% annual interest
    const monthlyInterestRate = interestRate / 12;
    const monthlyPayment = (amount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, term_months)) / 
                          (Math.pow(1 + monthlyInterestRate, term_months) - 1);

    // Create loan application
    const result = await database.run(
      'INSERT INTO loans (borrower_id, amount, term_months, interest_rate, status, outstanding_balance, monthly_payment) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, amount, term_months, interestRate, 'pending', amount, monthlyPayment]
    );

    res.status(201).json({ 
      message: 'Loan application submitted successfully',
      loan_id: result.lastID
    });
  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve or deny loan (teachers only)
router.post('/approve', [
  body('loan_id').isInt().withMessage('Loan ID is required'),
  body('approved').isBoolean().withMessage('Approval status is required')
], authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { loan_id, approved }: LoanApprovalRequest = req.body;

    // Get loan details
    const loan = await database.get('SELECT * FROM loans WHERE id = $1', [loan_id]);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ error: 'Loan is not pending approval' });
    }

    const newStatus = approved ? 'approved' : 'denied';
    const dueDate = approved ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;

    // Update loan status
    await database.run(
      'UPDATE loans SET status = $1, approved_at = $2, due_date = $3 WHERE id = $4',
      [newStatus, approved ? new Date().toISOString() : null, dueDate, loan_id]
    );

    if (approved) {
      // Disburse loan to student's account
      const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [loan.borrower_id]);
      if (account) {
        // Update account balance
        await database.run(
          'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [loan.amount, account.id]
        );

        // Record transaction
        await database.run(
          'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
          [account.id, loan.amount, 'loan_disbursement', `Loan disbursement - ${loan.amount}`]
        );
      }
    }

    res.json({ 
      message: `Loan ${approved ? 'approved' : 'denied'} successfully`,
      status: newStatus
    });
  } catch (error) {
    console.error('Loan approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make loan payment (students only)
router.post('/pay', [
  body('loan_id').isInt().withMessage('Loan ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { loan_id, amount } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get loan details
    const loan = await database.get('SELECT * FROM loans WHERE id = $1 AND borrower_id = $2', [loan_id, req.user.id]);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'active') {
      return res.status(400).json({ error: 'Loan is not active' });
    }

    // Get student's account
    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check sufficient balance
    if (account.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Check if payment exceeds outstanding balance
    const totalPaid = await database.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM loan_payments WHERE loan_id = $1',
      [loan_id]
    );
    const remainingBalance = loan.outstanding_balance - totalPaid.total;

    if (amount > remainingBalance) {
      return res.status(400).json({ error: 'Payment amount exceeds outstanding balance' });
    }

    // Start transaction
    await database.run('BEGIN TRANSACTION');

    try {
      // Update account balance
      await database.run(
        'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [amount, account.id]
      );

      // Record loan payment
      await database.run(
        'INSERT INTO loan_payments (loan_id, amount) VALUES ($1, $2)',
        [loan_id, amount]
      );

      // Check if loan is fully paid
      const newTotalPaid = totalPaid.total + amount;
      if (newTotalPaid >= loan.outstanding_balance) {
        await database.run(
          'UPDATE loans SET status = $1 WHERE id = $2',
          ['paid_off', loan_id]
        );
      }

      // Record transaction
      await database.run(
        'INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
        [account.id, amount, 'loan_repayment', `Loan payment - ${amount}`]
      );

      await database.run('COMMIT');

      res.json({ message: 'Payment successful' });
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Loan payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
