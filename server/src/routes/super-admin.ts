import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireSchoolId } from '../middleware/tenant';

const router = Router();

/**
 * GET /api/admin/schools
 * List all schools with aggregated stats
 * Super admin only
 */
router.get('/schools', authenticateToken, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schools = await database.query(`
      SELECT 
        s.id,
        s.name,
        s.code,
        s.archived,
        s.created_at,
        s.updated_at,
        COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END)::int as student_count,
        COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.id END)::int as teacher_count,
        COUNT(DISTINCT CASE WHEN u.updated_at > NOW() - INTERVAL '30 days' THEN u.id END)::int as active_users_30d,
        COALESCE(SUM(ts.treasury_balance), 0)::decimal as treasury_total,
        (
          SELECT COUNT(*)::int
          FROM transactions t
          JOIN accounts a ON t.from_account_id = a.id OR t.to_account_id = a.id
          JOIN users u2 ON a.user_id = u2.id
          WHERE u2.school_id = s.id AND t.created_at > NOW() - INTERVAL '30 days'
        ) as transaction_count_30d,
        (
          SELECT MAX(t.created_at)
          FROM transactions t
          JOIN accounts a ON t.from_account_id = a.id OR t.to_account_id = a.id
          JOIN users u2 ON a.user_id = u2.id
          WHERE u2.school_id = s.id
        ) as last_activity
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN town_settings ts ON ts.school_id = s.id
      GROUP BY s.id, s.name, s.code, s.archived, s.created_at, s.updated_at
      ORDER BY s.created_at DESC
    `);

    res.json(schools);
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

/**
 * GET /api/admin/schools/:id
 * Get school details with aggregated data
 * Super admin only
 */
router.get('/schools/:id', authenticateToken, requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = parseInt(req.params.id);

    // Get school basic info
    const school = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Financial overview
    const treasuryTotal = await database.get(`
      SELECT COALESCE(SUM(treasury_balance), 0)::decimal as total
      FROM town_settings
      WHERE school_id = $1
    `, [schoolId]);

    const studentBalancesTotal = await database.get(`
      SELECT COALESCE(SUM(a.balance), 0)::decimal as total
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE u.school_id = $1 AND u.role = 'student'
    `, [schoolId]);

    const transactionCount = await database.get(`
      SELECT COUNT(*)::int as count
      FROM transactions t
      JOIN accounts a ON t.from_account_id = a.id OR t.to_account_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE u.school_id = $1 AND t.created_at > NOW() - INTERVAL '30 days'
    `, [schoolId]);

    const loanStats = await database.get(`
      SELECT 
        COUNT(*)::int as total_loans,
        COALESCE(SUM(l.outstanding_balance), 0)::decimal as total_outstanding,
        COUNT(*) FILTER (WHERE l.status = 'active')::int as active_loans
      FROM loans l
      JOIN users u ON l.borrower_id = u.id
      WHERE u.school_id = $1
    `, [schoolId]);

    // User statistics
    const studentCount = await database.get(`
      SELECT COUNT(*)::int as count
      FROM users
      WHERE school_id = $1 AND role = 'student'
    `, [schoolId]);

    const teacherCount = await database.get(`
      SELECT COUNT(*)::int as count
      FROM users
      WHERE school_id = $1 AND role = 'teacher'
    `, [schoolId]);

    const teachers = await database.query(`
      SELECT id, username, first_name, last_name, email, created_at
      FROM users
      WHERE school_id = $1 AND role = 'teacher'
      ORDER BY created_at DESC
    `, [schoolId]);

    const pendingApprovals = await database.get(`
      SELECT COUNT(*)::int as count
      FROM users
      WHERE school_id = $1 AND role = 'student' AND status = 'pending'
    `, [schoolId]);

    // Activity metrics
    const activeUsers = await database.query(`
      SELECT 
        DATE(u.updated_at) as date,
        COUNT(DISTINCT u.id)::int as active_users
      FROM users u
      WHERE u.school_id = $1 AND u.updated_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(u.updated_at)
      ORDER BY date DESC
    `, [schoolId]);

    const mostActiveClasses = await database.query(`
      SELECT 
        u.class,
        COUNT(DISTINCT u.id)::int as student_count,
        COUNT(DISTINCT t.id)::int as transaction_count
      FROM users u
      LEFT JOIN accounts a ON a.user_id = u.id
      LEFT JOIN transactions t ON t.from_account_id = a.id OR t.to_account_id = a.id
      WHERE u.school_id = $1 AND u.role = 'student' AND t.created_at > NOW() - INTERVAL '7 days'
      GROUP BY u.class
      ORDER BY transaction_count DESC
    `, [schoolId]);

    res.json({
      school,
      financial: {
        treasury_total: treasuryTotal?.total || 0,
        student_balances_total: studentBalancesTotal?.total || 0,
        transaction_count_30d: transactionCount?.count || 0,
        loan_stats: loanStats || { total_loans: 0, total_outstanding: 0, active_loans: 0 }
      },
      users: {
        student_count: studentCount?.count || 0,
        teacher_count: teacherCount?.count || 0,
        teachers: teachers || [],
        pending_approvals: pendingApprovals?.count || 0
      },
      activity: {
        active_users_7d: activeUsers || [],
        most_active_classes: mostActiveClasses || []
      }
    });
  } catch (error) {
    console.error('Failed to fetch school details:', error);
    res.status(500).json({ error: 'Failed to fetch school details' });
  }
});

/**
 * POST /api/admin/schools
 * Create new school
 * Super admin only
 */
router.post('/schools', 
  authenticateToken, 
  requireRole(['super_admin']),
  [
    body('name').notEmpty().withMessage('School name is required'),
    body('code').notEmpty().withMessage('School code is required')
      .matches(/^[a-z0-9-]+$/).withMessage('Code must be lowercase alphanumeric with hyphens only'),
    body('settings').optional().isObject()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, code, settings = {} } = req.body;

      // Check if code already exists
      const existing = await database.get('SELECT id FROM schools WHERE code = $1', [code]);
      if (existing) {
        return res.status(400).json({ error: 'School code already exists' });
      }

      // Set default settings if not provided
      const defaultSettings = {
        classes: ['6A', '6B', '6C'],
        allowed_email_domains: [],
        enabled_plugins: [],
        ...settings
      };

      const result = await database.run(
        'INSERT INTO schools (name, code, settings) VALUES ($1, $2, $3) RETURNING id',
        [name, code, JSON.stringify(defaultSettings)]
      );

      const schoolId = result.lastID;

      // Create default town settings for each class
      const classes = defaultSettings.classes || ['6A', '6B', '6C'];
      for (const className of classes) {
        await database.run(
          `INSERT INTO town_settings (school_id, class, town_name, treasury_balance, tax_rate, tax_enabled)
           VALUES ($1, $2, $3, 10000000.00, 5.00, true)`,
          [schoolId, className, `${className} Town`]
        );
      }

      const school = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);

      res.status(201).json({ 
        message: 'School created successfully',
        school,
        note: 'Use POST /api/admin/schools/:id/teachers to create the first teacher for this school'
      });
    } catch (error: any) {
      console.error('Failed to create school:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'School code already exists' });
      }
      res.status(500).json({ error: 'Failed to create school' });
    }
  }
);

/**
 * PUT /api/admin/schools/:id
 * Update school settings
 * Super admin only
 */
router.put('/schools/:id',
  authenticateToken,
  requireRole(['super_admin']),
  [
    body('name').optional().notEmpty(),
    body('code').optional().matches(/^[a-z0-9-]+$/),
    body('settings').optional().isObject(),
    body('archived').optional().isBoolean()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const schoolId = parseInt(req.params.id);
      const { name, code, settings, archived } = req.body;

      // Check if school exists
      const existing = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
      if (!existing) {
        return res.status(404).json({ error: 'School not found' });
      }

      // Check code uniqueness if changing
      if (code && code !== existing.code) {
        const codeExists = await database.get('SELECT id FROM schools WHERE code = $1', [code]);
        if (codeExists) {
          return res.status(400).json({ error: 'School code already exists' });
        }
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (code !== undefined) {
        updates.push(`code = $${paramIndex++}`);
        values.push(code);
      }
      if (settings !== undefined) {
        updates.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(settings));
      }
      if (archived !== undefined) {
        updates.push(`archived = $${paramIndex++}`);
        values.push(archived);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(schoolId);

      await database.run(
        `UPDATE schools SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      const updated = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
      res.json({ message: 'School updated successfully', school: updated });
    } catch (error) {
      console.error('Failed to update school:', error);
      res.status(500).json({ error: 'Failed to update school' });
    }
  }
);

/**
 * DELETE /api/admin/schools/:id
 * Archive school (soft delete)
 * Super admin only
 */
router.delete('/schools/:id',
  authenticateToken,
  requireRole(['super_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = parseInt(req.params.id);

      const school = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
      if (!school) {
        return res.status(404).json({ error: 'School not found' });
      }

      // Soft delete by archiving
      await database.run(
        'UPDATE schools SET archived = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [schoolId]
      );

      res.json({ message: 'School archived successfully' });
    } catch (error) {
      console.error('Failed to archive school:', error);
      res.status(500).json({ error: 'Failed to archive school' });
    }
  }
);

/**
 * GET /api/admin/schools/:id/stats
 * Get detailed aggregated statistics for a school
 * Super admin only
 */
router.get('/schools/:id/stats',
  authenticateToken,
  requireRole(['super_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = parseInt(req.params.id);

      // Financial stats
      const treasuryTotal = await database.get(`
        SELECT COALESCE(SUM(treasury_balance), 0)::decimal as total
        FROM town_settings
        WHERE school_id = $1
      `, [schoolId]);

      const studentBalancesTotal = await database.get(`
        SELECT COALESCE(SUM(a.balance), 0)::decimal as total
        FROM accounts a
        JOIN users u ON a.user_id = u.id
        WHERE u.school_id = $1 AND u.role = 'student'
      `, [schoolId]);

      const transactionCount = await database.get(`
        SELECT COUNT(*)::int as count
        FROM transactions t
        JOIN accounts a ON t.from_account_id = a.id OR t.to_account_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE u.school_id = $1 AND t.created_at > NOW() - INTERVAL '30 days'
      `, [schoolId]);

      const loanStats = await database.get(`
        SELECT 
          COUNT(*)::int as total_loans,
          COALESCE(SUM(l.outstanding_balance), 0)::decimal as total_outstanding,
          COUNT(*) FILTER (WHERE l.status = 'active')::int as active_loans
        FROM loans l
        JOIN users u ON l.borrower_id = u.id
        WHERE u.school_id = $1
      `, [schoolId]);

      // User stats
      const studentCount = await database.get(`
        SELECT COUNT(*)::int as count
        FROM users
        WHERE school_id = $1 AND role = 'student'
      `, [schoolId]);

      const teacherCount = await database.get(`
        SELECT COUNT(*)::int as count
        FROM users
        WHERE school_id = $1 AND role = 'teacher'
      `, [schoolId]);

      const teachers = await database.query(`
        SELECT id, username, first_name, last_name
        FROM users
        WHERE school_id = $1 AND role = 'teacher'
        ORDER BY created_at DESC
      `, [schoolId]);

      const pendingApprovals = await database.get(`
        SELECT COUNT(*)::int as count
        FROM users
        WHERE school_id = $1 AND role = 'student' AND status = 'pending'
      `, [schoolId]);

      res.json({
        financial: {
          treasury_total: treasuryTotal?.total || 0,
          student_balances_total: studentBalancesTotal?.total || 0,
          transaction_count_30d: transactionCount?.count || 0,
          loan_stats: loanStats || { total_loans: 0, total_outstanding: 0, active_loans: 0 }
        },
        users: {
          student_count: studentCount?.count || 0,
          teacher_count: teacherCount?.count || 0,
          teachers: teachers || [],
          pending_approvals: pendingApprovals?.count || 0
        }
      });
    } catch (error) {
      console.error('Failed to fetch school stats:', error);
      res.status(500).json({ error: 'Failed to fetch school stats' });
    }
  }
);

/**
 * POST /api/admin/schools/:id/teachers
 * Create teacher for a school
 * Super admin only - used to create the first teacher for a new school
 */
router.post('/schools/:id/teachers',
  authenticateToken,
  requireRole(['super_admin']),
  [
    body('username').notEmpty().withMessage('Username is required')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').optional().isString(),
    body('last_name').optional().isString(),
    body('email').optional().isEmail().withMessage('Valid email required')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const schoolId = parseInt(req.params.id);
      const { username, password, first_name, last_name, email } = req.body;

      // Verify school exists
      const school = await database.get('SELECT * FROM schools WHERE id = $1', [schoolId]);
      if (!school) {
        return res.status(404).json({ error: 'School not found' });
      }

      if (school.archived) {
        return res.status(400).json({ error: 'Cannot create teachers for archived schools' });
      }

      // Check if username already exists (globally, since usernames are unique)
      const existingUser = await database.get('SELECT id FROM users WHERE username = $1', [username]);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create teacher user for the specified school
      const result = await database.run(
        'INSERT INTO users (username, password_hash, role, first_name, last_name, email, school_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [username, passwordHash, 'teacher', first_name || null, last_name || null, email || null, schoolId, 'approved']
      );

      const userId = result.lastID;
      const user = await database.get(
        'SELECT id, username, role, first_name, last_name, email, school_id, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      console.log(`✅ Teacher account created by super admin ${req.user?.username}: ${username} for school ${school.name}`);
      res.status(201).json({
        message: 'Teacher account created successfully',
        user,
        school: {
          id: school.id,
          name: school.name,
          code: school.code
        }
      });
    } catch (error: any) {
      console.error('Failed to create teacher:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: 'Failed to create teacher' });
    }
  }
);

/**
 * GET /api/admin/analytics
 * System-wide analytics
 * Super admin only
 */
router.get('/analytics',
  authenticateToken,
  requireRole(['super_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const totalSchools = await database.get(`
        SELECT COUNT(*)::int as total
        FROM schools
        WHERE archived = false
      `);

      const totalStudents = await database.get(`
        SELECT COUNT(*)::int as total
        FROM users
        WHERE role = 'student'
      `);

      const totalTeachers = await database.get(`
        SELECT COUNT(*)::int as total
        FROM users
        WHERE role = 'teacher'
      `);

      const transactionVolume = await database.get(`
        SELECT COUNT(*)::int as count
        FROM transactions t
        JOIN accounts a ON t.from_account_id = a.id OR t.to_account_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE t.created_at > NOW() - INTERVAL '30 days'
      `);

      const growthTrends = await database.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*)::int as new_schools
        FROM schools
        WHERE created_at > NOW() - INTERVAL '90 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      res.json({
        total_schools: totalSchools?.total || 0,
        total_students: totalStudents?.total || 0,
        total_teachers: totalTeachers?.total || 0,
        transaction_volume_30d: transactionVolume?.count || 0,
        growth_trends: growthTrends || []
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
);

export default router;
