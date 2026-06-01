import database from '../database/database-prod';
import { DOCTOR_ILLNESS_DAY_START_SQL } from './doctor-illness';
import { hasDoctorJob } from './attendance';

export const DOCTOR_REPUTATION_START = 20;
export const DOCTOR_REPUTATION_MAX = 20;
export const DOCTOR_REPUTATION_ASSIGN_PENALTY = 2;
export const DOCTOR_REPUTATION_DAILY_GAIN = 1;

const MS_PER_CIVIC_DAY = 24 * 60 * 60 * 1000;

export interface DoctorReputationStatus {
  current: number;
  max: number;
  earnings_multiplier: number;
  earnings_percent: number;
  penalty_label: string | null;
}

export function getDoctorEarningsMultiplier(reputation: number): number {
  const rep = Math.max(0, Math.floor(reputation));
  if (rep >= 15) return 1;
  if (rep >= 10) return 0.75;
  if (rep >= 5) return 0.5;
  return 0.25;
}

export function buildDoctorReputationStatus(reputation: number): DoctorReputationStatus {
  const current = Math.max(0, Math.min(DOCTOR_REPUTATION_MAX, Math.floor(reputation)));
  const earnings_multiplier = getDoctorEarningsMultiplier(current);
  const earnings_percent = Math.round(earnings_multiplier * 100);
  let penalty_label: string | null = null;
  if (earnings_multiplier <= 0.25) {
    penalty_label = 'Critical reputation — you earn 75% less';
  } else if (earnings_multiplier <= 0.5) {
    penalty_label = 'Poor reputation — you earn 50% less';
  } else if (earnings_multiplier <= 0.75) {
    penalty_label = 'Low reputation — you earn 25% less';
  }
  return {
    current,
    max: DOCTOR_REPUTATION_MAX,
    earnings_multiplier,
    earnings_percent,
    penalty_label,
  };
}

export function applyDoctorEarningsMultiplier(grossAmount: number, reputation: number): number {
  const gross = parseFloat(String(grossAmount));
  if (!Number.isFinite(gross) || gross <= 0) return 0;
  const multiplier = getDoctorEarningsMultiplier(reputation);
  return Math.round(gross * multiplier * 100) / 100;
}

/** Apply civic-day recovery (+1 per day missed, capped at max). */
export async function syncDoctorReputation(userId: number): Promise<DoctorReputationStatus> {
  const row = await database.get(
    `SELECT doctor_reputation, doctor_reputation_recovered_at,
            (${DOCTOR_ILLNESS_DAY_START_SQL}) AS period_start
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!row) {
    return buildDoctorReputationStatus(DOCTOR_REPUTATION_START);
  }

  let reputation = parseInt(String(row.doctor_reputation ?? DOCTOR_REPUTATION_START), 10);
  if (!Number.isFinite(reputation)) reputation = DOCTOR_REPUTATION_START;

  const periodStart = new Date(row.period_start);
  const lastRecovered = row.doctor_reputation_recovered_at
    ? new Date(row.doctor_reputation_recovered_at)
    : null;

  if (!lastRecovered) {
    await database.query(
      `UPDATE users
       SET doctor_reputation = LEAST($1, GREATEST(0, COALESCE(doctor_reputation, $2))),
           doctor_reputation_recovered_at = $3
       WHERE id = $4`,
      [DOCTOR_REPUTATION_MAX, DOCTOR_REPUTATION_START, periodStart, userId]
    );
    return buildDoctorReputationStatus(reputation);
  }

  if (lastRecovered.getTime() < periodStart.getTime()) {
    const periodsElapsed = Math.floor(
      (periodStart.getTime() - lastRecovered.getTime()) / MS_PER_CIVIC_DAY
    );
    if (periodsElapsed > 0) {
      reputation = Math.min(
        DOCTOR_REPUTATION_MAX,
        reputation + periodsElapsed * DOCTOR_REPUTATION_DAILY_GAIN
      );
      await database.query(
        `UPDATE users SET doctor_reputation = $1, doctor_reputation_recovered_at = $2 WHERE id = $3`,
        [reputation, periodStart, userId]
      );
    }
  }

  return buildDoctorReputationStatus(reputation);
}

export async function decrementDoctorReputationOnAssign(userId: number): Promise<DoctorReputationStatus> {
  await syncDoctorReputation(userId);
  const updated = await database.query(
    `UPDATE users
     SET doctor_reputation = GREATEST(
       0,
       COALESCE(doctor_reputation, $2) - $3
     )
     WHERE id = $1
     RETURNING doctor_reputation`,
    [userId, DOCTOR_REPUTATION_START, DOCTOR_REPUTATION_ASSIGN_PENALTY]
  );
  const reputation = parseInt(String(updated[0]?.doctor_reputation ?? 0), 10);
  return buildDoctorReputationStatus(reputation);
}

/** Gross doctor earnings after reputation sync (for games, salary, clinic). */
export async function resolveDoctorNetEarnings(
  doctorUserId: number,
  grossAmount: number
): Promise<{ netAmount: number; reputation: DoctorReputationStatus }> {
  const reputation = await syncDoctorReputation(doctorUserId);
  const netAmount = applyDoctorEarningsMultiplier(grossAmount, reputation.current);
  return { netAmount, reputation };
}

export async function getDoctorReputationIfDoctor(
  userId: number,
  jobName: string | null | undefined
): Promise<DoctorReputationStatus | null> {
  if (!hasDoctorJob(jobName)) return null;
  return syncDoctorReputation(userId);
}
