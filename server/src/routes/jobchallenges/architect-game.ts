import { Router, Response } from 'express';
import database from '../../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../../middleware/auth';
import { getArchitectQuestion } from '../../games/jobchallenges/architect-questions';
import { isDoublesDayEnabled } from '../../helpers/doubles-day';
import { getXPForLevel } from '../jobs';
import { JOB_CHALLENGES_DAILY_LIMIT } from './config';

const router = Router();

// Get architect game status (remaining plays, high scores, recent sessions)
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access architect game' });
    }

    const userId = req.user.id;
    
    // Check if user has Architect job
    const user = await database.get(`
      SELECT u.*, j.name as job_name 
      FROM users u 
      LEFT JOIN jobs j ON u.job_id = j.id 
      WHERE u.id = $1
    `, [userId]);
    
    if (!user || user.job_name?.toLowerCase() !== 'architect') {
      return res.status(403).json({ error: 'Only Architects can access this game' });
    }
    
    // All job challenges: 3 tries per day
    const dailyLimit = JOB_CHALLENGES_DAILY_LIMIT;

    // Check if architect game tables exist, if not return default status
    try {
      await database.query('SELECT 1 FROM architect_game_sessions LIMIT 1');
    } catch (tableError) {
      console.log('Architect game tables not found, returning default status');
      return res.json({
        remaining_plays: dailyLimit,
        daily_limit: dailyLimit,
        high_scores: { easy: 0, medium: 0, hard: 0, extreme: 0 },
        recent_sessions: []
      });
    }

    // Check remaining plays today (resets at 4 AM UTC = 6 AM SAST)
    const todayPlays = await database.query(`
      SELECT COUNT(*) as count FROM architect_game_sessions 
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
      FROM architect_game_high_scores 
      WHERE user_id = $1
    `, [userId]);

    const highScoreMap = {
      easy: 0,
      medium: 0,
      hard: 0,
      extreme: 0
    };

    highScores.forEach((row: any) => {
      const difficulty = row.difficulty as keyof typeof highScoreMap;
      if (difficulty in highScoreMap) {
        highScoreMap[difficulty] = row.high_score;
      }
    });

    // Get recent sessions (last 5)
    const recentSessions = await database.query(`
      SELECT * FROM architect_game_sessions 
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
    console.error('Get architect game status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start a new architect game session
router.post('/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can start architect games' });
    }

    const { difficulty } = req.body;
    
    if (!difficulty || !['easy', 'medium', 'hard', 'extreme'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    const userId = req.user.id;
    
    // Check if user has Architect job
    const user = await database.get(`
      SELECT u.*, j.name as job_name 
      FROM users u 
      LEFT JOIN jobs j ON u.job_id = j.id 
      WHERE u.id = $1
    `, [userId]);
    
    if (!user || user.job_name?.toLowerCase() !== 'architect') {
      return res.status(403).json({ error: 'Only Architects can play this game' });
    }
    
    // All job challenges: 3 tries per day
    const dailyLimit = JOB_CHALLENGES_DAILY_LIMIT;

    // Check if architect game tables exist
    try {
      await database.query('SELECT 1 FROM architect_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.status(503).json({ error: 'Architect game feature not available yet. Please try again later.' });
    }

    // Check remaining plays today (resets at 4 AM UTC = 6 AM SAST)
    const todayPlays = await database.query(`
      SELECT COUNT(*) as count FROM architect_game_sessions 
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
      INSERT INTO architect_game_sessions (user_id, difficulty, score, correct_answers, total_problems, experience_points, earnings)
      VALUES ($1, $2, 0, 0, 0, 0, 0.00)
      RETURNING *
    `, [userId, difficulty]);

    res.json({ session: session[0] });
  } catch (error) {
    console.error('Start architect game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit architect game results
router.post('/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit architect games' });
    }

    const { session_id, score, correct_answers, total_problems, answer_sequence } = req.body;

    console.log(`📝 Architect game submission from ${req.user.username}:`, {
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
    const MAX_PROBLEMS_PER_GAME = 60;
    const MAX_CORRECT_ANSWERS = MAX_PROBLEMS_PER_GAME;
    const MAX_EARNINGS_PER_GAME = 150;
    
    if (total_problems > MAX_PROBLEMS_PER_GAME) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to submit game with ${total_problems} problems (max: ${MAX_PROBLEMS_PER_GAME})`);
      return res.status(400).json({ error: 'Invalid game data: too many problems' });
    }
    
    if (correct_answers > total_problems) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to submit ${correct_answers} correct answers for ${total_problems} problems`);
      return res.status(400).json({ error: 'Invalid game data: correct answers cannot exceed total problems' });
    }
    
    if (correct_answers > MAX_CORRECT_ANSWERS) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to submit ${correct_answers} correct answers (max: ${MAX_CORRECT_ANSWERS})`);
      return res.status(400).json({ error: 'Invalid game data: too many correct answers' });
    }
    
    const safeAnswerSequence = Array.isArray(answer_sequence) ? answer_sequence : [];
    
    if (safeAnswerSequence.length !== total_problems) {
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted answer_sequence length ${safeAnswerSequence.length} for ${total_problems} problems`);
      return res.status(400).json({ error: 'Invalid game data: answer sequence mismatch' });
    }
    
    if (safeAnswerSequence.length > 0 && !safeAnswerSequence.every(a => typeof a === 'boolean')) {
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted invalid answer_sequence content`);
      return res.status(400).json({ error: 'Invalid game data: answer sequence must contain only boolean values' });
    }
    
    const actualCorrectCount = safeAnswerSequence.filter(a => a === true).length;
    if (actualCorrectCount !== correct_answers) {
      console.warn(`🚨 SECURITY: User ${req.user.username} claimed ${correct_answers} correct but sequence shows ${actualCorrectCount}`);
      return res.status(400).json({ error: 'Invalid game data: correct answer count mismatch' });
    }

    const userId = req.user.id;

    // Check if architect game tables exist
    try {
      await database.query('SELECT 1 FROM architect_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.status(503).json({ error: 'Architect game feature not available yet. Please try again later.' });
    }

    // Verify session belongs to user and hasn't been submitted already
    const session = await database.get(`
      SELECT * FROM architect_game_sessions 
      WHERE id = $1 AND user_id = $2
    `, [session_id, userId]);

    if (!session) {
      console.warn(`❌ Session ${session_id} not found for user ${req.user.username}`);
      return res.status(404).json({ error: 'Game session not found' });
    }

    // SECURITY: Check if session has already been submitted
    const sessionEarnings = parseFloat(session.earnings || '0');
    const sessionScore = parseInt(session.score || '0');
    if (sessionEarnings > 0 || sessionScore > 0) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to resubmit session ${session_id}`);
      return res.status(400).json({ error: 'Game session has already been submitted' });
    }

    // SECURITY: Minimum game duration
    const sessionPlayedAt = new Date(session.played_at).getTime();
    const minGameDurationMs = 45000; // 45 seconds
    if (Date.now() - sessionPlayedAt < minGameDurationMs) {
      const elapsedSec = Math.floor((Date.now() - sessionPlayedAt) / 1000);
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted session ${session_id} after only ${elapsedSec}s`);
      return res.status(400).json({ error: 'Game submitted too quickly. Each game must run for at least 60 seconds.' });
    }

    // SECURITY: Rate limit
    const recentCompletions = await database.query(`
      SELECT COUNT(*) as count FROM architect_game_sessions 
      WHERE user_id = $1 AND earnings > 0 
      AND played_at > NOW() - INTERVAL '3 minutes'
    `, [userId]);
    if (parseInt(recentCompletions[0].count) >= 2) {
      console.warn(`🚨 SECURITY: User ${req.user.username} exceeded rate limit`);
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
      
      // Streak bonus: 3+ streak = 1.1x, 5+ streak = 1.2x (as per user requirements)
      if (maxStreak >= 5) return 1.2;
      if (maxStreak >= 3) return 1.1;
      return 1.0;
    };

    // Calculate XP and earnings
    const difficultyMultipliers: Record<string, number> = { easy: 1.0, medium: 1.5, hard: 2.0, extreme: 3.0 };
    const baseXP = correct_answers * 1; // 1 XP per correct answer
    const difficultyMultiplier = difficultyMultipliers[session.difficulty] || 1.0;
    const streakBonus = calculateStreakBonus(safeAnswerSequence);
    let totalXP = Math.round(baseXP * difficultyMultiplier * streakBonus);
    
    // Calculate earnings (same as math game)
    const baseEarnings = correct_answers * 1;
    let totalEarnings = baseEarnings * difficultyMultipliers[session.difficulty] * streakBonus;
    
    // Cap earnings
    if (totalEarnings > MAX_EARNINGS_PER_GAME) {
      totalEarnings = MAX_EARNINGS_PER_GAME;
    }

    // Doubles Day: double earnings when plugin is enabled
    if (await isDoublesDayEnabled()) {
      totalEarnings = totalEarnings * 2;
    }

    // Update session with results
    await database.query(`
      UPDATE architect_game_sessions 
      SET score = $1, correct_answers = $2, total_problems = $3, experience_points = $4, earnings = $5
      WHERE id = $6
    `, [score, correct_answers, total_problems, totalXP, totalEarnings, session_id]);

    // Update high score if this is a new record
    const currentHighScore = await database.get(`
      SELECT high_score FROM architect_game_high_scores 
      WHERE user_id = $1 AND difficulty = $2
    `, [userId, session.difficulty]);

    if (!currentHighScore || score > currentHighScore.high_score) {
      await database.query(`
        INSERT INTO architect_game_high_scores (user_id, difficulty, high_score)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, difficulty) 
        DO UPDATE SET high_score = $3, achieved_at = CURRENT_TIMESTAMP
      `, [userId, session.difficulty, score]);
    }

    // Award XP to user (update job_experience_points and job_level)
    const currentUser = await database.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + totalXP;

    // Calculate new level based on XP
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
      const xpForNextLevel = getXPForLevel(level + 1);
      if (newXP >= xpForNextLevel) {
        newLevel = level + 1;
      } else {
        break;
      }
    }

    // Update user's XP and level
    await database.query(
      'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
      [newXP, newLevel, userId]
    );

    // Add earnings to account balance (same as math game)
    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (account && totalEarnings > 0) {
      const userClass = req.user.class;
      const architectSchoolId = req.user.school_id ?? null;
      if (userClass && ['6A', '6B', '6C'].includes(userClass)) {
        // Check treasury has sufficient funds
        const townSettings = architectSchoolId != null
          ? await database.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [userClass, architectSchoolId])
          : await database.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [userClass]);
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
        
        if (treasuryBalance < totalEarnings) {
          console.warn(`⚠️ Treasury for ${userClass} has insufficient funds`);
          return res.status(400).json({ error: 'Town treasury has insufficient funds to pay out your earnings. Please contact your teacher.' });
        }

        // Deduct from treasury
        if (architectSchoolId != null) {
          await database.query(
            'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
            [totalEarnings, userClass, architectSchoolId]
          );
        } else {
          await database.query(
            'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
            [totalEarnings, userClass]
          );
        }

        // Record treasury transaction
        await database.query(
          'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
          [architectSchoolId, userClass, totalEarnings, 'withdrawal', `Architect Game Payout to ${req.user.username}`, userId]
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
      `, [account.id, totalEarnings, `Architect Game Earnings - ${session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}`]);
    }

    res.json({ 
      success: true, 
      earnings: totalEarnings,
      experience_points: totalXP,
      new_level: newLevel > currentLevel ? newLevel : null,
      isNewHighScore: !currentHighScore || score > currentHighScore.high_score
    });
  } catch (error) {
    console.error('Submit architect game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
