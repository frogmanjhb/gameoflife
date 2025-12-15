import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { LoanRequest, LoanApprovalRequest, LoanWithDetails } from '../types';

const router = Router();

// Helper function to get next Monday from a given date
function getNextMonday(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  const dayOfWeek = date.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  date.setDate(date.getDate() + daysUntilMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Helper function to check if student has a negative balance or outstanding loan payment
async function checkStudentCanTransact(userId: number): Promise<{ canTransact: boolean; reason?: string }> {
  // Check if student has negative balance
  const account = await database.get('SELECT balance FROM accounts WHERE user_id = $1', [userId]);
  if (account && parseFloat(account.balance) < 0) {
    return { 
      canTransact: false, 
      reason: 'Your account has a negative balance. Please clear your debt before making any transactions.' 
    };
  }

  // Check if student has an active loan with overdue payment
  const activeLoan = await database.get(
    `SELECT id, monthly_payment, next_payment_date, outstanding_balance 
     FROM loans 
     WHERE borrower_id = $1 AND status = 'active' AND next_payment_date < CURRENT_DATE`,
    [userId]
  );
  
  if (activeLoan) {
    return { 
      canTransact: false, 
      reason: 'You have an overdue loan payment. Please make your loan payment before making any other transactions.' 
    };
  }

  return { canTransact: true };
}

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
            WHEN l.status = 'active' AND l.monthly_payment > 0 THEN 
              GREATEST(0, CEIL(l.outstanding_balance / (l.monthly_payment / 4.33)))
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
            WHEN l.status = 'active' AND l.monthly_payment > 0 THEN 
              GREATEST(0, CEIL(l.outstanding_balance / (l.monthly_payment / 4.33)))
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

// Check loan eligibility (students only)
router.get('/eligibility', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user's job information
    const user = await database.get(
      `SELECT u.id, u.job_id, j.name as job_name, j.salary as job_salary
       FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!user?.job_id) {
      return res.json({
        eligible: false,
        reason: 'You must have a job to apply for a loan.',
        hasJob: false,
        jobName: null,
        salary: 0,
        maxLoanAmount: 0,
        maxWeeks: 0
      });
    }

    const salary = parseFloat(user.job_salary || 0);
    
    // Check if user has any pending, approved, or active loans
    const existingLoan = await database.get(
      'SELECT id, status FROM loans WHERE borrower_id = $1 AND status IN ($2, $3, $4)',
      [req.user.id, 'pending', 'approved', 'active']
    );

    if (existingLoan) {
      const statusMessages: Record<string, string> = {
        'pending': 'You already have a pending loan application.',
        'approved': 'You already have an approved loan that is being processed.',
        'active': 'You must pay off your current loan before applying for a new one.'
      };
      return res.json({
        eligible: false,
        reason: statusMessages[existingLoan.status] || 'You already have a loan in progress.',
        hasJob: true,
        jobName: user.job_name,
        salary: salary,
        maxLoanAmount: 0,
        maxWeeks: 0
      });
    }

    // Check for negative balance
    const account = await database.get('SELECT balance FROM accounts WHERE user_id = $1', [req.user.id]);
    if (account && parseFloat(account.balance) < 0) {
      return res.json({
        eligible: false,
        reason: 'You must clear your negative balance before applying for a loan.',
        hasJob: true,
        jobName: user.job_name,
        salary: salary,
        maxLoanAmount: 0,
        maxWeeks: 0
      });
    }

    // Calculate maximum loan amount based on salary
    // Max loan = 4 weeks salary (1 month's worth), paid over max 12 weeks
    // Weekly payment should not exceed 50% of weekly salary
    const maxWeeklyPayment = salary * 0.5;
    const maxWeeks = 12;
    const maxLoanAmount = maxWeeklyPayment * maxWeeks * 0.9; // Account for ~10% interest

    return res.json({
      eligible: true,
      reason: null,
      hasJob: true,
      jobName: user.job_name,
      salary: salary,
      maxLoanAmount: Math.floor(maxLoanAmount),
      maxWeeks: maxWeeks,
      maxWeeklyPayment: maxWeeklyPayment
    });
  } catch (error) {
    console.error('Loan eligibility check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply for a loan (students only)
router.post('/apply', [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('term_weeks').isInt({ min: 1, max: 12 }).withMessage('Term must be between 1 and 12 weeks')
], authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, term_weeks }: LoanRequest = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get user's job information
    const user = await database.get(
      `SELECT u.id, u.job_id, j.name as job_name, j.salary as job_salary
       FROM users u
       LEFT JOIN jobs j ON u.job_id = j.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!user?.job_id) {
      return res.status(400).json({ error: 'You must have a job to apply for a loan.' });
    }

    const salary = parseFloat(user.job_salary || 0);

    // Check if user has any pending, approved, or active loans
    const existingLoan = await database.get(
      'SELECT id, status FROM loans WHERE borrower_id = $1 AND status IN ($2, $3, $4)',
      [req.user.id, 'pending', 'approved', 'active']
    );

    if (existingLoan) {
      const statusMessages: Record<string, string> = {
        'pending': 'You already have a pending loan application',
        'approved': 'You already have an approved loan that is being processed',
        'active': 'You must pay off your current loan first'
      };
      return res.status(400).json({ 
        error: statusMessages[existingLoan.status] || 'You already have a loan in progress'
      });
    }

    // Check for negative balance
    const account = await database.get('SELECT balance FROM accounts WHERE user_id = $1', [req.user.id]);
    if (account && parseFloat(account.balance) < 0) {
      return res.status(400).json({ error: 'You must clear your negative balance before applying for a loan.' });
    }

    // Calculate interest rate based on term (weekly)
    let interestRate: number;
    if (term_weeks <= 4) {
      interestRate = 0.05; // 5% for 4 weeks or less
    } else if (term_weeks <= 8) {
      interestRate = 0.08; // 8% for up to 8 weeks
    } else {
      interestRate = 0.10; // 10% for 9-12 weeks
    }

    // Calculate total amount with interest
    const totalAmount = amount * (1 + interestRate);
    const weeklyPayment = totalAmount / term_weeks;

    // Validate that weekly payment doesn't exceed 50% of salary
    const maxWeeklyPayment = salary * 0.5;
    if (weeklyPayment > maxWeeklyPayment) {
      return res.status(400).json({ 
        error: `Weekly payment (R${weeklyPayment.toFixed(2)}) exceeds 50% of your weekly salary (R${maxWeeklyPayment.toFixed(2)}). Please request a smaller amount or longer term.`
      });
    }

    // Calculate equivalent monthly payment for backwards compatibility
    const monthlyPayment = weeklyPayment * 4.33;
    const termMonths = Math.ceil(term_weeks / 4.33);

    // Create loan application (use only base columns that exist in all database versions)
    const result = await database.run(
      `INSERT INTO loans (
        borrower_id, amount, term_months, interest_rate, status, 
        outstanding_balance, monthly_payment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, amount, termMonths, interestRate, 'pending', totalAmount, monthlyPayment]
    );

    res.status(201).json({ 
      message: 'Loan application submitted successfully',
      loan_id: result.lastID,
      weeklyPayment: weeklyPayment,
      totalRepayment: totalAmount
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
    const nextMonday = getNextMonday();

    if (approved) {
      // Start transaction for loan approval and disbursement
      const client = await database.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Update loan status to approved and set dates
        await client.query(
          `UPDATE loans SET 
            status = 'active', 
            approved_at = $1, 
            next_payment_date = $2,
            due_date = $3
          WHERE id = $4`,
          [new Date().toISOString(), nextMonday.toISOString().split('T')[0], nextMonday.toISOString().split('T')[0], loan_id]
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
          [account.id, loanAmount, 'loan_disbursement', `Loan disbursement - R${loanAmount.toFixed(2)}`]
        );

        await client.query('COMMIT');
        
        console.log('✅ Loan approved and activated. First payment due:', nextMonday.toISOString().split('T')[0]);
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
      status: approved ? 'active' : 'denied',
      nextPaymentDate: approved ? nextMonday.toISOString().split('T')[0] : null
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

// Process weekly loan payments (to be called by a cron job or manually by teacher)
router.post('/process-weekly-payments', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('💰 Processing weekly loan payments...');
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Only process on Mondays (dayOfWeek === 1) unless forced
    if (dayOfWeek !== 1 && !req.body.force) {
      return res.json({ 
        message: 'Weekly payments are only processed on Mondays. Use force=true to override.',
        processed: 0 
      });
    }

    // Get all active loans with payments due today or earlier
    const loansToProcess = await database.query(
      `SELECT l.*, u.username as borrower_username, a.id as account_id, a.balance as account_balance
       FROM loans l
       JOIN users u ON l.borrower_id = u.id
       JOIN accounts a ON l.borrower_id = a.user_id
       WHERE l.status = 'active' 
       AND l.next_payment_date <= CURRENT_DATE
       AND l.outstanding_balance > 0`,
      []
    );

    console.log(`📋 Found ${loansToProcess.length} loans to process`);

    const results: any[] = [];
    const nextMonday = getNextMonday();

    for (const loan of loansToProcess) {
      const client = await database.pool.connect();
      
      try {
        await client.query('BEGIN');

        const weeklyPayment = parseFloat(loan.weekly_payment || loan.monthly_payment / 4.33);
        const outstandingBalance = parseFloat(loan.outstanding_balance);
        const accountBalance = parseFloat(loan.account_balance);
        
        // Determine actual payment amount (minimum of weekly payment or outstanding balance)
        const actualPayment = Math.min(weeklyPayment, outstandingBalance);
        const newOutstandingBalance = outstandingBalance - actualPayment;
        const newAccountBalance = accountBalance - actualPayment;

        // Deduct payment from account (even if it goes negative)
        await client.query(
          'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [actualPayment, loan.account_id]
        );

        // Record loan payment
        await client.query(
          'INSERT INTO loan_payments (loan_id, amount, payment_date) VALUES ($1, $2, CURRENT_TIMESTAMP)',
          [loan.id, actualPayment]
        );

        // Record transaction
        await client.query(
          'INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
          [loan.account_id, actualPayment, 'loan_repayment', `Weekly loan payment (automatic) - R${actualPayment.toFixed(2)}`]
        );

        // Update loan
        if (newOutstandingBalance <= 0.01) {
          // Loan is paid off
          await client.query(
            'UPDATE loans SET status = $1, outstanding_balance = 0, last_payment_date = CURRENT_DATE, next_payment_date = NULL WHERE id = $2',
            ['paid_off', loan.id]
          );
          
          results.push({
            loan_id: loan.id,
            borrower: loan.borrower_username,
            payment: actualPayment,
            status: 'paid_off',
            message: 'Loan fully paid off'
          });
        } else {
          // Set next payment date to next Monday
          await client.query(
            'UPDATE loans SET outstanding_balance = $1, last_payment_date = CURRENT_DATE, next_payment_date = $2 WHERE id = $3',
            [newOutstandingBalance, nextMonday.toISOString().split('T')[0], loan.id]
          );
          
          results.push({
            loan_id: loan.id,
            borrower: loan.borrower_username,
            payment: actualPayment,
            newOutstandingBalance,
            newAccountBalance,
            nextPaymentDate: nextMonday.toISOString().split('T')[0],
            wentNegative: newAccountBalance < 0
          });
        }

        await client.query('COMMIT');
        console.log(`✅ Processed payment for loan ${loan.id}: R${actualPayment.toFixed(2)}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to process loan ${loan.id}:`, error);
        results.push({
          loan_id: loan.id,
          borrower: loan.borrower_username,
          status: 'error',
          message: error instanceof Error ? error.message : String(error)
        });
      } finally {
        client.release();
      }
    }

    res.json({
      message: `Processed ${results.length} loan payments`,
      results
    });
  } catch (error) {
    console.error('Process weekly payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make manual loan payment (students only)
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

    // Check sufficient balance
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
      weeklyPayment: loan.weekly_payment || loan.monthly_payment / 4.33
    });

    // For final payments, automatically adjust payment to remaining balance
    const isFinalPayment = remainingBalance <= paymentAmount;
    let actualPaymentAmount = isFinalPayment ? remainingBalance : paymentAmount;
    
    // Handle very small remaining balances (less than 1 cent)
    if (actualPaymentAmount < 0.01 && actualPaymentAmount > 0) {
      actualPaymentAmount = 0.01;
      console.log(`🔄 Very small balance: Adjusted payment to minimum R0.01`);
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
        error: `Payment amount (R${paymentAmount.toFixed(2)}) exceeds outstanding balance (R${remainingBalance.toFixed(2)})` 
      });
    }
    
    if (isFinalPayment && actualPaymentAmount !== paymentAmount) {
      console.log(`🔄 Final payment: Adjusted payment from R${paymentAmount.toFixed(2)} to R${actualPaymentAmount.toFixed(2)}`);
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

      // Calculate the new outstanding balance
      const totalLoanAmount = parseFloat(loan.amount) * (1 + parseFloat(loan.interest_rate));
      const newTotalPaid = totalPaid + actualPaymentAmount;
      const newOutstandingBalance = totalLoanAmount - newTotalPaid;
      
      await client.query(
        'UPDATE loans SET outstanding_balance = $1, last_payment_date = CURRENT_DATE WHERE id = $2',
        [newOutstandingBalance, loan_id]
      );

      // Check if loan is fully paid (allow for small rounding differences)
      if (newOutstandingBalance <= 0.01) {
        await client.query(
          'UPDATE loans SET status = $1, outstanding_balance = 0, next_payment_date = NULL WHERE id = $2',
          ['paid_off', loan_id]
        );
      }

      // Record transaction
      await client.query(
        'INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
        [account.id, actualPaymentAmount, 'loan_repayment', `Loan payment - R${actualPaymentAmount.toFixed(2)}`]
      );

      await client.query('COMMIT');
      
      // Calculate remaining payments for response
      const weeklyPayment = parseFloat(loan.weekly_payment || loan.monthly_payment / 4.33);
      const remainingPayments = Math.max(0, Math.ceil(newOutstandingBalance / weeklyPayment));
      
      console.log('✅ Payment processed successfully:', {
        loan_id,
        paymentAmount: actualPaymentAmount,
        newOutstandingBalance,
        remainingPayments,
        totalLoanAmount,
        newTotalPaid
      });
      
      const responseMessage = isFinalPayment && actualPaymentAmount !== paymentAmount 
        ? `Payment successful! Final payment adjusted from R${paymentAmount.toFixed(2)} to R${actualPaymentAmount.toFixed(2)}. Loan paid off.`
        : 'Payment successful';
        
      res.json({ 
        message: responseMessage,
        paymentAmount: actualPaymentAmount,
        isFinalPayment: newOutstandingBalance <= 0.01,
        remainingPayments,
        newOutstandingBalance
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

// Check if student can make transactions (used by other routes)
router.get('/can-transact', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const result = await checkStudentCanTransact(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Can transact check error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

    const nextMonday = getNextMonday();

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
        [account.id, loanAmount, 'loan_disbursement', `Loan disbursement - R${loanAmount.toFixed(2)}`]
      );

      // Update status to active with next payment date
      await client.query(
        'UPDATE loans SET status = $1, next_payment_date = $2 WHERE id = $3',
        ['active', nextMonday.toISOString().split('T')[0], loan_id]
      );

      await client.query('COMMIT');

      res.json({ 
        message: 'Loan activated successfully',
        status: 'active',
        nextPaymentDate: nextMonday.toISOString().split('T')[0]
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
    
    const nextMonday = getNextMonday();
    
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
            [account.id, loanAmount, 'loan_disbursement', `Loan disbursement - R${loanAmount.toFixed(2)}`]
          );

          // Update status to active
          await client.query(
            'UPDATE loans SET status = $1, next_payment_date = $2 WHERE id = $3',
            ['active', nextMonday.toISOString().split('T')[0], loan.id]
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

// Fix outstanding balance for all loans (teachers only) - for correcting data inconsistencies
router.post('/admin/fix-outstanding-balances', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔧 Fixing outstanding balances for all loans...');
    
    // Get all active loans
    const loans = await database.query('SELECT * FROM loans WHERE status = $1', ['active']);
    
    console.log(`Found ${loans.length} active loans to fix`);
    
    const results = [];
    
    for (const loan of loans) {
      try {
        // Calculate correct outstanding balance
        const totalLoanAmount = parseFloat(loan.amount) * (1 + parseFloat(loan.interest_rate));
        const totalPaidResult = await database.get(
          'SELECT COALESCE(SUM(amount), 0) as total FROM loan_payments WHERE loan_id = $1',
          [loan.id]
        );
        const totalPaid = parseFloat(totalPaidResult?.total || 0);
        const correctOutstandingBalance = totalLoanAmount - totalPaid;
        
        // Update the loan with correct outstanding balance
        await database.run(
          'UPDATE loans SET outstanding_balance = $1 WHERE id = $2',
          [correctOutstandingBalance, loan.id]
        );
        
        results.push({ 
          loan_id: loan.id, 
          status: 'success', 
          message: `Fixed outstanding balance from R${loan.outstanding_balance} to R${correctOutstandingBalance.toFixed(2)}` 
        });
        
        console.log(`✅ Loan ${loan.id}: Fixed outstanding balance from R${loan.outstanding_balance} to R${correctOutstandingBalance.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ Failed to fix loan ${loan.id}:`, error);
        results.push({ 
          loan_id: loan.id, 
          status: 'error', 
          message: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    res.json({ 
      message: `Processed ${loans.length} active loans`,
      results 
    });
  } catch (error) {
    console.error('Fix outstanding balances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset all loan data (teachers only) - DANGEROUS: This will delete all loans, payments, and related transactions
router.post('/admin/reset-all-loans', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('⚠️ RESETTING ALL LOAN DATA - This action cannot be undone!');
    
    // Get database connection for transaction
    const client = await database.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get count of data to be deleted for logging
      const loansCountResult = await client.query('SELECT COUNT(*) as count FROM loans');
      const paymentsCountResult = await client.query('SELECT COUNT(*) as count FROM loan_payments');
      const transactionsCountResult = await client.query('SELECT COUNT(*) as count FROM transactions WHERE transaction_type IN ($1, $2)', ['loan_disbursement', 'loan_repayment']);
      
      const loansCount = parseInt(loansCountResult.rows[0]?.count || '0');
      const paymentsCount = parseInt(paymentsCountResult.rows[0]?.count || '0');
      const transactionsCount = parseInt(transactionsCountResult.rows[0]?.count || '0');
      
      console.log(`🗑️ Deleting: ${loansCount} loans, ${paymentsCount} payments, ${transactionsCount} transactions`);
      
      // Delete in correct order due to foreign key constraints
      await client.query('DELETE FROM loan_payments');
      await client.query('DELETE FROM transactions WHERE transaction_type IN ($1, $2)', ['loan_disbursement', 'loan_repayment']);
      await client.query('DELETE FROM loans');
      
      await client.query('COMMIT');
      
      console.log('✅ All loan data has been reset successfully');
      
      res.json({ 
        message: 'All loan data has been successfully reset',
        deleted: {
          loans: loansCount,
          payments: paymentsCount,
          transactions: transactionsCount
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reset loan data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the checkStudentCanTransact function for use in other routes
export { checkStudentCanTransact };
export default router;
