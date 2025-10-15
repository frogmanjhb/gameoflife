import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get students in the same class as the current student
router.get('/classmates', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access classmates' });
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
        u.created_at,
        a.account_number,
        a.balance,
        a.updated_at as last_activity
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
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

// Get student details with loan information (teachers only)
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
