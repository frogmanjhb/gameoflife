import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get students in the same class as the current student
router.get('/classmates', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access classmates' });
    }

    if (!req.user.class) {
      console.log('⚠️ Student has no class assigned:', req.user.username);
      return res.json([]);
    }

    console.log('🔍 Getting classmates for student:', req.user.username, 'in class:', req.user.class);
    
    const classmates = await database.query(`
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
      ORDER BY u.first_name, u.last_name
    `, [req.user.class, req.user.id]);

    console.log('📊 Found classmates:', classmates.length);
    res.json(classmates);
  } catch (error) {
    console.error('Get classmates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all students with their account balances (teachers only)
router.get('/', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Getting students for teacher:', req.user?.username);
    
    const students = await database.query(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.job_id,
        u.status,
        u.created_at,
        a.account_number,
        a.balance,
        a.updated_at as last_activity,
        j.name as job_name,
        j.salary as job_salary
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      LEFT JOIN jobs j ON u.job_id = j.id
      WHERE u.role = 'student'
      ORDER BY u.class, u.last_name, u.first_name
    `);

    console.log('📊 Found students:', students.length);
    console.log('📊 Student data:', JSON.stringify(students, null, 2));
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending students (teachers only)
router.get('/pending', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Getting pending students for teacher:', req.user?.username);
    
    const pendingStudents = await database.query(`
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
      WHERE u.role = 'student' AND u.status = 'pending'
      ORDER BY u.created_at ASC
    `);

    console.log('📊 Found pending students:', pendingStudents.length);
    res.json(pendingStudents);
  } catch (error) {
    console.error('Get pending students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve a pending student (teachers only)
router.post('/:username/approve', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;

    // Get student info
    const student = await database.get(`
      SELECT u.id, u.username, u.role, u.status
      FROM users u
      WHERE u.username = $1 AND u.role = 'student'
    `, [username]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.status !== 'pending') {
      return res.status(400).json({ error: `Student is already ${student.status}` });
    }

    // Update student status to approved
    await database.run(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['approved', student.id]
    );

    console.log(`✅ Teacher ${req.user?.username} approved student ${username}`);
    res.json({ message: `Student ${username} has been approved successfully` });
  } catch (error) {
    console.error('Approve student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deny a pending student (teachers only)
router.post('/:username/deny', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { reason } = req.body;

    // Get student info
    const student = await database.get(`
      SELECT u.id, u.username, u.role, u.status
      FROM users u
      WHERE u.username = $1 AND u.role = 'student'
    `, [username]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.status !== 'pending') {
      return res.status(400).json({ error: `Student is already ${student.status}` });
    }

    // Update student status to denied
    await database.run(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['denied', student.id]
    );

    console.log(`❌ Teacher ${req.user?.username} denied student ${username}${reason ? `: ${reason}` : ''}`);
    res.json({ message: `Student ${username} has been denied` });
  } catch (error) {
    console.error('Deny student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a student (teachers only)
router.delete('/:username', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;

    // Get student info first
    const student = await database.get(`
      SELECT u.id, u.username, u.role
      FROM users u
      WHERE u.username = $1 AND u.role = 'student'
    `, [username]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get the student's account
    const account = await database.get('SELECT id FROM accounts WHERE user_id = $1', [student.id]);

    // Delete related data in order (respecting foreign key constraints)
    // 1. Delete transactions involving this account
    if (account) {
      await database.run('DELETE FROM transactions WHERE from_account_id = $1 OR to_account_id = $1', [account.id]);
    }

    // 2. Delete loan payments for loans where student is borrower
    await database.run(`
      DELETE FROM loan_payments WHERE loan_id IN (
        SELECT id FROM loans WHERE borrower_id = $1
      )
    `, [student.id]);

    // 3. Delete loans where student is borrower
    await database.run('DELETE FROM loans WHERE borrower_id = $1', [student.id]);

    // 4. Delete job applications
    await database.run('DELETE FROM job_applications WHERE user_id = $1', [student.id]);

    // 5. Delete land purchase requests
    await database.run('DELETE FROM land_purchase_requests WHERE user_id = $1', [student.id]);

    // 6. Update owned land parcels (set owner to null)
    await database.run('UPDATE land_parcels SET owner_id = NULL WHERE owner_id = $1', [student.id]);

    // 7. Delete tender applications
    await database.run('DELETE FROM tender_applications WHERE applicant_id = $1', [student.id]);

    // 8. Delete math game sessions
    await database.run('DELETE FROM math_game_sessions WHERE user_id = $1', [student.id]);

    // 9. Delete the account
    if (account) {
      await database.run('DELETE FROM accounts WHERE user_id = $1', [student.id]);
    }

    // 10. Finally, delete the user
    await database.run('DELETE FROM users WHERE id = $1', [student.id]);

    console.log(`🗑️ Teacher ${req.user?.username} deleted student ${username}`);
    res.json({ message: `Student ${username} has been deleted successfully` });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset student password (teachers only)
router.post('/:username/reset-password', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    const reveal = req.body?.reveal === true;

    // Get student info
    const student = await database.get(`
      SELECT u.id, u.username, u.role
      FROM users u
      WHERE u.username = $1 AND u.role = 'student'
    `, [username]);

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
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Update the student's password
    await database.run(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, student.id]
    );

    console.log(`🔑 Teacher ${req.user?.username} reset password for student ${username}`);
    
    res.json(
      reveal
        ? {
            message: 'Password reset successfully',
            temporary_password: temporaryPassword,
            username: student.username
          }
        : {
            message: 'Password reset successfully',
            username: student.username
          }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comprehensive student details (teachers only)
router.get('/:username/details', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;

    // Get student info with job details
    const student = await database.get(`
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

    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);

    // Get all transactions
    let transactions = [];
    if (account) {
      transactions = await database.query(`
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
    const loans = await database.query(`
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
    const landParcels = await database.query(`
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
    const mathGameSessions = await database.query(`
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
    const pizzaContributions = await database.query(`
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
    const shopPurchases = await database.query(`
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
    const jobApplications = await database.query(`
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
    const suggestions = await database.query(
      `
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
      `,
      [student.id]
    );

    const bugReports = await database.query(
      `
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
      `,
      [student.id]
    );

    // Calculate statistics
    const stats = {
      total_transactions: transactions.length,
      total_transfers_sent: transactions.filter(t => 
        t.transaction_type === 'transfer' && t.from_username === student.username
      ).reduce((sum, t) => sum + parseFloat(t.amount), 0),
      total_transfers_received: transactions.filter(t => 
        t.transaction_type === 'transfer' && t.to_username === student.username
      ).reduce((sum, t) => sum + parseFloat(t.amount), 0),
      total_deposits: transactions.filter(t => 
        t.transaction_type === 'deposit'
      ).reduce((sum, t) => sum + parseFloat(t.amount), 0),
      total_withdrawals: transactions.filter(t => 
        t.transaction_type === 'withdrawal'
      ).reduce((sum, t) => sum + parseFloat(t.amount), 0),
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
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student details with loan information (teachers only) - Legacy endpoint
router.get('/:username', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;

    // Get student info
    const student = await database.get(`
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
    const loans = await database.query(`
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
    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [student.id]);
    let transactions = [];
    if (account) {
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
        LIMIT 10
      `, [account.id, account.id]);
    }

    res.json({
      student,
      loans,
      recent_transactions: transactions
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
