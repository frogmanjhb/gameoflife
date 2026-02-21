import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getXPForLevel } from './jobs';
import { isDoublesDayEnabled } from '../helpers/doubles-day';
import { getRandomWord, isValidWord, normalizeWord } from '../games/wordle-words';

const router = Router();

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

// 0 = not in word, 1 = wrong position, 2 = correct position
function computeFeedback(guess: string, target: string): number[] {
  const g = guess.split('');
  const t = target.split('');
  const feedback: number[] = new Array(WORD_LENGTH).fill(0);
  const used: boolean[] = new Array(WORD_LENGTH).fill(false);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === t[i]) {
      feedback[i] = 2;
      used[i] = true;
    }
  }

  const remaining: Record<string, number> = {};
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (!used[i]) {
      const c = t[i];
      remaining[c] = (remaining[c] || 0) + 1;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (feedback[i] === 2) continue;
    const c = g[i];
    if (remaining[c] && remaining[c] > 0) {
      feedback[i] = 1;
      remaining[c]--;
    }
  }

  return feedback;
}

async function getWordleChoresEnabled(): Promise<boolean> {
  try {
    const row = await database.get('SELECT setting_value FROM bank_settings WHERE setting_key = $1', ['wordle_chores_enabled']);
    return (row?.setting_value || 'true').toLowerCase() === 'true';
  } catch (error) {
    return true;
  }
}

async function getWordleDailyLimit(): Promise<number> {
  try {
    const row = await database.get('SELECT setting_value FROM bank_settings WHERE setting_key = $1', ['wordle_game_daily_limit']);
    return parseInt(row?.setting_value || '3', 10);
  } catch (error) {
    return 3;
  }
}

const DAILY_WINDOW_SQL = `played_at >= (
  CASE
    WHEN CURRENT_TIME < '04:00:00'
    THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
    ELSE CURRENT_DATE + INTERVAL '4 hours'
  END
)`;

// GET /status
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access Wordle game' });
    }

    const enabled = await getWordleChoresEnabled();
    if (!enabled) {
      return res.json({
        enabled: false,
        remaining_plays: 0,
        daily_limit: 0,
        recent_sessions: []
      });
    }

    const userId = req.user.id;
    const dailyLimit = await getWordleDailyLimit();

    try {
      await database.query('SELECT 1 FROM wordle_sessions LIMIT 1');
    } catch (tableError) {
      return res.json({
        enabled: true,
        remaining_plays: dailyLimit,
        daily_limit: dailyLimit,
        recent_sessions: []
      });
    }

    const todayCount = await database.query(`
      SELECT COUNT(*) as count FROM wordle_sessions
      WHERE user_id = $1 AND status IN ('won', 'lost') AND ${DAILY_WINDOW_SQL}
    `, [userId]);
    const played = parseInt(todayCount[0]?.count || '0');
    const remainingPlays = Math.max(0, dailyLimit - played);

    const recentSessions = await database.query(`
      SELECT id, status, guesses_count, earnings, played_at
      FROM wordle_sessions
      WHERE user_id = $1
      ORDER BY played_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      enabled: true,
      remaining_plays: remainingPlays,
      daily_limit: dailyLimit,
      recent_sessions: recentSessions
    });
  } catch (error) {
    console.error('Wordle status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /start
router.post('/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can start Wordle games' });
    }

    if (!(await getWordleChoresEnabled())) {
      return res.status(403).json({ error: 'Wordle chores are currently disabled.' });
    }

    const userId = req.user.id;
    const dailyLimit = await getWordleDailyLimit();

    const todayCount = await database.query(`
      SELECT COUNT(*) as count FROM wordle_sessions
      WHERE user_id = $1 AND status IN ('won', 'lost') AND ${DAILY_WINDOW_SQL}
    `, [userId]);
    const played = parseInt(todayCount[0]?.count || '0');
    if (played >= dailyLimit) {
      return res.status(400).json({ error: 'No Wordle plays remaining today. Try again tomorrow!' });
    }

    const targetWord = getRandomWord();
    const rows = await database.query(`
      INSERT INTO wordle_sessions (user_id, target_word, status, guesses_count, earnings)
      VALUES ($1, $2, 'active', 0, 0.00)
      RETURNING id
    `, [userId, targetWord]);

    res.json({ session_id: rows[0].id });
  } catch (error) {
    console.error('Wordle start error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /guess
router.post('/guess', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit guesses' });
    }

    const { session_id, guess } = req.body;
    if (!session_id || typeof guess !== 'string') {
      return res.status(400).json({ error: 'session_id and guess are required' });
    }

    const normalized = normalizeWord(guess);
    if (normalized.length !== WORD_LENGTH) {
      return res.status(400).json({ error: 'Guess must be exactly 5 letters' });
    }
    if (!isValidWord(normalized)) {
      return res.status(400).json({ error: 'Not a valid word' });
    }

    const userId = req.user.id;
    const session = await database.get(`
      SELECT * FROM wordle_sessions WHERE id = $1 AND user_id = $2
    `, [session_id, userId]);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Game already finished' });
    }
    const guessesCount = parseInt(session.guesses_count || '0');
    if (guessesCount >= MAX_GUESSES) {
      return res.status(400).json({ error: 'No guesses remaining' });
    }

    const target = (session.target_word as string).toLowerCase();
    const feedback = computeFeedback(normalized, target);
    const won = normalized === target;
    const newCount = guessesCount + 1;
    const lost = !won && newCount >= MAX_GUESSES;
    const newStatus = won ? 'won' : (lost ? 'lost' : 'active');

    await database.query(`
      UPDATE wordle_sessions
      SET status = $1, guesses_count = $2
      WHERE id = $3
    `, [newStatus, newCount, session_id]);

    res.json({
      feedback,
      game_over: won || lost,
      won,
      guesses_count: newCount
    });
  } catch (error) {
    console.error('Wordle guess error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Base earnings by guesses used (6 = R5, 5 = R6, ... 1 = R10). Cap and apply Doubles Day.
const EARNINGS_BY_GUESSES: Record<number, number> = {
  1: 10, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5
};
const WORDLE_XP_WIN = 10;
const MAX_WORDLE_EARNINGS = 20;

// POST /complete
router.post('/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can complete Wordle games' });
    }

    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const userId = req.user.id;
    const session = await database.get(`
      SELECT * FROM wordle_sessions WHERE id = $1 AND user_id = $2
    `, [session_id, userId]);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status !== 'won' && session.status !== 'lost') {
      return res.status(400).json({ error: 'Game is not finished yet' });
    }

    const earningsAlready = parseFloat(session.earnings || '0');
    if (earningsAlready > 0) {
      return res.json({
        success: true,
        earnings: earningsAlready,
        experience_points: 0,
        new_level: null
      });
    }

    let totalEarnings = 0;
    let experiencePoints = 0;
    let newLevel: number | null = null;

    if (session.status === 'won') {
      const guessesUsed = parseInt(session.guesses_count || '6');
      totalEarnings = EARNINGS_BY_GUESSES[guessesUsed] ?? 5;
      if (totalEarnings > MAX_WORDLE_EARNINGS) totalEarnings = MAX_WORDLE_EARNINGS;
      if (await isDoublesDayEnabled()) totalEarnings = totalEarnings * 2;

      await database.query(`
        UPDATE wordle_sessions SET earnings = $1 WHERE id = $2
      `, [totalEarnings, session_id]);

      const userClass = req.user.class;
      const schoolId = req.user.school_id ?? null;
      const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);

      if (account && totalEarnings > 0 && userClass && ['6A', '6B', '6C'].includes(userClass)) {
        const townSettings = schoolId != null
          ? await database.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [userClass, schoolId])
          : await database.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [userClass]);
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');

        if (treasuryBalance >= totalEarnings) {
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
            [schoolId, userClass, totalEarnings, 'withdrawal', `Wordle Chore Payout to ${req.user.username}`, userId]
          );
          await database.query(
            'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [totalEarnings, account.id]
          );
          await database.query(
            'INSERT INTO transactions (to_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [account.id, totalEarnings, 'deposit', 'Wordle Chore Earnings']
          );
        }
      }

      const user = await database.get('SELECT job_id, job_level, job_experience_points FROM users WHERE id = $1', [userId]);
      if (user?.job_id) {
        const currentLevel = user.job_level || 1;
        const currentXP = user.job_experience_points || 0;
        const newXP = currentXP + WORDLE_XP_WIN;
        let level = currentLevel;
        for (let l = currentLevel; l < 10; l++) {
          if (newXP >= getXPForLevel(l + 1)) level = l + 1;
          else break;
        }
        await database.query(
          'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
          [newXP, level, userId]
        );
        experiencePoints = WORDLE_XP_WIN;
        newLevel = level > currentLevel ? level : null;
      }
    }

    res.json({
      success: true,
      earnings: totalEarnings,
      experience_points: experiencePoints,
      new_level: newLevel
    });
  } catch (error) {
    console.error('Wordle complete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
