// Fix missing status column on users table
// Run this on Railway: node fix-status-column.js

const { Pool } = require('pg');

async function fixStatusColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
    ssl: false
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // Add status column to users table
    console.log('📝 Adding status column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved'
    `);
    console.log('✅ Added status column');

    // Set all existing users to approved
    console.log('📝 Setting all existing users to approved status...');
    const result = await pool.query(`
      UPDATE users SET status = 'approved' WHERE status IS NULL
    `);
    console.log(`✅ Updated ${result.rowCount} users to approved status`);

    // Create indexes for faster queries
    console.log('📝 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status)
    `);
    console.log('✅ Created indexes');

    // Verify the fix
    const countResult = await pool.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
      FROM users WHERE role = 'student'
    `);
    console.log(`📊 Students: ${countResult.rows[0].total} total, ${countResult.rows[0].approved} approved`);

    console.log('🎉 Migration completed successfully! Students should now be visible.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

fixStatusColumn();
