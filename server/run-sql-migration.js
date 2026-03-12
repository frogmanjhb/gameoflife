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

  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ No DATABASE_URL or DATABASE_PUBLIC_URL found in environment.');
    console.error('💡 When using Railway, run commands via:');
    console.error('   railway run npm run migrate:global-jobs');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('railway')
      ? { rejectUnauthorized: false }
      : false,
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

runSqlMigration().catch((err) => {
  console.error('❌ Unexpected error running migration:', err);
  process.exit(1);
});

