import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { TransferRequest, DepositRequest, WithdrawRequest, TransactionWithDetails } from '../types';

// Helper function to check if student can make transactions
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
  // Only check if due_date exists and is in the past
  const activeLoan = await database.get(
    `SELECT id, monthly_payment, due_date, outstanding_balance 
     FROM loans 
     WHERE borrower_id = $1 AND status = 'active' AND due_date IS NOT NULL AND due_date < CURRENT_DATE`,
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

const router = Router();

// Get transaction history
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    let transactions: TransactionWithDetails[] = [];

    if (req.user.role === 'student') {
      console.log('🔍 Getting transactions for student:', req.user.username);
      
      // Get student's account
      const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [req.user.id]);
      console.log('💳 Student account:', account);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Get all transactions for this account
      transactions = await database.query(`
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
    } else {
      // Teacher can see all transactions
      transactions = await database.query(`
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
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer money between students
router.post('/transfer', [
  body('to_username').notEmpty().withMessage('Recipient username is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString()
], authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to_username, amount, description }: TransferRequest = req.body;

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

    // Get recipient info before starting transaction (doesn't need locking)
    const toUser = await database.get('SELECT * FROM users WHERE username = $1 AND role = $2', [to_username, 'student']);
    if (!toUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // SECURITY FIX: Use a single database client for the entire transaction
    // This prevents race conditions where multiple concurrent transfers could
    // all pass balance checks before any of them deduct money
    const client = await database.pool.connect();
    
    try {
      await client.query('BEGIN');

      // SECURITY: Lock the sender's row with FOR UPDATE to prevent concurrent modifications
      // This ensures no other transaction can read or modify this row until we commit/rollback
      const fromAccountResult = await client.query(
        'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
        [req.user.id]
      );
      const fromAccount = fromAccountResult.rows[0];
      
      if (!fromAccount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Account not found' });
      }

      // SECURITY: Validate balance INSIDE the transaction with the locked row
      // This is the authoritative balance check - client-side values are ignored
      const senderBalance = parseFloat(fromAccount.balance);
      
      if (isNaN(senderBalance) || senderBalance < transferAmount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      // Get recipient's account (also lock it to ensure atomic update)
      const toAccountResult = await client.query(
        'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
        [toUser.id]
      );
      const toAccount = toAccountResult.rows[0];
      
      if (!toAccount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Recipient account not found' });
      }

      // Prevent self-transfer
      if (fromAccount.id === toAccount.id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot transfer to yourself' });
      }

      // Update sender's balance
      await client.query(
        'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [transferAmount, fromAccount.id]
      );

      // Update recipient's balance
      await client.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [transferAmount, toAccount.id]
      );

      // Record transaction
      await client.query(
        'INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)',
        [fromAccount.id, toAccount.id, transferAmount, 'transfer', description || `Transfer to ${to_username}`]
      );

      await client.query('COMMIT');

      res.json({ message: 'Transfer successful' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teacher: Deposit money to student account
router.post('/deposit', [
  body('username').notEmpty().withMessage('Username is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString()
], authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, amount, description }: DepositRequest = req.body;

    // Get student's account
    const student = await database.get('SELECT * FROM users WHERE username = $1 AND role = $2', [username, 'student']);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);
    if (!account) {
      return res.status(404).json({ error: 'Student account not found' });
    }

    // Update balance
    await database.run(
      'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [amount, account.id]
    );

    // Record transaction
    await database.run(
      'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
      [account.id, amount, 'deposit', description || `Deposit by teacher`]
    );

    res.json({ message: 'Deposit successful' });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teacher: Withdraw money from student account
router.post('/withdraw', [
  body('username').notEmpty().withMessage('Username is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString()
], authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, amount, description }: WithdrawRequest = req.body;

    // Get student's account
    const student = await database.get('SELECT * FROM users WHERE username = $1 AND role = $2', [username, 'student']);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);
    if (!account) {
      return res.status(404).json({ error: 'Student account not found' });
    }

    // Check sufficient balance
    if (account.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Update balance
    await database.run(
      'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [amount, account.id]
    );

    // Record transaction
    await database.run(
      'INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
      [account.id, amount, 'withdrawal', description || `Withdrawal by teacher`]
    );

    res.json({ message: 'Withdrawal successful' });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teacher: Bulk payment to all students in a class
router.post('/bulk-payment', [
  body('class_name').notEmpty().withMessage('Class name is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString()
], authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_name, amount, description }: { class_name: string; amount: number; description?: string } = req.body;

    console.log('🔍 Bulk payment to class:', class_name, 'amount:', amount);

    // Get all students in the class
    const students = await database.query(
      'SELECT u.id, u.username, a.id as account_id, a.balance FROM users u LEFT JOIN accounts a ON u.id = a.user_id WHERE u.role = $1 AND u.class = $2',
      ['student', class_name]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: `No students found in class ${class_name}` });
    }

    console.log('📊 Found students in class:', students.length);

    // Count students with accounts for treasury check
    const studentsWithAccounts = students.filter((s: any) => s.account_id).length;
    const totalNeeded = studentsWithAccounts * amount;

    // Check treasury has sufficient funds (if class is valid)
    if (['6A', '6B', '6C'].includes(class_name)) {
      const town = await database.get('SELECT treasury_balance FROM town_settings WHERE class = $1', [class_name]);
      const treasuryBalance = parseFloat(town?.treasury_balance || '0');
      
      if (treasuryBalance < totalNeeded) {
        return res.status(400).json({ 
          error: `Insufficient treasury funds. Need R${totalNeeded.toFixed(2)} but only have R${treasuryBalance.toFixed(2)}` 
        });
      }
    }

    let updatedCount = 0;

    // Use a single client connection for proper transaction handling
    const client = await database.pool.connect();

    try {
      await client.query('BEGIN');

      for (const student of students) {
        if (student.account_id) {
          // Update balance
          await client.query(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [amount, student.account_id]
          );

          // Record transaction
          await client.query(
            'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [student.account_id, amount, 'deposit', description || `Bulk payment to ${class_name}`]
          );

          updatedCount++;
        }
      }

      // Deduct from treasury (if class is valid)
      if (['6A', '6B', '6C'].includes(class_name) && updatedCount > 0) {
        const totalPaid = updatedCount * amount;
        
        await client.query(
          'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2',
          [totalPaid, class_name]
        );

        // Record treasury transaction
        await client.query(
          'INSERT INTO treasury_transactions (town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5)',
          [class_name, totalPaid, 'withdrawal', description || `Bulk payment to ${updatedCount} students`, req.user?.id]
        );
      }

      await client.query('COMMIT');
      console.log('✅ Bulk payment completed for', updatedCount, 'students');
      res.json({ message: 'Bulk payment successful', updated_count: updatedCount });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Teacher: Bulk removal from all students in a class
router.post('/bulk-removal', [
  body('class_name').notEmpty().withMessage('Class name is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString()
], authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class_name, amount, description }: { class_name: string; amount: number; description?: string } = req.body;

    console.log('🔍 Bulk removal from class:', class_name, 'amount:', amount);

    // Get all students in the class with sufficient balance
    const students = await database.query(
      'SELECT u.id, u.username, a.id as account_id, a.balance FROM users u LEFT JOIN accounts a ON u.id = a.user_id WHERE u.role = $1 AND u.class = $2 AND a.balance >= $3',
      ['student', class_name, amount]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: `No students found in class ${class_name} with sufficient balance` });
    }

    console.log('📊 Found students with sufficient balance:', students.length);

    let updatedCount = 0;

    // Use a single client connection for proper transaction handling
    const client = await database.pool.connect();

    try {
      await client.query('BEGIN');

      for (const student of students) {
        if (student.account_id) {
          // Update balance
          await client.query(
            'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [amount, student.account_id]
          );

          // Record transaction
          await client.query(
            'INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [student.account_id, amount, 'withdrawal', description || `Bulk removal from ${class_name}`]
          );

          updatedCount++;
        }
      }

      await client.query('COMMIT');
      console.log('✅ Bulk removal completed for', updatedCount, 'students');
      res.json({ message: 'Bulk removal successful', updated_count: updatedCount });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk removal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if student can make transactions
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

// Get bank settings (teachers only)
router.get('/bank-settings', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await database.query('SELECT * FROM bank_settings');
    const settingsMap = settings.reduce((acc: Record<string, string>, s: any) => {
      acc[s.setting_key] = s.setting_value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (error) {
    console.error('Get bank settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update bank setting (teachers only)
router.put('/bank-settings/:key', [
  body('value').notEmpty().withMessage('Value is required')
], authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { key } = req.params;
    const { value } = req.body;

    await database.run(
      'UPDATE bank_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE setting_key = $3',
      [value, req.user?.id, key]
    );

    res.json({ message: 'Setting updated successfully', key, value });
  } catch (error) {
    console.error('Update bank setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pay basic salary to all unemployed students (teachers only)
router.post('/pay-basic-salary', [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get basic salary amount from settings or use provided amount or default
    let amount = req.body.amount;
    if (!amount) {
      const setting = await database.get('SELECT setting_value FROM bank_settings WHERE setting_key = $1', ['basic_salary_amount']);
      amount = parseFloat(setting?.setting_value || '1500');
    }

    console.log('💰 Paying basic salary to unemployed students:', amount);

    // Get all students without jobs, including their class
    const students = await database.query(
      `SELECT u.id, u.username, u.class, a.id as account_id 
       FROM users u 
       LEFT JOIN accounts a ON u.id = a.user_id 
       WHERE u.role = 'student' AND (u.job_id IS NULL OR u.job_id = 0)`,
      []
    );

    if (students.length === 0) {
      return res.json({ message: 'No unemployed students found', updated_count: 0 });
    }

    console.log('📊 Found unemployed students:', students.length);

    // Group students by class to calculate treasury deductions
    const studentsByClass: Record<string, typeof students> = {};
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
      const town = await database.get('SELECT treasury_balance FROM town_settings WHERE class = $1', [townClass]);
      const treasuryBalance = parseFloat(town?.treasury_balance || '0');
      
      if (treasuryBalance < totalNeeded) {
        return res.status(400).json({ 
          error: `Insufficient treasury funds for class ${townClass}. Need R${totalNeeded.toFixed(2)} but only have R${treasuryBalance.toFixed(2)}` 
        });
      }
    }

    let updatedCount = 0;
    const client = await database.pool.connect();

    try {
      await client.query('BEGIN');

      // Track totals per class for treasury deductions
      const classTotals: Record<string, { count: number; total: number }> = {};

      for (const student of students) {
        if (student.account_id) {
          // Update balance
          await client.query(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [amount, student.account_id]
          );

          // Record transaction
          await client.query(
            'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [student.account_id, amount, 'salary', 'Basic salary (unemployed)']
          );

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

      // Deduct from each class treasury
      for (const [townClass, totals] of Object.entries(classTotals)) {
        await client.query(
          'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2',
          [totals.total, townClass]
        );

        // Record treasury transaction
        await client.query(
          'INSERT INTO treasury_transactions (town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5)',
          [townClass, totals.total, 'withdrawal', `Basic salary payments to ${totals.count} unemployed students`, req.user?.id]
        );
      }

      // Update last run timestamp
      await client.query(
        'UPDATE bank_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2',
        [new Date().toISOString(), 'last_basic_salary_run']
      );

      await client.query('COMMIT');
      console.log('✅ Basic salary paid to', updatedCount, 'unemployed students');
      res.json({ message: 'Basic salary paid successfully', updated_count: updatedCount, amount });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Pay basic salary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unemployed students count (teachers only)
router.get('/unemployed-students', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const students = await database.query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.class, a.balance, a.account_number
       FROM users u 
       LEFT JOIN accounts a ON u.id = a.user_id 
       WHERE u.role = 'student' AND (u.job_id IS NULL OR u.job_id = 0)
       ORDER BY u.class, u.last_name, u.first_name`,
      []
    );
    res.json({ students, count: students.length });
  } catch (error) {
    console.error('Get unemployed students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
