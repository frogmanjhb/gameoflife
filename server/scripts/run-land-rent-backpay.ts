/**
 * One-time backpay for land rental income underpaid when owners collected
 * multiple weeks of rent but only received a single week's payout.
 *
 * Usage (from server/):
 *   npx tsx scripts/run-land-rent-backpay.ts --audit
 *   npx tsx scripts/run-land-rent-backpay.ts --apply
 *
 * Railway:
 *   npx @railway/cli@latest run --service Postgres npm run migrate:land-rent-backpay
 *   npx @railway/cli@latest run --service Postgres npm run backpay:land-rent
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { replayLandRentCollections } from '../src/domain/landProperty';

const RENT_DESC_PREFIX = 'Land rental income: Plot ';
const BACKPAY_DESC_PREFIX = 'Land rental income backpay: Plot ';

function isValidPostgresUrl(value: string | undefined): boolean {
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

function buildUrlFromPgEnv(): string | null {
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

function resolveDatabaseConnection(): { connectionString: string; source: string } | null {
  const publicUrl = process.env.DATABASE_PUBLIC_URL;
  const databaseUrl = process.env.DATABASE_URL;
  if (isValidPostgresUrl(publicUrl)) {
    return { connectionString: publicUrl!.trim(), source: 'DATABASE_PUBLIC_URL' };
  }
  if (isValidPostgresUrl(databaseUrl) && !databaseUrl!.includes('.railway.internal')) {
    return { connectionString: databaseUrl!.trim(), source: 'DATABASE_URL' };
  }
  const fromPg = buildUrlFromPgEnv();
  if (isValidPostgresUrl(fromPg) && !fromPg!.includes('.railway.internal')) {
    return { connectionString: fromPg!, source: 'PGHOST/PGUSER/...' };
  }
  return null;
}

function isRailwayLike(url: string): boolean {
  return (
    url.includes('railway') ||
    url.includes('rlwy.net') ||
    url.includes('railway.internal') ||
    url.includes('switchback.proxy.rlwy.net')
  );
}

interface ParcelRow {
  id: number;
  grid_code: string;
  owner_id: number;
  purchase_price: string | number | null;
  value: string | number;
  purchased_at: string;
}

interface RentTxnRow {
  amount: string | number;
  created_at: string;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const audit = process.argv.includes('--audit') || !apply;
  if (!apply && !audit) {
    console.error('Pass --audit or --apply');
    process.exit(1);
  }

  const resolved = resolveDatabaseConnection();
  if (!resolved) {
    console.error('No valid database URL. Use railway run from server/.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: resolved.connectionString,
    ssl: isRailwayLike(resolved.connectionString) ? { rejectUnauthorized: false } : false,
  });

  console.log(`🔗 Using ${resolved.source}`);
  console.log(apply ? '💰 APPLY — crediting accounts' : '🔍 AUDIT — no database writes');

  const colCheck = await pool.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'land_parcels' AND column_name = 'rent_backpay_applied_at'
  `);
  if (colCheck.rowCount === 0) {
    console.error('Missing rent_backpay_applied_at column. Run: npm run migrate:land-rent-backpay');
    process.exit(1);
  }

  const parcelsRes = await pool.query<ParcelRow>(`
    SELECT id, grid_code, owner_id, purchase_price, value, purchased_at
    FROM land_parcels
    WHERE owner_id IS NOT NULL
      AND purchased_at IS NOT NULL
      AND rent_backpay_applied_at IS NULL
    ORDER BY id
  `);

  let parcelsProcessed = 0;
  let parcelsCredited = 0;
  let totalShortfall = 0;

  for (const parcel of parcelsRes.rows) {
    const purchasePrice = Number(parcel.purchase_price ?? parcel.value) || 0;
    if (purchasePrice <= 0) continue;

    const rentDesc = `${RENT_DESC_PREFIX}${parcel.grid_code}`;
    const txnsRes = await pool.query<RentTxnRow>(
      `SELECT t.amount, t.created_at
       FROM transactions t
       JOIN accounts a ON a.id = t.to_account_id
       WHERE a.user_id = $1
         AND t.transaction_type = 'deposit'
         AND t.description = $2
         AND t.created_at >= $3
       ORDER BY t.created_at ASC`,
      [parcel.owner_id, rentDesc, parcel.purchased_at]
    );

    const replay = replayLandRentCollections(
      purchasePrice,
      parcel.purchased_at,
      txnsRes.rows.map((row) => ({
        amount: Number(row.amount),
        collectedAt: row.created_at,
      }))
    );

    parcelsProcessed += 1;

    if (replay.shortfall > 0 || replay.correctedLastRentCollectedAt) {
      console.log(
        `Plot ${parcel.grid_code} (id ${parcel.id}): paid R${replay.totalPaid}, expected R${replay.totalExpected}, shortfall R${replay.shortfall}`
      );
    }

    if (replay.shortfall <= 0) {
      if (apply) {
        await markParcelDone(pool, parcel.id, replay.correctedLastRentCollectedAt);
      }
      continue;
    }

    totalShortfall += replay.shortfall;
    parcelsCredited += 1;

    if (!apply) continue;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const accountRes = await client.query<{ id: number }>(
        'SELECT id FROM accounts WHERE user_id = $1 FOR UPDATE',
        [parcel.owner_id]
      );
      const account = accountRes.rows[0];
      if (!account) {
        throw new Error(`No account for user ${parcel.owner_id}`);
      }

      await client.query(
        'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [replay.shortfall, account.id]
      );
      await client.query(
        `INSERT INTO transactions (to_account_id, amount, transaction_type, description)
         VALUES ($1, $2, 'deposit', $3)`,
        [account.id, replay.shortfall, `${BACKPAY_DESC_PREFIX}${parcel.grid_code}`]
      );

      if (replay.correctedLastRentCollectedAt) {
        await client.query(
          `UPDATE land_parcels
           SET last_rent_collected_at = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [replay.correctedLastRentCollectedAt, parcel.id]
        );
      }

      await client.query(
        `UPDATE land_parcels
         SET rent_backpay_applied_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [parcel.id]
      );

      await client.query('COMMIT');
      console.log(`  ✅ Credited R${replay.shortfall} to user ${parcel.owner_id}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('---');
  console.log(`Parcels scanned: ${parcelsProcessed}`);
  console.log(`Parcels with backpay due: ${parcelsCredited}`);
  console.log(`Total shortfall: R${totalShortfall}`);
  if (audit && parcelsCredited > 0) {
    console.log('Run with --apply to credit accounts.');
  }

  await pool.end();
}

async function markParcelDone(
  pool: Pool,
  parcelId: number,
  correctedLastRentCollectedAt: string | null
) {
  if (correctedLastRentCollectedAt) {
    await pool.query(
      `UPDATE land_parcels
       SET last_rent_collected_at = $1,
           rent_backpay_applied_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [correctedLastRentCollectedAt, parcelId]
    );
  } else {
    await pool.query(
      `UPDATE land_parcels
       SET rent_backpay_applied_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [parcelId]
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
