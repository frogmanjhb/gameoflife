/**
 * Audit and reverse fraudulent accountant transfer approval rewards.
 *
 * Flags rewards where the linked approved transfer was:
 *   - below R50 (old exploit: R0.01 transfers),
 *   - to the approving accountant (self-dealing),
 *   - or reward amount exceeded the transfer amount.
 *
 * Usage (from server/):
 *   node scripts/audit-reverse-accountant-transfer-rewards.js --audit
 *   node scripts/audit-reverse-accountant-transfer-rewards.js --apply
 *   node scripts/audit-reverse-accountant-transfer-rewards.js --apply --accountant=username
 *
 * With Railway:
 *   npx @railway/cli@latest run --service Postgres npm run audit:accountant-transfer-exploit
 *   npx @railway/cli@latest run --service Postgres npm run reverse:accountant-transfer-exploit
 */

require('dotenv').config();
const { Pool } = require('pg');

const MIN_LEGITIMATE_REWARD_TRANSFER = 50;
const XP_PER_REWARD = 1;

function getXPForLevel(level) {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  return (100 * level * (level + 1)) / 2 - 100;
}

function levelFromXP(totalXP) {
  let level = 1;
  for (let candidate = 1; candidate < 10; candidate++) {
    if (totalXP >= getXPForLevel(candidate + 1)) level = candidate + 1;
    else break;
  }
  return level;
}

function isValidPostgresUrl(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('${{') || trimmed.includes('${')) return false;
  try {
    const normalized = trimmed.replace(/^postgres:\/\//, 'postgresql://');
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function buildUrlFromPgEnv() {
  if (!process.env.PGHOST) return null;
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '';
  const database = process.env.PGDATABASE || 'railway';
  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);
  return `postgresql://${auth}@${host}:${port}/${database}`;
}

function resolveDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.DATABASE_PUBLIC_URL;
  if (isValidPostgresUrl(publicUrl)) {
    return { connectionString: publicUrl.trim(), source: 'DATABASE_PUBLIC_URL' };
  }
  if (isValidPostgresUrl(databaseUrl) && !databaseUrl.includes('.railway.internal')) {
    return { connectionString: databaseUrl.trim(), source: 'DATABASE_URL' };
  }
  const fromPg = buildUrlFromPgEnv();
  if (isValidPostgresUrl(fromPg) && !fromPg.includes('.railway.internal')) {
    return { connectionString: fromPg, source: 'PGHOST/PGUSER/...' };
  }
  return null;
}

function classifyExploit(row) {
  const transferAmount = row.transfer_amount != null ? parseFloat(row.transfer_amount) : null;
  const rewardAmount = parseFloat(row.reward_amount);

  if (row.already_reversed) {
    return { exploit: false, reason: 'already_reversed', skip: true };
  }

  if (!row.pending_transfer_id) {
    return { exploit: true, reason: 'unmatched_pending_transfer' };
  }

  if (row.to_user_id === row.accountant_user_id) {
    return { exploit: true, reason: 'recipient_is_approving_accountant' };
  }

  if (transferAmount == null || Number.isNaN(transferAmount)) {
    return { exploit: true, reason: 'missing_transfer_amount' };
  }

  if (transferAmount < MIN_LEGITIMATE_REWARD_TRANSFER) {
    return { exploit: true, reason: `transfer_below_R${MIN_LEGITIMATE_REWARD_TRANSFER}` };
  }

  if (rewardAmount > transferAmount + 0.001) {
    return { exploit: true, reason: 'reward_exceeds_transfer_amount' };
  }

  return { exploit: false, reason: 'legitimate', skip: false };
}

const AUDIT_SQL = `
  SELECT
    reward.id AS reward_transaction_id,
    reward.amount AS reward_amount,
    reward.created_at AS reward_at,
    acc.user_id AS accountant_user_id,
    accountant.username AS accountant_username,
    accountant.first_name AS accountant_first_name,
    accountant.last_name AS accountant_last_name,
    accountant.class AS town_class,
    accountant.school_id,
    pt.id AS pending_transfer_id,
    pt.amount AS transfer_amount,
    pt.description AS transfer_description,
    pt.reviewed_at,
    fu.username AS from_username,
    fu.first_name AS from_first_name,
    fu.last_name AS from_last_name,
    tu.id AS to_user_id,
    tu.username AS to_username,
    rev.id IS NOT NULL AS already_reversed
  FROM transactions reward
  JOIN accounts acc ON reward.to_account_id = acc.id
  JOIN users accountant ON acc.user_id = accountant.id
  LEFT JOIN accountant_transfer_reward_reversals rev
    ON rev.reward_transaction_id = reward.id
  LEFT JOIN LATERAL (
    SELECT pt.*
    FROM pending_transfers pt
    WHERE pt.reviewed_by = accountant.id
      AND pt.status = 'approved'
      AND pt.reviewed_at BETWEEN reward.created_at - INTERVAL '3 seconds'
                              AND reward.created_at + INTERVAL '3 seconds'
    ORDER BY ABS(EXTRACT(EPOCH FROM (pt.reviewed_at - reward.created_at)))
    LIMIT 1
  ) pt ON TRUE
  LEFT JOIN users fu ON pt.from_user_id = fu.id
  LEFT JOIN users tu ON pt.to_user_id = tu.id
  WHERE reward.description = 'ACCOUNTANT_TRANSFER_APPROVAL_EARN'
    AND reward.transaction_type = 'deposit'
  ORDER BY reward.created_at DESC, reward.id DESC
`;

function formatName(row, prefix) {
  const first = row[`${prefix}_first_name`];
  const last = row[`${prefix}_last_name`];
  const username = row[`${prefix}_username`];
  if (first && last) return `${first} ${last} (@${username})`;
  return `@${username}`;
}

function printAuditReport(rows, mode, quiet) {
  const toReverse = rows.filter((row) => row.exploit && !row.skip);
  const legitimate = rows.filter((row) => !row.exploit && !row.skip);
  const alreadyReversed = rows.filter((row) => row.skip);

  console.log(`\n=== Accountant transfer approval reward ${mode} ===\n`);
  console.log(`Total reward deposits found:     ${rows.length}`);
  console.log(`Flagged for reversal (exploit):  ${toReverse.length}`);
  console.log(`Already reversed:                ${alreadyReversed.length}`);
  console.log(`Legitimate (keep):               ${legitimate.length}`);

  const totalExploitMoney = toReverse.reduce((sum, row) => sum + parseFloat(row.reward_amount), 0);
  const totalExploitXP = toReverse.length * XP_PER_REWARD;
  console.log(`\nExploit money to claw back:      R${totalExploitMoney.toFixed(2)}`);
  console.log(`Exploit XP to remove:            ${totalExploitXP}`);

  const byAccountant = new Map();
  for (const row of toReverse) {
    const key = row.accountant_username;
    if (!byAccountant.has(key)) {
      byAccountant.set(key, { count: 0, amount: 0, name: formatName(row, 'accountant') });
    }
    const entry = byAccountant.get(key);
    entry.count += 1;
    entry.amount += parseFloat(row.reward_amount);
  }

  if (byAccountant.size > 0) {
    console.log('\n--- By accountant (exploit totals) ---');
    for (const [username, entry] of [...byAccountant.entries()].sort((a, b) => b[1].amount - a[1].amount)) {
      console.log(`  ${entry.name}: ${entry.count} rewards, R${entry.amount.toFixed(2)}`);
    }
  }

  if (!quiet && toReverse.length > 0) {
    console.log('\n--- Flagged transactions (newest first) ---');
    for (const row of toReverse.slice(0, 100)) {
      const from = row.from_username ? formatName(row, 'from') : '(unknown sender)';
      const transferAmt =
        row.transfer_amount != null ? `R${parseFloat(row.transfer_amount).toFixed(2)}` : 'unknown';
      console.log(
        `  #${row.reward_transaction_id} ${row.reward_at.toISOString?.() || row.reward_at}` +
          ` | accountant ${formatName(row, 'accountant')}` +
          ` | reward R${parseFloat(row.reward_amount).toFixed(2)}` +
          ` | transfer ${transferAmt} from ${from} → @${row.to_username || '?'}` +
          ` | ${row.exploit_reason}` +
          (row.transfer_description ? ` | "${row.transfer_description}"` : '')
      );
    }
    if (toReverse.length > 100) {
      console.log(`  ... and ${toReverse.length - 100} more`);
    }
  }

  if (!quiet && legitimate.length > 0) {
    console.log('\n--- Legitimate rewards (not reversed) ---');
    for (const row of legitimate.slice(0, 20)) {
      console.log(
        `  #${row.reward_transaction_id} @${row.accountant_username}` +
          ` R${parseFloat(row.reward_amount).toFixed(2)}` +
          ` (transfer R${parseFloat(row.transfer_amount).toFixed(2)})`
      );
    }
    if (legitimate.length > 20) {
      console.log(`  ... and ${legitimate.length - 20} more`);
    }
  }

  return toReverse;
}

async function reverseBulkForAccountant(client, accountantUsername, rows) {
  const sample = rows[0];
  const totalReward = rows.reduce((sum, row) => sum + parseFloat(row.reward_amount), 0);
  const xpToRemove = rows.length * XP_PER_REWARD;
  const townClass = sample.town_class;
  const schoolId = sample.school_id ?? null;

  if (!townClass) {
    throw new Error(`Accountant @${accountantUsername} has no town class`);
  }

  const accountResult = await client.query(
    'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
    [sample.accountant_user_id]
  );
  const account = accountResult.rows[0];
  if (!account) {
    throw new Error(`No account for accountant @${accountantUsername}`);
  }

  const userResult = await client.query(
    'SELECT job_experience_points FROM users WHERE id = $1 FOR UPDATE',
    [sample.accountant_user_id]
  );
  const currentXP = parseInt(userResult.rows[0].job_experience_points, 10) || 0;
  const newXP = Math.max(0, currentXP - xpToRemove);
  const newLevel = levelFromXP(newXP);
  const newBalance = parseFloat(account.balance) - totalReward;

  await client.query(
    'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newBalance, account.id]
  );
  await client.query(
    'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
    [newXP, newLevel, sample.accountant_user_id]
  );

  if (schoolId != null) {
    await client.query(
      `UPDATE town_settings
       SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE class = $2 AND school_id = $3`,
      [totalReward, townClass, schoolId]
    );
  } else {
    await client.query(
      `UPDATE town_settings
       SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE class = $2 AND school_id IS NULL`,
      [totalReward, townClass]
    );
  }

  await client.query(
    `INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      schoolId,
      townClass,
      totalReward,
      'deposit',
      `Bulk reversal of ${rows.length} fraudulent accountant transfer approval rewards (@${accountantUsername})`,
      sample.accountant_user_id,
    ]
  );

  const reversalTx = await client.query(
    `INSERT INTO transactions (from_account_id, amount, transaction_type, description)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      account.id,
      totalReward,
      'withdrawal',
      `ACCOUNTANT_TRANSFER_APPROVAL_EARN_REVERSAL (${rows.length} exploits)`,
    ]
  );
  const reversalTransactionId = reversalTx.rows[0].id;

  const rewardIds = rows.map((row) => row.reward_transaction_id);
  const transferAmounts = rows.map((row) =>
    row.transfer_amount != null ? parseFloat(row.transfer_amount) : null
  );
  const pendingIds = rows.map((row) => row.pending_transfer_id);
  const reasons = rows.map((row) => row.exploit_reason);

  await client.query(
    `INSERT INTO accountant_transfer_reward_reversals
       (reward_transaction_id, accountant_user_id, reversal_transaction_id, reward_amount,
        transfer_amount, pending_transfer_id, exploit_reason)
     SELECT
       u.reward_id,
       $2,
       $1,
       t.amount,
       u.transfer_amt,
       u.pending_id,
       u.reason
     FROM unnest($3::int[], $4::numeric[], $5::int[], $6::text[])
       AS u(reward_id, transfer_amt, pending_id, reason)
     JOIN transactions t ON t.id = u.reward_id`,
    [reversalTransactionId, sample.accountant_user_id, rewardIds, transferAmounts, pendingIds, reasons]
  );

  return {
    reversal_transaction_id: reversalTransactionId,
    balance_after: newBalance,
    xp_after: newXP,
    level_after: newLevel,
    count: rows.length,
    total_reward: totalReward,
  };
}

async function reverseOne(client, row) {
  const rewardAmount = parseFloat(row.reward_amount);
  const townClass = row.town_class;
  const schoolId = row.school_id ?? null;

  if (!townClass) {
    throw new Error(`Accountant @${row.accountant_username} has no town class`);
  }

  const accountResult = await client.query(
    'SELECT * FROM accounts WHERE user_id = $1 FOR UPDATE',
    [row.accountant_user_id]
  );
  const account = accountResult.rows[0];
  if (!account) {
    throw new Error(`No account for accountant user id ${row.accountant_user_id}`);
  }

  const userResult = await client.query(
    'SELECT job_experience_points, job_level FROM users WHERE id = $1 FOR UPDATE',
    [row.accountant_user_id]
  );
  const userRow = userResult.rows[0];
  const currentXP = parseInt(userRow.job_experience_points, 10) || 0;
  const newXP = Math.max(0, currentXP - XP_PER_REWARD);
  const newLevel = levelFromXP(newXP);

  const newBalance = parseFloat(account.balance) - rewardAmount;
  await client.query(
    'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newBalance, account.id]
  );

  await client.query(
    'UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3',
    [newXP, newLevel, row.accountant_user_id]
  );

  if (schoolId != null) {
    await client.query(
      `UPDATE town_settings
       SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE class = $2 AND school_id = $3`,
      [rewardAmount, townClass, schoolId]
    );
  } else {
    await client.query(
      `UPDATE town_settings
       SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE class = $2 AND school_id IS NULL`,
      [rewardAmount, townClass]
    );
  }

  await client.query(
    `INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      schoolId,
      townClass,
      rewardAmount,
      'deposit',
      `Reversal of fraudulent accountant transfer approval reward (tx #${row.reward_transaction_id})`,
      row.accountant_user_id,
    ]
  );

  const reversalTx = await client.query(
    `INSERT INTO transactions (from_account_id, amount, transaction_type, description)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      account.id,
      rewardAmount,
      'withdrawal',
      'ACCOUNTANT_TRANSFER_APPROVAL_EARN_REVERSAL',
    ]
  );

  await client.query(
    `INSERT INTO accountant_transfer_reward_reversals
       (reward_transaction_id, accountant_user_id, reversal_transaction_id, reward_amount,
        transfer_amount, pending_transfer_id, exploit_reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      row.reward_transaction_id,
      row.accountant_user_id,
      reversalTx.rows[0].id,
      rewardAmount,
      row.transfer_amount != null ? parseFloat(row.transfer_amount) : null,
      row.pending_transfer_id,
      row.exploit_reason,
    ]
  );

  return {
    reversal_transaction_id: reversalTx.rows[0].id,
    balance_after: newBalance,
    xp_after: newXP,
    level_after: newLevel,
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const audit = process.argv.includes('--audit') || !apply;
  const quiet = process.argv.includes('--quiet') || apply;
  const accountantFilterArg = process.argv.find((arg) => arg.startsWith('--accountant='));
  const accountantFilter = accountantFilterArg
    ? accountantFilterArg.split('=')[1].trim().toLowerCase()
    : null;

  const resolved = resolveDatabaseConnection();
  if (!resolved) {
    console.error('❌ No valid DATABASE_URL / DATABASE_PUBLIC_URL. Run via Railway:');
    console.error('   npx @railway/cli@latest run --service Postgres npm run audit:accountant-transfer-exploit');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: resolved.connectionString,
    ssl: resolved.connectionString.includes('railway') || resolved.connectionString.includes('rlwy.net')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    const tableCheck = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_name = 'accountant_transfer_reward_reversals'
       ) AS exists`
    );
    const hasReversalTable = tableCheck.rows[0].exists;
    if (apply && !hasReversalTable) {
      console.error('❌ Table accountant_transfer_reward_reversals not found.');
      console.error('   Run: npm run migrate:accountant-transfer-reward-reversals');
      process.exit(1);
    }

    const auditSql = hasReversalTable
      ? AUDIT_SQL
      : AUDIT_SQL.replace(
          `  LEFT JOIN accountant_transfer_reward_reversals rev
    ON rev.reward_transaction_id = reward.id
`,
          ''
        ).replace('rev.id IS NOT NULL AS already_reversed', 'FALSE AS already_reversed');

    const result = await pool.query(auditSql);
    let rows = result.rows.map((row) => {
      const classification = classifyExploit(row);
      return {
        ...row,
        exploit: classification.exploit,
        exploit_reason: classification.reason,
        skip: classification.skip || false,
      };
    });

    if (accountantFilter) {
      rows = rows.filter((row) => row.accountant_username.toLowerCase() === accountantFilter);
    }

    const toReverse = printAuditReport(rows, apply ? 'REVERSAL' : 'AUDIT', quiet);

    if (!apply) {
      console.log('\nDry run only. To reverse flagged rewards, run with --apply');
      return;
    }

    if (toReverse.length === 0) {
      console.log('\nNothing to reverse.');
      return;
    }

    console.log(`\nReversing ${toReverse.length} fraudulent reward(s)...`);

    const byAccountant = new Map();
    for (const row of toReverse) {
      const key = row.accountant_username;
      if (!byAccountant.has(key)) byAccountant.set(key, []);
      byAccountant.get(key).push(row);
    }

    let reversed = 0;
    const errors = [];

    for (const [accountantUsername, rows] of byAccountant.entries()) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const outcome = await reverseBulkForAccountant(client, accountantUsername, rows);
        await client.query('COMMIT');
        reversed += outcome.count;
        console.log(
          `  ✅ @${accountantUsername}: reversed ${outcome.count} rewards (R${outcome.total_reward.toFixed(2)})` +
            ` → bulk reversal tx #${outcome.reversal_transaction_id}` +
            ` | balance now R${outcome.balance_after.toFixed(2)}`
        );
        if (outcome.balance_after < 0) {
          console.log(`     ⚠️  Account went negative — student may have spent the fraudulent funds`);
        }
      } catch (err) {
        await client.query('ROLLBACK');
        errors.push({ accountant: accountantUsername, error: err.message || String(err) });
        console.error(`  ❌ Failed @${accountantUsername}: ${err.message || err}`);
      } finally {
        client.release();
      }
    }

    console.log(`\nDone. Reversed ${reversed}/${toReverse.length} reward deposit(s) across ${byAccountant.size} accountant(s).`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}`);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
