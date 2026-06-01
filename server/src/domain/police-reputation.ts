import database from '../database/database-prod';
import { DOCTOR_ILLNESS_DAY_START_SQL } from './doctor-illness';

function hasPoliceLieutenantJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('police lieutenant');
}

export const POLICE_REPUTATION_START = 10;
export const POLICE_REPUTATION_MAX = 20;
export const POLICE_REPUTATION_FINE_PENALTY = 1;
export const POLICE_REPUTATION_BONUS_GAIN = 2;
export const POLICE_REPUTATION_DAILY_GAIN = 1;
export const POLICE_REPUTATION_PEAK_MULTIPLIER = 1.25;

const MS_PER_CIVIC_DAY = 24 * 60 * 60 * 1000;

export interface PoliceReputationStatus {
  current: number;
  max: number;
  earnings_multiplier: number;
  earnings_percent: number;
  penalty_label: string | null;
  bonus_label: string | null;
}

export function getPoliceEarningsMultiplier(reputation: number): number {
  const rep = Math.max(0, Math.floor(reputation));
  if (rep >= POLICE_REPUTATION_MAX) return POLICE_REPUTATION_PEAK_MULTIPLIER;
  if (rep >= 15) return 1;
  if (rep >= 10) return 0.75;
  if (rep >= 5) return 0.5;
  return 0.25;
}

export function buildPoliceReputationStatus(reputation: number): PoliceReputationStatus {
  const current = Math.max(0, Math.min(POLICE_REPUTATION_MAX, Math.floor(reputation)));
  const earnings_multiplier = getPoliceEarningsMultiplier(current);
  const earnings_percent = Math.round(earnings_multiplier * 100);
  let penalty_label: string | null = null;
  let bonus_label: string | null = null;
  if (current >= POLICE_REPUTATION_MAX) {
    bonus_label = 'Peak reputation — +25% on fine and bonus pay';
  } else if (current < 5) {
    penalty_label = 'Critical reputation — you earn 75% less';
  } else if (current < 10) {
    penalty_label = 'Poor reputation — you earn 50% less';
  } else if (current < 15) {
    penalty_label = 'Low reputation — you earn 25% less';
  }
  return {
    current,
    max: POLICE_REPUTATION_MAX,
    earnings_multiplier,
    earnings_percent,
    penalty_label,
    bonus_label,
  };
}

export function applyPoliceEarningsMultiplier(grossAmount: number, reputation: number): number {
  const gross = parseFloat(String(grossAmount));
  if (!Number.isFinite(gross) || gross <= 0) return 0;
  const multiplier = getPoliceEarningsMultiplier(reputation);
  return Math.round(gross * multiplier * 100) / 100;
}

/** Apply civic-day recovery (+1 per day missed, capped at max). */
export async function syncPoliceReputation(userId: number): Promise<PoliceReputationStatus> {
  const row = await database.get(
    `SELECT police_reputation, police_reputation_recovered_at,
            (${DOCTOR_ILLNESS_DAY_START_SQL}) AS period_start
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!row) {
    return buildPoliceReputationStatus(POLICE_REPUTATION_START);
  }

  let reputation = parseInt(String(row.police_reputation ?? POLICE_REPUTATION_START), 10);
  if (!Number.isFinite(reputation)) reputation = POLICE_REPUTATION_START;

  const periodStart = new Date(row.period_start);
  const lastRecovered = row.police_reputation_recovered_at
    ? new Date(row.police_reputation_recovered_at)
    : null;

  if (!lastRecovered) {
    await database.query(
      `UPDATE users
       SET police_reputation = LEAST($1, GREATEST(0, COALESCE(police_reputation, $2))),
           police_reputation_recovered_at = $3
       WHERE id = $4`,
      [POLICE_REPUTATION_MAX, POLICE_REPUTATION_START, periodStart, userId]
    );
    return buildPoliceReputationStatus(reputation);
  }

  if (lastRecovered.getTime() < periodStart.getTime()) {
    const periodsElapsed = Math.floor(
      (periodStart.getTime() - lastRecovered.getTime()) / MS_PER_CIVIC_DAY
    );
    if (periodsElapsed > 0) {
      reputation = Math.min(
        POLICE_REPUTATION_MAX,
        reputation + periodsElapsed * POLICE_REPUTATION_DAILY_GAIN
      );
      await database.query(
        `UPDATE users SET police_reputation = $1, police_reputation_recovered_at = $2 WHERE id = $3`,
        [reputation, periodStart, userId]
      );
    }
  }

  return buildPoliceReputationStatus(reputation);
}

export async function adjustPoliceReputationOnSubmit(
  userId: number,
  type: 'fine' | 'bonus'
): Promise<PoliceReputationStatus> {
  await syncPoliceReputation(userId);
  const delta = type === 'fine' ? -POLICE_REPUTATION_FINE_PENALTY : POLICE_REPUTATION_BONUS_GAIN;
  const updated = await database.query(
    `UPDATE users
     SET police_reputation = LEAST(
       $4,
       GREATEST(0, COALESCE(police_reputation, $2) + $3)
     )
     WHERE id = $1
     RETURNING police_reputation`,
    [userId, POLICE_REPUTATION_START, delta, POLICE_REPUTATION_MAX]
  );
  const reputation = parseInt(String(updated[0]?.police_reputation ?? POLICE_REPUTATION_START), 10);
  return buildPoliceReputationStatus(reputation);
}

export async function resolvePoliceNetEarnings(
  policeUserId: number,
  grossAmount: number
): Promise<{ netAmount: number; reputation: PoliceReputationStatus }> {
  const reputation = await syncPoliceReputation(policeUserId);
  const netAmount = applyPoliceEarningsMultiplier(grossAmount, reputation.current);
  return { netAmount, reputation };
}

export async function getPoliceReputationIfPolice(
  userId: number,
  jobName: string | null | undefined
): Promise<PoliceReputationStatus | null> {
  if (!hasPoliceLieutenantJob(jobName)) return null;
  return syncPoliceReputation(userId);
}
