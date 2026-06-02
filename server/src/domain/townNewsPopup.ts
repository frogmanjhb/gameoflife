import database from '../database/database-prod';

export const POPUP_AD_COST = 1000;

export async function chargePopupAdFee(
  creatorUserId: number,
  creatorUsername: string,
  townClass: string,
  schoolId: number | null,
  headline: string
): Promise<void> {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');

    const accountResult = await client.query(
      'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
      [creatorUserId]
    );
    const account = accountResult.rows[0];
    if (!account) {
      throw new Error('NO_ACCOUNT');
    }

    const balance = parseFloat(account.balance);
    if (isNaN(balance) || balance < POPUP_AD_COST) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    await client.query(
      'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [POPUP_AD_COST, account.id]
    );

    await client.query(
      `INSERT INTO transactions (from_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'withdrawal', $3)`,
      [account.id, POPUP_AD_COST, `Login pop-up ad: ${headline}`]
    );

    if (schoolId != null) {
      await client.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3',
        [POPUP_AD_COST, townClass, schoolId]
      );
    } else {
      await client.query(
        'UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL',
        [POPUP_AD_COST, townClass]
      );
    }

    await client.query(
      `INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        schoolId,
        townClass,
        POPUP_AD_COST,
        'deposit',
        `Login pop-up ad by ${creatorUsername}: "${headline}"`,
        creatorUserId,
      ]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
