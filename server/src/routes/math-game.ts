import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { MathGameStartRequest, MathGameSubmitRequest, MathGameStatus, MathGameSession } from '../types';

const router = Router();

// Get math game status (remaining plays, high scores, recent sessions)
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access math game' });
    }

    const userId = req.user.id;

    // Check if math game tables exist, if not return default status
    try {
      await database.query('SELECT 1 FROM math_game_sessions LIMIT 1');
    } catch (tableError) {
      console.log('Math game tables not found, returning default status');
      return res.json({
        remaining_plays: 3,
        high_scores: { easy: 0, medium: 0, hard: 0 },
        recent_sessions: []
      });
    }

    // Check remaining plays today (resets at 6 AM)
    const todayPlays = await database.query(`
      SELECT COUNT(*) as count FROM math_game_sessions 
      WHERE user_id = $1 
      AND played_at >= (
        CASE 
          WHEN CURRENT_TIME < '06:00:00' 
          THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '6 hours'
          ELSE CURRENT_DATE + INTERVAL '6 hours'
        END
      )
    `, [userId]);

    const remainingPlays = Math.max(0, 3 - parseInt(todayPlays[0].count));

    // Get high scores for each difficulty
    const highScores = await database.query(`
      SELECT difficulty, high_score 
      FROM math_game_high_scores 
      WHERE user_id = $1
    `, [userId]);

    const highScoreMap = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    highScores.forEach((row: any) => {
      const difficulty = row.difficulty as keyof typeof highScoreMap;
      if (difficulty in highScoreMap) {
        highScoreMap[difficulty] = row.high_score;
      }
    });

    // Get recent sessions (last 5)
    const recentSessions = await database.query(`
      SELECT * FROM math_game_sessions 
      WHERE user_id = $1 
      ORDER BY played_at DESC 
      LIMIT 5
    `, [userId]);

    const status: MathGameStatus = {
      remaining_plays: remainingPlays,
      high_scores: highScoreMap,
      recent_sessions: recentSessions
    };

    res.json(status);
  } catch (error) {
    console.error('Get math game status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start a new math game session
router.post('/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can start math games' });
    }

    const { difficulty }: MathGameStartRequest = req.body;
    
    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    const userId = req.user.id;

    // Check if math game tables exist
    try {
      await database.query('SELECT 1 FROM math_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.status(503).json({ error: 'Math game feature not available yet. Please try again later.' });
    }

    // Check remaining plays today
    const todayPlays = await database.query(`
      SELECT COUNT(*) as count FROM math_game_sessions 
      WHERE user_id = $1 
      AND played_at >= (
        CASE 
          WHEN CURRENT_TIME < '06:00:00' 
          THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '6 hours'
          ELSE CURRENT_DATE + INTERVAL '6 hours'
        END
      )
    `, [userId]);

    const remainingPlays = 3 - parseInt(todayPlays[0].count);
    
    if (remainingPlays <= 0) {
      return res.status(400).json({ error: 'No plays remaining today. Try again tomorrow!' });
    }

    // Create new session
    const session = await database.query(`
      INSERT INTO math_game_sessions (user_id, difficulty, score, correct_answers, total_problems, earnings)
      VALUES ($1, $2, 0, 0, 0, 0.00)
      RETURNING *
    `, [userId, difficulty]);

    res.json({ session: session[0] });
  } catch (error) {
    console.error('Start math game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit math game results
router.post('/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit math games' });
    }

    const { session_id, score, correct_answers, total_problems, answer_sequence }: MathGameSubmitRequest = req.body;

    if (!session_id || score < 0 || correct_answers < 0 || total_problems < 0) {
      return res.status(400).json({ error: 'Invalid game data' });
    }

    // SECURITY: Validate game data integrity
    const MAX_PROBLEMS_PER_GAME = 30; // Maximum allowed problems per game session
    const MAX_CORRECT_ANSWERS = MAX_PROBLEMS_PER_GAME;
    const MAX_EARNINGS_PER_GAME = 150; // Maximum R150 per game (30 correct * 1.5 hard * 2.5 streak bonus, rounded up)
    
    // Validate total_problems is reasonable
    if (total_problems > MAX_PROBLEMS_PER_GAME) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to submit game with ${total_problems} problems (max: ${MAX_PROBLEMS_PER_GAME})`);
      return res.status(400).json({ error: 'Invalid game data: too many problems' });
    }
    
    // Validate correct_answers doesn't exceed total_problems
    if (correct_answers > total_problems) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to submit ${correct_answers} correct answers for ${total_problems} problems`);
      return res.status(400).json({ error: 'Invalid game data: correct answers cannot exceed total problems' });
    }
    
    // Validate correct_answers doesn't exceed maximum
    if (correct_answers > MAX_CORRECT_ANSWERS) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to submit ${correct_answers} correct answers (max: ${MAX_CORRECT_ANSWERS})`);
      return res.status(400).json({ error: 'Invalid game data: too many correct answers' });
    }
    
    // Validate answer_sequence length matches total_problems
    if (!Array.isArray(answer_sequence) || answer_sequence.length !== total_problems) {
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted answer_sequence length ${answer_sequence?.length} for ${total_problems} problems`);
      return res.status(400).json({ error: 'Invalid game data: answer sequence mismatch' });
    }
    
    // Validate answer_sequence content (must be array of booleans)
    if (!answer_sequence.every(a => typeof a === 'boolean')) {
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted invalid answer_sequence content`);
      return res.status(400).json({ error: 'Invalid game data: answer sequence must contain only boolean values' });
    }
    
    // Validate that correct_answers matches the number of trues in answer_sequence
    const actualCorrectCount = answer_sequence.filter(a => a === true).length;
    if (actualCorrectCount !== correct_answers) {
      console.warn(`🚨 SECURITY: User ${req.user.username} claimed ${correct_answers} correct but sequence shows ${actualCorrectCount}`);
      return res.status(400).json({ error: 'Invalid game data: correct answer count mismatch' });
    }

    const userId = req.user.id;

    // Check if math game tables exist
    try {
      await database.query('SELECT 1 FROM math_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.status(503).json({ error: 'Math game feature not available yet. Please try again later.' });
    }

    // Verify session belongs to user and hasn't been submitted already
    const session = await database.get(`
      SELECT * FROM math_game_sessions 
      WHERE id = $1 AND user_id = $2
    `, [session_id, userId]);

    if (!session) {
      return res.status(404).json({ error: 'Game session not found' });
    }
    
    // SECURITY: Check if session has already been submitted (earnings > 0 means already submitted)
    if (parseFloat(session.earnings) > 0) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to resubmit session ${session_id} (already has earnings: ${session.earnings})`);
      return res.status(400).json({ error: 'Game session has already been submitted' });
    }

    // Calculate streak bonus
    const calculateStreakBonus = (sequence: boolean[]): number => {
      let maxStreak = 0;
      let currentStreak = 0;
      
      for (const isCorrect of sequence) {
        if (isCorrect) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      
      // Streak bonus: 5+ streak = 1.5x, 10+ streak = 2x, 15+ streak = 2.5x
      if (maxStreak >= 15) return 2.5;
      if (maxStreak >= 10) return 2.0;
      if (maxStreak >= 5) return 1.5;
      return 1.0;
    };

    // Calculate earnings with server-side validation
    const difficultyMultipliers: Record<string, number> = { easy: 1.0, medium: 1.2, hard: 1.5 };
    const basePoints = correct_answers * 1; // 1 point per correct answer
    const difficultyMultiplier = difficultyMultipliers[session.difficulty] || 1.0;
    const streakBonus = calculateStreakBonus(answer_sequence);
    let totalEarnings = basePoints * difficultyMultiplier * streakBonus;
    
    // SECURITY: Cap earnings at maximum per game
    if (totalEarnings > MAX_EARNINGS_PER_GAME) {
      console.warn(`🚨 SECURITY: User ${req.user.username} earnings ${totalEarnings} capped at ${MAX_EARNINGS_PER_GAME}`);
      totalEarnings = MAX_EARNINGS_PER_GAME;
    }

    // Update session with results
    await database.query(`
      UPDATE math_game_sessions 
      SET score = $1, correct_answers = $2, total_problems = $3, earnings = $4
      WHERE id = $5
    `, [score, correct_answers, total_problems, totalEarnings, session_id]);

    // Update high score if this is a new record
    const currentHighScore = await database.get(`
      SELECT high_score FROM math_game_high_scores 
      WHERE user_id = $1 AND difficulty = $2
    `, [userId, session.difficulty]);

    if (!currentHighScore || score > currentHighScore.high_score) {
      await database.query(`
        INSERT INTO math_game_high_scores (user_id, difficulty, high_score)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, difficulty) 
        DO UPDATE SET high_score = $3, achieved_at = CURRENT_TIMESTAMP
      `, [userId, session.difficulty, score]);
    }

    // Add earnings to account balance
    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (account) {
      // Update account balance
      await database.query(`
        UPDATE accounts 
        SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [totalEarnings, account.id]);

      // Create transaction record
      await database.query(`
        INSERT INTO transactions (to_account_id, amount, transaction_type, description)
        VALUES ($1, $2, 'deposit', $3)
      `, [account.id, totalEarnings, `Math Game Earnings - ${session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}`]);
    }

    res.json({ 
      success: true, 
      earnings: totalEarnings,
      isNewHighScore: !currentHighScore || score > currentHighScore.high_score
    });
  } catch (error) {
    console.error('Submit math game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
