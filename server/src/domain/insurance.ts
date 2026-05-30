import database from '../database/database-prod';
import { getXPForLevel } from '../routes/jobs';

export const INSURANCE_RATE = 0.05;
export const INSURANCE_BROKER_EARNINGS = 500;
export const INSURANCE_BROKER_XP = 5;
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
  return status === 'approved' && isPolicyCoverageActive(weekStart, weeks, today);
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
    `SELECT weeks, week_start_date, status
     FROM insurance_purchases
     WHERE user_id = $1 AND insurance_type = $2 AND status = 'approved'
     ORDER BY created_at DESC`,
    [userId, insuranceType]
  );

  return (rows as Array<{ weeks: number; week_start_date: string | null; status: string }>).some((p) =>
    isPolicyEffectivelyActive(p.status, p.week_start_date, p.weeks, today)
  );
}

type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<unknown>;
};

export async function payHealthInsuranceClinicClaim(
  executor: Queryable,
  assignmentId: number,
  doctorAccountId: number,
  cureFee: number,
  illnessType: string
): Promise<void> {
  await executor.query(
    'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [cureFee, doctorAccountId]
  );
  await executor.query(
    `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
     VALUES (NULL, $1, $2, 'insurance', $3)`,
    [
      doctorAccountId,
      cureFee,
      `Health insurance claim — ${illnessType} clinic fee (awaiting doctor approval)`,
    ]
  );
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

export async function awardInsuranceBroker(
  executor: Queryable,
  brokerUserId: number,
  brokerUsername: string,
  schoolId: number | null,
  townClass: string | null,
  earningsLabel: string
): Promise<{ earnings: number; experience_points: number; new_level: number | null }> {
  const currentUser = await database.get(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1',
    [brokerUserId]
  );
  const currentLevel = currentUser?.job_level || 1;
  const currentXP = currentUser?.job_experience_points || 0;
  const newXP = currentXP + INSURANCE_BROKER_XP;
  let newLevel = currentLevel;
  for (let level = currentLevel; level < 10; level++) {
    if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
    else break;
  }
  await executor.query(
    'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
    [newXP, newLevel, brokerUserId]
  );

  const account = await database.get('SELECT id FROM accounts WHERE user_id = $1', [brokerUserId]);
  if (account && townClass) {
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
    if (treasuryBalance < INSURANCE_BROKER_EARNINGS) {
      throw new Error('Town treasury has insufficient funds to pay insurance broker earnings.');
    }

    if (schoolId != null) {
      await executor.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
        [INSURANCE_BROKER_EARNINGS, townClass, schoolId]
      );
    } else {
      await executor.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
        [INSURANCE_BROKER_EARNINGS, townClass]
      );
    }
    await executor.query(
      `INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        schoolId,
        townClass,
        INSURANCE_BROKER_EARNINGS,
        'withdrawal',
        `${earningsLabel} payout to ${brokerUsername}`,
        brokerUserId,
      ]
    );
    await executor.query(
      'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [INSURANCE_BROKER_EARNINGS, account.id]
    );
    await executor.query(
      `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`,
      [account.id, INSURANCE_BROKER_EARNINGS, earningsLabel]
    );
  }

  return {
    earnings: INSURANCE_BROKER_EARNINGS,
    experience_points: INSURANCE_BROKER_XP,
    new_level: newLevel > currentLevel ? newLevel : null,
  };
}
