import database from '../database/database-prod';

export const INSURANCE_RATE = 0.05;
export const VALID_INSURANCE_TYPES = ['health', 'cyber', 'property'] as const;
export type InsuranceType = (typeof VALID_INSURANCE_TYPES)[number];
export type InsurancePurchaseStatus = 'pending_broker' | 'approved' | 'denied';

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
  townClass: string | null | undefined
): Promise<boolean> {
  if (!townClass) return false;
  const brokers = await getClassInsuranceBrokers(schoolId, townClass);
  return brokers.length > 0;
}

export async function hasActiveApprovedHealthInsurance(userId: number): Promise<boolean> {
  const today = todayInSA();
  const rows = await database.query(
    `SELECT weeks, week_start_date, status
     FROM insurance_purchases
     WHERE user_id = $1 AND insurance_type = 'health' AND status = 'approved'
     ORDER BY created_at DESC`,
    [userId]
  );

  return (rows as Array<{ weeks: number; week_start_date: string | null; status: string }>).some((p) =>
    isPolicyEffectivelyActive(p.status, p.week_start_date, p.weeks, today)
  );
}
