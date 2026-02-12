import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

// All engagement routes: teacher only, tenant-scoped
router.use(authenticateToken, requireTenant, requireRole(['teacher']));

type Scope = 'individual' | 'class' | 'school';

// GET /api/engagement/summary - Aggregate engagement metrics
router.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: 'School context required' });
    }

    // Logins (last 30 days)
    const loginsResult = await database.query(`
      SELECT COUNT(*) as count FROM login_events le
      JOIN users u ON le.user_id = u.id
      WHERE le.school_id = $1 AND le.logged_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [schoolId]);

    // Chores (math game sessions - correct_answers, last 30 days)
    const choresResult = await database.query(`
      SELECT COALESCE(SUM(mgs.correct_answers), 0) as count FROM math_game_sessions mgs
      JOIN users u ON mgs.user_id = u.id
      WHERE u.school_id = $1 AND u.role = 'student'
      AND mgs.played_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [schoolId]);

    // Transfers (last 30 days) - approved transfers only (executed)
    const transfersResult = await database.query(`
      SELECT COUNT(*) as count FROM transactions t
      JOIN accounts fa ON t.from_account_id = fa.id
      JOIN users u ON fa.user_id = u.id
      WHERE t.transaction_type = 'transfer' AND u.school_id = $1
      AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [schoolId]);

    // Purchases (last 30 days)
    const purchasesResult = await database.query(`
      SELECT COUNT(*) as count FROM shop_purchases sp
      JOIN users u ON sp.user_id = u.id
      WHERE u.school_id = $1 AND sp.created_at >= CURRENT_DATE - INTERVAL '30 days'
    `, [schoolId]);

    res.json({
      logins: parseInt(loginsResult[0]?.count || '0'),
      chores: parseInt(choresResult[0]?.count || '0'),
      transfers: parseInt(transfersResult[0]?.count || '0'),
      purchases: parseInt(purchasesResult[0]?.count || '0')
    });
  } catch (error) {
    console.error('Engagement summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/engagement/over-time - Time series data for line/bar charts
router.get('/over-time', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId;
    const scope = (req.query.scope as Scope) || 'school';
    const metric = (req.query.metric as string) || 'logins';
    const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30));
    const classFilter = req.query.class as string | undefined;

    if (!schoolId) return res.status(400).json({ error: 'School context required' });

    const validMetrics = ['logins', 'chores', 'transfers', 'purchases'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric' });
    }

    let result: { date: string; count: number; class?: string }[] = [];

    if (metric === 'logins') {
      result = await database.query(`
        SELECT DATE(le.logged_at) as date, COUNT(*)::int as count
        FROM login_events le
        JOIN users u ON le.user_id = u.id
        WHERE le.school_id = $1 AND u.role = 'student'
        AND le.logged_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        ${classFilter ? 'AND u.class = $3' : ''}
        GROUP BY DATE(le.logged_at)
        ORDER BY date
      `, classFilter ? [schoolId, days, classFilter] : [schoolId, days]);
    } else if (metric === 'chores') {
      result = await database.query(`
        SELECT DATE(mgs.played_at) as date, COALESCE(SUM(mgs.correct_answers), 0)::int as count
        FROM math_game_sessions mgs
        JOIN users u ON mgs.user_id = u.id
        WHERE u.school_id = $1 AND u.role = 'student'
        AND mgs.played_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        ${classFilter ? 'AND u.class = $3' : ''}
        GROUP BY DATE(mgs.played_at)
        ORDER BY date
      `, classFilter ? [schoolId, days, classFilter] : [schoolId, days]);
    } else if (metric === 'transfers') {
      result = await database.query(`
        SELECT DATE(t.created_at) as date, COUNT(*)::int as count
        FROM transactions t
        JOIN accounts fa ON t.from_account_id = fa.id
        JOIN users u ON fa.user_id = u.id
        WHERE t.transaction_type = 'transfer' AND u.school_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        ${classFilter ? 'AND u.class = $3' : ''}
        GROUP BY DATE(t.created_at)
        ORDER BY date
      `, classFilter ? [schoolId, days, classFilter] : [schoolId, days]);
    } else if (metric === 'purchases') {
      result = await database.query(`
        SELECT DATE(sp.created_at) as date, COUNT(*)::int as count
        FROM shop_purchases sp
        JOIN users u ON sp.user_id = u.id
        WHERE u.school_id = $1
        AND sp.created_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        ${classFilter ? 'AND u.class = $3' : ''}
        GROUP BY DATE(sp.created_at)
        ORDER BY date
      `, classFilter ? [schoolId, days, classFilter] : [schoolId, days]);
    }

    res.json({ data: result.map(r => ({ ...r, date: r.date ? String(r.date).slice(0, 10) : '' })) });
  } catch (error) {
    console.error('Engagement over-time error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/engagement/by-class - Breakdown by class for pie/bar
router.get('/by-class', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId;
    const metric = (req.query.metric as string) || 'logins';
    const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30));

    if (!schoolId) return res.status(400).json({ error: 'School context required' });

    const validMetrics = ['logins', 'chores', 'transfers', 'purchases'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric' });
    }

    let result: { class: string; count: number }[] = [];

    if (metric === 'logins') {
      result = await database.query(`
        SELECT COALESCE(u.class, 'Unassigned') as class, COUNT(*)::int as count
        FROM login_events le
        JOIN users u ON le.user_id = u.id
        WHERE le.school_id = $1 AND u.role = 'student'
        AND le.logged_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        GROUP BY u.class
        ORDER BY count DESC
      `, [schoolId, days]);
    } else if (metric === 'chores') {
      result = await database.query(`
        SELECT COALESCE(u.class, 'Unassigned') as class, COALESCE(SUM(mgs.correct_answers), 0)::int as count
        FROM math_game_sessions mgs
        JOIN users u ON mgs.user_id = u.id
        WHERE u.school_id = $1 AND u.role = 'student'
        AND mgs.played_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        GROUP BY u.class
        ORDER BY count DESC
      `, [schoolId, days]);
    } else if (metric === 'transfers') {
      result = await database.query(`
        SELECT COALESCE(u.class, 'Unassigned') as class, COUNT(*)::int as count
        FROM transactions t
        JOIN accounts fa ON t.from_account_id = fa.id
        JOIN users u ON fa.user_id = u.id
        WHERE t.transaction_type = 'transfer' AND u.school_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        GROUP BY u.class
        ORDER BY count DESC
      `, [schoolId, days]);
    } else if (metric === 'purchases') {
      result = await database.query(`
        SELECT COALESCE(u.class, 'Unassigned') as class, COUNT(*)::int as count
        FROM shop_purchases sp
        JOIN users u ON sp.user_id = u.id
        WHERE u.school_id = $1
        AND sp.created_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        GROUP BY u.class
        ORDER BY count DESC
      `, [schoolId, days]);
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Engagement by-class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/engagement/students - Individual student engagement (for drill-down)
router.get('/students', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId;
    const metric = (req.query.metric as string) || 'logins';
    const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30));
    const classFilter = req.query.class as string | undefined;
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit as string) || 20));

    if (!schoolId) return res.status(400).json({ error: 'School context required' });

    const validMetrics = ['logins', 'chores', 'transfers', 'purchases'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric' });
    }

    let result: { user_id: number; username: string; first_name: string; last_name: string; class: string; count: number }[] = [];

    if (metric === 'logins') {
      const params = classFilter ? [schoolId, days, classFilter, limit] : [schoolId, days, limit];
      result = await database.query(`
        SELECT u.id as user_id, u.username, u.first_name, u.last_name, COALESCE(u.class, 'Unassigned') as class, COUNT(*)::int as count
        FROM login_events le
        JOIN users u ON le.user_id = u.id
        WHERE le.school_id = $1 AND u.role = 'student'
        AND le.logged_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        ${classFilter ? 'AND u.class = $3' : ''}
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
        ORDER BY count DESC
        LIMIT ${classFilter ? '$4' : '$3'}
      `, params);
    } else if (metric === 'chores') {
      const params = classFilter ? [schoolId, days, classFilter, limit] : [schoolId, days, limit];
      result = await database.query(`
        SELECT u.id as user_id, u.username, u.first_name, u.last_name, COALESCE(u.class, 'Unassigned') as class, COALESCE(SUM(mgs.correct_answers), 0)::int as count
        FROM math_game_sessions mgs
        JOIN users u ON mgs.user_id = u.id
        WHERE u.school_id = $1 AND u.role = 'student'
        AND mgs.played_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        ${classFilter ? 'AND u.class = $3' : ''}
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
        ORDER BY count DESC
        LIMIT ${classFilter ? '$4' : '$3'}
      `, params);
    } else if (metric === 'transfers') {
      const params = classFilter ? [schoolId, days, classFilter, limit] : [schoolId, days, limit];
      result = await database.query(`
        SELECT u.id as user_id, u.username, u.first_name, u.last_name, COALESCE(u.class, 'Unassigned') as class, COUNT(*)::int as count
        FROM transactions t
        JOIN accounts fa ON t.from_account_id = fa.id
        JOIN users u ON fa.user_id = u.id
        WHERE t.transaction_type = 'transfer' AND u.school_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        ${classFilter ? 'AND u.class = $3' : ''}
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
        ORDER BY count DESC
        LIMIT ${classFilter ? '$4' : '$3'}
      `, params);
    } else if (metric === 'purchases') {
      const params = classFilter ? [schoolId, days, classFilter, limit] : [schoolId, days, limit];
      result = await database.query(`
        SELECT u.id as user_id, u.username, u.first_name, u.last_name, COALESCE(u.class, 'Unassigned') as class, COUNT(*)::int as count
        FROM shop_purchases sp
        JOIN users u ON sp.user_id = u.id
        WHERE u.school_id = $1
        AND sp.created_at >= CURRENT_DATE - INTERVAL '1 day' * $2
        ${classFilter ? 'AND u.class = $3' : ''}
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
        ORDER BY count DESC
        LIMIT ${classFilter ? '$4' : '$3'}
      `, params);
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Engagement students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/engagement/classes - List of classes for filters
router.get('/classes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.schoolId;
    if (!schoolId) return res.status(400).json({ error: 'School context required' });

    const classes = await database.query(`
      SELECT DISTINCT COALESCE(NULLIF(TRIM(class), ''), 'Unassigned') as class FROM users
      WHERE school_id = $1 AND role = 'student'
      ORDER BY class
    `, [schoolId]);

    const classList = [...new Set(classes.map((c: { class: string }) => c.class || 'Unassigned'))].filter(Boolean).sort();
    res.json({ classes: classList });
  } catch (error) {
    console.error('Engagement classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
