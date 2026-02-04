import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all schools with aggregated stats (super admin only)
router.get('/schools', authenticateToken, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schools = await database.query(`
      SELECT 
        s.id,
        s.name,
        s.code,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'student') as student_count,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as teacher_count,
        COALESCE(SUM(ts.treasury_balance), 0) as total_treasury,
        COUNT(DISTINCT u.id) FILTER (WHERE u.last_login > NOW() - INTERVAL '30 days') as active_users,
        s.created_at,
        MAX(GREATEST(
          COALESCE((SELECT MAX(created_at) FROM transactions t 
            JOIN accounts a ON t.from_account_id = a.id OR t.to_account_id = a.id
            JOIN users u2 ON a.user_id = u2.id WHERE u2.school_id = s.id), '1970-01-01'),
          COALESCE((SELECT MAX(updated_at) FROM users WHERE school_id = s.id), '1970-01-01')
        )) as last_activity
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN town_settings ts ON ts.school_id = s.id
      WHERE s.archived = false
      GROUP BY s.id, s.name, s.code, s.created_at
      ORDER BY s.name
    `);

    res.json(schools);
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Get school details with aggregated stats
router.get('/schools/:id', authenticateToken, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = parseInt(req.params.id, 10);
    
    const school = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Get aggregated stats
    const stats = await database.get(`
      SELECT 
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'student') as student_count,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as teacher_count,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'student' AND u.status = 'pending') as pending_students,
        COUNT(DISTINCT u.id) FILTER (WHERE u.last_login > NOW() - INTERVAL '30 days') as active_users_30d,
        COUNT(DISTINCT u.id) FILTER (WHERE u.last_login > NOW() - INTERVAL '7 days') as active_users_7d,
        COALESCE(SUM(a.balance), 0) as total_student_balances,
        COUNT(DISTINCT t.id) FILTER (WHERE t.created_at > NOW() - INTERVAL '30 days') as transactions_30d,
        COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') as active_loans,
        COALESCE(SUM(l.outstanding_balance), 0) as total_outstanding_loans
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN accounts a ON a.user_id = u.id AND u.role = 'student'
      LEFT JOIN transactions t ON (t.from_account_id = a.id OR t.to_account_id = a.id)
      LEFT JOIN loans l ON l.borrower_id = u.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [schoolId]);

    // Get teachers list
    const teachers = await database.query(`
      SELECT id, username, first_name, last_name, email, created_at
      FROM users
      WHERE school_id = $1 AND role = 'teacher'
      ORDER BY username
    `, [schoolId]);

    res.json({
      ...school,
      stats: stats || {},
      teachers
    });
  } catch (error) {
    console.error('Failed to fetch school details:', error);
    res.status(500).json({ error: 'Failed to fetch school details' });
  }
});

// Create new school
router.post('/schools', authenticateToken, requireRole(['super_admin']), [
  body('name').notEmpty().withMessage('School name is required'),
  body('code').notEmpty().withMessage('School code is required').matches(/^[a-z0-9-]+$/).withMessage('Code must be lowercase alphanumeric with hyphens'),
  body('settings').optional().isObject()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, settings } = req.body;

    // Check if code already exists
    const existing = await database.get('SELECT id FROM schools WHERE code = $1', [code]);
    if (existing) {
      return res.status(400).json({ error: 'School code already exists' });
    }

    // Create school
    const result = await database.run(
      'INSERT INTO schools (name, code, settings) VALUES ($1, $2, $3) RETURNING id',
      [name, code, settings || {}]
    );

    const schoolId = result.lastID;

    // Seed default data for the school
    // Create default town settings for each class
    const defaultClasses = settings?.classes || ['6A', '6B', '6C'];
    for (const className of defaultClasses) {
      await database.run(
        `INSERT INTO town_settings (school_id, class, town_name, tax_rate, tax_enabled, treasury_balance)
         VALUES ($1, $2, $3, 5.00, true, 10000000.00)`,
        [schoolId, className, `${className} Town`]
      );
    }

    // Create default jobs (copy from template or create defaults)
    const defaultJobs = [
      { name: 'Teacher', salary: 5000 },
      { name: 'Doctor', salary: 8000 },
      { name: 'Engineer', salary: 7000 },
      { name: 'Lawyer', salary: 7500 },
      { name: 'Accountant', salary: 6000 },
      { name: 'Police Officer', salary: 5500 },
      { name: 'Mayor', salary: 10000 },
      { name: 'Town Planner', salary: 6500 }
    ];

    for (const job of defaultJobs) {
      await database.run(
        'INSERT INTO jobs (school_id, name, salary) VALUES ($1, $2, $3)',
        [schoolId, job.name, job.salary]
      );
    }

    const school = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
    res.status(201).json(school);
  } catch (error: any) {
    console.error('Failed to create school:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'School code already exists' });
    }
    res.status(500).json({ error: 'Failed to create school' });
  }
});

// Update school settings
router.put('/schools/:id', authenticateToken, requireRole(['super_admin']), [
  body('name').optional().notEmpty(),
  body('code').optional().notEmpty().matches(/^[a-z0-9-]+$/),
  body('settings').optional().isObject()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const schoolId = parseInt(req.params.id, 10);
    const { name, code, settings } = req.body;

    // Check if school exists
    const school = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Check code uniqueness if changing
    if (code && code !== school.code) {
      const existing = await database.get('SELECT id FROM schools WHERE code = $1', [code]);
      if (existing) {
        return res.status(400).json({ error: 'School code already exists' });
      }
    }

    // Update school
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (code) {
      updates.push(`code = $${paramCount++}`);
      values.push(code);
    }
    if (settings) {
      updates.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(settings));
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(schoolId);

    await database.run(
      `UPDATE schools SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    const updated = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update school:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'School code already exists' });
    }
    res.status(500).json({ error: 'Failed to update school' });
  }
});

// Archive school (soft delete)
router.delete('/schools/:id', authenticateToken, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = parseInt(req.params.id, 10);

    const school = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    await database.run('UPDATE schools SET archived = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [schoolId]);
    res.json({ message: 'School archived successfully' });
  } catch (error) {
    console.error('Failed to archive school:', error);
    res.status(500).json({ error: 'Failed to archive school' });
  }
});

// Get cross-school analytics
router.get('/analytics', authenticateToken, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await database.get(`
      SELECT 
        COUNT(DISTINCT s.id) FILTER (WHERE s.archived = false) as total_schools,
        COUNT(DISTINCT s.id) FILTER (WHERE s.archived = true) as archived_schools,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'student') as total_students,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as total_teachers,
        COUNT(DISTINCT t.id) FILTER (WHERE t.created_at > NOW() - INTERVAL '30 days') as transactions_30d,
        COUNT(DISTINCT s.id) FILTER (WHERE s.created_at > NOW() - INTERVAL '30 days' AND s.archived = false) as new_schools_30d,
        COUNT(DISTINCT u.id) FILTER (WHERE u.created_at > NOW() - INTERVAL '30 days' AND u.role = 'student') as new_students_30d
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN transactions t ON t.school_id = s.id
    `);

    res.json(analytics);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Reset school data (factory reset for a specific school)
router.post('/schools/:id/reset', authenticateToken, requireRole(['super_admin']), [
  body('confirm').equals('RESET').withMessage('Confirmation must be RESET')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const schoolId = parseInt(req.params.id, 10);
    const school = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');

      // Count students before deletion
      const studentsCountRes = await client.query(
        `SELECT COUNT(*)::int AS count FROM users WHERE role = 'student' AND school_id = $1`,
        [schoolId]
      );
      const studentsCount = studentsCountRes.rows?.[0]?.count ?? 0;

      // Delete school-specific data
      await client.query(`DELETE FROM tender_applications WHERE school_id = $1`, [schoolId]);
      await client.query(`DELETE FROM tenders WHERE school_id = $1`, [schoolId]);
      await client.query(`DELETE FROM job_applications WHERE school_id = $1`, [schoolId]);
      await client.query(`DELETE FROM land_purchase_requests WHERE school_id = $1`, [schoolId]);
      await client.query(`UPDATE land_parcels SET owner_id = NULL, purchased_at = NULL WHERE school_id = $1`, [schoolId]);
      await client.query(`DELETE FROM loan_payments WHERE loan_id IN (SELECT id FROM loans WHERE borrower_id IN (SELECT id FROM users WHERE school_id = $1))`, [schoolId]);
      await client.query(`DELETE FROM loans WHERE borrower_id IN (SELECT id FROM users WHERE school_id = $1)`, [schoolId]);
      await client.query(`DELETE FROM math_game_sessions WHERE user_id IN (SELECT id FROM users WHERE school_id = $1)`, [schoolId]);
      await client.query(`DELETE FROM math_game_high_scores WHERE user_id IN (SELECT id FROM users WHERE school_id = $1)`, [schoolId]);
      await client.query(`DELETE FROM tax_transactions WHERE school_id = $1`, [schoolId]);
      await client.query(`DELETE FROM treasury_transactions WHERE school_id = $1`, [schoolId]);
      await client.query(`DELETE FROM announcements WHERE school_id = $1`, [schoolId]);
      await client.query(`DELETE FROM transactions WHERE school_id = $1`, [schoolId]);
      await client.query(`DELETE FROM accounts WHERE school_id = $1`, [schoolId]);
      await client.query(`DELETE FROM users WHERE role = 'student' AND school_id = $1`, [schoolId]);

      // Reset town settings
      await client.query(`
        UPDATE town_settings
        SET town_name = class || ' Town',
            mayor_name = 'TBD',
            tax_rate = 5.00,
            tax_enabled = true,
            treasury_balance = 10000000.00,
            updated_at = CURRENT_TIMESTAMP
        WHERE school_id = $1
      `, [schoolId]);

      // Record initial treasury balance
      await client.query(`
        INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description)
        SELECT $1, class, 10000000.00, 'initial_balance', 'Initial town treasury allocation (school reset)'
        FROM town_settings
        WHERE school_id = $1
      `, [schoolId]);

      await client.query('COMMIT');

      res.json({
        message: 'School reset completed successfully',
        deleted_students: studentsCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('School reset failed:', error);
    res.status(500).json({ error: 'School reset failed' });
  }
});

export default router;
