// Script to add Software Engineer job to the database
const { Pool } = require('pg');

async function addSoftwareEngineerJob() {
  // Prefer DATABASE_PUBLIC_URL for external connections, fallback to DATABASE_URL
  const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ No DATABASE_URL or DATABASE_PUBLIC_URL found');
    console.error('💡 Get connection string: railway connect postgres');
    console.error('💡 Then set: $env:DATABASE_PUBLIC_URL = "your-connection-string"');
    process.exit(1);
  }
  
  console.log('🔗 Using connection string:', connectionString.substring(0, 30) + '...');
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('railway') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('💼 Adding Software Engineer job...');
    
    const result = await pool.query(
      `INSERT INTO jobs (name, description, salary, company_name, location, requirements)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (name) DO UPDATE SET
         description = EXCLUDED.description,
         salary = EXCLUDED.salary,
         company_name = EXCLUDED.company_name,
         location = EXCLUDED.location,
         requirements = EXCLUDED.requirements
       RETURNING id, name`,
      [
        'Software Engineer',
        'Daily: Check the Software Requests board (a list of problems learners want solved). Choose 1 task to work on or continue. Test the app with 1–2 users and capture feedback.\n\nWeekly: Bug hunt in CivicLab. Deliver one working micro-app or feature improvement. Publish it in the Town Hub as a "plugin" or tool link. Run a 2–3 minute demo to the class. Log: what problem it solves, how to use it, what changed after feedback.',
        6000.00,
        'Town Government / Tech Department',
        'Development Lab',
        null
      ]
    );

    if (result.rows.length > 0) {
      console.log('✅ Software Engineer job added/updated successfully!');
      console.log(`   Job ID: ${result.rows[0].id}`);
      console.log(`   Name: ${result.rows[0].name}`);
    } else {
      console.log('⚠️ Job may have been added but no row returned');
    }

  } catch (error) {
    console.error('❌ Failed to add Software Engineer job:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addSoftwareEngineerJob().catch(console.error);
