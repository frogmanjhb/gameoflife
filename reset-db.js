const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  // Railway uses DATABASE_PUBLIC_URL for external access
  const databaseUrl = process.env.DATABASE_PUBLIC_URL;
  
  console.log('🔗 Database URL found:', databaseUrl ? 'Yes' : 'No');
  console.log('🔗 Using DATABASE_PUBLIC_URL:', !!process.env.DATABASE_PUBLIC_URL);
  console.log('🔗 Using DATABASE_URL:', !!process.env.DATABASE_URL);
  
  if (!databaseUrl) {
    throw new Error('DATABASE_PUBLIC_URL environment variable is required for PostgreSQL connection');
  }
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    
    console.log('🗑️ Dropping all tables...');
    await client.query('DROP TABLE IF EXISTS loan_payments CASCADE');
    await client.query('DROP TABLE IF EXISTS loans CASCADE');
    await client.query('DROP TABLE IF EXISTS transactions CASCADE');
    await client.query('DROP TABLE IF EXISTS accounts CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('📄 Reading schema file...');
    const schemaPath = path.join(__dirname, 'server', 'src', 'database', 'schema-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🏗️ Creating fresh schema...');
    await client.query(schema);
    
    console.log('✅ Database reset completed successfully!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables created:', result.rows.map(row => row.table_name));
    
    client.release();
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

resetDatabase().catch(console.error);
