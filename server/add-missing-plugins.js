// Quick script to add missing plugins (Town Rules and The Winkel)
const { Pool } = require('pg');

async function addMissingPlugins() {
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
    console.log('🔌 Adding missing plugins...');
    
    const plugins = [
      { name: 'Town Rules', route_path: '/town-rules', icon: '📜', description: 'Town-specific rules and regulations' },
      { name: 'The Winkel', route_path: '/winkel', icon: '🛒', description: 'Weekly shop for consumables and privileges' }
    ];

    for (const plugin of plugins) {
      // Check if plugin exists
      const existing = await pool.query('SELECT id FROM plugins WHERE name = $1', [plugin.name]);
      
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO plugins (name, enabled, route_path, icon, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [plugin.name, true, plugin.route_path, plugin.icon, plugin.description]
        );
        console.log(`✅ Added plugin: ${plugin.name}`);
      } else {
        console.log(`ℹ️  Plugin already exists: ${plugin.name}`);
      }
    }
    
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addMissingPlugins().catch(console.error);
