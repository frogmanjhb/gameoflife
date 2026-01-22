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
    
    // Check if tables exist, if not run migrations
    const fs = require('fs');
    const path = require('path');
    
    try {
      await pool.query('SELECT 1 FROM plugins LIMIT 1');
      console.log('✅ Tables already exist, checking for additional migrations...');
    } catch (error) {
      console.log('📝 Tables not found, running migrations...');
      const migrationPath = path.join(__dirname, 'migrations', '002_town_hub_tables.sql');
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSQL);
        console.log('✅ Town Hub migration completed');
      } else {
        console.log('⚠️ Migration file not found, assuming tables already exist');
      }
    }
    
    // Run job applications migration if needed
    try {
      await pool.query('SELECT 1 FROM job_applications LIMIT 1');
      console.log('✅ Job applications table already exists');
    } catch (error) {
      console.log('📝 Job applications table not found, running migration...');
      const migrationPath = path.join(__dirname, 'migrations', '003_job_applications.sql');
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSQL);
        console.log('✅ Job Applications migration completed');
      } else {
        console.log('⚠️ Job applications migration file not found');
      }
    }

    // Seed Plugins
    console.log('🔌 Seeding plugins...');
    const plugins = [
      { name: 'Bank', route_path: '/bank', icon: '🏦', description: 'Financial services and banking' },
      { name: 'Land & Property', route_path: '/land', icon: '🗺️', description: 'Land registry and property management' },
      { name: 'Jobs', route_path: '/jobs', icon: '💼', description: 'Employment board and job listings' },
      { name: 'Town News', route_path: '/news', icon: '📰', description: 'Local news and updates' },
      { name: 'Government', route_path: '/government', icon: '🏛️', description: 'Town government services' },
      { name: 'Tenders', route_path: '/tenders', icon: '📑', description: 'Building jobs that need to happen on the game board' },
      { name: 'Town Rules', route_path: '/town-rules', icon: '📜', description: 'Town-specific rules and regulations' }
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
    // Note: All salaries are in South African Rands (ZAR)
    console.log('💼 Seeding jobs...');
    
    // Delete old placeholder jobs if they exist
    const oldJobs = ['Chef', 'Firefighter', 'Police Officer', 'Farmer', 'Shopkeeper', 'Engineer'];
    for (const oldJobName of oldJobs) {
      await pool.query('DELETE FROM jobs WHERE name = $1', [oldJobName]);
    }
    console.log('✅ Old placeholder jobs removed');
    
    const jobs = [
      // 🏛️ GOVERNANCE & ADMINISTRATION
      {
        name: 'Mayor',
        description: 'Daily: Check Town Hub announcements and alerts. Respond to issues raised by HR, Police or Planner. Approve minor decisions (with teacher sign-off if needed).\n\nWeekly: Chair town council meeting. Announce laws, tax changes or events. Approve major land or budget decisions. Address the town after major events or disasters.',
        salary: 10000.00,
        company_name: 'Town Government',
        location: 'Town Hall'
      },
      {
        name: 'Town Planner',
        description: 'Daily: Update land ownership records. Answer questions about zoning and building rules. Monitor builds on the physical board.\n\nWeekly: Run land tender process. Approve or reject building plans. Update town map (physical + digital). Work with Engineers on infrastructure planning.',
        salary: 7500.00,
        company_name: 'Town Government',
        location: 'Planning Office',
        requirements: 'Two positions available. Planners work together and must agree on major planning decisions.'
      },
      {
        name: 'Lawyer',
        description: 'Daily: Advise students on fines, disputes or rules. Clarify constitution rules when conflicts arise.\n\nWeekly: Help update or interpret town constitution. Represent cases during town disputes. Review contracts (jobs, land, loans). Present legal summary to Mayor.',
        salary: 8000.00,
        company_name: 'Town Government',
        location: 'Legal Office',
        requirements: 'Two positions available.'
      },
      {
        name: 'Police Lieutenant',
        description: 'Daily: Record fines issued during the school day. Communicate fines to Financial Manager. Monitor rule compliance.\n\nWeekly: Report fine totals. Build or update police station. Assist during disasters or emergencies. Meet with Mayor and Lawyer on enforcement issues.',
        salary: 7000.00,
        company_name: 'Town Police',
        location: 'Police Station',
        requirements: 'Two positions available.'
      },
      {
        name: 'HR Director',
        description: 'Daily: Track attendance, participation and behaviour. Check in with students struggling in roles. Note conflicts or concerns.\n\nWeekly: Mediate disputes. Report role performance to Mayor/Teacher. Recommend bonuses or warnings. Adjust job assignments if needed.',
        salary: 7200.00,
        company_name: 'Town Government',
        location: 'HR Office'
      },
      // 💰 FINANCE
      {
        name: 'Chartered Accountant',
        description: 'Daily: Check financial accuracy (balances, reports). Flag missing or incorrect data.\n\nWeekly: Audit town finances. Review tax income and expenses. Produce summary report. Advise Mayor on financial risks.',
        salary: 8500.00,
        company_name: 'Town Finance',
        location: 'Accounting Office',
        requirements: 'Two positions available.'
      },
      {
        name: 'Financial Manager',
        description: 'Daily: Process salaries, bonuses and fines. Update banking records. Answer balance queries.\n\nWeekly: Pay salaries. Collect taxes. Transfer funds to Town Bank. Report finances to Accountant.',
        salary: 7800.00,
        company_name: 'Town Finance',
        location: 'Finance Office',
        requirements: 'Two positions available.'
      },
      // 🏗️ INFRASTRUCTURE & DESIGN
      {
        name: 'Architect',
        description: 'Daily: Review building designs. Consult on sustainability requirements. Sketch or revise plans.\n\nWeekly: Design public buildings. Approve private building layouts. Present designs to Town Planner. Update design portfolio.',
        salary: 8000.00,
        company_name: 'Town Design',
        location: 'Design Studio'
      },
      {
        name: 'Civil Engineer',
        description: 'Daily: Monitor road and transport planning. Assist with build logistics.\n\nWeekly: Design or improve road systems. Plan disaster recovery infrastructure. Work with Architect and Planner. Update infrastructure plans.',
        salary: 7500.00,
        company_name: 'Town Infrastructure',
        location: 'Engineering Office'
      },
      {
        name: 'Electrical Engineer',
        description: 'Daily: Plan power layouts. Advise on energy use and sustainability.\n\nWeekly: Implement renewable energy systems. Support builds needing power. Update town power plan. Assist during power-related disasters.',
        salary: 7500.00,
        company_name: 'Town Infrastructure',
        location: 'Engineering Office'
      },
      // 🎓 EDUCATION
      {
        name: 'School Principal',
        description: 'Daily: Liaise between students and teacher. Check learning progress and understanding.\n\nWeekly: Oversee school build. Address town learning needs. Support assessment alignment. Report to Mayor and Teacher.',
        salary: 9000.00,
        company_name: 'Town Education',
        location: 'School'
      },
      {
        name: 'Teacher',
        description: 'Daily: Support learners in projects. Run short learning activities.\n\nWeekly: Plan lessons linked to town needs. Teach skills required for jobs. Assess student work. Report progress.',
        salary: 6000.00,
        company_name: 'Town Education',
        location: 'School'
      },
      // 🏥 HEALTH
      {
        name: 'Doctor',
        description: 'Daily: Track sick leave and injuries. Manage absenteeism records.\n\nWeekly: Run health briefings. Respond to disaster injuries. Manage hospital build. Report health data to teachers.',
        salary: 9000.00,
        company_name: 'Town Health',
        location: 'Hospital'
      },
      {
        name: 'Nurse',
        description: 'Daily: Assist sick or injured students. Record treatments.\n\nWeekly: Support Doctor during emergencies. Update health logs. Prepare medical supplies.',
        salary: 5500.00,
        company_name: 'Town Health',
        location: 'Hospital'
      },
      // 🏪 BUSINESS & COMMUNITY
      {
        name: 'Retail Manager',
        description: 'Daily: Track supply and demand. Set prices.\n\nWeekly: Adjust pricing based on economy. Respond to shortages. Report sales to Finance. Update shop on board.',
        salary: 6500.00,
        company_name: 'Town Retail',
        location: 'Town Shop'
      },
      {
        name: 'Event Planner',
        description: 'Daily: Update town calendar. Communicate upcoming events.\n\nWeekly: Plan elections, meetings or celebrations. Co-ordinate logistics. Work with Marketing and Mayor. Evaluate event success.',
        salary: 6000.00,
        company_name: 'Town Events',
        location: 'Event Office'
      },
      // 📰 MEDIA & COMMUNICATION
      {
        name: 'Journalist',
        description: 'Daily: Observe town activity. Take notes and conduct interviews.\n\nWeekly: Write and submit articles. Publish approved news. Cover events and elections. Maintain news archive.',
        salary: 5500.00,
        company_name: 'Town News',
        location: 'News Office'
      },
      {
        name: 'Graphic Designer',
        description: 'Daily: Design posters, signs or visuals.\n\nWeekly: Support campaigns and events. Update town branding. Collaborate with Journalist and Marketing.',
        salary: 6000.00,
        company_name: 'Town Media',
        location: 'Design Studio'
      },
      {
        name: 'Marketing Manager',
        description: 'Daily: Oversee messaging and tone. Approve designs and articles.\n\nWeekly: Promote town initiatives. Run campaigns (elections, events). Update town brand assets. Report engagement to Mayor.',
        salary: 7000.00,
        company_name: 'Town Media',
        location: 'Marketing Office'
      }
    ];

    for (const job of jobs) {
      await pool.query(
        `INSERT INTO jobs (name, description, salary, company_name, location, requirements)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           salary = EXCLUDED.salary,
           company_name = EXCLUDED.company_name,
           location = EXCLUDED.location,
           requirements = EXCLUDED.requirements`,
        [job.name, job.description, job.salary, job.company_name || null, job.location || null, job.requirements || null]
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
    console.log(`  - Jobs: ${jobs.length} (all categories)`);
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

