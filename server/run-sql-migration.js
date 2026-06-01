// Generic script to run a raw SQL migration file against the Postgres database
// Usage:
//   node run-sql-migration.js migrations/064_add_global_jobs_for_all_schools.sql

require('dotenv').config();
const { Pool } = require('pg');
const { readFileSync } = require('fs');
const { join, resolve } = require('path');

async function runSqlMigration() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('❌ No migration file provided.');
    console.error('   Usage: node run-sql-migration.js migrations/<file>.sql');
    process.exit(1);
  }

  // Support both relative paths and bare filenames under migrations/
  const migrationPath = fileArg.endsWith('.sql')
    ? (fileArg.includes('/') || fileArg.includes('\\')
        ? resolve(__dirname, fileArg)
        : join(__dirname, 'migrations', fileArg))
    : join(__dirname, 'migrations', `${fileArg}.sql`);

  const resolved = resolveDatabaseConnection();
  if (!resolved) {
    console.error('❌ No valid DATABASE_URL, DATABASE_PUBLIC_URL, or PGHOST config found.');
    console.error('💡 From server/, run: npx @railway/cli@latest run npm run migrate:<name>');
    console.error('💡 Ensure the project is linked (railway link) to gameoflife-backend.');
    process.exit(1);
  }

  const { connectionString, source } = resolved;
  console.log(`🔗 Using ${source}`);

  const pool = new Pool({
    connectionString,
    ssl: isRailwayLike(connectionString) ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Running SQL migration:', migrationPath);
    const sql = readFileSync(migrationPath, 'utf8');
    await pool.query(sql);
    console.log('✅ Migration completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function isRailwayLike(url) {
  return (
    url.includes('railway') ||
    url.includes('rlwy.net') ||
    url.includes('railway.internal') ||
    url.includes('switchback.proxy.rlwy.net')
  );
}

/** Reject empty, template, or unparseable Postgres URLs (avoids pg "searchParams" crashes). */
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

function isInternalRailwayHost(url) {
  return url.includes('.railway.internal');
}

function resolveDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  const publicUrl = process.env.DATABASE_PUBLIC_URL;

  // Local `railway run` must use a public/proxy host — *.railway.internal only works in deploy.
  if (isValidPostgresUrl(publicUrl)) {
    return { connectionString: publicUrl.trim(), source: 'DATABASE_PUBLIC_URL' };
  }

  if (isValidPostgresUrl(databaseUrl) && !isInternalRailwayHost(databaseUrl)) {
    return { connectionString: databaseUrl.trim(), source: 'DATABASE_URL' };
  }

  const fromPg = buildUrlFromPgEnv();
  if (isValidPostgresUrl(fromPg) && !isInternalRailwayHost(fromPg)) {
    return { connectionString: fromPg, source: 'PGHOST/PGUSER/...' };
  }

  if (isValidPostgresUrl(databaseUrl) && isInternalRailwayHost(databaseUrl)) {
    console.error('❌ DATABASE_URL uses internal Railway host (*.railway.internal).');
    console.error('   Commands run on your PC cannot reach that host.');
    console.error('');
    console.error('   Fix (pick one):');
    console.error('   1) Railway dashboard → Postgres service → Connect → copy Public URL');
    console.error('      Add variable DATABASE_PUBLIC_URL on gameoflife-backend (reference Postgres).');
    console.error('   2) Run migration against the Postgres service:');
    console.error('      npx @railway/cli@latest run --service gameoflife-db npm run migrate:doctor-reputation');
    console.error('   3) Temporarily in server/.env (do not commit): DATABASE_PUBLIC_URL=<public url>');
    process.exit(1);
  }

  return null;
}

runSqlMigration().catch((err) => {
  console.error('❌ Unexpected error running migration:', err);
  process.exit(1);
});

