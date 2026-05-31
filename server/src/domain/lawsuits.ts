import database from '../database/database-prod';
import { getXPForLevel } from '../routes/jobs';
import { hasHrDirectorJob } from './attendance';
import { getClassLawyerRoster, getLawyerIdsForStudent, hasLawyerJob } from './lawyer-assignments';
import { hasPoliceLieutenantJob } from './police-fines';
import { isTownClass, TownClass } from './townScope';

export const COURT_ROUTE_PATH = '/court';

export const LAWSUIT_PROCESS_COST = 10000;
export const LAWYER_LAWSUIT_FEE = 10000;
export const LAWYER_LAWSUIT_XP = 20;
export const DEFENSE_LAWYER_FEE = 5000;
export const DEFENSE_LAWYER_XP = 15;
export const JURY_LAWSUIT_XP = 10;
export const HR_MEDIATION_XP = 10;
export const LAWSUIT_CLAIM_CAP = 5000;
export const JURY_SIZE = 5;
export const JURY_MIN_ELIGIBLE = 3;

export const TERMINAL_STATUSES = ['approved', 'denied', 'withdrawn', 'resolved_mediation'] as const;
export const LAWYER_OPINIONS = ['recommend_approve', 'recommend_partial', 'recommend_dismiss'] as const;

export type LawsuitStatus =
  | 'pending_hr'
  | 'pending_lawyer'
  | 'pending_jury'
  | 'pending_teacher'
  | 'approved'
  | 'denied'
  | 'withdrawn'
  | 'resolved_mediation';

export type LinkedActionType =
  | 'police_fine_bonus'
  | 'cyber_attack'
  | 'doctor_illness'
  | 'land_sale';

export interface ProceedingsStep {
  key: string;
  label: string;
  state: 'complete' | 'current' | 'pending' | 'skipped';
  summary?: string;
  detail?: string;
  at?: string | null;
  waiting_message?: string;
}

let tablesReadyCache: boolean | null = null;

export async function tablesReady(): Promise<boolean> {
  if (tablesReadyCache === true) return true;
  try {
    await database.query('SELECT 1 FROM student_lawsuits LIMIT 1');
    tablesReadyCache = true;
    return true;
  } catch {
    return false;
  }
}

export async function isCourtPluginEnabled(schoolId: number | null): Promise<boolean> {
  try {
    if (schoolId != null) {
      const row = await database.get(
        `SELECT enabled FROM plugins
         WHERE route_path = $1 AND (school_id IS NULL OR school_id = $2)
         ORDER BY (school_id = $2) DESC NULLS LAST, id
         LIMIT 1`,
        [COURT_ROUTE_PATH, schoolId]
      );
      return !!row?.enabled;
    }
    const row = await database.get('SELECT enabled FROM plugins WHERE route_path = $1 AND school_id IS NULL LIMIT 1', [
      COURT_ROUTE_PATH,
    ]);
    return !!row?.enabled;
  } catch {
    return false;
  }
}

export async function awardJobXp(
  userId: number,
  xpAmount: number
): Promise<{ experience_points: number; new_level: number | null }> {
  const currentUser = await database.get(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1',
    [userId]
  );
  const currentLevel = currentUser?.job_level || 1;
  const currentXP = currentUser?.job_experience_points || 0;
  const newXP = currentXP + xpAmount;
  let newLevel = currentLevel;
  for (let level = currentLevel; level < 10; level++) {
    if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
    else break;
  }
  await database.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [
    newXP,
    newLevel,
    userId,
  ]);
  return {
    experience_points: xpAmount,
    new_level: newLevel > currentLevel ? newLevel : null,
  };
}

export async function checkStudentCanTransact(userId: number): Promise<{ canTransact: boolean; reason?: string }> {
  const account = await database.get('SELECT balance FROM accounts WHERE user_id = $1', [userId]);
  if (account && parseFloat(account.balance) < 0) {
    return {
      canTransact: false,
      reason: 'Your account has a negative balance. Please clear your debt before making any transactions.',
    };
  }
  const activeLoan = await database.get(
    `SELECT id FROM loans
     WHERE borrower_id = $1 AND status = 'active' AND due_date IS NOT NULL AND due_date < CURRENT_DATE`,
    [userId]
  );
  if (activeLoan) {
    return {
      canTransact: false,
      reason: 'You have an overdue loan payment. Please pay your loan before making transactions.',
    };
  }
  return { canTransact: true };
}

export async function getStudentBalance(userId: number): Promise<number> {
  const account = await database.get('SELECT balance FROM accounts WHERE user_id = $1', [userId]);
  return account ? parseFloat(account.balance) : 0;
}

export async function resolveLawyerSetup(
  plaintiffUserId: number,
  defendantUserId: number,
  townClass: string,
  schoolId: number | null
): Promise<{
  plaintiffLawyerId: number | null;
  defendantLawyerId: number | null;
  lawyerConflict: boolean;
  plaintiffAcceptance: 'pending' | 'not_required';
}> {
  const { lawyerIds } = await getClassLawyerRoster(townClass, schoolId);
  const plaintiffLawyerIds = await getLawyerIdsForStudent(plaintiffUserId, townClass, schoolId);
  const defendantLawyerIds = await getLawyerIdsForStudent(defendantUserId, townClass, schoolId);
  const plaintiffLawyerId = plaintiffLawyerIds[0] ?? null;
  const defendantLawyerId = defendantLawyerIds[0] ?? null;
  const shared =
    plaintiffLawyerId != null && defendantLawyerId != null && plaintiffLawyerId === defendantLawyerId;

  if (shared && lawyerIds.length === 1) {
    return {
      plaintiffLawyerId,
      defendantLawyerId: plaintiffLawyerId,
      lawyerConflict: false,
      plaintiffAcceptance: 'pending',
    };
  }

  if (shared) {
    return {
      plaintiffLawyerId: null,
      defendantLawyerId: null,
      lawyerConflict: true,
      plaintiffAcceptance: 'not_required',
    };
  }

  return {
    plaintiffLawyerId,
    defendantLawyerId,
    lawyerConflict: false,
    plaintiffAcceptance: !plaintiffLawyerId ? 'not_required' : 'pending',
  };
}

function plaintiffLawyerStepComplete(row: Record<string, unknown>): boolean {
  if (row.lawyer_conflict) return true;
  const acceptance = row.plaintiff_lawyer_acceptance as string;
  if (acceptance === 'not_required' || acceptance === 'declined') return true;
  if (acceptance === 'accepted' && row.plaintiff_lawyer_reviewed_at) return true;
  return false;
}

function defendantLawyerStepComplete(row: Record<string, unknown>): boolean {
  if (row.lawyer_conflict) return true;
  if (!row.defendant_lawyer_id) return true;
  return !!row.defendant_lawyer_reviewed_at;
}

export async function tryAdvanceToJury(lawsuitId: number): Promise<void> {
  const row = await database.get('SELECT * FROM student_lawsuits WHERE id = $1', [lawsuitId]);
  if (!row || row.status !== 'pending_lawyer') return;
  if (!plaintiffLawyerStepComplete(row) || !defendantLawyerStepComplete(row)) return;
  await seatJury(lawsuitId);
}

async function updateTownTreasury(
  client: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  schoolId: number | null,
  townClass: string,
  amount: number,
  description: string,
  createdBy: number | null
): Promise<void> {
  const absAmount = Math.abs(amount);
  if (schoolId != null) {
    await client.query(
      `UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP
       WHERE class = $2 AND school_id = $3`,
      [absAmount, townClass, schoolId]
    );
  } else {
    await client.query(
      `UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP
       WHERE class = $2 AND school_id IS NULL`,
      [absAmount, townClass]
    );
  }
  await client.query(
    `INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [schoolId, townClass, -absAmount, 'withdrawal', description, createdBy]
  );
}

export async function holdEscrow(lawsuitId: number, lawyerUserId: number): Promise<void> {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    const row = await client.query('SELECT * FROM student_lawsuits WHERE id = $1 FOR UPDATE', [lawsuitId]);
    const lawsuit = row.rows[0];
    if (!lawsuit || lawsuit.status !== 'pending_lawyer') {
      throw new Error('Case is not awaiting lawyer acceptance');
    }
    if (lawsuit.plaintiff_lawyer_acceptance !== 'pending') {
      throw new Error('Lawyer acceptance is not pending');
    }
    if (lawsuit.plaintiff_lawyer_id !== lawyerUserId) {
      throw new Error('You are not the plaintiff assigned lawyer');
    }

    const canTransact = await checkStudentCanTransact(lawsuit.plaintiff_user_id);
    if (!canTransact.canTransact) throw new Error(canTransact.reason || 'Plaintiff cannot transact');

    const accountRes = await client.query('SELECT id, balance FROM accounts WHERE user_id = $1 FOR UPDATE', [
      lawsuit.plaintiff_user_id,
    ]);
    const account = accountRes.rows[0];
    if (!account || parseFloat(account.balance) < LAWSUIT_PROCESS_COST) {
      throw new Error('Plaintiff does not have enough balance for the R10,000 process cost');
    }

    await client.query(
      'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [LAWSUIT_PROCESS_COST, account.id]
    );
    await client.query(
      `INSERT INTO transactions (from_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'withdrawal', $3)`,
      [account.id, LAWSUIT_PROCESS_COST, `Lawsuit escrow hold | case #${lawsuitId}`]
    );
    await client.query(
      `UPDATE student_lawsuits SET
         plaintiff_lawyer_acceptance = 'accepted',
         plaintiff_lawyer_accepted_at = CURRENT_TIMESTAMP,
         accepting_lawyer_id = $1,
         escrow_amount = $2,
         escrow_held_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [lawyerUserId, LAWSUIT_PROCESS_COST, lawsuitId]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function refundEscrowIfHeld(lawsuitId: number): Promise<void> {
  const row = await database.get(
    'SELECT * FROM student_lawsuits WHERE id = $1 AND escrow_held_at IS NOT NULL AND escrow_refunded_at IS NULL',
    [lawsuitId]
  );
  if (!row || !row.escrow_amount) return;

  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    const accountRes = await client.query('SELECT id FROM accounts WHERE user_id = $1 FOR UPDATE', [
      row.plaintiff_user_id,
    ]);
    const account = accountRes.rows[0];
    if (!account) throw new Error('Plaintiff account not found');
    const amount = parseFloat(String(row.escrow_amount));
    await client.query(
      'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [amount, account.id]
    );
    await client.query(
      `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`,
      [account.id, amount, `Lawsuit escrow refund | case #${lawsuitId}`]
    );
    await client.query(
      'UPDATE student_lawsuits SET escrow_refunded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [lawsuitId]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function payPlaintiffLawyerOnClose(
  lawsuit: Record<string, unknown>,
  client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }
): Promise<{ lawyerId?: number }> {
  if (!lawsuit.accepting_lawyer_id || lawsuit.lawyer_fee_paid_at || !lawsuit.escrow_held_at || lawsuit.escrow_refunded_at) {
    return {};
  }
  const lawyerId = lawsuit.accepting_lawyer_id as number;
  const accountRes = await client.query('SELECT id FROM accounts WHERE user_id = $1 FOR UPDATE', [lawyerId]);
  const account = accountRes.rows[0];
  if (!account) throw new Error('Lawyer account not found');
  await client.query(
    'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [LAWYER_LAWSUIT_FEE, account.id]
  );
  await client.query(
    `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
     VALUES ($1, $2, 'deposit', $3)`,
    [account.id, LAWYER_LAWSUIT_FEE, `Lawsuit legal fee | case #${lawsuit.id}`]
  );
  await client.query('UPDATE student_lawsuits SET lawyer_fee_paid_at = CURRENT_TIMESTAMP WHERE id = $1', [
    lawsuit.id,
  ]);
  return { lawyerId };
}

export async function payDefenseLawyerParticipation(
  lawsuitId: number,
  lawyerUserId: number
): Promise<{ experience_points: number; new_level: number | null }> {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query('SELECT * FROM student_lawsuits WHERE id = $1 FOR UPDATE', [lawsuitId]);
    const lawsuit = res.rows[0];
    if (!lawsuit || lawsuit.status !== 'pending_lawyer') {
      throw new Error('Case is not in lawyer review');
    }
    if (lawsuit.defendant_lawyer_id !== lawyerUserId) {
      throw new Error('You are not the defendant assigned lawyer');
    }
    if (lawsuit.defendant_lawyer_fee_paid_at) {
      throw new Error('Defense participation fee already paid');
    }

    const townRes = await client.query(
      'SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NOT DISTINCT FROM $2 FOR UPDATE',
      [lawsuit.town_class, lawsuit.school_id]
    );
    const town = townRes.rows[0];
    if (!town || parseFloat(town.treasury_balance) < DEFENSE_LAWYER_FEE) {
      throw new Error('Town treasury has insufficient funds for the defense lawyer participation fee');
    }

    await updateTownTreasury(
      client,
      lawsuit.school_id,
      lawsuit.town_class,
      DEFENSE_LAWYER_FEE,
      `Lawsuit defense participation | case #${lawsuitId}`,
      lawyerUserId
    );

    const accountRes = await client.query('SELECT id FROM accounts WHERE user_id = $1 FOR UPDATE', [lawyerUserId]);
    const account = accountRes.rows[0];
    if (!account) throw new Error('Lawyer account not found');
    await client.query(
      'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [DEFENSE_LAWYER_FEE, account.id]
    );
    await client.query(
      `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`,
      [account.id, DEFENSE_LAWYER_FEE, `Lawsuit defense participation | case #${lawsuitId}`]
    );
    await client.query(
      'UPDATE student_lawsuits SET defendant_lawyer_fee_paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [lawsuitId]
    );
    await client.query('COMMIT');
    return awardJobXp(lawyerUserId, DEFENSE_LAWYER_XP);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function isJuryEligibleStudent(
  userId: number,
  jobName: string | null | undefined
): Promise<boolean> {
  if (hasPoliceLieutenantJob(jobName) || hasHrDirectorJob(jobName) || hasLawyerJob(jobName)) {
    return false;
  }
  return true;
}

export async function seatJury(lawsuitId: number): Promise<void> {
  const lawsuit = await database.get('SELECT * FROM student_lawsuits WHERE id = $1', [lawsuitId]);
  if (!lawsuit) return;

  const eligible = await database.query(
    `SELECT u.id, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2
       AND u.id NOT IN ($3, $4)
       AND u.id NOT IN (
         SELECT ja.juror_user_id FROM lawsuit_jury_assignments ja
         JOIN student_lawsuits sl ON sl.id = ja.lawsuit_id
         WHERE sl.status = 'pending_jury' AND ja.voted_at IS NULL AND ja.lawsuit_id != $5
       )
     ORDER BY RANDOM()
     LIMIT $6`,
    [
      lawsuit.town_class,
      lawsuit.school_id,
      lawsuit.plaintiff_user_id,
      lawsuit.defendant_user_id,
      lawsuitId,
      JURY_SIZE,
    ]
  );

  const filtered: { id: number }[] = [];
  for (const s of eligible) {
    if (await isJuryEligibleStudent(s.id, s.job_name)) {
      filtered.push({ id: s.id });
    }
  }

  if (filtered.length < JURY_MIN_ELIGIBLE) {
    await database.query(
      `UPDATE student_lawsuits SET
         status = 'pending_teacher',
         jury_skipped_reason = 'insufficient_jurors',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [lawsuitId]
    );
    return;
  }

  for (const juror of filtered) {
    await database.query(
      'INSERT INTO lawsuit_jury_assignments (lawsuit_id, juror_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [lawsuitId, juror.id]
    );
  }
  await database.query(
    `UPDATE student_lawsuits SET status = 'pending_jury', jury_seated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [lawsuitId]
  );
}

export async function recordJuryVote(
  lawsuitId: number,
  jurorUserId: number,
  vote: 'guilty' | 'not_guilty'
): Promise<{ jury_complete: boolean; experience_points?: number; new_level?: number | null }> {
  const assignment = await database.get(
    `SELECT ja.* FROM lawsuit_jury_assignments ja
     JOIN student_lawsuits sl ON sl.id = ja.lawsuit_id
     WHERE ja.lawsuit_id = $1 AND ja.juror_user_id = $2 AND sl.status = 'pending_jury'`,
    [lawsuitId, jurorUserId]
  );
  if (!assignment) throw new Error('You are not assigned to this jury');
  if (assignment.vote) throw new Error('You have already voted on this case');

  await database.query(
    'UPDATE lawsuit_jury_assignments SET vote = $1, voted_at = CURRENT_TIMESTAMP WHERE id = $2',
    [vote, assignment.id]
  );
  const xp = await awardJobXp(jurorUserId, JURY_LAWSUIT_XP);

  const counts = await database.get(
    `SELECT
       COUNT(*) FILTER (WHERE vote = 'guilty')::int AS guilty,
       COUNT(*) FILTER (WHERE vote = 'not_guilty')::int AS not_guilty,
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE vote IS NOT NULL)::int AS voted
     FROM lawsuit_jury_assignments WHERE lawsuit_id = $1`,
    [lawsuitId]
  );

  if ((counts?.voted ?? 0) < (counts?.total ?? 0)) {
    return { jury_complete: false, experience_points: xp.experience_points, new_level: xp.new_level };
  }

  const guilty = counts?.guilty ?? 0;
  const notGuilty = counts?.not_guilty ?? 0;
  let verdict: string | null = 'hung';
  if (guilty > notGuilty) verdict = 'guilty';
  else if (notGuilty > guilty) verdict = 'not_guilty';

  await database.query(
    `UPDATE student_lawsuits SET
       status = 'pending_teacher',
       jury_verdict = $1,
       jury_guilty_votes = $2,
       jury_not_guilty_votes = $3,
       jury_completed_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [verdict, guilty, notGuilty, lawsuitId]
  );

  return { jury_complete: true, experience_points: xp.experience_points, new_level: xp.new_level };
}

export async function validateLinkedAction(
  type: LinkedActionType,
  actionId: number,
  plaintiffUserId: number,
  defendantUserId: number,
  schoolId: number | null,
  townClass: string
): Promise<boolean> {
  switch (type) {
    case 'police_fine_bonus': {
      const row = await database.get(
        `SELECT id FROM police_fine_bonus_requests
         WHERE id = $1 AND school_id IS NOT DISTINCT FROM $2 AND class = $3
           AND (submitted_by_id IN ($4, $5) OR target_user_id IN ($4, $5))`,
        [actionId, schoolId, townClass, plaintiffUserId, defendantUserId]
      );
      return !!row;
    }
    case 'cyber_attack': {
      const row = await database.get(
        `SELECT id FROM cyber_attack_assignments
         WHERE id = $1 AND school_id IS NOT DISTINCT FROM $2 AND town_class = $3
           AND (assigned_by_user_id IN ($4, $5) OR victim_user_id IN ($4, $5))`,
        [actionId, schoolId, townClass, plaintiffUserId, defendantUserId]
      );
      return !!row;
    }
    case 'doctor_illness': {
      const row = await database.get(
        `SELECT id FROM doctor_illness_assignments
         WHERE id = $1 AND school_id IS NOT DISTINCT FROM $2 AND town_class = $3
           AND (assigned_by_user_id IN ($4, $5) OR patient_user_id IN ($4, $5))`,
        [actionId, schoolId, townClass, plaintiffUserId, defendantUserId]
      );
      return !!row;
    }
    case 'land_sale': {
      const row = await database.get(
        `SELECT id FROM land_sale_requests
         WHERE id = $1 AND school_id IS NOT DISTINCT FROM $2
           AND (seller_id IN ($3, $4) OR buyer_id IN ($3, $4))`,
        [actionId, schoolId, plaintiffUserId, defendantUserId]
      );
      return !!row;
    }
    default:
      return false;
  }
}

export async function getLinkableActions(
  plaintiffUserId: number,
  defendantUserId: number,
  schoolId: number | null,
  townClass: string
): Promise<Array<{ type: LinkedActionType; id: number; label: string; created_at: string }>> {
  const results: Array<{ type: LinkedActionType; id: number; label: string; created_at: string }> = [];

  const fines = await database.query(
    `SELECT id, type, amount, description, created_at FROM police_fine_bonus_requests
     WHERE school_id IS NOT DISTINCT FROM $1 AND class = $2
       AND (submitted_by_id IN ($3, $4) OR target_user_id IN ($3, $4))
     ORDER BY created_at DESC LIMIT 20`,
    [schoolId, townClass, plaintiffUserId, defendantUserId]
  );
  for (const f of fines) {
    results.push({
      type: 'police_fine_bonus',
      id: f.id,
      label: `Police ${f.type} R${f.amount}${f.description ? `: ${f.description}` : ''}`,
      created_at: f.created_at,
    });
  }

  try {
    const cyber = await database.query(
      `SELECT id, attack_type, assigned_at AS created_at FROM cyber_attack_assignments
       WHERE school_id IS NOT DISTINCT FROM $1 AND town_class = $2
         AND (assigned_by_user_id IN ($3, $4) OR victim_user_id IN ($3, $4))
       ORDER BY assigned_at DESC LIMIT 20`,
      [schoolId, townClass, plaintiffUserId, defendantUserId]
    );
    for (const c of cyber) {
      results.push({
        type: 'cyber_attack',
        id: c.id,
        label: `Cyber attack: ${c.attack_type || 'attack'}`,
        created_at: c.created_at,
      });
    }
  } catch {
    /* table may not exist */
  }

  try {
    const illness = await database.query(
      `SELECT id, illness_type, assigned_at AS created_at FROM doctor_illness_assignments
       WHERE school_id IS NOT DISTINCT FROM $1 AND town_class = $2
         AND (assigned_by_user_id IN ($3, $4) OR patient_user_id IN ($3, $4))
       ORDER BY assigned_at DESC LIMIT 20`,
      [schoolId, townClass, plaintiffUserId, defendantUserId]
    );
    for (const d of illness) {
      results.push({
        type: 'doctor_illness',
        id: d.id,
        label: `Doctor illness: ${d.illness_type || 'illness'}`,
        created_at: d.created_at,
      });
    }
  } catch {
    /* table may not exist */
  }

  try {
    const land = await database.query(
      `SELECT id, sale_price, created_at FROM land_sale_requests
       WHERE school_id IS NOT DISTINCT FROM $1
         AND (seller_id IN ($2, $3) OR buyer_id IN ($2, $3))
       ORDER BY created_at DESC LIMIT 20`,
      [schoolId, plaintiffUserId, defendantUserId]
    );
    for (const l of land) {
      results.push({
        type: 'land_sale',
        id: l.id,
        label: `Land sale R${l.sale_price}`,
        created_at: l.created_at,
      });
    }
  } catch {
    /* table may not exist */
  }

  return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function buildProceedingsTimeline(
  row: Record<string, unknown>,
  juryAssignments?: Array<{ vote: string | null; voted_at: string | null }>
): ProceedingsStep[] {
  const status = row.status as string;
  const isTerminal = TERMINAL_STATUSES.includes(status as (typeof TERMINAL_STATUSES)[number]);
  const juryTotal = juryAssignments?.length ?? 0;
  const juryVoted = juryAssignments?.filter((j) => j.vote).length ?? 0;

  const stepState = (stepKey: string): ProceedingsStep['state'] => {
    if (isTerminal) return stepKey === 'outcome' || isStepComplete(row, stepKey) ? 'complete' : 'skipped';
    const current = getCurrentStepKey(row, juryTotal, juryVoted);
    const order = ['filed', 'hr', 'plaintiff_lawyer', 'defense_lawyer', 'jury', 'teacher', 'outcome'];
    const stepIdx = order.indexOf(stepKey);
    const currentIdx = order.indexOf(current);
    if (stepIdx < currentIdx) return isStepComplete(row, stepKey) ? 'complete' : 'skipped';
    if (stepIdx === currentIdx) return 'current';
    return 'pending';
  };

  const steps: ProceedingsStep[] = [
    {
      key: 'filed',
      label: 'Case filed',
      state: stepState('filed'),
      at: row.created_at as string,
      summary: `Claim R${row.claim_amount} against defendant`,
      detail: `${row.description}\n\nRule cited: ${row.rule_reference}`,
    },
    {
      key: 'hr',
      label: 'HR mediation',
      state: stepState('hr'),
      at: (row.hr_reviewed_at as string) || null,
      summary: row.hr_outcome ? String(row.hr_outcome).replace(/_/g, ' ') : undefined,
      detail: row.hr_notes as string | undefined,
    },
    {
      key: 'plaintiff_lawyer',
      label: 'Plaintiff counsel',
      state: stepState('plaintiff_lawyer'),
      at: (row.plaintiff_lawyer_reviewed_at as string) || (row.plaintiff_lawyer_declined_at as string) || null,
      summary: row.lawyer_conflict
        ? 'Conflict of interest — same lawyer for both sides'
        : row.plaintiff_lawyer_id &&
            row.defendant_lawyer_id &&
            row.plaintiff_lawyer_id === row.defendant_lawyer_id
          ? row.plaintiff_lawyer_opinion
            ? String(row.plaintiff_lawyer_opinion).replace(/_/g, ' ')
            : row.plaintiff_lawyer_acceptance === 'accepted'
              ? 'Single town lawyer — awaiting plaintiff opinion'
              : 'Single town lawyer — awaiting accept'
          : row.plaintiff_lawyer_acceptance === 'not_required'
            ? 'No assigned lawyer'
            : row.plaintiff_lawyer_acceptance === 'declined'
              ? 'Lawyer declined'
              : row.plaintiff_lawyer_opinion
                ? String(row.plaintiff_lawyer_opinion).replace(/_/g, ' ')
                : row.plaintiff_lawyer_acceptance === 'accepted'
                  ? 'Accepted — awaiting opinion'
                  : 'Awaiting accept/decline',
      detail: row.plaintiff_lawyer_notes as string | undefined,
    },
    {
      key: 'defense_lawyer',
      label: 'Defense counsel',
      state: stepState('defense_lawyer'),
      at: row.defendant_lawyer_reviewed_at as string | null,
      summary: row.lawyer_conflict
        ? 'Skipped — conflict of interest'
        : !row.defendant_lawyer_id
          ? 'No assigned lawyer'
          : row.plaintiff_lawyer_id &&
              row.defendant_lawyer_id &&
              row.plaintiff_lawyer_id === row.defendant_lawyer_id
            ? row.defendant_lawyer_opinion
              ? String(row.defendant_lawyer_opinion).replace(/_/g, ' ')
              : 'Single town lawyer — awaiting defense opinion'
            : row.defendant_lawyer_opinion
              ? String(row.defendant_lawyer_opinion).replace(/_/g, ' ')
              : 'Awaiting defense opinion',
      detail: row.defendant_lawyer_notes as string | undefined,
    },
    {
      key: 'jury',
      label: 'Jury',
      state: stepState('jury'),
      at: (row.jury_completed_at as string) || (row.jury_seated_at as string) || null,
      summary: row.jury_skipped_reason
        ? 'Jury skipped — insufficient jurors'
        : row.jury_verdict
          ? `${row.jury_verdict} (${row.jury_guilty_votes}-${row.jury_not_guilty_votes})`
          : status === 'pending_jury'
            ? `Awaiting votes (${juryVoted}/${juryTotal})`
            : row.hr_outcome === 'settlement_recommended'
              ? 'Skipped — HR settlement'
              : undefined,
      waiting_message: status === 'pending_jury' ? `Awaiting jury votes — ${juryVoted} of ${juryTotal} cast` : undefined,
    },
    {
      key: 'teacher',
      label: 'Teacher decision',
      state: stepState('teacher'),
      at: row.teacher_reviewed_at as string | null,
      summary:
        status === 'approved'
          ? `Approved — R${row.awarded_amount} awarded`
          : status === 'denied'
            ? 'Denied'
            : status === 'pending_teacher'
              ? 'Awaiting teacher review'
              : undefined,
      detail: (row.teacher_notes as string) || (row.denial_reason as string) || undefined,
    },
    {
      key: 'outcome',
      label: 'Outcome',
      state: isTerminal ? 'complete' : stepState('outcome'),
      at: (row.teacher_reviewed_at as string) || (row.hr_reviewed_at as string) || null,
      summary: status.replace(/_/g, ' '),
    },
  ];

  return steps;
}

function isStepComplete(row: Record<string, unknown>, stepKey: string): boolean {
  switch (stepKey) {
    case 'filed':
      return true;
    case 'hr':
      return !!row.hr_reviewed_at || (TERMINAL_STATUSES as readonly string[]).includes(row.status as string);
    case 'plaintiff_lawyer':
      return plaintiffLawyerStepComplete(row);
    case 'defense_lawyer':
      return defendantLawyerStepComplete(row);
    case 'jury':
      return !!row.jury_completed_at || !!row.jury_skipped_reason || row.hr_outcome === 'settlement_recommended';
    case 'teacher':
      return row.status === 'approved' || row.status === 'denied';
    case 'outcome':
      return (TERMINAL_STATUSES as readonly string[]).includes(row.status as string);
    default:
      return false;
  }
}

function getCurrentStepKey(row: Record<string, unknown>, juryTotal: number, juryVoted: number): string {
  const status = row.status as string;
  if (status === 'pending_hr') return 'hr';
  if (status === 'pending_lawyer') {
    if (!plaintiffLawyerStepComplete(row)) return 'plaintiff_lawyer';
    if (!defendantLawyerStepComplete(row)) return 'defense_lawyer';
    return 'plaintiff_lawyer';
  }
  if (status === 'pending_jury') return 'jury';
  if (status === 'pending_teacher') return 'teacher';
  if (TERMINAL_STATUSES.includes(status as (typeof TERMINAL_STATUSES)[number])) return 'outcome';
  return 'filed';
}

export const LAWSUIT_LIST_SELECT = `
  sl.*,
  p.username AS plaintiff_username,
  p.first_name AS plaintiff_first_name,
  p.last_name AS plaintiff_last_name,
  d.username AS defendant_username,
  d.first_name AS defendant_first_name,
  d.last_name AS defendant_last_name,
  hr.username AS hr_reviewer_username,
  tr.username AS teacher_reviewer_username,
  pl.username AS plaintiff_lawyer_username,
  dl.username AS defendant_lawyer_username,
  al.username AS accepting_lawyer_username
`;

export const LAWSUIT_LIST_JOINS = `
  FROM student_lawsuits sl
  JOIN users p ON p.id = sl.plaintiff_user_id
  JOIN users d ON d.id = sl.defendant_user_id
  LEFT JOIN users hr ON hr.id = sl.hr_reviewer_id
  LEFT JOIN users tr ON tr.id = sl.teacher_reviewer_id
  LEFT JOIN users pl ON pl.id = sl.plaintiff_lawyer_id
  LEFT JOIN users dl ON dl.id = sl.defendant_lawyer_id
  LEFT JOIN users al ON al.id = sl.accepting_lawyer_id
`;

export function isValidTownClassForLawsuit(value: unknown): value is TownClass {
  return isTownClass(value);
}
