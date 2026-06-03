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

const JOB_GAME_SESSIONS_DETAIL_UNION = `
  SELECT 'architect'::text AS job_key, id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM architect_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'accountant', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM accountant_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'software_engineer', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM software_engineer_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'marketing_manager', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM marketing_manager_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'graphic_designer', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM graphic_designer_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'journalist', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM journalist_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'event_planner', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM event_planner_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'financial_manager', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM financial_manager_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'hr_director', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM hr_director_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'police_lieutenant', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM police_lieutenant_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'lawyer', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM lawyer_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'town_planner', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM town_planner_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'electrical_engineer', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM electrical_engineer_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'civil_engineer', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM civil_engineer_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'principal', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM principal_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'teacher', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM teacher_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'nurse', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM nurse_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'doctor', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM doctor_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'retail_manager', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM retail_manager_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'entrepreneur', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM entrepreneur_game_sessions WHERE user_id = $1
  UNION ALL SELECT 'insurance_manager', id, difficulty, experience_points, earnings, played_at, score, correct_answers, total_problems
  FROM insurance_manager_game_sessions WHERE user_id = $1
`;

const JOB_GAME_LABELS: Record<string, string> = {
  architect: 'Architect challenge',
  accountant: 'Accountant challenge',
  software_engineer: 'Software Engineer challenge',
  marketing_manager: 'Marketing Manager challenge',
  graphic_designer: 'Graphic Designer challenge',
  journalist: 'Journalist challenge',
  event_planner: 'Event Planner challenge',
  financial_manager: 'Financial Manager challenge',
  hr_director: 'HR Director challenge',
  police_lieutenant: 'Police Lieutenant challenge',
  lawyer: 'Lawyer challenge',
  town_planner: 'Town Planner challenge',
  electrical_engineer: 'Electrical Engineer challenge',
  civil_engineer: 'Civil Engineer challenge',
  principal: 'Principal challenge',
  teacher: 'Teacher challenge',
  nurse: 'Nurse challenge',
  doctor: 'Doctor challenge',
  retail_manager: 'Retail Manager challenge',
  entrepreneur: 'Entrepreneur challenge',
  insurance_manager: 'Insurance Manager challenge',
};

const ACTIVITY_HISTORY_LIMIT = 150;

export type EarningsActivitySource =
  | 'wordle'
  | 'math_chores'
  | 'job_challenge_game'
  | 'salary'
  | 'job_task';

export interface StudentEarningsActivityItem {
  id: string;
  source: EarningsActivitySource;
  label: string;
  detail?: string;
  xp?: number;
  money?: number;
  occurred_at: string;
}

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
  xp_history: StudentEarningsActivityItem[];
  money_history: StudentEarningsActivityItem[];
}

function parseAmount(value: unknown): number {
  const n = parseFloat(String(value ?? 0));
  return Number.isFinite(n) ? n : 0;
}

function parseIntSafe(value: unknown): number {
  const n = parseInt(String(value ?? 0), 10);
  return Number.isFinite(n) ? n : 0;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function classifyTransaction(description: string): { source: EarningsActivitySource; label: string } {
  const d = description || '';
  if (/^Salary for/i.test(d) || /^Basic salary/i.test(d)) {
    return { source: 'salary', label: d.startsWith('Basic') ? 'Basic salary (unemployed)' : 'Salary payment' };
  }
  if (d === 'CLASS_EVENT_SUGGESTION_EARN') {
    return { source: 'job_task', label: 'Class event suggestion approved' };
  }
  if (d === 'FIVE_MINUTE_LESSON_EARN') {
    return { source: 'job_task', label: 'Five minute lesson approved' };
  }
  if (d === 'ACCOUNTANT_CLIENT_ADVICE_EARN') {
    return { source: 'job_task', label: 'Accountant client advice' };
  }
  if (d === 'ACCOUNTANT_TRANSFER_APPROVAL_EARN') {
    return { source: 'job_task', label: 'Transfer approval fee' };
  }
  if (d === 'POLICE_BONUS_SUBMISSION_EARN') {
    return { source: 'job_task', label: 'Police bonus submission fee' };
  }
  if (d === 'POLICE_FINE_SUBMISSION_EARN') {
    return { source: 'job_task', label: 'Police fine submission fee' };
  }
  if (/^Town News story:/i.test(d)) {
    return { source: 'job_task', label: 'Town news story approved' };
  }
  if (/^Land purchase/i.test(d)) {
    return { source: 'job_task', label: 'Land purchase review fee' };
  }
  if (/^Police bonus/i.test(d)) {
    return { source: 'job_task', label: 'Police bonus approved' };
  }
  if (/^Code Board/i.test(d)) {
    return { source: 'job_task', label: 'Code Board reward' };
  }
  if (/^Insurance /i.test(d) || d === 'INSURANCE_BROKER_EARN') {
    return { source: 'job_task', label: 'Insurance broker work' };
  }
  if (/^Cyber repair/i.test(d)) {
    return { source: 'job_task', label: 'Cyber repair approval' };
  }
  if (/^Tender/i.test(d)) {
    return { source: 'job_task', label: 'Tender payment' };
  }
  return { source: 'job_task', label: 'Job task payment' };
}

function isTrackedEarningTransaction(description: string): boolean {
  const d = description || '';
  return (
    /^Salary for/i.test(d) ||
    /^Basic salary/i.test(d) ||
    /^Land purchase/i.test(d) ||
    /^Town News story:/i.test(d) ||
    d === 'CLASS_EVENT_SUGGESTION_EARN' ||
    d === 'FIVE_MINUTE_LESSON_EARN' ||
    d === 'ACCOUNTANT_CLIENT_ADVICE_EARN' ||
    d === 'ACCOUNTANT_TRANSFER_APPROVAL_EARN' ||
    d === 'INSURANCE_BROKER_EARN' ||
    d === 'POLICE_BONUS_SUBMISSION_EARN' ||
    d === 'POLICE_FINE_SUBMISSION_EARN' ||
    /^Code Board/i.test(d) ||
    /^Insurance /i.test(d) ||
    /^Police bonus/i.test(d) ||
    /^Cyber repair/i.test(d) ||
    /^Tender/i.test(d)
  );
}

async function buildStudentEarningsActivity(
  userId: number
): Promise<{ xp_history: StudentEarningsActivityItem[]; money_history: StudentEarningsActivityItem[] }> {
  const xpItems: StudentEarningsActivityItem[] = [];
  const moneyItems: StudentEarningsActivityItem[] = [];

  const mathSessions = await database.query(
    `SELECT id, difficulty, score, correct_answers, total_problems, earnings, played_at
     FROM math_game_sessions WHERE user_id = $1 ORDER BY played_at DESC LIMIT $2`,
    [userId, ACTIVITY_HISTORY_LIMIT]
  );
  for (const row of mathSessions) {
    const earnings = parseAmount(row.earnings);
    const item: StudentEarningsActivityItem = {
      id: `math-${row.id}`,
      source: 'math_chores',
      label: 'Math chores',
      detail: `${capitalize(row.difficulty)} · ${row.correct_answers}/${row.total_problems} correct · score ${row.score}`,
      money: earnings > 0 ? earnings : undefined,
      occurred_at: row.played_at,
    };
    if (earnings > 0) moneyItems.push(item);
  }

  const wordleSessions = await database.query(
    `SELECT id, status, guesses_count, earnings, played_at
     FROM wordle_sessions
     WHERE user_id = $1 AND status IN ('won', 'lost')
     ORDER BY played_at DESC LIMIT $2`,
    [userId, ACTIVITY_HISTORY_LIMIT]
  );
  for (const row of wordleSessions) {
    const earnings = parseAmount(row.earnings);
    const xp = row.status === 'won' ? 10 : 0;
    const base = {
      id: `wordle-${row.id}`,
      source: 'wordle' as const,
      label: 'Wordle chores',
      detail: `${row.status === 'won' ? 'Won' : 'Lost'} in ${row.guesses_count} guess${row.guesses_count === 1 ? '' : 'es'}`,
      occurred_at: row.played_at,
    };
    if (xp > 0) xpItems.push({ ...base, xp });
    if (earnings > 0) moneyItems.push({ ...base, money: earnings });
  }

  const jobSessions = await database.query(
    `SELECT * FROM (${JOB_GAME_SESSIONS_DETAIL_UNION}) s ORDER BY played_at DESC LIMIT $2`,
    [userId, ACTIVITY_HISTORY_LIMIT]
  );
  for (const row of jobSessions) {
    const xp = parseIntSafe(row.experience_points);
    const earnings = parseAmount(row.earnings);
    const jobLabel = JOB_GAME_LABELS[row.job_key] || 'Job challenge game';
    const base = {
      id: `job-${row.job_key}-${row.id}`,
      source: 'job_challenge_game' as const,
      label: jobLabel,
      detail: `${capitalize(row.difficulty)} · ${row.correct_answers}/${row.total_problems} correct · score ${row.score}`,
      occurred_at: row.played_at,
    };
    if (xp > 0) xpItems.push({ ...base, xp });
    if (earnings > 0) moneyItems.push({ ...base, money: earnings });
  }

  const taskTransactions = await database.query(
    `SELECT t.id, t.amount, t.description, t.created_at
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
         OR t.description = 'ACCOUNTANT_TRANSFER_APPROVAL_EARN'
         OR t.description = 'POLICE_BONUS_SUBMISSION_EARN'
         OR t.description = 'POLICE_FINE_SUBMISSION_EARN'
         OR t.description ILIKE 'Code Board%'
         OR t.description ILIKE 'Insurance %'
         OR t.description = 'INSURANCE_BROKER_EARN'
         OR t.description ILIKE 'Police bonus%'
         OR t.description ILIKE 'Cyber repair%'
         OR t.description ILIKE 'Tender%'
       )
     ORDER BY t.created_at DESC
     LIMIT $2`,
    [userId, ACTIVITY_HISTORY_LIMIT]
  );
  for (const row of taskTransactions) {
    const amount = parseAmount(row.amount);
    if (amount <= 0 || !isTrackedEarningTransaction(row.description)) continue;
    const { source, label } = classifyTransaction(row.description);
    const detail =
      row.description === label || row.description === 'CLASS_EVENT_SUGGESTION_EARN' ||
      row.description === 'FIVE_MINUTE_LESSON_EARN' ||
      row.description === 'ACCOUNTANT_CLIENT_ADVICE_EARN' ||
      row.description === 'ACCOUNTANT_TRANSFER_APPROVAL_EARN' ||
      row.description === 'POLICE_BONUS_SUBMISSION_EARN' ||
      row.description === 'POLICE_FINE_SUBMISSION_EARN'
        ? undefined
        : row.description;
    moneyItems.push({
      id: `tx-${row.id}`,
      source,
      label,
      detail,
      money: amount,
      occurred_at: row.created_at,
    });
  }

  const sortNewest = (a: StudentEarningsActivityItem, b: StudentEarningsActivityItem) =>
    new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();

  return {
    xp_history: xpItems.sort(sortNewest).slice(0, ACTIVITY_HISTORY_LIMIT),
    money_history: moneyItems.sort(sortNewest).slice(0, ACTIVITY_HISTORY_LIMIT),
  };
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
         OR t.description = 'ACCOUNTANT_TRANSFER_APPROVAL_EARN'
         OR t.description = 'POLICE_BONUS_SUBMISSION_EARN'
         OR t.description = 'POLICE_FINE_SUBMISSION_EARN'
         OR t.description ILIKE 'Code Board%'
         OR t.description ILIKE 'Insurance %'
         OR t.description = 'INSURANCE_BROKER_EARN'
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

  const activity = await buildStudentEarningsActivity(userId);

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
    xp_history: activity.xp_history,
    money_history: activity.money_history,
  };
}
