import { getXPForLevel } from '../routes/jobs';

export const TRANSFER_APPROVAL_XP_REWARD = 1;
export const TRANSFER_APPROVAL_EARNINGS_REWARD = 500;
/** Transfers below this amount can be approved but earn no accountant reward. */
export const TRANSFER_APPROVAL_MIN_REWARD_AMOUNT = 50;
/** Max rewarded transfer approvals per accountant per game day (resets 04:00). */
export const ACCOUNTANT_TRANSFER_APPROVAL_DAILY_REWARD_LIMIT = 10;

const GAME_DAY_START_SQL = `
  CASE
    WHEN CURRENT_TIME < '04:00:00'
    THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
    ELSE CURRENT_DATE + INTERVAL '4 hours'
  END
`;

type TxClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number }>;
};

export type TransferApprovalRewardInput = {
  transferAmount: number;
  toUserId: number;
  accountantUserId: number;
};

export type TransferApprovalRewardResult = {
  experience_points: number;
  earnings: number;
  new_level: number | null;
  reward_skipped_reason: string | null;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function resolveRewardAmounts(input: TransferApprovalRewardInput): {
  experience_points: number;
  earnings: number;
  reward_skipped_reason: string | null;
} {
  const transferAmount = roundMoney(input.transferAmount);

  if (input.toUserId === input.accountantUserId) {
    return {
      experience_points: 0,
      earnings: 0,
      reward_skipped_reason: 'No reward when you are the transfer recipient',
    };
  }

  if (transferAmount < TRANSFER_APPROVAL_MIN_REWARD_AMOUNT) {
    return {
      experience_points: 0,
      earnings: 0,
      reward_skipped_reason: `No reward for transfers under R${TRANSFER_APPROVAL_MIN_REWARD_AMOUNT.toFixed(2)}`,
    };
  }

  const earnings = roundMoney(Math.min(TRANSFER_APPROVAL_EARNINGS_REWARD, transferAmount));
  return {
    experience_points: TRANSFER_APPROVAL_XP_REWARD,
    earnings,
    reward_skipped_reason: null,
  };
}

async function countRewardedApprovalsToday(
  client: TxClient,
  accountantUserId: number
): Promise<number> {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM transactions t
     JOIN accounts a ON t.to_account_id = a.id
     WHERE a.user_id = $1
       AND t.transaction_type = 'deposit'
       AND t.description = 'ACCOUNTANT_TRANSFER_APPROVAL_EARN'
       AND t.created_at >= (${GAME_DAY_START_SQL})`,
    [accountantUserId]
  );
  const row = result.rows[0];
  return typeof row?.count === 'number' ? row.count : parseInt(String(row?.count ?? '0'), 10) || 0;
}

export async function payTransferApprovalReward(
  client: TxClient,
  userId: number,
  username: string,
  townClass: string,
  schoolId: number | null,
  input: TransferApprovalRewardInput
): Promise<TransferApprovalRewardResult> {
  let { experience_points, earnings, reward_skipped_reason } = resolveRewardAmounts({
    ...input,
    accountantUserId: userId,
  });

  if (!reward_skipped_reason && experience_points > 0) {
    const rewardedToday = await countRewardedApprovalsToday(client, userId);
    if (rewardedToday >= ACCOUNTANT_TRANSFER_APPROVAL_DAILY_REWARD_LIMIT) {
      experience_points = 0;
      earnings = 0;
      reward_skipped_reason = `Daily approval reward limit reached (${ACCOUNTANT_TRANSFER_APPROVAL_DAILY_REWARD_LIMIT} per day)`;
    }
  }

  const userRowResult = await client.query(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1 FOR UPDATE',
    [userId]
  );
  const userRow = userRowResult.rows[0] || {};
  const currentLevel = Number.isInteger(userRow.job_level) ? (userRow.job_level as number) : 1;
  const currentXP =
    typeof userRow.job_experience_points === 'number' ? userRow.job_experience_points : 0;
  let newLevel = currentLevel;

  if (experience_points > 0) {
    const newXP = currentXP + experience_points;
    newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
      if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
      else break;
    }
    await client.query(
      'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
      [newXP, newLevel, userId]
    );
  }

  if (earnings <= 0) {
    return {
      experience_points,
      earnings: 0,
      new_level: experience_points > 0 && newLevel > currentLevel ? newLevel : null,
      reward_skipped_reason,
    };
  }

  const accountResult = await client.query(
    'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
    [userId]
  );
  const account = accountResult.rows[0];
  if (!account) {
    return {
      experience_points,
      earnings: 0,
      new_level: experience_points > 0 && newLevel > currentLevel ? newLevel : null,
      reward_skipped_reason: reward_skipped_reason ?? 'Account not found for reward payout',
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
  if (!townRow || treasuryBalance < earnings) {
    throw new Error('TREASURY_INSUFFICIENT');
  }

  if (schoolId != null) {
    await client.query(
      'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
      [earnings, townClass, schoolId]
    );
  } else {
    await client.query(
      'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
      [earnings, townClass]
    );
  }

  await client.query(
    'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
    [
      schoolId,
      townClass,
      earnings,
      'withdrawal',
      `Accountant transfer approval payout to ${username}`,
      userId,
    ]
  );
  await client.query(
    'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [earnings, account.id]
  );
  await client.query(
    `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
     VALUES ($1, $2, 'deposit', $3)`,
    [account.id, earnings, 'ACCOUNTANT_TRANSFER_APPROVAL_EARN']
  );

  return {
    experience_points,
    earnings,
    new_level: newLevel > currentLevel ? newLevel : null,
    reward_skipped_reason,
  };
}
