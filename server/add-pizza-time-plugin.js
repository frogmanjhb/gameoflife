// Quick script to add Pizza Time plugin to the database
const { Pool } = require('pg');

async function addPizzaTimePlugin() {
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ No DATABASE_URL or DATABASE_PUBLIC_URL found');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('railway') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🍕 Adding Pizza Time plugin...');
    
    // Check if plugin exists
    const existing = await pool.query('SELECT id FROM plugins WHERE name = $1', ['Pizza Time']);
    
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO plugins (name, enabled, route_path, icon, description)
         VALUES ($1, $2, $3, $4, $5)`,
        ['Pizza Time', true, '/pizza-time', '🍕', 'Donate towards a class pizza party!']
      );
      console.log('✅ Added plugin: Pizza Time');
    } else {
      console.log('ℹ️  Plugin already exists: Pizza Time');
    }
    
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addPizzaTimePlugin().catch(console.error);
