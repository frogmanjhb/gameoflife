import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

/**
 * Helper: Calculate start date based on time range (UTC for consistent DB comparison)
 */
function getStartDate(timeRange: 'day' | 'week' | 'month' | 'year'): Date {
  const now = new Date();
  const start = new Date(now);

  switch (timeRange) {
    case 'day':
      start.setUTCHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setUTCDate(now.getUTCDate() - 7);
      start.setUTCHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setUTCMonth(now.getUTCMonth() - 1);
      start.setUTCHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setUTCFullYear(now.getUTCFullYear() - 1);
      start.setUTCHours(0, 0, 0, 0);
      break;
  }

  return start;
}

/**
 * Helper: Get date grouping interval for SQL
 */
function getDateInterval(timeRange: 'day' | 'week' | 'month' | 'year'): string {
  switch (timeRange) {
    case 'day':
      return 'hour';
    case 'week':
      return 'day';
    case 'month':
      return 'day';
    case 'year':
      return 'month';
  }
}

/**
 * GET /api/teacher-analytics/engagement
 * Get engagement analytics for teacher's school
 * Teacher only, scoped to school
 */
router.get('/engagement',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.schoolId) {
        return res.status(403).json({ error: 'School context required' });
      }

      const timeRange = (req.query.time_range as 'day' | 'week' | 'month' | 'year') || 'week';
      const scope = (req.query.scope as 'school' | 'classes' | 'students') || 'school';
      const className = req.query.class as string | undefined;

      const startDate = getStartDate(timeRange);
      const startDateIso = startDate.toISOString();
      const dateInterval = getDateInterval(timeRange);

      // Check if login_events table exists, if not return empty data
      let loginEventsExists = false;
      try {
        await database.query('SELECT 1 FROM login_events LIMIT 1');
        loginEventsExists = true;
      } catch (err) {
        // Table doesn't exist yet - return empty data structure
        console.log('⚠️ login_events table not found, returning empty analytics');
        return res.json({
          time_range: timeRange,
          scope,
          start_date: startDate.toISOString(),
          time_series: [],
          by_class: [],
          top_students: [],
          low_login_students: [],
          summary: {
            total_logins_users: 0,
            total_logins: 0,
            total_chores_users: 0,
            total_chores_sessions: 0,
            total_transfers_users: 0,
            total_transfers: 0,
            total_purchases_users: 0,
            total_purchases: 0
          }
        });
      }

      // Time series data (aggregated by time period)
      // Use a simpler approach that works with PostgreSQL
      let intervalExpr = '';
      switch (dateInterval) {
        case 'hour':
          intervalExpr = '1 hour';
          break;
        case 'day':
          intervalExpr = '1 day';
          break;
        case 'month':
          intervalExpr = '1 month';
          break;
        default:
          intervalExpr = '1 day';
      }

      // Build time series query conditionally
      let timeSeriesQuery = '';
      if (loginEventsExists) {
        timeSeriesQuery = `
          WITH date_buckets AS (
            SELECT generate_series(
              DATE_TRUNC($1, $2::timestamptz),
              DATE_TRUNC($1, CURRENT_TIMESTAMP),
              $4::interval
            ) AS bucket
          ),
          logins_by_time AS (
            SELECT 
              DATE_TRUNC($1, le.login_at) AS time_bucket,
              COUNT(DISTINCT le.user_id)::int as login_count
            FROM login_events le
            JOIN users u ON le.user_id = u.id
            WHERE le.school_id = $3 
              AND le.login_at >= $2::timestamptz
              AND u.role = 'student'
            GROUP BY DATE_TRUNC($1, le.login_at)
          ),
        `;
      } else {
        timeSeriesQuery = `
          WITH date_buckets AS (
            SELECT generate_series(
              DATE_TRUNC($1, $2::timestamptz),
              DATE_TRUNC($1, CURRENT_TIMESTAMP),
              $4::interval
            ) AS bucket
          ),
          logins_by_time AS (
            SELECT NULL::timestamp AS time_bucket, 0::int as login_count WHERE false
          ),
        `;
      }

      const timeSeries = await database.query(timeSeriesQuery + `
        chores_by_time AS (
          SELECT 
            DATE_TRUNC($1, mgs.played_at) AS time_bucket,
            COUNT(DISTINCT mgs.user_id)::int as chore_count,
            COUNT(*)::int as chore_sessions
          FROM math_game_sessions mgs
          JOIN users u ON mgs.user_id = u.id
          WHERE u.school_id = $3 
            AND mgs.played_at >= $2::timestamptz
            AND u.role = 'student'
          GROUP BY DATE_TRUNC($1, mgs.played_at)
        ),
        transfers_by_time AS (
          SELECT 
            DATE_TRUNC($1, t.created_at) AS time_bucket,
            COUNT(DISTINCT t.from_account_id)::int as transfer_count,
            COUNT(DISTINCT t.id)::int as transfer_transactions
          FROM transactions t
          JOIN accounts a ON t.from_account_id = a.id
          JOIN users u ON a.user_id = u.id
          WHERE u.school_id = $3 
            AND t.transaction_type = 'transfer'
            AND t.created_at >= $2::timestamptz
            AND u.role = 'student'
          GROUP BY DATE_TRUNC($1, t.created_at)
        ),
        purchases_by_time AS (
          SELECT 
            DATE_TRUNC($1, sp.purchase_date) AS time_bucket,
            COUNT(DISTINCT sp.user_id)::int as purchase_count,
            COUNT(*)::int as purchase_transactions
          FROM shop_purchases sp
          JOIN users u ON sp.user_id = u.id
          WHERE u.school_id = $3 
            AND sp.purchase_date >= $2::timestamptz
            AND u.role = 'student'
          GROUP BY DATE_TRUNC($1, sp.purchase_date)
        )
        SELECT 
          db.bucket AS time_bucket,
          COALESCE(l.login_count, 0)::int as logins,
          COALESCE(c.chore_count, 0)::int as chores_users,
          COALESCE(c.chore_sessions, 0)::int as chores_sessions,
          COALESCE(tr.transfer_count, 0)::int as transfers_users,
          COALESCE(tr.transfer_transactions, 0)::int as transfers_count,
          COALESCE(p.purchase_count, 0)::int as purchases_users,
          COALESCE(p.purchase_transactions, 0)::int as purchases_count
        FROM date_buckets db
        LEFT JOIN logins_by_time l ON db.bucket = l.time_bucket
        LEFT JOIN chores_by_time c ON db.bucket = c.time_bucket
        LEFT JOIN transfers_by_time tr ON db.bucket = tr.time_bucket
        LEFT JOIN purchases_by_time p ON db.bucket = p.time_bucket
        ORDER BY db.bucket ASC
      `, [dateInterval, startDateIso, req.schoolId, intervalExpr]);

      // Students with few or no logins in the period (approved students only; pending have no access yet)
      let lowLoginStudents: Array<{ id: number; username: string; first_name?: string; last_name?: string; class?: string; town_name?: string; logins: number; last_login: string | null }> = [];
      if (loginEventsExists) {
        const tsJoin = req.schoolId !== null
          ? 'LEFT JOIN town_settings ts ON ts.class = u.class AND ts.school_id = u.school_id'
          : 'LEFT JOIN town_settings ts ON ts.class = u.class AND ts.school_id IS NULL AND u.school_id IS NULL';
        const lowLoginRows = await database.query(`
          WITH student_logins AS (
            SELECT 
              u.id,
              u.username,
              u.first_name,
              u.last_name,
              u.class,
              COALESCE(ts.town_name, u.class) AS town_name,
              COUNT(le.id) FILTER (WHERE le.login_at >= $1::timestamptz)::int as logins_in_period,
              MAX(le.login_at) as last_login
            FROM users u
            ${tsJoin}
            LEFT JOIN login_events le ON le.user_id = u.id AND le.school_id = $2
            WHERE u.school_id = $2 
              AND u.role = 'student'
              AND u.class IN ('6A', '6B', '6C')
              AND (u.status IS NULL OR u.status = 'approved')
            GROUP BY u.id, u.username, u.first_name, u.last_name, u.class, ts.town_name
          )
          SELECT id, username, first_name, last_name, class, town_name, logins_in_period as logins, last_login
          FROM student_logins
          WHERE logins_in_period <= 1
          ORDER BY last_login ASC NULLS FIRST, logins_in_period ASC
        `, [startDateIso, req.schoolId]);
      lowLoginStudents = lowLoginRows.map((r: any) => ({
          id: r.id,
          username: r.username,
          first_name: r.first_name,
          last_name: r.last_name,
          class: r.class,
          town_name: r.town_name,
          logins: r.logins,
          last_login: r.last_login ? new Date(r.last_login).toISOString() : null
        }));
      }

      // By class breakdown: only this school's towns (from town_settings), with town_name for labels
      const classLoginJoin = loginEventsExists 
        ? 'LEFT JOIN login_events le ON le.user_id = u.id AND le.login_at >= $1::timestamptz AND le.school_id = $2'
        : '';
      const classLoginCount = loginEventsExists 
        ? 'COUNT(DISTINCT le.user_id)::int'
        : '0::int';
      const townsCondition = req.schoolId !== null
        ? 'WHERE ts.school_id = $2'
        : 'WHERE ts.school_id IS NULL';
      const byClass = await database.query(`
        WITH towns AS (
          SELECT ts.class, COALESCE(ts.town_name, ts.class) AS town_name
          FROM town_settings ts
          ${townsCondition}
          ORDER BY ts.class
        ),
        activity AS (
          SELECT 
            u.class,
            ${classLoginCount} as logins,
            COUNT(DISTINCT mgs.user_id)::int as chores_users,
            COUNT(mgs.id)::int as chores_sessions,
            COUNT(DISTINCT CASE WHEN t.transaction_type = 'transfer' THEN t.from_account_id END)::int as transfers_users,
            COUNT(DISTINCT CASE WHEN t.transaction_type = 'transfer' THEN t.id END)::int as transfers_count,
            COUNT(DISTINCT sp.user_id)::int as purchases_users,
            COUNT(sp.id)::int as purchases_count
          FROM users u
          ${classLoginJoin}
          LEFT JOIN math_game_sessions mgs ON mgs.user_id = u.id AND mgs.played_at >= $1::timestamptz
          LEFT JOIN accounts a ON a.user_id = u.id
          LEFT JOIN transactions t ON t.from_account_id = a.id 
            AND t.transaction_type = 'transfer' AND t.created_at >= $1::timestamptz
          LEFT JOIN shop_purchases sp ON sp.user_id = u.id AND sp.purchase_date >= $1::timestamptz
          WHERE u.school_id = $2 
            AND u.role = 'student'
            AND u.class IN ('6A', '6B', '6C')
          GROUP BY u.class
        )
        SELECT 
          t.class,
          t.town_name,
          COALESCE(a.logins, 0)::int as logins,
          COALESCE(a.chores_users, 0)::int as chores_users,
          COALESCE(a.chores_sessions, 0)::int as chores_sessions,
          COALESCE(a.transfers_users, 0)::int as transfers_users,
          COALESCE(a.transfers_count, 0)::int as transfers_count,
          COALESCE(a.purchases_users, 0)::int as purchases_users,
          COALESCE(a.purchases_count, 0)::int as purchases_count
        FROM towns t
        LEFT JOIN activity a ON t.class = a.class
        ORDER BY t.class
      `, [startDateIso, req.schoolId]);

      // Top students (if scope is students) - use subquery so ORDER BY can reference column aliases
      let topStudents: any[] = [];
      if (scope === 'students') {
        try {
          const studentLoginJoin = loginEventsExists 
            ? 'LEFT JOIN login_events le ON le.user_id = u.id AND le.login_at >= $1::timestamptz AND le.school_id = $2'
            : '';
          const studentLoginCount = loginEventsExists ? 'COUNT(DISTINCT le.id)::int' : '0::int';
          const studentQuery = className
            ? `
              SELECT * FROM (
                SELECT 
                  u.id,
                  u.username,
                  u.first_name,
                  u.last_name,
                  u.class,
                  ${studentLoginCount} as logins,
                  COUNT(DISTINCT mgs.id)::int as chores_sessions,
                  COUNT(DISTINCT CASE WHEN t.transaction_type = 'transfer' THEN t.id END)::int as transfers_count,
                  COUNT(DISTINCT sp.id)::int as purchases_count
                FROM users u
                ${studentLoginJoin}
                LEFT JOIN math_game_sessions mgs ON mgs.user_id = u.id AND mgs.played_at >= $1::timestamptz
                LEFT JOIN accounts a ON a.user_id = u.id
                LEFT JOIN transactions t ON t.from_account_id = a.id 
                  AND t.transaction_type = 'transfer' AND t.created_at >= $1::timestamptz
                LEFT JOIN shop_purchases sp ON sp.user_id = u.id AND sp.purchase_date >= $1::timestamptz
                WHERE u.school_id = $2 
                  AND u.role = 'student'
                  AND u.class = $3
                GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
              ) sub
              ORDER BY (sub.logins + sub.chores_sessions + sub.transfers_count + sub.purchases_count) DESC
              LIMIT 50
            `
            : `
              SELECT * FROM (
                SELECT 
                  u.id,
                  u.username,
                  u.first_name,
                  u.last_name,
                  u.class,
                  ${studentLoginCount} as logins,
                  COUNT(DISTINCT mgs.id)::int as chores_sessions,
                  COUNT(DISTINCT CASE WHEN t.transaction_type = 'transfer' THEN t.id END)::int as transfers_count,
                  COUNT(DISTINCT sp.id)::int as purchases_count
                FROM users u
                ${studentLoginJoin}
                LEFT JOIN math_game_sessions mgs ON mgs.user_id = u.id AND mgs.played_at >= $1::timestamptz
                LEFT JOIN accounts a ON a.user_id = u.id
                LEFT JOIN transactions t ON t.from_account_id = a.id 
                  AND t.transaction_type = 'transfer' AND t.created_at >= $1::timestamptz
                LEFT JOIN shop_purchases sp ON sp.user_id = u.id AND sp.purchase_date >= $1::timestamptz
                WHERE u.school_id = $2 
                  AND u.role = 'student'
                GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
              ) sub
              ORDER BY (sub.logins + sub.chores_sessions + sub.transfers_count + sub.purchases_count) DESC
              LIMIT 50
            `;
          
          topStudents = await database.query(
            studentQuery,
            className ? [startDateIso, req.schoolId, className] : [startDateIso, req.schoolId]
          );
        } catch (err) {
          console.error('Error fetching top students:', err);
          topStudents = [];
        }
      }

      // Summary totals - use subqueries to avoid Cartesian product from JOINs
      let summaryLoginSubquery = '';
      if (loginEventsExists) {
        summaryLoginSubquery = `
          SELECT 
            COUNT(DISTINCT le.user_id)::int as total_logins_users,
            COUNT(le.id)::int as total_logins
          FROM login_events le
          JOIN users u ON le.user_id = u.id
          WHERE le.school_id = $2 
            AND le.login_at >= $1::timestamptz
            AND u.role = 'student'
        `;
      } else {
        summaryLoginSubquery = `SELECT 0::int as total_logins_users, 0::int as total_logins`;
      }
      
      const summary = await database.get(`
        SELECT 
          COALESCE(login_stats.total_logins_users, 0)::int as total_logins_users,
          COALESCE(login_stats.total_logins, 0)::int as total_logins,
          COALESCE(chore_stats.total_chores_users, 0)::int as total_chores_users,
          COALESCE(chore_stats.total_chores_sessions, 0)::int as total_chores_sessions,
          COALESCE(transfer_stats.total_transfers_users, 0)::int as total_transfers_users,
          COALESCE(transfer_stats.total_transfers, 0)::int as total_transfers,
          COALESCE(purchase_stats.total_purchases_users, 0)::int as total_purchases_users,
          COALESCE(purchase_stats.total_purchases, 0)::int as total_purchases
        FROM (${summaryLoginSubquery}) login_stats
        CROSS JOIN (
          SELECT 
            COUNT(DISTINCT mgs.user_id)::int as total_chores_users,
            COUNT(mgs.id)::int as total_chores_sessions
          FROM math_game_sessions mgs
          JOIN users u ON mgs.user_id = u.id
          WHERE u.school_id = $2 
            AND mgs.played_at >= $1::timestamptz
            AND u.role = 'student'
        ) chore_stats
        CROSS JOIN (
          SELECT 
            COUNT(DISTINCT t.from_account_id)::int as total_transfers_users,
            COUNT(DISTINCT t.id)::int as total_transfers
          FROM transactions t
          JOIN accounts a ON t.from_account_id = a.id
          JOIN users u ON a.user_id = u.id
          WHERE u.school_id = $2 
            AND t.transaction_type = 'transfer'
            AND t.created_at >= $1::timestamptz
            AND u.role = 'student'
        ) transfer_stats
        CROSS JOIN (
          SELECT 
            COUNT(DISTINCT sp.user_id)::int as total_purchases_users,
            COUNT(sp.id)::int as total_purchases
          FROM shop_purchases sp
          JOIN users u ON sp.user_id = u.id
          WHERE u.school_id = $2 
            AND sp.purchase_date >= $1::timestamptz
            AND u.role = 'student'
        ) purchase_stats
      `, [startDateIso, req.schoolId]);

      res.json({
        time_range: timeRange,
        scope,
        start_date: startDate.toISOString(),
        time_series: timeSeries,
        by_class: byClass,
        top_students: topStudents,
        low_login_students: lowLoginStudents,
        summary: summary || {
          total_logins_users: 0,
          total_logins: 0,
          total_chores_users: 0,
          total_chores_sessions: 0,
          total_transfers_users: 0,
          total_transfers: 0,
          total_purchases_users: 0,
          total_purchases: 0
        }
      });
    } catch (error) {
      console.error('Failed to fetch engagement analytics:', error);
      res.status(500).json({ error: 'Failed to fetch engagement analytics' });
    }
  }
);

/**
 * GET /api/teacher-analytics/student-logins
 * All students in teacher's school with total logins in the selected period.
 * Own time filter: week | month | year. School-scoped.
 */
router.get('/student-logins',
  authenticateToken,
  requireTenant,
  requireRole(['teacher']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.schoolId) {
        return res.status(403).json({ error: 'School context required' });
      }

      const timeRange = (req.query.time_range as 'week' | 'month' | 'year') || 'week';
      const startDate = getStartDate(timeRange);
      const startDateIso = startDate.toISOString();

      let loginEventsExists = false;
      try {
        await database.query('SELECT 1 FROM login_events LIMIT 1');
        loginEventsExists = true;
      } catch {
        return res.json({ time_range: timeRange, start_date: startDate.toISOString(), students: [] });
      }

      const tsJoin = req.schoolId !== null
        ? 'LEFT JOIN town_settings ts ON ts.class = u.class AND ts.school_id = u.school_id'
        : 'LEFT JOIN town_settings ts ON ts.class = u.class AND ts.school_id IS NULL AND u.school_id IS NULL';

      const rows = await database.query(`
        SELECT 
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          u.class,
          COALESCE(ts.town_name, u.class) AS town_name,
          COUNT(le.id) FILTER (WHERE le.login_at >= $1::timestamptz)::int as logins,
          MAX(le.login_at) as last_login
        FROM users u
        ${tsJoin}
        LEFT JOIN login_events le ON le.user_id = u.id AND le.school_id = $2
        WHERE u.school_id = $2 
          AND u.role = 'student'
          AND u.class IN ('6A', '6B', '6C')
          AND (u.status IS NULL OR u.status = 'approved')
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.class, ts.town_name
        ORDER BY logins DESC, last_login DESC NULLS LAST
      `, [startDateIso, req.schoolId]);

      const students = rows.map((r: any) => ({
        id: r.id,
        username: r.username,
        first_name: r.first_name,
        last_name: r.last_name,
        class: r.class,
        town_name: r.town_name,
        logins: r.logins,
        last_login: r.last_login ? new Date(r.last_login).toISOString() : null
      }));

      res.json({ time_range: timeRange, start_date: startDate.toISOString(), students });
    } catch (error) {
      console.error('Failed to fetch student logins:', error);
      res.status(500).json({ error: 'Failed to fetch student logins' });
    }
  }
);

export default router;
