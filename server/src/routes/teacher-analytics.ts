import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

/**
 * Helper: Calculate start date based on time range
 */
function getStartDate(timeRange: 'day' | 'week' | 'month' | 'year'): Date {
  const now = new Date();
  const start = new Date(now);
  
  switch (timeRange) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
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
      const dateInterval = getDateInterval(timeRange);

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

      // Check if login_events table exists, if not return empty data
      let loginEventsExists = true;
      try {
        await database.query('SELECT 1 FROM login_events LIMIT 1');
      } catch {
        loginEventsExists = false;
      }

      // Build time series query conditionally
      let timeSeriesQuery = '';
      if (loginEventsExists) {
        timeSeriesQuery = `
          WITH date_buckets AS (
            SELECT generate_series(
              DATE_TRUNC($1, $2::timestamp),
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
              AND le.login_at >= $2
              AND u.role = 'student'
            GROUP BY DATE_TRUNC($1, le.login_at)
          ),
        `;
      } else {
        timeSeriesQuery = `
          WITH date_buckets AS (
            SELECT generate_series(
              DATE_TRUNC($1, $2::timestamp),
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
            AND mgs.played_at >= $2
            AND u.role = 'student'
          GROUP BY DATE_TRUNC($1, mgs.played_at)
        ),
        transfers_by_time AS (
          SELECT 
            DATE_TRUNC($1, t.created_at) AS time_bucket,
            COUNT(DISTINCT t.from_account_id)::int as transfer_count,
            COUNT(*)::int as transfer_transactions
          FROM transactions t
          JOIN accounts a ON t.from_account_id = a.id
          JOIN users u ON a.user_id = u.id
          WHERE u.school_id = $3 
            AND t.transaction_type = 'transfer'
            AND t.created_at >= $2
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
            AND sp.purchase_date >= $2
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
      `, [dateInterval, startDate, req.schoolId, intervalExpr]);

      // By class breakdown
      const classLoginJoin = loginEventsExists 
        ? 'LEFT JOIN login_events le ON le.user_id = u.id AND le.login_at >= $1 AND le.school_id = $2'
        : '';
      const classLoginCount = loginEventsExists 
        ? 'COUNT(DISTINCT le.user_id)::int'
        : '0::int';
      
      const byClass = await database.query(`
        SELECT 
          u.class,
          ${classLoginCount} as logins,
          COUNT(DISTINCT mgs.user_id)::int as chores_users,
          COUNT(mgs.id)::int as chores_sessions,
          COUNT(DISTINCT CASE WHEN t.transaction_type = 'transfer' THEN t.from_account_id END)::int as transfers_users,
          COUNT(CASE WHEN t.transaction_type = 'transfer' THEN t.id END)::int as transfers_count,
          COUNT(DISTINCT sp.user_id)::int as purchases_users,
          COUNT(sp.id)::int as purchases_count
        FROM users u
        ${classLoginJoin}
        LEFT JOIN math_game_sessions mgs ON mgs.user_id = u.id AND mgs.played_at >= $1
        LEFT JOIN accounts a ON a.user_id = u.id
        LEFT JOIN transactions t ON (t.from_account_id = a.id OR t.to_account_id = a.id) 
          AND t.transaction_type = 'transfer' AND t.created_at >= $1
        LEFT JOIN shop_purchases sp ON sp.user_id = u.id AND sp.purchase_date >= $1
        WHERE u.school_id = $2 
          AND u.role = 'student'
          AND u.class IN ('6A', '6B', '6C')
        GROUP BY u.class
        ORDER BY u.class
      `, [startDate, req.schoolId]);

      // Top students (if scope is students)
      let topStudents: any[] = [];
      if (scope === 'students') {
        try {
          const studentLoginJoin = loginEventsExists 
            ? 'LEFT JOIN login_events le ON le.user_id = u.id AND le.login_at >= $1 AND le.school_id = $2'
            : '';
          const studentLoginCount = loginEventsExists ? 'COUNT(DISTINCT le.id)::int' : '0::int';
          const studentOrderBy = loginEventsExists 
            ? '(logins + chores_sessions + transfers_count + purchases_count)'
            : '(chores_sessions + transfers_count + purchases_count)';
          
          const studentQuery = className
            ? `
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
              LEFT JOIN math_game_sessions mgs ON mgs.user_id = u.id AND mgs.played_at >= $1
              LEFT JOIN accounts a ON a.user_id = u.id
              LEFT JOIN transactions t ON (t.from_account_id = a.id OR t.to_account_id = a.id) 
                AND t.transaction_type = 'transfer' AND t.created_at >= $1
              LEFT JOIN shop_purchases sp ON sp.user_id = u.id AND sp.purchase_date >= $1
              WHERE u.school_id = $2 
                AND u.role = 'student'
                AND u.class = $3
              GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
              ORDER BY ${studentOrderBy} DESC
              LIMIT 50
            `
            : `
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
              LEFT JOIN math_game_sessions mgs ON mgs.user_id = u.id AND mgs.played_at >= $1
              LEFT JOIN accounts a ON a.user_id = u.id
              LEFT JOIN transactions t ON (t.from_account_id = a.id OR t.to_account_id = a.id) 
                AND t.transaction_type = 'transfer' AND t.created_at >= $1
              LEFT JOIN shop_purchases sp ON sp.user_id = u.id AND sp.purchase_date >= $1
              WHERE u.school_id = $2 
                AND u.role = 'student'
              GROUP BY u.id, u.username, u.first_name, u.last_name, u.class
              ORDER BY ${studentOrderBy} DESC
              LIMIT 50
            `;
          
          topStudents = await database.query(
            studentQuery,
            className ? [startDate, req.schoolId, className] : [startDate, req.schoolId]
          );
        } catch (err) {
          console.error('Error fetching top students:', err);
          topStudents = [];
        }
      }

      // Summary totals
      const summaryLoginJoin = loginEventsExists 
        ? 'LEFT JOIN login_events le ON le.user_id = u.id AND le.login_at >= $1 AND le.school_id = $2'
        : '';
      const summaryLoginUsers = loginEventsExists ? 'COUNT(DISTINCT le.user_id)::int' : '0::int';
      const summaryLoginCount = loginEventsExists ? 'COUNT(le.id)::int' : '0::int';
      
      const summary = await database.get(`
        SELECT 
          ${summaryLoginUsers} as total_logins_users,
          ${summaryLoginCount} as total_logins,
          COUNT(DISTINCT mgs.user_id)::int as total_chores_users,
          COUNT(mgs.id)::int as total_chores_sessions,
          COUNT(DISTINCT CASE WHEN t.transaction_type = 'transfer' THEN t.from_account_id END)::int as total_transfers_users,
          COUNT(CASE WHEN t.transaction_type = 'transfer' THEN t.id END)::int as total_transfers,
          COUNT(DISTINCT sp.user_id)::int as total_purchases_users,
          COUNT(sp.id)::int as total_purchases
        FROM users u
        ${summaryLoginJoin}
        LEFT JOIN math_game_sessions mgs ON mgs.user_id = u.id AND mgs.played_at >= $1
        LEFT JOIN accounts a ON a.user_id = u.id
        LEFT JOIN transactions t ON (t.from_account_id = a.id OR t.to_account_id = a.id) 
          AND t.transaction_type = 'transfer' AND t.created_at >= $1
        LEFT JOIN shop_purchases sp ON sp.user_id = u.id AND sp.purchase_date >= $1
        WHERE u.school_id = $2 AND u.role = 'student'
      `, [startDate, req.schoolId]);

      res.json({
        time_range: timeRange,
        scope,
        start_date: startDate.toISOString(),
        time_series: timeSeries,
        by_class: byClass,
        top_students: topStudents,
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

export default router;
