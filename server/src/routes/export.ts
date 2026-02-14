import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

// Export transactions as CSV (school-scoped: only transactions involving accounts in teacher's school)
router.get('/transactions/csv', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const schoolFilter = schoolId !== null
      ? 'AND (fu.school_id = $1 OR tu.school_id = $1)'
      : '';
    const params = schoolId !== null ? [schoolId] : [];

    const transactions = await database.query(`
      SELECT 
        t.id,
        t.created_at,
        t.transaction_type,
        t.amount,
        t.description,
        fu.username as from_username,
        tu.username as to_username
      FROM transactions t
      LEFT JOIN accounts fa ON t.from_account_id = fa.id
      LEFT JOIN users fu ON fa.user_id = fu.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      LEFT JOIN users tu ON ta.user_id = tu.id
      WHERE 1=1 ${schoolFilter}
      ORDER BY t.created_at DESC
    `, params);

    // Convert to CSV format
    const csvHeader = 'ID,Date,Type,Amount,Description,From,To\n';
    const csvRows = transactions.map(t => 
      `${t.id},"${t.created_at}","${t.transaction_type}",${t.amount},"${t.description || ''}","${t.from_username || ''}","${t.to_username || ''}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// Export students as CSV (school-scoped)
router.get('/students/csv', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const schoolFilter = schoolId !== null ? 'AND u.school_id = $1' : '';
    const params = schoolId !== null ? [schoolId] : [];

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
      WHERE u.role = 'student' ${schoolFilter}
      ORDER BY u.username
    `, params);

    // Convert to CSV format
    const csvHeader = 'ID,Username,Account Number,Balance,Last Activity,Join Date\n';
    const csvRows = students.map(s => 
      `${s.id},"${s.username}","${s.account_number}",${s.balance},"${s.last_activity}","${s.created_at}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export students' });
  }
});

// Export loans as CSV (school-scoped: only borrowers in teacher's school)
router.get('/loans/csv', authenticateToken, requireTenant, requireRole(['teacher']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId ?? req.user?.school_id ?? null;
    const schoolFilter = schoolId !== null ? 'AND u.school_id = $1' : '';
    const params = schoolId !== null ? [schoolId] : [];

    const loans = await database.query(`
      SELECT 
        l.id,
        u.username as borrower_username,
        l.amount,
        l.term_months,
        l.interest_rate,
        l.status,
        l.outstanding_balance,
        l.monthly_payment,
        l.created_at,
        l.approved_at,
        l.due_date,
        COALESCE(SUM(lp.amount), 0) as total_paid
      FROM loans l
      JOIN users u ON l.borrower_id = u.id
      LEFT JOIN loan_payments lp ON l.id = lp.loan_id
      WHERE 1=1 ${schoolFilter}
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, params);

    // Convert to CSV format
    const csvHeader = 'ID,Borrower,Amount,Term (Months),Interest Rate,Status,Outstanding Balance,Monthly Payment,Total Paid,Created,Approved,Due Date\n';
    const csvRows = loans.map(l => 
      `${l.id},"${l.borrower_username}",${l.amount},${l.term_months},${l.interest_rate},"${l.status}",${l.outstanding_balance},${l.monthly_payment},${l.total_paid},"${l.created_at}","${l.approved_at || ''}","${l.due_date || ''}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="loans.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export loans' });
  }
});

export default router;
