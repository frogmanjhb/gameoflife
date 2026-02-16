import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

interface LeaderboardEntry {
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  total_points: number;
  games_played: number;
  high_score_easy: number;
  high_score_medium: number;
  high_score_hard: number;
  high_score_extreme: number;
  rank: number;
}

// Get overall leaderboard (top 5 across all classes, school-scoped)
router.get('/overall', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if math game tables exist
    try {
      await database.query('SELECT 1 FROM math_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.json({ leaderboard: [] });
    }

    const schoolId = req.user?.school_id ?? null;
    const schoolFilter = schoolId !== null ? 'AND u.school_id = $1' : '';
    const params = schoolId !== null ? [schoolId] : [];

    const leaderboard = await database.query(`
      WITH session_totals AS (
        SELECT user_id, COUNT(*) as games_played, COALESCE(SUM(score), 0) as total_points
        FROM math_game_sessions
        GROUP BY user_id
      ),
      player_stats AS (
        SELECT 
          u.id as user_id,
          u.username,
          u.first_name,
          u.last_name,
          u.class,
          COALESCE(st.total_points, 0) as total_points,
          COALESCE(st.games_played, 0)::int as games_played,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'easy' THEN mgh.high_score ELSE 0 END), 0) as high_score_easy,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'medium' THEN mgh.high_score ELSE 0 END), 0) as high_score_medium,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'hard' THEN mgh.high_score ELSE 0 END), 0) as high_score_hard,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'extreme' THEN mgh.high_score ELSE 0 END), 0) as high_score_extreme
        FROM users u
        LEFT JOIN session_totals st ON u.id = st.user_id
        LEFT JOIN math_game_high_scores mgh ON u.id = mgh.user_id
        WHERE u.role = 'student' ${schoolFilter}
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.class, st.total_points, st.games_played
        HAVING COALESCE(st.games_played, 0) > 0
      )
      SELECT 
        *,
        ROW_NUMBER() OVER (ORDER BY total_points DESC, games_played ASC) as rank
      FROM player_stats
      ORDER BY total_points DESC, games_played ASC
      LIMIT 5
    `, params);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get overall leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get class-specific leaderboard (top 5 per class, school-scoped)
router.get('/class/:className', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const className = req.params.className;
    const schoolId = req.user?.school_id ?? null;

    // Validate class name
    if (!['6A', '6B', '6C'].includes(className)) {
      return res.status(400).json({ error: 'Invalid class name' });
    }

    // Check if math game tables exist
    try {
      await database.query('SELECT 1 FROM math_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.json({ leaderboard: [] });
    }

    const schoolFilter = schoolId !== null ? 'AND u.school_id = $2' : '';
    const params = schoolId !== null ? [className, schoolId] : [className];

    const leaderboard = await database.query(`
      WITH session_totals AS (
        SELECT user_id, COUNT(*) as games_played, COALESCE(SUM(score), 0) as total_points
        FROM math_game_sessions
        GROUP BY user_id
      ),
      player_stats AS (
        SELECT 
          u.id as user_id,
          u.username,
          u.first_name,
          u.last_name,
          u.class,
          COALESCE(st.total_points, 0) as total_points,
          COALESCE(st.games_played, 0)::int as games_played,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'easy' THEN mgh.high_score ELSE 0 END), 0) as high_score_easy,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'medium' THEN mgh.high_score ELSE 0 END), 0) as high_score_medium,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'hard' THEN mgh.high_score ELSE 0 END), 0) as high_score_hard,
          COALESCE(MAX(CASE WHEN mgh.difficulty = 'extreme' THEN mgh.high_score ELSE 0 END), 0) as high_score_extreme
        FROM users u
        LEFT JOIN session_totals st ON u.id = st.user_id
        LEFT JOIN math_game_high_scores mgh ON u.id = mgh.user_id
        WHERE u.role = 'student' AND u.class = $1 ${schoolFilter}
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.class, st.total_points, st.games_played
        HAVING COALESCE(st.games_played, 0) > 0
      )
      SELECT 
        *,
        ROW_NUMBER() OVER (ORDER BY total_points DESC, games_played ASC) as rank
      FROM player_stats
      ORDER BY total_points DESC, games_played ASC
      LIMIT 5
    `, params);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get class leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all classes leaderboards at once (school-scoped)
router.get('/all-classes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if math game tables exist
    try {
      await database.query('SELECT 1 FROM math_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.json({ 
        '6A': [],
        '6B': [],
        '6C': []
      });
    }

    const schoolId = req.user?.school_id ?? null;
    const schoolFilter = schoolId !== null ? 'AND u.school_id = $2' : '';
    const classes = ['6A', '6B', '6C'];
    const allLeaderboards: Record<string, LeaderboardEntry[]> = {};

    for (const className of classes) {
      const params = schoolId !== null ? [className, schoolId] : [className];
      const leaderboard = await database.query(`
        WITH session_totals AS (
          SELECT user_id, COUNT(*) as games_played, COALESCE(SUM(score), 0) as total_points
          FROM math_game_sessions
          GROUP BY user_id
        ),
        player_stats AS (
          SELECT 
            u.id as user_id,
            u.username,
            u.first_name,
            u.last_name,
            u.class,
            COALESCE(st.total_points, 0) as total_points,
            COALESCE(st.games_played, 0)::int as games_played,
            COALESCE(MAX(CASE WHEN mgh.difficulty = 'easy' THEN mgh.high_score ELSE 0 END), 0) as high_score_easy,
            COALESCE(MAX(CASE WHEN mgh.difficulty = 'medium' THEN mgh.high_score ELSE 0 END), 0) as high_score_medium,
            COALESCE(MAX(CASE WHEN mgh.difficulty = 'hard' THEN mgh.high_score ELSE 0 END), 0) as high_score_hard,
            COALESCE(MAX(CASE WHEN mgh.difficulty = 'extreme' THEN mgh.high_score ELSE 0 END), 0) as high_score_extreme
          FROM users u
          LEFT JOIN session_totals st ON u.id = st.user_id
          LEFT JOIN math_game_high_scores mgh ON u.id = mgh.user_id
          WHERE u.role = 'student' AND u.class = $1 ${schoolFilter}
          GROUP BY u.id, u.username, u.first_name, u.last_name, u.class, st.total_points, st.games_played
          HAVING COALESCE(st.games_played, 0) > 0
        )
        SELECT 
          *,
          ROW_NUMBER() OVER (ORDER BY total_points DESC, games_played ASC) as rank
        FROM player_stats
        ORDER BY total_points DESC, games_played ASC
        LIMIT 5
      `, params);

      allLeaderboards[className] = leaderboard;
    }

    res.json(allLeaderboards);
  } catch (error) {
    console.error('Get all classes leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
