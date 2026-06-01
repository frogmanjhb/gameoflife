import { getXPForLevel } from '../routes/jobs';

export const TRANSFER_APPROVAL_XP_REWARD = 1;
export const TRANSFER_APPROVAL_EARNINGS_REWARD = 500;

type TxClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

export async function payTransferApprovalReward(
  client: TxClient,
  userId: number,
  username: string,
  townClass: string,
  schoolId: number | null
): Promise<{
  experience_points: number;
  earnings: number;
  new_level: number | null;
}> {
  const userRowResult = await client.query(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1 FOR UPDATE',
    [userId]
  );
  const userRow = userRowResult.rows[0] || {};
  const currentLevel = Number.isInteger(userRow.job_level) ? (userRow.job_level as number) : 1;
  const currentXP =
    typeof userRow.job_experience_points === 'number' ? userRow.job_experience_points : 0;
  const newXP = currentXP + TRANSFER_APPROVAL_XP_REWARD;
  let newLevel = currentLevel;
  for (let level = currentLevel; level < 10; level++) {
    if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
    else break;
  }

  await client.query(
    'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
    [newXP, newLevel, userId]
  );

  const accountResult = await client.query(
    'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
    [userId]
  );
  const account = accountResult.rows[0];
  if (!account || TRANSFER_APPROVAL_EARNINGS_REWARD <= 0) {
    return {
      experience_points: TRANSFER_APPROVAL_XP_REWARD,
      earnings: 0,
      new_level: newLevel > currentLevel ? newLevel : null,
    };
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
  if (!townRow || treasuryBalance < TRANSFER_APPROVAL_EARNINGS_REWARD) {
    throw new Error('TREASURY_INSUFFICIENT');
  }

  if (schoolId != null) {
    await client.query(
      'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
      [TRANSFER_APPROVAL_EARNINGS_REWARD, townClass, schoolId]
    );
  } else {
    await client.query(
      'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
      [TRANSFER_APPROVAL_EARNINGS_REWARD, townClass]
    );
  }

  await client.query(
    'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
    [
      schoolId,
      townClass,
      TRANSFER_APPROVAL_EARNINGS_REWARD,
      'withdrawal',
      `Accountant transfer approval payout to ${username}`,
      userId,
    ]
  );
  await client.query(
    'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [TRANSFER_APPROVAL_EARNINGS_REWARD, account.id]
  );
  await client.query(
    `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
     VALUES ($1, $2, 'deposit', $3)`,
    [account.id, TRANSFER_APPROVAL_EARNINGS_REWARD, 'ACCOUNTANT_TRANSFER_APPROVAL_EARN']
  );

  return {
    experience_points: TRANSFER_APPROVAL_XP_REWARD,
    earnings: TRANSFER_APPROVAL_EARNINGS_REWARD,
    new_level: newLevel > currentLevel ? newLevel : null,
  };
}
