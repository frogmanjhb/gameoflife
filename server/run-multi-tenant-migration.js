// Script to run the multi-tenant schools migration
require('dotenv').config();
const { Pool } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');

async function runMigration() {
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ No DATABASE_URL or DATABASE_PUBLIC_URL found');
    console.error('💡 Set environment variable: DATABASE_URL or DATABASE_PUBLIC_URL');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('railway') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Running multi-tenant schools migration...');
    
    const migrationPath = join(__dirname, 'migrations', '022_multi_tenant_schools.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Multi-tenant schools migration completed successfully!');
    console.log('\n📋 What was done:');
    console.log('  - Created schools table');
    console.log('  - Added school_id to all tenant-scoped tables');
    console.log('  - Created St Peter\'s Boys Prep school');
    console.log('  - Assigned all existing data to St Peter\'s school');
    console.log('  - Updated user roles to include super_admin');
    console.log('\n💡 Next step: Run "npm run create-super-admin" to create your super admin account');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42703') {
      console.error('💡 Some columns may already exist. This is okay - the migration uses IF NOT EXISTS.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
