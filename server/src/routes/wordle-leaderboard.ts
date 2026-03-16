import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

export interface WordleLeaderboardEntry {
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  total_earnings: number;
  games_played: number;
  wins: number;
  best_guesses: number | null;
  rank: number;
}

// Get overall Wordle leaderboard (top 5 across all classes, school-scoped)
router.get('/overall', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    try {
      await database.query('SELECT 1 FROM wordle_sessions LIMIT 1');
    } catch (tableError) {
      return res.json({ leaderboard: [] });
    }

    const schoolId = req.user?.school_id ?? null;
    const includeHidden = req.query.include_hidden === 'true';
    const schoolFilter = schoolId !== null ? 'AND u.school_id = $1' : '';
    const params = schoolId !== null ? [schoolId] : [];
    const hiddenFilter = includeHidden ? '' : 'AND COALESCE(u.hide_from_leaderboards, FALSE) = FALSE';

    const leaderboard = await database.query(`
      WITH completed AS (
        SELECT user_id,
          COUNT(*)::int AS games_played,
          COALESCE(SUM(earnings), 0)::numeric AS total_earnings,
          COUNT(*) FILTER (WHERE status = 'won')::int AS wins,
          MIN(guesses_count) FILTER (WHERE status = 'won') AS best_guesses
        FROM wordle_sessions
        WHERE status IN ('won', 'lost')
        GROUP BY user_id
      )
      SELECT
        u.id AS user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.class,
        COALESCE(c.total_earnings, 0)::float AS total_earnings,
        COALESCE(c.games_played, 0) AS games_played,
        COALESCE(c.wins, 0) AS wins,
        c.best_guesses,
        ROW_NUMBER() OVER (ORDER BY COALESCE(c.total_earnings, 0) DESC, COALESCE(c.wins, 0) DESC) AS rank
      FROM users u
      INNER JOIN completed c ON u.id = c.user_id
      WHERE u.role = 'student' ${schoolFilter} ${hiddenFilter}
      ORDER BY total_earnings DESC, wins DESC
      LIMIT 5
    `, params);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get Wordle overall leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all classes Wordle leaderboards at once (school-scoped)
router.get('/all-classes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    try {
      await database.query('SELECT 1 FROM wordle_sessions LIMIT 1');
    } catch (tableError) {
      return res.json({ '6A': [], '6B': [], '6C': [] });
    }

    const schoolId = req.user?.school_id ?? null;
    const includeHidden = req.query.include_hidden === 'true';
    const schoolFilter = schoolId !== null ? 'AND u.school_id = $2' : '';
    const classes = ['6A', '6B', '6C'];
    const allLeaderboards: Record<string, WordleLeaderboardEntry[]> = {};

    for (const className of classes) {
      const params = schoolId !== null ? [className, schoolId] : [className];
      const hiddenFilter = includeHidden ? '' : 'AND COALESCE(u.hide_from_leaderboards, FALSE) = FALSE';
      const leaderboard = await database.query(`
        WITH completed AS (
          SELECT user_id,
            COUNT(*)::int AS games_played,
            COALESCE(SUM(earnings), 0)::numeric AS total_earnings,
            COUNT(*) FILTER (WHERE status = 'won')::int AS wins,
            MIN(guesses_count) FILTER (WHERE status = 'won') AS best_guesses
          FROM wordle_sessions
          WHERE status IN ('won', 'lost')
          GROUP BY user_id
        )
        SELECT
          u.id AS user_id,
          u.username,
          u.first_name,
          u.last_name,
          u.class,
          COALESCE(c.total_earnings, 0)::float AS total_earnings,
          COALESCE(c.games_played, 0) AS games_played,
          COALESCE(c.wins, 0) AS wins,
          c.best_guesses,
          ROW_NUMBER() OVER (ORDER BY COALESCE(c.total_earnings, 0) DESC, COALESCE(c.wins, 0) DESC) AS rank
        FROM users u
        INNER JOIN completed c ON u.id = c.user_id
        WHERE u.role = 'student' AND u.class = $1 ${schoolFilter} ${hiddenFilter}
        ORDER BY total_earnings DESC, wins DESC
        LIMIT 5
      `, params);

      allLeaderboards[className] = leaderboard;
    }

    res.json(allLeaderboards);
  } catch (error) {
    console.error('Get Wordle all-classes leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
