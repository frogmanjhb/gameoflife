import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all students with their account balances (teachers only)
router.get('/', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const students = await database.query(`
      SELECT 
        u.id,
        u.username,
        u.created_at,
        a.account_number,
        a.balance,
        a.updated_at as last_activity
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE u.role = 'student'
      ORDER BY u.username
    `);

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
      WHERE u.username = ? AND u.role = 'student'
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
      WHERE l.borrower_id = ?
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [student.id]);

    // Get recent transactions
    const transactions = await database.query(`
      SELECT 
        t.*,
        fu.username as from_username,
        tu.username as to_username
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN users fu ON fa.user_id = fu.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN users tu ON ta.user_id = tu.id
      WHERE t.from_account_id = ? OR t.to_account_id = ?
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [student.id, student.id]);

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
