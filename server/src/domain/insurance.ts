import database from '../database/database-prod';
import { getXPForLevel } from '../routes/jobs';
import { resolveDoctorNetEarnings } from './doctor-reputation';

export const INSURANCE_RATE = 0.05;
export const INSURANCE_BROKER_EARNINGS = 500;
export const INSURANCE_BROKER_XP = 5;
/** Max rewarded broker actions per broker per game day (resets 04:00). */
export const INSURANCE_BROKER_DAILY_REWARD_LIMIT = 10;
export const INSURANCE_BROKER_EARN_DESCRIPTION = 'INSURANCE_BROKER_EARN';

const GAME_DAY_START_SQL = `
  CASE
    WHEN CURRENT_TIME < '04:00:00'
    THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
    ELSE CURRENT_DATE + INTERVAL '4 hours'
  END
`;
export const INSURANCE_TEACHER_REFUND_RATE = 0.9;
export const VALID_INSURANCE_TYPES = ['health', 'cyber', 'property'] as const;
export type InsuranceType = (typeof VALID_INSURANCE_TYPES)[number];
export type InsurancePurchaseStatus = 'pending_broker' | 'approved' | 'denied' | 'refunded';

const SA_TIMEZONE = 'Africa/Johannesburg';

export function todayInSA(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

export function toDateString(val: Date | string | null | undefined): string {
  if (val == null) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateUTC(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isPolicyCoverageActive(
  weekStart: string | null | undefined,
  weeks: number,
  today: string = todayInSA()
): boolean {
  const startStr = toDateString(weekStart);
  if (!startStr) return false;
  const [y, m, day] = startStr.split('-').map(Number);
  const startUTC = Date.UTC(y, m - 1, day);
  const endUTC = startUTC + (weeks * 7 - 1) * 24 * 60 * 60 * 1000;
  const end = formatDateUTC(new Date(endUTC));
  return today >= startStr && today <= end;
}

export function isPolicyEffectivelyActive(
  status: string,
  weekStart: string | null | undefined,
  weeks: number,
  today: string = todayInSA()
): boolean {
  return isPolicyProvidingCoverage(status, weekStart, weeks, today);
}

/** Premium paid; coverage applies while approved or awaiting broker sign-off (denial refunds premium). */
export function isPolicyProvidingCoverage(
  status: string,
  weekStart: string | null | undefined,
  weeks: number,
  today: string = todayInSA()
): boolean {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'denied' || normalized === 'refunded') return false;
  if (normalized !== 'approved' && normalized !== 'pending_broker') return false;
  return isPolicyCoverageActive(weekStart, weeks, today);
}

export function resolvePolicyWeekStartDate(
  weekStart: string | Date | null | undefined,
  createdAt: string | Date | null | undefined,
  today: string = todayInSA()
): string {
  const fromWeekStart = toDateString(weekStart);
  if (fromWeekStart) return fromWeekStart;
  const fromCreated = toDateString(createdAt);
  return fromCreated || today;
}

export function isInsuranceBrokerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('insurance');
}

export function calculateTeacherRefundAmount(totalCost: number): number {
  return Math.round(totalCost * INSURANCE_TEACHER_REFUND_RATE * 100) / 100;
}

export function canTeacherRefundInsuranceStatus(status: string): boolean {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'approved' || normalized === 'pending_broker';
}

export interface InsuranceBroker {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
}

export async function getClassInsuranceBrokers(
  schoolId: number | null,
  townClass: string
): Promise<InsuranceBroker[]> {
  const params: unknown[] = [townClass];
  let schoolFilter = 'u.school_id IS NULL';
  if (schoolId !== null) {
    schoolFilter = 'u.school_id = $2';
    params.push(schoolId);
  }

  return database.query(
    `SELECT u.id, u.username, u.first_name, u.last_name
     FROM users u
     JOIN jobs j ON j.id = u.job_id
     WHERE u.role = 'student'
       AND u.status = 'approved'
       AND u.class = $1
       AND ${schoolFilter}
       AND LOWER(j.name) LIKE '%insurance%'
     ORDER BY u.id`,
    params
  );
}

export async function classRequiresBrokerApproval(
  schoolId: number | null,
  townClass: string | null | undefined,
  requestingUserId?: number | null
): Promise<boolean> {
  if (!townClass) return false;
  const brokers = await getClassInsuranceBrokers(schoolId, townClass);
  if (requestingUserId != null) {
    return brokers.some((b) => b.id !== requestingUserId);
  }
  return brokers.length > 0;
}

export async function getDisabledInsuranceTypes(schoolId: number | null): Promise<InsuranceType[]> {
  if (schoolId === null) return [];
  try {
    const rows = await database.query(
      `SELECT insurance_type FROM insurance_disabled_types WHERE school_id = $1`,
      [schoolId]
    );
    return (rows as Array<{ insurance_type: string }>)
      .map((r) => r.insurance_type)
      .filter((t): t is InsuranceType => VALID_INSURANCE_TYPES.includes(t as InsuranceType));
  } catch {
    return [];
  }
}

export async function getEnabledInsuranceTypes(schoolId: number | null): Promise<InsuranceType[]> {
  const disabled = await getDisabledInsuranceTypes(schoolId);
  return VALID_INSURANCE_TYPES.filter((t) => !disabled.includes(t));
}

export async function getInsuranceTypeSettings(schoolId: number | null): Promise<
  Array<{ id: InsuranceType; enabled: boolean }>
> {
  const disabled = new Set(await getDisabledInsuranceTypes(schoolId));
  return VALID_INSURANCE_TYPES.map((id) => ({
    id,
    enabled: !disabled.has(id),
  }));
}

export async function setInsuranceTypeEnabled(
  schoolId: number,
  insuranceType: InsuranceType,
  enabled: boolean,
  teacherUserId: number
): Promise<void> {
  if (enabled) {
    await database.query(
      `DELETE FROM insurance_disabled_types WHERE school_id = $1 AND insurance_type = $2`,
      [schoolId, insuranceType]
    );
    return;
  }
  await database.query(
    `INSERT INTO insurance_disabled_types (school_id, insurance_type, disabled_by, disabled_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (school_id, insurance_type) DO UPDATE
       SET disabled_by = EXCLUDED.disabled_by,
           disabled_at = CURRENT_TIMESTAMP`,
    [schoolId, insuranceType, teacherUserId]
  );
}

export async function hasActiveApprovedHealthInsurance(userId: number): Promise<boolean> {
  return hasActiveApprovedInsuranceOfType(userId, 'health');
}

export async function hasActiveApprovedCyberInsurance(userId: number): Promise<boolean> {
  return hasActiveApprovedInsuranceOfType(userId, 'cyber');
}

async function hasActiveApprovedInsuranceOfType(
  userId: number,
  insuranceType: InsuranceType
): Promise<boolean> {
  const today = todayInSA();
  const rows = await database.query(
    `SELECT weeks, week_start_date, status, created_at
     FROM insurance_purchases
     WHERE user_id = $1 AND insurance_type = $2 AND status IN ('approved', 'pending_broker')
     ORDER BY created_at DESC`,
    [userId, insuranceType]
  );

  return (
    rows as Array<{
      weeks: number;
      week_start_date: string | null;
      status: string;
      created_at: string | Date;
    }>
  ).some((p) =>
    isPolicyProvidingCoverage(
      p.status,
      resolvePolicyWeekStartDate(p.week_start_date, p.created_at, today),
      p.weeks,
      today
    )
  );
}

type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<unknown>;
};

export async function payHealthInsuranceClinicClaim(
  executor: Queryable,
  assignmentId: number,
  doctorUserId: number,
  doctorAccountId: number,
  cureFee: number,
  illnessType: string,
  opts?: { townClass?: string | null; schoolId?: number | null }
): Promise<void> {
  const { netAmount: doctorPay, reputation } = await resolveDoctorNetEarnings(doctorUserId, cureFee);
  const withheld = Math.round((cureFee - doctorPay) * 100) / 100;

  await executor.query(
    'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [doctorPay, doctorAccountId]
  );
  const description =
    reputation.penalty_label && withheld > 0
      ? `Health insurance claim — ${illnessType} clinic fee (R${doctorPay.toFixed(2)} after reputation penalty)`
      : `Health insurance claim — ${illnessType} clinic fee (awaiting doctor approval)`;
  await executor.query(
    `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
     VALUES (NULL, $1, $2, 'insurance', $3)`,
    [doctorAccountId, doctorPay, description]
  );

  if (withheld > 0 && opts?.townClass) {
    if (opts.schoolId != null) {
      await executor.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
        [withheld, opts.townClass, opts.schoolId]
      );
    } else {
      await executor.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
        [withheld, opts.townClass]
      );
    }
    await executor.query(
      `INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
       VALUES ($1, $2, $3, 'deposit', $4, $5)`,
      [opts.schoolId ?? null, opts.townClass, withheld, 'Doctor clinic reputation withholding (insurance)', doctorUserId]
    );
  }
  await executor.query(
    `UPDATE doctor_illness_assignments
     SET cure_requested_at = CURRENT_TIMESTAMP,
         cure_paid_at = CURRENT_TIMESTAMP,
         paid_by_insurance = TRUE
     WHERE id = $1`,
    [assignmentId]
  );
}

export async function payCyberInsuranceRepairClaim(
  executor: Queryable,
  assignmentId: number,
  engineerAccountId: number,
  repairFee: number,
  attackType: string
): Promise<void> {
  await executor.query(
    'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [repairFee, engineerAccountId]
  );
  await executor.query(
    `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
     VALUES (NULL, $1, $2, 'insurance', $3)`,
    [
      engineerAccountId,
      repairFee,
      `Cyber insurance claim — ${attackType} IT repair fee (awaiting engineer approval)`,
    ]
  );
  await executor.query(
    `UPDATE cyber_attack_assignments
     SET repair_requested_at = CURRENT_TIMESTAMP,
         repair_paid_at = CURRENT_TIMESTAMP,
         paid_by_insurance = TRUE
     WHERE id = $1`,
    [assignmentId]
  );
}

export type InsuranceBrokerRewardInput = {
  /** Premium or claim amount — purchase rewards are capped at this value. */
  referenceAmount?: number;
  /** Skip reward when another type in the same purchase batch was already approved. */
  purchaseBatchAlreadyRewarded?: boolean;
};

export type InsuranceBrokerRewardResult = {
  earnings: number;
  experience_points: number;
  new_level: number | null;
  reward_skipped_reason: string | null;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

async function countBrokerRewardsToday(
  executor: Queryable,
  brokerUserId: number
): Promise<number> {
  const result = (await executor.query(
    `SELECT COUNT(*)::int AS count
     FROM transactions t
     JOIN accounts a ON t.to_account_id = a.id
     WHERE a.user_id = $1
       AND t.transaction_type = 'deposit'
       AND t.description = $2
       AND t.created_at >= (${GAME_DAY_START_SQL})`,
    [brokerUserId, INSURANCE_BROKER_EARN_DESCRIPTION]
  )) as { rows: Array<{ count: number | string }> };
  const row = result.rows?.[0];
  return typeof row?.count === 'number' ? row.count : parseInt(String(row?.count ?? '0'), 10) || 0;
}

export async function purchaseBatchAlreadyRewarded(
  executor: Queryable,
  brokerUserId: number,
  applicantUserId: number,
  purchaseCreatedAt: string | Date,
  purchaseId: number
): Promise<boolean> {
  const result = (await executor.query(
    `SELECT EXISTS (
       SELECT 1
       FROM insurance_purchases
       WHERE user_id = $1
         AND created_at = $2::timestamp
         AND status = 'approved'
         AND reviewed_by = $3
         AND id != $4
     ) AS exists`,
    [applicantUserId, purchaseCreatedAt, brokerUserId, purchaseId]
  )) as { rows: Array<{ exists: boolean | string }> };
  const row = result.rows?.[0];
  return row?.exists === true || row?.exists === 't';
}

function resolveBrokerRewardAmounts(input: InsuranceBrokerRewardInput): {
  experience_points: number;
  earnings: number;
  reward_skipped_reason: string | null;
} {
  if (input.purchaseBatchAlreadyRewarded) {
    return {
      experience_points: 0,
      earnings: 0,
      reward_skipped_reason: 'Broker reward already paid for this insurance purchase',
    };
  }

  const referenceAmount =
    input.referenceAmount != null && !Number.isNaN(input.referenceAmount)
      ? roundMoney(input.referenceAmount)
      : null;

  if (referenceAmount != null && referenceAmount <= 0) {
    return {
      experience_points: 0,
      earnings: 0,
      reward_skipped_reason: 'No broker reward for zero-cost insurance',
    };
  }

  const earnings =
    referenceAmount != null
      ? roundMoney(Math.min(INSURANCE_BROKER_EARNINGS, referenceAmount))
      : INSURANCE_BROKER_EARNINGS;

  if (earnings <= 0) {
    return {
      experience_points: 0,
      earnings: 0,
      reward_skipped_reason: 'Broker reward amount is zero',
    };
  }

  return {
    experience_points: INSURANCE_BROKER_XP,
    earnings,
    reward_skipped_reason: null,
  };
}

export async function awardInsuranceBroker(
  executor: Queryable,
  brokerUserId: number,
  brokerUsername: string,
  schoolId: number | null,
  townClass: string | null,
  earningsLabel: string,
  input: InsuranceBrokerRewardInput = {}
): Promise<InsuranceBrokerRewardResult> {
  let { experience_points, earnings, reward_skipped_reason } = resolveBrokerRewardAmounts(input);

  if (!reward_skipped_reason && experience_points > 0) {
    const rewardedToday = await countBrokerRewardsToday(executor, brokerUserId);
    if (rewardedToday >= INSURANCE_BROKER_DAILY_REWARD_LIMIT) {
      experience_points = 0;
      earnings = 0;
      reward_skipped_reason = `Daily broker reward limit reached (${INSURANCE_BROKER_DAILY_REWARD_LIMIT} per day)`;
    }
  }

  const currentUser = await database.get(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1',
    [brokerUserId]
  );
  const currentLevel = currentUser?.job_level || 1;
  const currentXP = currentUser?.job_experience_points || 0;
  let newLevel = currentLevel;

  if (experience_points > 0) {
    const newXP = currentXP + experience_points;
    newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
      if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
      else break;
    }
    await executor.query(
      'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
      [newXP, newLevel, brokerUserId]
    );
  }

  if (earnings <= 0 || !townClass) {
    return {
      earnings: 0,
      experience_points,
      new_level: experience_points > 0 && newLevel > currentLevel ? newLevel : null,
      reward_skipped_reason,
    };
  }

  const account = await database.get('SELECT id FROM accounts WHERE user_id = $1', [brokerUserId]);
  if (!account) {
    return {
      earnings: 0,
      experience_points,
      new_level: experience_points > 0 && newLevel > currentLevel ? newLevel : null,
      reward_skipped_reason: reward_skipped_reason ?? 'Account not found for reward payout',
    };
  }

  const townSettings =
    schoolId != null
      ? await database.get(
          'SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2',
          [townClass, schoolId]
        )
      : await database.get(
          'SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL',
          [townClass]
        );
  const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
  if (treasuryBalance < earnings) {
    throw new Error('Town treasury has insufficient funds to pay insurance broker earnings.');
  }

  if (schoolId != null) {
    await executor.query(
      'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
      [earnings, townClass, schoolId]
    );
  } else {
    await executor.query(
      'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
      [earnings, townClass]
    );
  }
  await executor.query(
    `INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [schoolId, townClass, earnings, 'withdrawal', `${earningsLabel} payout to ${brokerUsername}`, brokerUserId]
  );
  await executor.query(
    'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [earnings, account.id]
  );
  await executor.query(
    `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
     VALUES ($1, $2, 'deposit', $3)`,
    [account.id, earnings, INSURANCE_BROKER_EARN_DESCRIPTION]
  );

  return {
    earnings,
    experience_points,
    new_level: newLevel > currentLevel ? newLevel : null,
    reward_skipped_reason,
  };
}
