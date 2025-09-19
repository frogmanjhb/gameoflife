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

    console.log('📊 Loan statuses:', loans.map(l => ({ id: l.id, status: l.status, borrower: l.borrower_username })));
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

    // Check if user has any pending, approved, or active loans
    const existingLoan = await database.get(
      'SELECT id, status FROM loans WHERE borrower_id = $1 AND status IN ($2, $3, $4)',
      [req.user.id, 'pending', 'approved', 'active']
    );

    if (existingLoan) {
      const statusMessages = {
        'pending': 'You already have a pending loan application',
        'approved': 'You already have an approved loan that is being processed',
        'active': 'You already have an active loan'
      };
      return res.status(400).json({ 
        error: statusMessages[existingLoan.status as keyof typeof statusMessages] || 'You already have a loan in progress'
      });
    }

    // Calculate interest rate based on term
    let interestRate: number;
    if (term_months <= 6) {
      interestRate = 0.05; // 5% for 6 months or less
    } else if (term_months <= 12) {
      interestRate = 0.10; // 10% for 12 months
    } else if (term_months <= 24) {
      interestRate = 0.12; // 12% for 24 months
    } else {
      interestRate = 0.15; // 15% for 48 months
    }

    // Calculate total amount with interest
    const totalAmount = amount * (1 + interestRate);
    const monthlyPayment = totalAmount / term_months;

    // Create loan application
    const result = await database.run(
      'INSERT INTO loans (borrower_id, amount, term_months, interest_rate, status, outstanding_balance, monthly_payment) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, amount, term_months, interestRate, 'pending', totalAmount, monthlyPayment]
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
    console.log('🔍 Loan approval request received:', {
      loan_id: req.body.loan_id,
      approved: req.body.approved,
      user_id: req.user?.id,
      timestamp: new Date().toISOString()
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { loan_id, approved }: LoanApprovalRequest = req.body;

    // Get loan details
    const loan = await database.get('SELECT * FROM loans WHERE id = $1', [loan_id]);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'pending' && loan.status !== 'approved') {
      return res.status(400).json({ error: 'Loan cannot be processed - invalid status' });
    }

    const newStatus = approved ? 'approved' : 'denied';
    const dueDate = approved ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;

    if (approved) {
      // Start transaction for loan approval and disbursement
      const client = await database.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Update loan status to approved and set dates
        await client.query(
          'UPDATE loans SET status = $1, approved_at = $2, due_date = $3 WHERE id = $4',
          [newStatus, new Date().toISOString(), dueDate, loan_id]
        );

        // Disburse loan to student's account
        const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [loan.borrower_id]);
        if (!account) {
          throw new Error('Student account not found');
        }

        // Update account balance (ensure amount is a number)
        const loanAmount = parseFloat(loan.amount);
        await client.query(
          'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [loanAmount, account.id]
        );

        // Record transaction
        await client.query(
          'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
          [account.id, loanAmount, 'loan_disbursement', `Loan disbursement - ${loanAmount}`]
        );

        // Update status to active after successful disbursement
        await client.query(
          'UPDATE loans SET status = $1 WHERE id = $2',
          ['active', loan_id]
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Just update status to denied
      await database.run(
        'UPDATE loans SET status = $1, approved_at = $2 WHERE id = $3',
        [newStatus, new Date().toISOString(), loan_id]
      );
    }

    res.json({ 
      message: `Loan ${approved ? 'approved and activated' : 'denied'} successfully`,
      status: approved ? 'active' : 'denied'
    });
  } catch (error) {
    console.error('Loan approval error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      loan_id: req.body.loan_id,
      approved: req.body.approved,
      user_id: req.user?.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Make loan payment (students only)
router.post('/pay', [
  body('loan_id').isInt().withMessage('Loan ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Loan payment request received:', {
      loan_id: req.body.loan_id,
      amount: req.body.amount,
      user_id: req.user?.id,
      timestamp: new Date().toISOString()
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { loan_id, amount } = req.body;

    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ error: 'User not found' });
    }

    // Convert amount to number to ensure proper handling
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount)) {
      return res.status(400).json({ error: 'Invalid payment amount' });
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

    console.log('Loan payment debug:', {
      userId: req.user.id,
      accountBalance: account.balance,
      paymentAmount: paymentAmount,
      accountId: account.id
    });

    // Check sufficient balance (ensure balance is a number)
    const accountBalance = parseFloat(account.balance);
    if (accountBalance < paymentAmount) {
      console.log('Insufficient funds:', { balance: accountBalance, amount: paymentAmount, originalBalance: account.balance });
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Check if payment exceeds outstanding balance
    const totalPaidResult = await database.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM loan_payments WHERE loan_id = $1',
      [loan_id]
    );
    const totalPaid = parseFloat(totalPaidResult?.total || 0);
    const outstandingBalance = parseFloat(loan.outstanding_balance);
    const remainingBalance = outstandingBalance - totalPaid;
    
    // Check if loan is already paid off
    if (remainingBalance <= 0.01) {
      return res.status(400).json({ 
        error: 'Loan is already paid off or has a very small remaining balance.' 
      });
    }
    
    // Check for recent payments to prevent duplicate submissions
    const recentPayment = await database.get(
      'SELECT id FROM loan_payments WHERE loan_id = $1 AND payment_date > NOW() - INTERVAL \'5 seconds\'',
      [loan_id]
    );
    
    if (recentPayment) {
      return res.status(400).json({ 
        error: 'A payment was recently processed for this loan. Please wait a moment before trying again.' 
      });
    }

    console.log('Loan balance debug:', {
      outstandingBalance,
      totalPaid,
      remainingBalance,
      paymentAmount: paymentAmount,
      monthlyPayment: loan.monthly_payment,
      isFinalPayment: remainingBalance <= loan.monthly_payment
    });

    // For final payments, automatically adjust payment to remaining balance
    const isFinalPayment = remainingBalance <= loan.monthly_payment;
    let actualPaymentAmount = isFinalPayment ? remainingBalance : paymentAmount;
    
    // Handle very small remaining balances (less than 1 cent)
    if (actualPaymentAmount < 0.01 && actualPaymentAmount > 0) {
      actualPaymentAmount = 0.01; // Minimum payment of 1 cent
      console.log(`🔄 Very small balance: Adjusted payment to minimum $0.01`);
    }
    
    // Skip payment if amount is zero or negative
    if (actualPaymentAmount <= 0) {
      return res.status(400).json({ 
        error: 'Payment amount is zero or negative. Loan may already be paid off.' 
      });
    }
    
    // Allow payment if it's close to the remaining balance (within 1 cent tolerance)
    if (actualPaymentAmount > remainingBalance + 0.01) {
      return res.status(400).json({ 
        error: `Payment amount ($${paymentAmount.toFixed(2)}) exceeds outstanding balance ($${remainingBalance.toFixed(2)})` 
      });
    }
    
    // Log if payment was adjusted for final payment
    if (isFinalPayment && actualPaymentAmount !== paymentAmount) {
      console.log(`🔄 Final payment: Adjusted payment from $${paymentAmount.toFixed(2)} to $${actualPaymentAmount.toFixed(2)}`);
    }

    // Start transaction using PostgreSQL client
    const client = await database.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update account balance
      await client.query(
        'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [actualPaymentAmount, account.id]
      );

      // Record loan payment
      await client.query(
        'INSERT INTO loan_payments (loan_id, amount, payment_date) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [loan_id, actualPaymentAmount]
      );

      // Update outstanding balance
      const newOutstandingBalance = outstandingBalance - actualPaymentAmount;
      await client.query(
        'UPDATE loans SET outstanding_balance = $1 WHERE id = $2',
        [newOutstandingBalance, loan_id]
      );

      // Check if loan is fully paid (allow for small rounding differences)
      if (newOutstandingBalance <= 0.01) {
        await client.query(
          'UPDATE loans SET status = $1, outstanding_balance = 0 WHERE id = $2',
          ['paid_off', loan_id]
        );
      }

      // Record transaction
      await client.query(
        'INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
        [account.id, actualPaymentAmount, 'loan_repayment', `Loan payment - ${actualPaymentAmount}`]
      );

      await client.query('COMMIT');
      
      const responseMessage = isFinalPayment && actualPaymentAmount !== paymentAmount 
        ? `Payment successful! Final payment adjusted from $${paymentAmount.toFixed(2)} to $${actualPaymentAmount.toFixed(2)}. Loan paid off.`
        : 'Payment successful';
        
      res.json({ 
        message: responseMessage,
        paymentAmount: actualPaymentAmount,
        isFinalPayment: newOutstandingBalance <= 0.01
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Loan payment error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      loan_id: req.body.loan_id,
      amount: req.body.amount,
      user_id: req.user?.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Activate approved loans (teachers only) - for fixing stuck loans
router.post('/activate/:loan_id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { loan_id } = req.params;

    // Get loan details
    const loan = await database.get('SELECT * FROM loans WHERE id = $1', [loan_id]);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'approved') {
      return res.status(400).json({ error: 'Loan is not in approved status' });
    }

    // Start transaction for loan activation
    const client = await database.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Disburse loan to student's account
      const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [loan.borrower_id]);
      if (!account) {
        throw new Error('Student account not found');
      }

      // Update account balance (ensure amount is a number)
      const loanAmount = parseFloat(loan.amount);
      await client.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [loanAmount, account.id]
      );

      // Record transaction
      await client.query(
        'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
        [account.id, loanAmount, 'loan_disbursement', `Loan disbursement - ${loanAmount}`]
      );

      // Update status to active
      await client.query(
        'UPDATE loans SET status = $1 WHERE id = $2',
        ['active', loan_id]
      );

      await client.query('COMMIT');

      res.json({ 
        message: 'Loan activated successfully',
        status: 'active'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Loan activation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin route to view all loans (teachers only)
router.get('/admin/all', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loans = await database.query(`
      SELECT 
        l.*,
        u.username as borrower_username,
        u.role as borrower_role
      FROM loans l
      JOIN users u ON l.borrower_id = u.id
      ORDER BY l.created_at DESC
    `);
    
    res.json({ loans });
  } catch (error) {
    console.error('Admin loans view error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin route to view all users (teachers only)
router.get('/admin/users', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await database.query(`
      SELECT 
        u.*,
        a.balance,
        a.account_number
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      ORDER BY u.created_at DESC
    `);
    
    res.json({ users });
  } catch (error) {
    console.error('Admin users view error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin route to view all transactions (teachers only)
router.get('/admin/transactions', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactions = await database.query(`
      SELECT 
        t.*,
        from_acc.account_number as from_account,
        to_acc.account_number as to_account,
        from_user.username as from_username,
        to_user.username as to_username
      FROM transactions t
      LEFT JOIN accounts from_acc ON t.from_account_id = from_acc.id
      LEFT JOIN accounts to_acc ON t.to_account_id = to_acc.id
      LEFT JOIN users from_user ON from_acc.user_id = from_user.id
      LEFT JOIN users to_user ON to_acc.user_id = to_user.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
    
    res.json({ transactions });
  } catch (error) {
    console.error('Admin transactions view error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin route to view loan payments (teachers only)
router.get('/admin/loan-payments', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await database.query(`
      SELECT 
        lp.*,
        l.amount as loan_amount,
        l.status as loan_status,
        u.username as borrower_username
      FROM loan_payments lp
      JOIN loans l ON lp.loan_id = l.id
      JOIN users u ON l.borrower_id = u.id
      ORDER BY lp.payment_date DESC
    `);
    
    res.json({ payments });
  } catch (error) {
    console.error('Admin loan payments view error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fix all approved loans (teachers only) - for fixing stuck loans
router.post('/admin/fix-approved', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔧 Fixing all approved loans...');
    
    // Get all approved loans
    const approvedLoans = await database.query('SELECT * FROM loans WHERE status = $1', ['approved']);
    
    console.log(`Found ${approvedLoans.length} approved loans to fix`);
    
    const results = [];
    
    for (const loan of approvedLoans) {
      try {
        console.log(`Processing loan ${loan.id} for user ${loan.borrower_id}`);
        
        // Start transaction for loan activation
        const client = await database.pool.connect();
        
        try {
          await client.query('BEGIN');
          
          // Disburse loan to student's account
          const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [loan.borrower_id]);
          if (!account) {
            throw new Error(`Student account not found for user ${loan.borrower_id}`);
          }

          // Update account balance (ensure amount is a number)
          const loanAmount = parseFloat(loan.amount);
          await client.query(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [loanAmount, account.id]
          );

          // Record transaction
          await client.query(
            'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [account.id, loanAmount, 'loan_disbursement', `Loan disbursement - ${loanAmount}`]
          );

          // Update status to active
          await client.query(
            'UPDATE loans SET status = $1 WHERE id = $2',
            ['active', loan.id]
          );

          await client.query('COMMIT');
          
          results.push({ loan_id: loan.id, status: 'success', message: 'Loan activated successfully' });
          console.log(`✅ Loan ${loan.id} activated successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error(`❌ Failed to activate loan ${loan.id}:`, error);
        results.push({ 
          loan_id: loan.id, 
          status: 'error', 
          message: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    res.json({ 
      message: `Processed ${approvedLoans.length} approved loans`,
      results 
    });
  } catch (error) {
    console.error('Fix approved loans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clean up zero-amount transactions (teachers only) - for fixing data issues
router.post('/admin/cleanup-zero-transactions', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🧹 Cleaning up zero-amount loan repayment transactions...');
    
    // Find and delete zero-amount loan repayment transactions
    const result = await database.query(
      'DELETE FROM transactions WHERE transaction_type = $1 AND amount = $2',
      ['loan_repayment', '0.00']
    );
    
    console.log(`✅ Cleaned up ${result.length || 0} zero-amount transactions`);
    
    res.json({ 
      message: `Cleaned up ${result.length || 0} zero-amount loan repayment transactions`,
      deletedCount: result.length || 0
    });
  } catch (error) {
    console.error('Cleanup zero transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
