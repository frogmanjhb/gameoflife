import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { MathGameStartRequest, MathGameSubmitRequest, MathGameStatus, MathGameSession } from '../types';

const router = Router();

// Helper function to get math game daily limit from settings
async function getMathGameDailyLimit(): Promise<number> {
  try {
    const setting = await database.get('SELECT setting_value FROM bank_settings WHERE setting_key = $1', ['math_game_daily_limit']);
    return parseInt(setting?.setting_value || '3', 10);
  } catch (error) {
    console.log('Could not fetch math game daily limit, using default of 3');
    return 3;
  }
}

// Get math game status (remaining plays, high scores, recent sessions)
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access math game' });
    }

    const userId = req.user.id;
    
    // Get daily limit from settings
    const dailyLimit = await getMathGameDailyLimit();

    // Check if math game tables exist, if not return default status
    try {
      await database.query('SELECT 1 FROM math_game_sessions LIMIT 1');
    } catch (tableError) {
      console.log('Math game tables not found, returning default status');
      return res.json({
        remaining_plays: dailyLimit,
        daily_limit: dailyLimit,
        high_scores: { easy: 0, medium: 0, hard: 0 },
        recent_sessions: []
      });
    }

    // Check remaining plays today (resets at 4 AM UTC = 6 AM SAST)
    const todayPlays = await database.query(`
      SELECT COUNT(*) as count FROM math_game_sessions 
      WHERE user_id = $1 
      AND played_at >= (
        CASE 
          WHEN CURRENT_TIME < '04:00:00' 
          THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
          ELSE CURRENT_DATE + INTERVAL '4 hours'
        END
      )
    `, [userId]);

    const remainingPlays = Math.max(0, dailyLimit - parseInt(todayPlays[0].count));

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

    const status = {
      remaining_plays: remainingPlays,
      daily_limit: dailyLimit,
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
    
    // Get daily limit from settings
    const dailyLimit = await getMathGameDailyLimit();

    // Check if math game tables exist
    try {
      await database.query('SELECT 1 FROM math_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.status(503).json({ error: 'Math game feature not available yet. Please try again later.' });
    }

    // Check remaining plays today (resets at 4 AM UTC = 6 AM SAST)
    const todayPlays = await database.query(`
      SELECT COUNT(*) as count FROM math_game_sessions 
      WHERE user_id = $1 
      AND played_at >= (
        CASE 
          WHEN CURRENT_TIME < '04:00:00' 
          THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
          ELSE CURRENT_DATE + INTERVAL '4 hours'
        END
      )
    `, [userId]);

    const remainingPlays = dailyLimit - parseInt(todayPlays[0].count);
    
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

    console.log(`📝 Math game submission from ${req.user.username}:`, {
      session_id,
      score,
      correct_answers,
      total_problems,
      answer_sequence_length: answer_sequence?.length
    });

    if (!session_id || score < 0 || correct_answers < 0 || total_problems < 0) {
      console.warn(`❌ Invalid game data from ${req.user.username}: missing or negative values`);
      return res.status(400).json({ error: 'Invalid game data' });
    }

    // SECURITY: Validate game data integrity
    const MAX_PROBLEMS_PER_GAME = 60; // Increased to 60 to allow for fast players (1 problem per second)
    const MAX_CORRECT_ANSWERS = MAX_PROBLEMS_PER_GAME;
    const MAX_EARNINGS_PER_GAME = 150; // Maximum R150 per game
    
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
    
    // Validate answer_sequence - allow empty array if no problems were answered
    const safeAnswerSequence = Array.isArray(answer_sequence) ? answer_sequence : [];
    
    // Validate answer_sequence length matches total_problems
    if (safeAnswerSequence.length !== total_problems) {
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted answer_sequence length ${safeAnswerSequence.length} for ${total_problems} problems`);
      return res.status(400).json({ error: 'Invalid game data: answer sequence mismatch' });
    }
    
    // Validate answer_sequence content (must be array of booleans) - skip for empty arrays
    if (safeAnswerSequence.length > 0 && !safeAnswerSequence.every(a => typeof a === 'boolean')) {
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted invalid answer_sequence content`);
      return res.status(400).json({ error: 'Invalid game data: answer sequence must contain only boolean values' });
    }
    
    // Validate that correct_answers matches the number of trues in answer_sequence
    const actualCorrectCount = safeAnswerSequence.filter(a => a === true).length;
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
      console.warn(`❌ Session ${session_id} not found for user ${req.user.username}`);
      return res.status(404).json({ error: 'Game session not found' });
    }

    console.log(`📋 Found session:`, {
      id: session.id,
      user_id: session.user_id,
      difficulty: session.difficulty,
      score: session.score,
      earnings: session.earnings
    });
    
    // SECURITY: Check if session has already been submitted
    // A session is considered submitted if it has a score > 0 OR earnings > 0
    const sessionEarnings = parseFloat(session.earnings || '0');
    const sessionScore = parseInt(session.score || '0');
    if (sessionEarnings > 0 || sessionScore > 0) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to resubmit session ${session_id} (score: ${sessionScore}, earnings: ${sessionEarnings})`);
      return res.status(400).json({ error: 'Game session has already been submitted' });
    }

    // SECURITY: Minimum game duration - each game runs 60 seconds client-side
    // Reject if submitted too quickly (detects devtools/API abuse)
    const sessionPlayedAt = new Date(session.played_at).getTime();
    const minGameDurationMs = 45000; // 45 seconds (game is 60 sec, allow network lag)
    if (Date.now() - sessionPlayedAt < minGameDurationMs) {
      const elapsedSec = Math.floor((Date.now() - sessionPlayedAt) / 1000);
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted session ${session_id} after only ${elapsedSec}s (min 45s required)`);
      return res.status(400).json({ error: 'Game submitted too quickly. Each game must run for at least 60 seconds.' });
    }

    // SECURITY: Rate limit - max 2 games per 3 minutes (each game = 60 sec minimum)
    // Detects rapid-fire submissions (e.g. 9 games in 2 minutes)
    const recentCompletions = await database.query(`
      SELECT COUNT(*) as count FROM math_game_sessions 
      WHERE user_id = $1 AND earnings > 0 
      AND played_at > NOW() - INTERVAL '3 minutes'
    `, [userId]);
    if (parseInt(recentCompletions[0].count) >= 2) {
      console.warn(`🚨 SECURITY: User ${req.user.username} exceeded rate limit - ${recentCompletions[0].count} games in last 3 minutes`);
      return res.status(429).json({ error: 'Too many games completed recently. Please wait a few minutes before playing again.' });
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
    const streakBonus = calculateStreakBonus(safeAnswerSequence);
    let totalEarnings = basePoints * difficultyMultiplier * streakBonus;
    
    console.log(`💰 Earnings calculation for ${req.user.username}:`, {
      basePoints,
      difficultyMultiplier,
      streakBonus,
      totalEarnings
    });
    
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

    // Add earnings to account balance and deduct from treasury
    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (account && totalEarnings > 0) {
      // Get user's class for treasury
      const userClass = req.user.class;
      if (!userClass || !['6A', '6B', '6C'].includes(userClass)) {
        console.warn(`⚠️ User ${req.user.username} has no valid class (${userClass}), skipping treasury deduction`);
      } else {
        // Check treasury has sufficient funds
        const townSettings = await database.get('SELECT treasury_balance FROM town_settings WHERE class = $1', [userClass]);
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
        
        if (treasuryBalance < totalEarnings) {
          console.warn(`⚠️ Treasury for ${userClass} has insufficient funds (R${treasuryBalance}) for math game payout (R${totalEarnings})`);
          return res.status(400).json({ error: 'Town treasury has insufficient funds to pay out your earnings. Please contact your teacher.' });
        }

        // Deduct from treasury
        await database.query(
          'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2',
          [totalEarnings, userClass]
        );

        // Record treasury transaction
        const mathSchoolId = req.user.school_id ?? null;
        await database.query(
          'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
          [mathSchoolId, userClass, totalEarnings, 'withdrawal', `Math Game Payout to ${req.user.username}`, userId]
        );
      }

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
