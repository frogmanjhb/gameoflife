import database from '../database/database-prod';

const JOB_GAME_SESSIONS_UNION = `
  SELECT experience_points, earnings FROM architect_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM accountant_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM software_engineer_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM marketing_manager_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM graphic_designer_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM journalist_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM event_planner_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM financial_manager_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM hr_director_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM police_lieutenant_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM lawyer_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM town_planner_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM electrical_engineer_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM civil_engineer_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM principal_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM teacher_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM nurse_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM doctor_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM retail_manager_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM entrepreneur_game_sessions WHERE user_id = $1
  UNION ALL SELECT experience_points, earnings FROM insurance_manager_game_sessions WHERE user_id = $1
`;

export interface StudentEarningsProfile {
  job_level: number;
  job_experience_points: number;
  job_name: string | null;
  account_balance: number;
  xp: {
    wordle: number;
    job_challenge_games: number;
    job_tasks_and_other: number;
    total: number;
  };
  money: {
    math_chores: number;
    wordle: number;
    job_challenge_games: number;
    salary: number;
    job_tasks: number;
    total_earned: number;
  };
  counts: {
    math_chores_sessions: number;
    wordle_games: number;
    job_challenge_sessions: number;
  };
}

function parseAmount(value: unknown): number {
  const n = parseFloat(String(value ?? 0));
  return Number.isFinite(n) ? n : 0;
}

export async function buildStudentEarningsProfile(userId: number): Promise<StudentEarningsProfile | null> {
  const user = await database.get(
    `SELECT u.id, u.job_level, u.job_experience_points, j.name AS job_name, a.balance AS account_balance
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     LEFT JOIN accounts a ON a.user_id = u.id
     WHERE u.id = $1 AND u.role = 'student'`,
    [userId]
  );
  if (!user) return null;

  const mathStats = await database.get(
    `SELECT COUNT(*)::int AS sessions, COALESCE(SUM(earnings), 0)::numeric AS earnings
     FROM math_game_sessions WHERE user_id = $1`,
    [userId]
  );

  const wordleStats = await database.get(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('won','lost'))::int AS games,
       COALESCE(SUM(earnings), 0)::numeric AS earnings,
       COALESCE(SUM(CASE WHEN status = 'won' THEN 10 ELSE 0 END), 0)::int AS xp
     FROM wordle_sessions WHERE user_id = $1`,
    [userId]
  );

  const jobGameStats = await database.get(
    `WITH job_sessions AS (${JOB_GAME_SESSIONS_UNION})
     SELECT COUNT(*)::int AS sessions,
            COALESCE(SUM(experience_points), 0)::int AS xp,
            COALESCE(SUM(earnings), 0)::numeric AS earnings
     FROM job_sessions`,
    [userId]
  );

  const taskMoney = await database.get(
    `SELECT COALESCE(SUM(t.amount), 0)::numeric AS total
     FROM transactions t
     JOIN accounts a ON t.to_account_id = a.id
     WHERE a.user_id = $1
       AND t.transaction_type IN ('deposit', 'transfer')
       AND (
         t.description ILIKE 'Salary for%'
         OR t.description ILIKE 'Basic salary%'
         OR t.description ILIKE 'Land purchase%'
         OR t.description ILIKE 'Town News story:%'
         OR t.description = 'CLASS_EVENT_SUGGESTION_EARN'
         OR t.description = 'FIVE_MINUTE_LESSON_EARN'
         OR t.description = 'ACCOUNTANT_CLIENT_ADVICE_EARN'
         OR t.description ILIKE 'Code Board%'
         OR t.description ILIKE 'Insurance %'
         OR t.description ILIKE 'Police bonus%'
         OR t.description ILIKE 'Cyber repair%'
         OR t.description ILIKE 'Tender%'
       )`,
    [userId]
  );

  const salaryMoney = await database.get(
    `SELECT COALESCE(SUM(t.amount), 0)::numeric AS total
     FROM transactions t
     JOIN accounts a ON t.to_account_id = a.id
     WHERE a.user_id = $1
       AND t.transaction_type IN ('deposit', 'transfer')
       AND (
         t.description ILIKE 'Salary for%'
         OR t.description ILIKE 'Basic salary%'
       )`,
    [userId]
  );

  const jobLevel = user.job_level || 1;
  const totalXp = user.job_experience_points || 0;
  const wordleXp = wordleStats?.xp ?? 0;
  const jobGameXp = jobGameStats?.xp ?? 0;
  const taskXp = Math.max(0, totalXp - wordleXp - jobGameXp);

  const mathEarnings = parseAmount(mathStats?.earnings);
  const wordleEarnings = parseAmount(wordleStats?.earnings);
  const jobGameEarnings = parseAmount(jobGameStats?.earnings);
  const salaryEarnings = parseAmount(salaryMoney?.total);
  const jobTaskEarnings = Math.max(0, parseAmount(taskMoney?.total) - salaryEarnings);

  return {
    job_level: jobLevel,
    job_experience_points: totalXp,
    job_name: user.job_name ?? null,
    account_balance: parseAmount(user.account_balance),
    xp: {
      wordle: wordleXp,
      job_challenge_games: jobGameXp,
      job_tasks_and_other: taskXp,
      total: totalXp,
    },
    money: {
      math_chores: mathEarnings,
      wordle: wordleEarnings,
      job_challenge_games: jobGameEarnings,
      salary: salaryEarnings,
      job_tasks: jobTaskEarnings,
      total_earned: mathEarnings + wordleEarnings + jobGameEarnings + salaryEarnings + jobTaskEarnings,
    },
    counts: {
      math_chores_sessions: mathStats?.sessions ?? 0,
      wordle_games: wordleStats?.games ?? 0,
      job_challenge_sessions: jobGameStats?.sessions ?? 0,
    },
  };
}
