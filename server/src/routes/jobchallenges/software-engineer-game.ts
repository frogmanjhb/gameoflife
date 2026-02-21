import { Router, Response } from 'express';
import database from '../../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { isDoublesDayEnabled } from '../../helpers/doubles-day';
import { getXPForLevel } from '../jobs';
import { JOB_CHALLENGES_DAILY_LIMIT } from './config';

const router = Router();

const SOFTWARE_ENGINEER_JOB_NAME = 'assistant software engineer';

function hasSoftwareEngineerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim() === SOFTWARE_ENGINEER_JOB_NAME;
}

router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access software engineer game' });
    }
    const userId = req.user.id;
    const user = await database.get(`
      SELECT u.*, j.name as job_name 
      FROM users u 
      LEFT JOIN jobs j ON u.job_id = j.id 
      WHERE u.id = $1
    `, [userId]);
    if (!user || !hasSoftwareEngineerJob(user.job_name)) {
      return res.status(403).json({ error: 'Only Software Engineers can access this game' });
    }
    let dailyLimit = JOB_CHALLENGES_DAILY_LIMIT;
    const userClass = req.user?.class;
    const schoolId = req.user?.school_id ?? null;
    if (userClass && ['6A', '6B', '6C'].includes(userClass)) {
      try {
        const row = schoolId != null
          ? await database.get('SELECT job_game_daily_limit FROM town_settings WHERE class = $1 AND school_id = $2', [userClass, schoolId])
          : await database.get('SELECT job_game_daily_limit FROM town_settings WHERE class = $1 AND school_id IS NULL', [userClass]);
        if (row != null && row.job_game_daily_limit != null) dailyLimit = parseInt(String(row.job_game_daily_limit), 10) || dailyLimit;
      } catch (_) { /* use default */ }
    }
    try {
      await database.query('SELECT 1 FROM software_engineer_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.json({
        remaining_plays: dailyLimit,
        daily_limit: dailyLimit,
        high_scores: { easy: 0, medium: 0, hard: 0, extreme: 0 },
        recent_sessions: []
      });
    }
    const todayPlays = await database.query(`
      SELECT COUNT(*) as count FROM software_engineer_game_sessions 
      WHERE user_id = $1 
      AND played_at >= (
        CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
        ELSE CURRENT_DATE + INTERVAL '4 hours' END
      )
    `, [userId]);
    const remainingPlays = Math.max(0, dailyLimit - parseInt(todayPlays[0].count));
    const highScores = await database.query(`
      SELECT difficulty, high_score FROM software_engineer_game_high_scores WHERE user_id = $1
    `, [userId]);
    const highScoreMap = { easy: 0, medium: 0, hard: 0, extreme: 0 };
    highScores.forEach((row: any) => {
      const d = row.difficulty as keyof typeof highScoreMap;
      if (d in highScoreMap) highScoreMap[d] = row.high_score;
    });
    const recentSessions = await database.query(`
      SELECT * FROM software_engineer_game_sessions WHERE user_id = $1 ORDER BY played_at DESC LIMIT 5
    `, [userId]);
    res.json({ remaining_plays: remainingPlays, daily_limit: dailyLimit, high_scores: highScoreMap, recent_sessions: recentSessions });
  } catch (error) {
    console.error('Get software engineer game status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can start software engineer games' });
    }
    const { difficulty } = req.body;
    if (!difficulty || !['easy', 'medium', 'hard', 'extreme'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    const userId = req.user.id;
    const user = await database.get(`
      SELECT u.*, j.name as job_name FROM users u LEFT JOIN jobs j ON u.job_id = j.id WHERE u.id = $1
    `, [userId]);
    if (!user || !hasSoftwareEngineerJob(user.job_name)) {
      return res.status(403).json({ error: 'Only Software Engineers can play this game' });
    }
    let dailyLimit = JOB_CHALLENGES_DAILY_LIMIT;
    const userClass = req.user?.class;
    const schoolId = req.user?.school_id ?? null;
    if (userClass && ['6A', '6B', '6C'].includes(userClass)) {
      try {
        const row = schoolId != null
          ? await database.get('SELECT job_game_daily_limit FROM town_settings WHERE class = $1 AND school_id = $2', [userClass, schoolId])
          : await database.get('SELECT job_game_daily_limit FROM town_settings WHERE class = $1 AND school_id IS NULL', [userClass]);
        if (row != null && row.job_game_daily_limit != null) dailyLimit = parseInt(String(row.job_game_daily_limit), 10) || dailyLimit;
      } catch (_) { /* use default */ }
    }
    try {
      await database.query('SELECT 1 FROM software_engineer_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.status(503).json({ error: 'Software engineer game feature not available yet. Please try again later.' });
    }
    const todayPlays = await database.query(`
      SELECT COUNT(*) as count FROM software_engineer_game_sessions 
      WHERE user_id = $1 
      AND played_at >= (
        CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
        ELSE CURRENT_DATE + INTERVAL '4 hours' END
      )
    `, [userId]);
    if (dailyLimit - parseInt(todayPlays[0].count) <= 0) {
      return res.status(400).json({ error: 'No plays remaining today. Try again tomorrow!' });
    }
    const session = await database.query(`
      INSERT INTO software_engineer_game_sessions (user_id, difficulty, score, correct_answers, total_problems, experience_points, earnings)
      VALUES ($1, $2, 0, 0, 0, 0, 0.00)
      RETURNING *
    `, [userId, difficulty]);
    res.json({ session: session[0] });
  } catch (error) {
    console.error('Start software engineer game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit software engineer games' });
    }
    const { session_id, score, correct_answers, total_problems, answer_sequence } = req.body;
    if (!session_id || score < 0 || correct_answers < 0 || total_problems < 0) {
      return res.status(400).json({ error: 'Invalid game data' });
    }
    const MAX_PROBLEMS_PER_GAME = 60;
    const MAX_EARNINGS_PER_GAME = 150;
    if (total_problems > MAX_PROBLEMS_PER_GAME || correct_answers > total_problems || correct_answers > MAX_PROBLEMS_PER_GAME) {
      return res.status(400).json({ error: 'Invalid game data' });
    }
    const safeAnswerSequence = Array.isArray(answer_sequence) ? answer_sequence : [];
    if (safeAnswerSequence.length !== total_problems ||
        (safeAnswerSequence.length > 0 && !safeAnswerSequence.every((a: unknown) => typeof a === 'boolean'))) {
      return res.status(400).json({ error: 'Invalid game data: answer sequence mismatch' });
    }
    const actualCorrectCount = safeAnswerSequence.filter((a: boolean) => a === true).length;
    if (actualCorrectCount !== correct_answers) {
      return res.status(400).json({ error: 'Invalid game data: correct answer count mismatch' });
    }
    const userId = req.user!.id;
    try {
      await database.query('SELECT 1 FROM software_engineer_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.status(503).json({ error: 'Software engineer game feature not available yet. Please try again later.' });
    }
    const session = await database.get(`
      SELECT * FROM software_engineer_game_sessions WHERE id = $1 AND user_id = $2
    `, [session_id, userId]);
    if (!session) return res.status(404).json({ error: 'Game session not found' });
    if (parseFloat(session.earnings || '0') > 0 || parseInt(session.score || '0', 10) > 0) {
      return res.status(400).json({ error: 'Game session has already been submitted' });
    }
    const sessionPlayedAt = new Date(session.played_at).getTime();
    if (Date.now() - sessionPlayedAt < 45000) {
      return res.status(400).json({ error: 'Game submitted too quickly. Each build sprint must run for at least 60 seconds.' });
    }
    const recentCompletions = await database.query(`
      SELECT COUNT(*) as count FROM software_engineer_game_sessions 
      WHERE user_id = $1 AND earnings > 0 AND played_at > NOW() - INTERVAL '3 minutes'
    `, [userId]);
    if (parseInt(recentCompletions[0].count, 10) >= 2) {
      return res.status(429).json({ error: 'Too many games completed recently. Please wait a few minutes before playing again.' });
    }
    const calculateStreakBonus = (sequence: boolean[]): number => {
      let maxStreak = 0, currentStreak = 0;
      for (const isCorrect of sequence) {
        if (isCorrect) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); } else currentStreak = 0;
      }
      if (maxStreak >= 5) return 1.2;
      if (maxStreak >= 3) return 1.1;
      return 1.0;
    };
    const difficultyMultipliers: Record<string, number> = { easy: 1.0, medium: 1.5, hard: 2.0, extreme: 3.0 };
    const difficultyMultiplier = difficultyMultipliers[session.difficulty] || 1.0;
    const streakBonus = calculateStreakBonus(safeAnswerSequence);
    let totalXP = Math.round(correct_answers * 1 * difficultyMultiplier * streakBonus);
    let totalEarnings = correct_answers * 1 * difficultyMultipliers[session.difficulty] * streakBonus;
    if (totalEarnings > MAX_EARNINGS_PER_GAME) totalEarnings = MAX_EARNINGS_PER_GAME;
    if (await isDoublesDayEnabled()) totalEarnings = totalEarnings * 2;
    await database.query(`
      UPDATE software_engineer_game_sessions 
      SET score = $1, correct_answers = $2, total_problems = $3, experience_points = $4, earnings = $5
      WHERE id = $6
    `, [score, correct_answers, total_problems, totalXP, totalEarnings, session_id]);
    const currentHighScore = await database.get(`
      SELECT high_score FROM software_engineer_game_high_scores WHERE user_id = $1 AND difficulty = $2
    `, [userId, session.difficulty]);
    if (!currentHighScore || score > currentHighScore.high_score) {
      await database.query(`
        INSERT INTO software_engineer_game_high_scores (user_id, difficulty, high_score)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, difficulty) DO UPDATE SET high_score = $3, achieved_at = CURRENT_TIMESTAMP
      `, [userId, session.difficulty, score]);
    }
    const currentUser = await database.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [userId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + totalXP;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
      if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
      else break;
    }
    await database.query(
      'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
      [newXP, newLevel, userId]
    );
    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (account && totalEarnings > 0) {
      const userClass = req.user!.class;
      const schoolId = req.user!.school_id ?? null;
      if (userClass && ['6A', '6B', '6C'].includes(userClass)) {
        const townSettings = schoolId != null
          ? await database.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [userClass, schoolId])
          : await database.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [userClass]);
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
        if (treasuryBalance < totalEarnings) {
          return res.status(400).json({ error: 'Town treasury has insufficient funds to pay out your earnings. Please contact your teacher.' });
        }
        if (schoolId != null) {
          await database.query(
            'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
            [totalEarnings, userClass, schoolId]
          );
        } else {
          await database.query(
            'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
            [totalEarnings, userClass]
          );
        }
        await database.query(
          'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
          [schoolId, userClass, totalEarnings, 'withdrawal', `Software Engineer Build Payout to ${req.user!.username}`, userId]
        );
      }
      await database.query(`
        UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
      `, [totalEarnings, account.id]);
      await database.query(`
        INSERT INTO transactions (to_account_id, amount, transaction_type, description)
        VALUES ($1, $2, 'deposit', $3)
      `, [account.id, totalEarnings, 'SOFTWARE_ENGINEER_BUILD_EARN']);
    }
    res.json({
      success: true,
      earnings: totalEarnings,
      experience_points: totalXP,
      new_level: newLevel > currentLevel ? newLevel : null,
      isNewHighScore: !currentHighScore || score > currentHighScore.high_score
    });
  } catch (error) {
    console.error('Submit software engineer game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
