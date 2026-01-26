import { Router, Response } from 'express';
import database from '../database/database-prod';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { MathGameStartRequest, MathGameSubmitRequest, MathGameStatus, MathGameSession } from '../types';

const router = Router();

// Security constants
const GAME_DURATION_SECONDS = 60;
const MAX_PROBLEMS_PER_GAME = 60; // Maximum 1 problem per second
const MIN_PROBLEMS_PER_GAME = 0; // Allow submitting with 0 if they ran out of time
const MAX_EARNINGS_PER_GAME = 150;
const MIN_GAME_DURATION_SECONDS = 55; // Must play for at least 55 seconds (allows for some network latency)

// Problem configuration by difficulty
const DIFFICULTY_CONFIG = {
  easy: {
    addition: { max: 20, min: 1 },
    subtraction: { max: 20, min: 1 },
    multiplication: { max: 12, min: 1 },
    division: { max: 12, min: 2 }
  },
  medium: {
    addition: { max: 50, min: 1 },
    subtraction: { max: 50, min: 1 },
    multiplication: { max: 15, min: 1 },
    division: { max: 15, min: 2 }
  },
  hard: {
    addition: { max: 100, min: 1 },
    subtraction: { max: 100, min: 1 },
    multiplication: { max: 20, min: 1 },
    division: { max: 20, min: 2 }
  }
};

interface MathProblem {
  num1: number;
  num2: number;
  operation: string;
  answer: number;
  display: string;
}

// Generate a single math problem server-side
function generateProblem(difficulty: 'easy' | 'medium' | 'hard'): MathProblem {
  const ranges = DIFFICULTY_CONFIG[difficulty];
  const operations = ['+', '-', '×', '÷'] as const;
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1: number, num2: number, answer: number;

  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * (ranges.addition.max - ranges.addition.min + 1)) + ranges.addition.min;
      num2 = Math.floor(Math.random() * (ranges.addition.max - ranges.addition.min + 1)) + ranges.addition.min;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * (ranges.subtraction.max - ranges.subtraction.min + 1)) + ranges.subtraction.min;
      num2 = Math.floor(Math.random() * (ranges.subtraction.max - ranges.subtraction.min + 1)) + ranges.subtraction.min;
      if (num1 < num2) [num1, num2] = [num2, num1];
      answer = num1 - num2;
      break;
    case '×':
      num1 = Math.floor(Math.random() * (ranges.multiplication.max - ranges.multiplication.min + 1)) + ranges.multiplication.min;
      num2 = Math.floor(Math.random() * (ranges.multiplication.max - ranges.multiplication.min + 1)) + ranges.multiplication.min;
      answer = num1 * num2;
      break;
    case '÷':
      answer = Math.floor(Math.random() * (ranges.division.max - ranges.division.min + 1)) + ranges.division.min;
      num2 = Math.floor(Math.random() * (ranges.division.max - ranges.division.min + 1)) + ranges.division.min;
      num1 = num2 * answer;
      break;
    default:
      num1 = 1;
      num2 = 1;
      answer = 2;
  }

  return {
    num1,
    num2,
    operation,
    answer,
    display: `${num1} ${operation} ${num2} =`
  };
}

// Generate all problems for a game session
function generateProblemsForSession(difficulty: 'easy' | 'medium' | 'hard', count: number): MathProblem[] {
  const problems: MathProblem[] = [];
  for (let i = 0; i < count; i++) {
    problems.push(generateProblem(difficulty));
  }
  return problems;
}

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

// Start a new math game session with server-generated problems
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

    // SECURITY: Generate problems server-side
    const problems = generateProblemsForSession(difficulty as 'easy' | 'medium' | 'hard', MAX_PROBLEMS_PER_GAME);
    
    // Create new session with server-generated problems
    const session = await database.query(`
      INSERT INTO math_game_sessions (user_id, difficulty, score, correct_answers, total_problems, earnings, problems, started_at, submitted, current_problem_index, server_validated_score)
      VALUES ($1, $2, 0, 0, 0, 0.00, $3, CURRENT_TIMESTAMP, FALSE, 0, 0)
      RETURNING id, user_id, difficulty, score, correct_answers, total_problems, earnings, started_at
    `, [userId, difficulty, JSON.stringify(problems)]);

    // Return problems WITHOUT answers to the client
    const clientProblems = problems.map((p: MathProblem) => ({
      num1: p.num1,
      num2: p.num2,
      operation: p.operation,
      display: p.display
      // NOTE: answer is NOT included - this is the key security feature
    }));

    console.log(`🎮 Started secure math game for ${req.user.username} (session ${session[0].id}) with ${problems.length} server-generated problems`);

    res.json({ 
      session: session[0],
      problems: clientProblems // Send problems without answers
    });
  } catch (error) {
    console.error('Start math game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit an individual answer for real-time validation
router.post('/answer', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit answers' });
    }

    const { session_id, problem_index, answer } = req.body;
    const userId = req.user.id;

    if (session_id === undefined || problem_index === undefined || answer === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get session with problems
    const session = await database.get(`
      SELECT * FROM math_game_sessions 
      WHERE id = $1 AND user_id = $2
    `, [session_id, userId]);

    if (!session) {
      return res.status(404).json({ error: 'Game session not found' });
    }

    if (session.submitted) {
      return res.status(400).json({ error: 'Game already submitted' });
    }

    // Parse stored problems
    const problems: MathProblem[] = typeof session.problems === 'string' 
      ? JSON.parse(session.problems) 
      : session.problems;

    if (!problems || problem_index < 0 || problem_index >= problems.length) {
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted invalid problem index ${problem_index}`);
      return res.status(400).json({ error: 'Invalid problem index' });
    }

    // SECURITY: Validate answer against server-stored problem
    const problem = problems[problem_index];
    const userAnswer = parseInt(answer);
    const isCorrect = userAnswer === problem.answer;

    // Update server-validated score if correct
    if (isCorrect) {
      await database.query(`
        UPDATE math_game_sessions 
        SET server_validated_score = server_validated_score + 1,
            current_problem_index = $1
        WHERE id = $2
      `, [problem_index + 1, session_id]);
    } else {
      await database.query(`
        UPDATE math_game_sessions 
        SET current_problem_index = $1
        WHERE id = $2
      `, [problem_index + 1, session_id]);
    }

    // Return result (but NOT the correct answer to prevent reverse engineering)
    res.json({ 
      correct: isCorrect,
      problem_index
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit math game results (finalize game)
router.post('/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit math games' });
    }

    const { session_id, answers }: { session_id: number; answers: { problem_index: number; answer: number }[] } = req.body;
    const userId = req.user.id;

    console.log(`📝 Math game submission from ${req.user.username}:`, {
      session_id,
      answers_count: answers?.length
    });

    if (!session_id) {
      console.warn(`❌ Invalid game data from ${req.user.username}: missing session_id`);
      return res.status(400).json({ error: 'Invalid game data' });
    }

    // Check if math game tables exist
    try {
      await database.query('SELECT 1 FROM math_game_sessions LIMIT 1');
    } catch (tableError) {
      return res.status(503).json({ error: 'Math game feature not available yet. Please try again later.' });
    }

    // Verify session belongs to user
    const session = await database.get(`
      SELECT * FROM math_game_sessions 
      WHERE id = $1 AND user_id = $2
    `, [session_id, userId]);

    if (!session) {
      console.warn(`❌ Session ${session_id} not found for user ${req.user.username}`);
      return res.status(404).json({ error: 'Game session not found' });
    }

    // SECURITY: Check if session has already been submitted
    if (session.submitted) {
      console.warn(`🚨 SECURITY: User ${req.user.username} attempted to resubmit session ${session_id}`);
      return res.status(400).json({ error: 'Game session has already been submitted' });
    }

    // SECURITY: Validate game duration
    const startedAt = new Date(session.started_at);
    const now = new Date();
    const durationSeconds = (now.getTime() - startedAt.getTime()) / 1000;
    
    if (durationSeconds < MIN_GAME_DURATION_SECONDS) {
      console.warn(`🚨 SECURITY: User ${req.user.username} submitted game after only ${durationSeconds.toFixed(1)}s (min: ${MIN_GAME_DURATION_SECONDS}s)`);
      return res.status(400).json({ error: 'Game submitted too quickly. Please play the full game.' });
    }

    // Parse stored problems
    const problems: MathProblem[] = typeof session.problems === 'string' 
      ? JSON.parse(session.problems) 
      : session.problems;

    if (!problems) {
      console.error(`❌ No problems found for session ${session_id}`);
      return res.status(500).json({ error: 'Session data corrupted' });
    }

    // SECURITY: Validate all answers server-side
    const safeAnswers = Array.isArray(answers) ? answers : [];
    let correctCount = 0;
    const answerSequence: boolean[] = [];

    // Validate each answer against server-stored problems
    for (const { problem_index, answer } of safeAnswers) {
      if (problem_index < 0 || problem_index >= problems.length) {
        console.warn(`🚨 SECURITY: User ${req.user.username} submitted invalid problem_index ${problem_index}`);
        continue;
      }
      
      const problem = problems[problem_index];
      const isCorrect = parseInt(String(answer)) === problem.answer;
      answerSequence.push(isCorrect);
      
      if (isCorrect) {
        correctCount++;
      }
    }

    console.log(`✅ Server-validated results for ${req.user.username}: ${correctCount}/${safeAnswers.length} correct`);

    // Calculate streak bonus from validated answers
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
      
      if (maxStreak >= 15) return 2.5;
      if (maxStreak >= 10) return 2.0;
      if (maxStreak >= 5) return 1.5;
      return 1.0;
    };

    // Calculate earnings using SERVER-VALIDATED score
    const difficultyMultipliers: Record<string, number> = { easy: 1.0, medium: 1.2, hard: 1.5 };
    const basePoints = correctCount * 1;
    const difficultyMultiplier = difficultyMultipliers[session.difficulty] || 1.0;
    const streakBonus = calculateStreakBonus(answerSequence);
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

    // Update session with SERVER-VALIDATED results
    await database.query(`
      UPDATE math_game_sessions 
      SET score = $1, correct_answers = $2, total_problems = $3, earnings = $4, submitted = TRUE, server_validated_score = $2
      WHERE id = $5
    `, [correctCount, correctCount, safeAnswers.length, totalEarnings, session_id]);

    // Update high score if this is a new record
    const currentHighScore = await database.get(`
      SELECT high_score FROM math_game_high_scores 
      WHERE user_id = $1 AND difficulty = $2
    `, [userId, session.difficulty]);

    if (!currentHighScore || correctCount > currentHighScore.high_score) {
      await database.query(`
        INSERT INTO math_game_high_scores (user_id, difficulty, high_score)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, difficulty) 
        DO UPDATE SET high_score = $3, achieved_at = CURRENT_TIMESTAMP
      `, [userId, session.difficulty, correctCount]);
    }

    // Add earnings to account balance
    const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
    if (account) {
      await database.query(`
        UPDATE accounts 
        SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [totalEarnings, account.id]);

      await database.query(`
        INSERT INTO transactions (to_account_id, amount, transaction_type, description)
        VALUES ($1, $2, 'deposit', $3)
      `, [account.id, totalEarnings, `Math Game Earnings - ${session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}`]);
    }

    console.log(`🎉 Game completed for ${req.user.username}: Score ${correctCount}, Earned R${totalEarnings.toFixed(2)}`);

    res.json({ 
      success: true, 
      score: correctCount,
      earnings: totalEarnings,
      isNewHighScore: !currentHighScore || correctCount > currentHighScore.high_score
    });
  } catch (error) {
    console.error('Submit math game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
