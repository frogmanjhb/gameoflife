import database from '../database/database-prod';
import { getXPForLevel } from '../routes/jobs';
import { getAccountantContext, isManagedClient } from './accountant-assignments';

export const ADVICE_XP_REWARD = 10;
export const ADVICE_EARNINGS_REWARD = 500;
export const MIN_ADVICE_LENGTH = 20;
export const MAX_ADVICE_LENGTH = 2000;

export function sanitizeAdvice(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export async function tablesReady(): Promise<boolean> {
  try {
    await database.query('SELECT 1 FROM accountant_client_advice LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

export async function resolveAccountantClient(
  accountantUserId: number,
  clientUsername: string
): Promise<{
  accountant: { id: number; class: string | null; school_id: number | null };
  client: {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    class: string | null;
    school_id: number | null;
    job_name: string | null;
  };
}> {
  const context = await getAccountantContext(accountantUserId);
  const client = await database.get(
    `SELECT u.id, u.username, u.first_name, u.last_name, u.class, u.school_id, j.name AS job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.username = $1 AND u.role = 'student'`,
    [clientUsername]
  );

  if (!client) {
    throw new Error('CLIENT_NOT_FOUND');
  }

  if (!isManagedClient(context, client.id)) {
    throw new Error('NOT_YOUR_CLIENT');
  }

  const accountantSchool = context.accountant.school_id ?? null;
  const clientSchool = client.school_id ?? null;
  if (accountantSchool !== null && clientSchool !== accountantSchool) {
    throw new Error('NOT_YOUR_CLIENT');
  }

  if (context.accountant.class && client.class && context.accountant.class !== client.class) {
    throw new Error('NOT_YOUR_CLIENT');
  }

  return { accountant: context.accountant, client };
}

export async function payAdviceReward(
  userId: number,
  username: string,
  townClass: string,
  schoolId: number | null
): Promise<{ experience_points: number; earnings: number; new_level: number | null }> {
  const currentUser = await database.get(
    'SELECT job_level, job_experience_points FROM users WHERE id = $1',
    [userId]
  );
  const currentLevel = currentUser?.job_level || 1;
  const currentXP = currentUser?.job_experience_points || 0;
  const newXP = currentXP + ADVICE_XP_REWARD;
  let newLevel = currentLevel;
  for (let level = currentLevel; level < 10; level++) {
    if (newXP >= getXPForLevel(level + 1)) newLevel = level + 1;
    else break;
  }
  await database.query(
    'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
    [newXP, newLevel, userId]
  );

  const account = await database.get('SELECT * FROM accounts WHERE user_id = $1', [userId]);
  if (account && ADVICE_EARNINGS_REWARD > 0) {
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
    if (treasuryBalance < ADVICE_EARNINGS_REWARD) {
      throw new Error('TREASURY_INSUFFICIENT');
    }
    if (schoolId != null) {
      await database.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
        [ADVICE_EARNINGS_REWARD, townClass, schoolId]
      );
    } else {
      await database.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
        [ADVICE_EARNINGS_REWARD, townClass]
      );
    }
    await database.query(
      'INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        schoolId,
        townClass,
        ADVICE_EARNINGS_REWARD,
        'withdrawal',
        `Accountant client advice payout to ${username}`,
        userId,
      ]
    );
    await database.query(
      'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [ADVICE_EARNINGS_REWARD, account.id]
    );
    await database.query(
      `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`,
      [account.id, ADVICE_EARNINGS_REWARD, 'ACCOUNTANT_CLIENT_ADVICE_EARN']
    );
  }

  return {
    experience_points: ADVICE_XP_REWARD,
    earnings: ADVICE_EARNINGS_REWARD,
    new_level: newLevel > currentLevel ? newLevel : null,
  };
}
