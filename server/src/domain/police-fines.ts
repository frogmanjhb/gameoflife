import database from '../database/database-prod';
import { getXPForLevel } from '../routes/jobs';
import { resolvePoliceNetEarnings } from './police-reputation';

export const POLICE_FINE_BONUS_SUBMIT_XP = 5;
export const LAWYER_FINE_REVIEW_XP = 10;
export const POLICE_BONUS_APPROVAL_EARNINGS = 3000;
export const POLICE_FINE_APPROVAL_EARNINGS = 1000;

type TxClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

export function hasPoliceLieutenantJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('police lieutenant');
}

async function awardJobXp(
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
  await database.query(
    'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
    [newXP, newLevel, userId]
  );
  return {
    experience_points: xpAmount,
    new_level: newLevel > currentLevel ? newLevel : null,
  };
}

export async function awardPoliceSubmitXp(
  userId: number
): Promise<{ experience_points: number; new_level: number | null }> {
  return awardJobXp(userId, POLICE_FINE_BONUS_SUBMIT_XP);
}

export async function awardLawyerFineReviewXp(
  userId: number
): Promise<{ experience_points: number; new_level: number | null }> {
  return awardJobXp(userId, LAWYER_FINE_REVIEW_XP);
}

async function payPoliceApprovalRewardFromTreasury(
  client: TxClient,
  policeUserId: number,
  policeUsername: string,
  townClass: string,
  schoolId: number | null,
  grossEarnings: number,
  treasuryDescription: string,
  transactionDescription: string
): Promise<{ earnings: number }> {
  if (grossEarnings <= 0) {
    return { earnings: 0 };
  }

  const { netAmount: payout, reputation } = await resolvePoliceNetEarnings(policeUserId, grossEarnings);
  if (payout <= 0) {
    return { earnings: 0 };
  }

  const accountResult = await client.query(
    'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
    [policeUserId]
  );
  const account = accountResult.rows[0];
  if (!account) {
    return { earnings: 0 };
  }

  const townResult =
    schoolId != null
      ? await client.query(
          'SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2 FOR UPDATE',
          [townClass, schoolId]
        )
      : await client.query(
          'SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL FOR UPDATE',
          [townClass]
        );
  const townRow = townResult.rows[0];
  const treasuryBalance = parseFloat(String(townRow?.treasury_balance ?? '0'));
  if (!townRow || treasuryBalance < payout) {
    throw new Error('TREASURY_INSUFFICIENT');
  }

  if (schoolId != null) {
    await client.query(
      'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
      [payout, townClass, schoolId]
    );
  } else {
    await client.query(
      'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
      [payout, townClass]
    );
  }

  const repNote =
    reputation.current >= 20
      ? ' (peak reputation +25%)'
      : reputation.earnings_multiplier < 1
        ? ` (${reputation.earnings_percent}% reputation pay)`
        : '';

  await client.query(
    'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
    [
      schoolId,
      townClass,
      payout,
      'withdrawal',
      `${treasuryDescription}${repNote}`,
      policeUserId,
    ]
  );
  await client.query(
    'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [payout, account.id]
  );
  await client.query(
    `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
     VALUES ($1, $2, 'deposit', $3)`,
    [account.id, payout, transactionDescription]
  );

  return { earnings: payout };
}

export async function payPoliceBonusApprovalReward(
  client: TxClient,
  policeUserId: number,
  policeUsername: string,
  townClass: string,
  schoolId: number | null
): Promise<{ earnings: number }> {
  return payPoliceApprovalRewardFromTreasury(
    client,
    policeUserId,
    policeUsername,
    townClass,
    schoolId,
    POLICE_BONUS_APPROVAL_EARNINGS,
    `Police bonus submission payout to ${policeUsername}`,
    'POLICE_BONUS_SUBMISSION_EARN'
  );
}

export async function payPoliceFineApprovalReward(
  client: TxClient,
  policeUserId: number,
  policeUsername: string,
  townClass: string,
  schoolId: number | null
): Promise<{ earnings: number }> {
  return payPoliceApprovalRewardFromTreasury(
    client,
    policeUserId,
    policeUsername,
    townClass,
    schoolId,
    POLICE_FINE_APPROVAL_EARNINGS,
    `Police fine submission payout to ${policeUsername}`,
    'POLICE_FINE_SUBMISSION_EARN'
  );
}
