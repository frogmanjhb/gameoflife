require('dotenv').config();
const { Pool } = require('pg');

function resolveDatabaseConnection() {
  const candidates = [
    ['DATABASE_PUBLIC_URL', process.env.DATABASE_PUBLIC_URL],
    ['DATABASE_URL', process.env.DATABASE_URL],
  ];
  for (const [source, url] of candidates) {
    if (url && !url.includes('${{') && !url.includes('railway.internal')) {
      return { connectionString: url, source };
    }
  }
  return null;
}

async function main() {
  const search = process.argv[2] || 'cayden';
  const resolved = resolveDatabaseConnection();
  if (!resolved) {
    console.error('No DB URL');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: resolved.connectionString,
    ssl: resolved.connectionString.includes('railway') ? { rejectUnauthorized: false } : false,
  });

  const users = await pool.query(
    `SELECT id, username, first_name, last_name, class, school_id
     FROM users
     WHERE role = 'student'
       AND (
         LOWER(username) LIKE $1
         OR LOWER(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) LIKE $1
       )
     ORDER BY class, username
     LIMIT 20`,
    [`%${search.toLowerCase()}%`]
  );
  console.log('Matching users:', users.rows);

  for (const u of users.rows) {
    const acct = await pool.query('SELECT id, balance FROM accounts WHERE user_id = $1', [u.id]);
    const accountId = acct.rows[0]?.id;
    if (!accountId) continue;

    const totals = await pool.query(
      `SELECT COUNT(*)::int AS transfer_count,
              MIN(created_at) AS first_at,
              MAX(created_at) AS last_at,
              MIN(amount::numeric) AS min_amt,
              MAX(amount::numeric) AS max_amt
       FROM transactions
       WHERE from_account_id = $1 AND transaction_type = 'transfer'`,
      [accountId]
    );
    console.log('\n---', u.username, u.class, totals.rows[0]);

    const byMonth = await pool.query(
      `SELECT date_trunc('month', created_at AT TIME ZONE 'UTC') AS month,
              COUNT(*)::int AS cnt
       FROM transactions
       WHERE from_account_id = $1 AND transaction_type = 'transfer'
       GROUP BY 1 ORDER BY 1`,
      [accountId]
    );
    console.log('By month:', byMonth.rows);

    const byDesc = await pool.query(
      `SELECT LEFT(description, 120) AS description,
              COUNT(*)::int AS cnt,
              MIN(amount::numeric) AS min_amt,
              MAX(amount::numeric) AS max_amt
       FROM transactions
       WHERE from_account_id = $1 AND transaction_type = 'transfer'
       GROUP BY 1
       ORDER BY cnt DESC
       LIMIT 15`,
      [accountId]
    );
    console.log('Top descriptions:', byDesc.rows);

    const dupCheck = await pool.query(
      `SELECT created_at, amount, description, COUNT(*)::int AS cnt
       FROM transactions
       WHERE from_account_id = $1 AND transaction_type = 'transfer'
       GROUP BY created_at, amount, description
       HAVING COUNT(*) > 1
       ORDER BY cnt DESC
       LIMIT 10`,
      [accountId]
    );
    console.log('Exact duplicate groups (sample):', dupCheck.rows);

    const pending = await pool.query(
      `SELECT status, COUNT(*)::int AS cnt
       FROM pending_transfers WHERE from_user_id = $1
       GROUP BY status`,
      [u.id]
    );
    console.log('Pending transfers by status:', pending.rows);

    const juneCombined = await pool.query(
      `SELECT COUNT(*)::int AS cnt,
              COUNT(DISTINCT t.to_account_id)::int AS recipients,
              MIN(t.created_at) AS first_at,
              MAX(t.created_at) AS last_at
       FROM transactions t
       WHERE t.from_account_id = $1
         AND t.transaction_type = 'transfer'
         AND t.description = 'combined'
         AND t.created_at >= '2026-06-01' AND t.created_at < '2026-07-01'`,
      [accountId]
    );
    console.log('June "combined" transfers:', juneCombined.rows[0]);

    const topRecipients = await pool.query(
      `SELECT tu.username, COUNT(*)::int AS cnt
       FROM transactions t
       JOIN accounts ta ON t.to_account_id = ta.id
       JOIN users tu ON ta.user_id = tu.id
       WHERE t.from_account_id = $1
         AND t.description = 'combined'
         AND t.created_at >= '2026-06-01' AND t.created_at < '2026-07-01'
       GROUP BY tu.username
       ORDER BY cnt DESC
       LIMIT 10`,
      [accountId]
    );
    console.log('June combined top recipients:', topRecipients.rows);

    const burstMinutes = await pool.query(
      `SELECT date_trunc('minute', created_at) AS minute, COUNT(*)::int AS cnt
       FROM transactions
       WHERE from_account_id = $1
         AND description = 'combined'
         AND created_at >= '2026-06-01' AND created_at < '2026-07-01'
       GROUP BY 1
       HAVING COUNT(*) > 20
       ORDER BY cnt DESC
       LIMIT 10`,
      [accountId]
    );
    console.log('June burst minutes (>20/min):', burstMinutes.rows);
  }

  const schoolTotal = await pool.query(
    `SELECT COUNT(*)::int AS total_transfers
     FROM transactions t
     JOIN accounts a ON t.from_account_id = a.id
     JOIN users u ON a.user_id = u.id
     WHERE u.role = 'student' AND t.transaction_type = 'transfer'`
  );
  console.log('\nPlatform student-sent transfer rows (all time):', schoolTotal.rows[0]);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
