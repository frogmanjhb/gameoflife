// Seed script for Town Hub
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
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
    console.log('🌱 Starting Town Hub seed...');
    
    // Check if tables exist, if not run migration
    try {
      await pool.query('SELECT 1 FROM plugins LIMIT 1');
      console.log('✅ Tables already exist, skipping migration');
    } catch (error) {
      console.log('📝 Tables not found, running migration...');
      const fs = require('fs');
      const path = require('path');
      const migrationPath = path.join(__dirname, 'migrations', '002_town_hub_tables.sql');
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSQL);
        console.log('✅ Migration completed');
      } else {
        console.log('⚠️ Migration file not found, assuming tables already exist');
      }
    }

    // Seed Plugins
    console.log('🔌 Seeding plugins...');
    const plugins = [
      { name: 'Bank', route_path: '/bank', icon: '🏦', description: 'Financial services and banking' },
      { name: 'Land & Property', route_path: '/land', icon: '🗺️', description: 'Land registry and property management' },
      { name: 'Jobs', route_path: '/jobs', icon: '💼', description: 'Employment board and job listings' },
      { name: 'Town News', route_path: '/news', icon: '📰', description: 'Local news and updates' },
      { name: 'Government', route_path: '/government', icon: '🏛️', description: 'Town government services' }
    ];

    for (const plugin of plugins) {
      await pool.query(
        `INSERT INTO plugins (name, enabled, route_path, icon, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING`,
        [plugin.name, true, plugin.route_path, plugin.icon, plugin.description]
      );
    }
    console.log('✅ Plugins seeded');

    // Seed Jobs
    console.log('💼 Seeding jobs...');
    const jobs = [
      { name: 'Teacher', description: 'Educate students', salary: 5000.00 },
      { name: 'Doctor', description: 'Provide medical care', salary: 8000.00 },
      { name: 'Engineer', description: 'Design and build', salary: 7000.00 },
      { name: 'Shopkeeper', description: 'Run a store', salary: 4000.00 },
      { name: 'Farmer', description: 'Grow crops', salary: 3000.00 },
      { name: 'Police Officer', description: 'Maintain law and order', salary: 6000.00 },
      { name: 'Firefighter', description: 'Fight fires', salary: 5500.00 },
      { name: 'Chef', description: 'Prepare meals', salary: 4500.00 }
    ];

    for (const job of jobs) {
      await pool.query(
        `INSERT INTO jobs (name, description, salary)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [job.name, job.description, job.salary]
      );
    }
    console.log('✅ Jobs seeded');

    // Seed Town Settings
    console.log('🏘️ Seeding town settings...');
    const towns = [
      { class: '6A', town_name: '6A Town', mayor_name: 'TBD', tax_rate: 5.0 },
      { class: '6B', town_name: '6B Town', mayor_name: 'TBD', tax_rate: 5.0 },
      { class: '6C', town_name: '6C Town', mayor_name: 'TBD', tax_rate: 5.0 }
    ];

    for (const town of towns) {
      await pool.query(
        `INSERT INTO town_settings (class, town_name, mayor_name, tax_rate)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (class) DO UPDATE SET
           town_name = EXCLUDED.town_name,
           mayor_name = EXCLUDED.mayor_name,
           tax_rate = EXCLUDED.tax_rate`,
        [town.class, town.town_name, town.mayor_name, town.tax_rate]
      );
    }
    console.log('✅ Town settings seeded');

    // Seed Users (only if they don't exist)
    console.log('👥 Seeding users...');
    
    // Check if teacher exists
    const teacherCheck = await pool.query('SELECT id FROM users WHERE username = $1', ['teacher1']);
    if (teacherCheck.rows.length === 0) {
      const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
      await pool.query(
        `INSERT INTO users (username, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)`,
        ['teacher1', teacherPasswordHash, 'teacher', 'Teacher', 'One']
      );
      console.log('✅ Teacher user created (username: teacher1, password: teacher123)');
    } else {
      console.log('ℹ️ Teacher user already exists');
    }

    // Seed students
    const students = [
      { username: 'student1', class: '6A', first_name: 'Student', last_name: 'One' },
      { username: 'student2', class: '6B', first_name: 'Student', last_name: 'Two' },
      { username: 'student3', class: '6C', first_name: 'Student', last_name: 'Three' }
    ];

    for (const student of students) {
      const studentCheck = await pool.query('SELECT id FROM users WHERE username = $1', [student.username]);
      if (studentCheck.rows.length === 0) {
        const studentPasswordHash = await bcrypt.hash('student123', 10);
        const result = await pool.query(
          `INSERT INTO users (username, password_hash, role, first_name, last_name, class)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [student.username, studentPasswordHash, 'student', student.first_name, student.last_name, student.class]
        );
        
        // Create account for student
        const userId = result.rows[0].id;
        const accountNumber = `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
        await pool.query(
          `INSERT INTO accounts (user_id, account_number, balance)
           VALUES ($1, $2, $3)`,
          [userId, accountNumber, 0.00]
        );
        console.log(`✅ Student ${student.username} created with account`);
      } else {
        console.log(`ℹ️ Student ${student.username} already exists`);
      }
    }
    console.log('✅ Users seeded (password for all: student123)');

    console.log('🎉 Town Hub seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Plugins: 5 (all enabled)');
    console.log('  - Jobs: 8');
    console.log('  - Towns: 3 (6A, 6B, 6C)');
    console.log('  - Users: 1 teacher, 3 students');
    console.log('\n🔑 Login credentials:');
    console.log('  Teacher: teacher1 / teacher123');
    console.log('  Students: student1, student2, student3 / student123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase().catch(console.error);

