// Seed script for Town Hub
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
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

    // Seed Plugins (global: school_id NULL). After migration 022, unique is (school_id, name).
    console.log('🔌 Seeding plugins...');
    const plugins = [
      { name: 'Bank', route_path: '/bank', icon: '🏦', description: 'Financial services and banking' },
      { name: 'Land & Property', route_path: '/land', icon: '🗺️', description: 'Land registry and property management' },
      { name: 'Jobs', route_path: '/jobs', icon: '💼', description: 'Employment board and job listings' },
      { name: 'Town News', route_path: '/news', icon: '📰', description: 'Local news and updates' },
      { name: 'Government', route_path: '/government', icon: '🏛️', description: 'Town government services' },
      { name: 'Tenders', route_path: '/tenders', icon: '📑', description: 'Building jobs that need to happen on the game board' },
      { name: 'Town Rules', route_path: '/town-rules', icon: '📜', description: 'Town-specific rules and regulations' },
      { name: 'The Winkel', route_path: '/winkel', icon: '🛒', description: 'Weekly shop for consumables and privileges' }
    ];

    let pluginsHaveSchoolId = false;
    try {
      await pool.query('SELECT school_id FROM plugins LIMIT 1');
      pluginsHaveSchoolId = true;
    } catch (_) {
      // Column doesn't exist (pre-022)
    }
    // After migration 022: unique is (school_id, name). Pre-022: name or route_path may be unique.
    // Use ON CONFLICT (school_id, name) when school_id exists so we match the composite constraint.
    for (const plugin of plugins) {
      if (pluginsHaveSchoolId) {
        await pool.query(
          `INSERT INTO plugins (name, enabled, route_path, icon, description, school_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (school_id, name) DO UPDATE SET
             enabled = EXCLUDED.enabled,
             route_path = EXCLUDED.route_path,
             icon = EXCLUDED.icon,
             description = EXCLUDED.description`,
          [plugin.name, true, plugin.route_path, plugin.icon, plugin.description, null]
        );
      } else {
        await pool.query(
          `INSERT INTO plugins (name, enabled, route_path, icon, description)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (name) DO UPDATE SET
             route_path = EXCLUDED.route_path,
             icon = EXCLUDED.icon,
             description = EXCLUDED.description`,
          [plugin.name, true, plugin.route_path, plugin.icon, plugin.description]
        );
      }
    }
    console.log('✅ Plugins seeded');

    // Seed Shop Items (The Winkel)
    console.log('🛒 Seeding shop items...');
    
    // Check if shop_items table exists
    try {
      await pool.query('SELECT 1 FROM shop_items LIMIT 1');
      console.log('✅ Shop items table exists');
    } catch (error) {
      console.log('⚠️ Shop items table not found. Please run migration 010_winkel_shop.sql first.');
    }

    // Prices with 40% increase from original
    const shopItems = [
      // Consumables
      {
        name: 'Sweet / Lolly',
        category: 'consumable',
        price: 350.00, // Average of R280-R420 (original R200-R300 + 40%)
        description: 'A delicious sweet treat',
        notes: 'One-off purchase',
        available: true,
        event_day_only: false
      },
      {
        name: 'Chocolate Square',
        category: 'consumable',
        price: 560.00, // R400 + 40%
        description: 'Premium chocolate square',
        notes: 'Premium sweet',
        available: true,
        event_day_only: false
      },
      {
        name: 'Sticker',
        category: 'consumable',
        price: 420.00, // R300 + 40%
        description: 'Choose your favorite sticker',
        notes: 'Let them choose',
        available: true,
        event_day_only: false
      },
      {
        name: 'Extra Sticker Pack',
        category: 'consumable',
        price: 1120.00, // R800 + 40%
        description: 'A bundle of stickers',
        notes: 'Bundled value',
        available: true,
        event_day_only: false
      },
      {
        name: 'Popcorn (Small Cup)',
        category: 'consumable',
        price: 700.00, // R500 + 40%
        description: 'Fresh popcorn in a small cup',
        notes: 'Event day only',
        available: true,
        event_day_only: true
      },
      {
        name: 'Jelly Baby / Gummy',
        category: 'consumable',
        price: 350.00, // R250 + 40%
        description: 'Chewy gummy treat',
        notes: 'Easy win',
        available: true,
        event_day_only: false
      },
      // Privileges
      {
        name: '5 min Free Time',
        category: 'privilege',
        price: 1400.00, // R1,000 + 40%
        description: '5 minutes of free time during class',
        notes: 'Once per week max',
        available: true,
        event_day_only: false
      },
      {
        name: '10 min Free Time',
        category: 'privilege',
        price: 2520.00, // R1,800 + 40%
        description: '10 minutes of free time during class',
        notes: 'Cap weekly',
        available: true,
        event_day_only: false
      },
      {
        name: 'Cushion to Sit On (Day)',
        category: 'privilege',
        price: 1680.00, // R1,200 + 40%
        description: 'Comfortable cushion for the day',
        notes: 'Comfort matters',
        available: true,
        event_day_only: false
      }
    ];

    for (const item of shopItems) {
      // Check if item already exists
      const existing = await pool.query('SELECT id FROM shop_items WHERE name = $1', [item.name]);
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO shop_items (name, category, price, description, notes, available, event_day_only)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.name, item.category, item.price, item.description, item.notes, item.available, item.event_day_only]
        );
      }
    }
    console.log('✅ Shop items seeded');

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
      // 🏛 Government & Finance (Mayor is elected, not applied for)
      {
        name: 'Mayor',
        description: 'Daily: Check Town Hub announcements and alerts. Respond to issues raised by HR, Police or Planner. Approve minor decisions (with teacher sign-off if needed).\n\nWeekly: Chair town council meeting. Announce laws, tax changes or events. Approve major land or budget decisions. Address the town after major events or disasters.',
        salary: 10000.00,
        company_name: 'Town Government',
        location: 'Town Hall'
      },
      {
        name: 'Assistant Town Planner',
        description: 'Daily: Update land ownership records. Answer questions about zoning and building rules. Monitor builds on the physical board.\n\nWeekly: Run land tender process. Approve or reject building plans. Update town map (physical + digital). Work with Engineers on infrastructure planning.',
        salary: 7500.00,
        company_name: 'Town Government',
        location: 'Planning Office',
        requirements: 'Two positions available. Planners work together and must agree on major planning decisions.'
      },
      {
        name: 'Junior Lawyer',
        description: 'Daily: Advise students on fines, disputes or rules. Clarify constitution rules when conflicts arise.\n\nWeekly: Help update or interpret town constitution. Represent cases during town disputes. Review contracts (jobs, land, loans). Present legal summary to Mayor.',
        salary: 8000.00,
        company_name: 'Town Government',
        location: 'Legal Office',
        requirements: 'Two positions available.'
      },
      {
        name: 'Junior Police Lieutenant',
        description: 'Daily: Record fines issued during the school day. Communicate fines to Financial Manager. Monitor rule compliance.\n\nWeekly: Report fine totals. Build or update police station. Assist during disasters or emergencies. Meet with Mayor and Lawyer on enforcement issues.',
        salary: 7000.00,
        company_name: 'Town Police',
        location: 'Police Station',
        requirements: 'Two positions available.'
      },
      {
        name: 'Assistant HR Director',
        description: 'Daily: Track attendance, participation and behaviour. Check in with students struggling in roles. Note conflicts or concerns.\n\nWeekly: Mediate disputes. Report role performance to Mayor/Teacher. Recommend bonuses or warnings. Adjust job assignments if needed.',
        salary: 7200.00,
        company_name: 'Town Government',
        location: 'HR Office'
      },
      {
        name: 'Junior Chartered Accountant',
        description: 'Daily: Check financial accuracy (balances, reports). Flag missing or incorrect data.\n\nWeekly: Audit town finances. Review tax income and expenses. Produce summary report. Advise Mayor on financial risks.',
        salary: 8500.00,
        company_name: 'Town Finance',
        location: 'Accounting Office',
        requirements: 'Two positions available.'
      },
      {
        name: 'Assistant Financial Manager',
        description: 'Daily: Process salaries, bonuses and fines. Update banking records. Answer balance queries.\n\nWeekly: Pay salaries. Collect taxes. Transfer funds to Town Bank. Report finances to Accountant.',
        salary: 7800.00,
        company_name: 'Town Finance',
        location: 'Finance Office',
        requirements: 'Two positions available.'
      },
      {
        name: 'Assistant Risk & Insurance Manager',
        description: 'Daily: Review property insurance requests. Calculate premium based on risk. Approve or deny cover.\n\nWeekly: Assess biome risk levels. Update premium rates. Pay out claims after disasters. Report financial exposure to Finance.',
        salary: 7500.00,
        company_name: 'Town Finance',
        location: 'Insurance Office'
      },
      // 🏗 Infrastructure & Design
      {
        name: 'Assistant Civil Engineer',
        description: 'Daily: Monitor road and transport planning. Assist with build logistics.\n\nWeekly: Design or improve road systems. Plan disaster recovery infrastructure. Work with Architect and Planner. Update infrastructure plans.',
        salary: 7500.00,
        company_name: 'Town Infrastructure',
        location: 'Engineering Office'
      },
      {
        name: 'Assistant Electrical Engineer',
        description: 'Daily: Plan power layouts. Advise on energy use and sustainability.\n\nWeekly: Implement renewable energy systems. Support builds needing power. Update town power plan. Assist during power-related disasters.',
        salary: 7500.00,
        company_name: 'Town Infrastructure',
        location: 'Engineering Office'
      },
      {
        name: 'Assistant Architect',
        description: 'Daily: Review building designs. Consult on sustainability requirements. Sketch or revise plans.\n\nWeekly: Design public buildings. Approve private building layouts. Present designs to Town Planner. Update design portfolio.',
        salary: 8000.00,
        company_name: 'Town Design',
        location: 'Design Studio'
      },
      // 🎓 Education
      {
        name: 'Assistant Principal',
        description: 'Daily: Liaise between students and teacher. Check learning progress and understanding.\n\nWeekly: Oversee school build. Address town learning needs. Support assessment alignment. Report to Mayor and Teacher.',
        salary: 9000.00,
        company_name: 'Town Education',
        location: 'School'
      },
      {
        name: 'Assistant Teacher',
        description: 'Daily: Support learners in projects. Run short learning activities.\n\nWeekly: Plan lessons linked to town needs. Teach skills required for jobs. Assess student work. Report progress.',
        salary: 6000.00,
        company_name: 'Town Education',
        location: 'School'
      },
      // 🏥 Health
      {
        name: 'Junior Doctor',
        description: 'Daily: Track sick leave and injuries. Manage absenteeism records.\n\nWeekly: Run health briefings. Respond to disaster injuries. Manage hospital build. Report health data to teachers.',
        salary: 9000.00,
        company_name: 'Town Health',
        location: 'Hospital'
      },
      {
        name: 'Assistant Nurse',
        description: 'Daily: Assist sick or injured students. Record treatments.\n\nWeekly: Support Doctor during emergencies. Update health logs. Prepare medical supplies.',
        salary: 5500.00,
        company_name: 'Town Health',
        location: 'Hospital'
      },
      // 🛍 Economy & Events
      {
        name: 'Assistant Retail Manager',
        description: 'Daily: Track supply and demand. Set prices.\n\nWeekly: Adjust pricing based on economy. Respond to shortages. Report sales to Finance. Update shop on board.',
        salary: 6500.00,
        company_name: 'Town Retail',
        location: 'Town Shop'
      },
      {
        name: 'Assistant Event Planner',
        description: 'Daily: Update town calendar. Communicate upcoming events.\n\nWeekly: Plan elections, meetings or celebrations. Co-ordinate logistics. Work with Marketing and Mayor. Evaluate event success.',
        salary: 6000.00,
        company_name: 'Town Events',
        location: 'Event Office'
      },
      {
        name: 'Entrepreneur – Town Business Founder',
        description: 'Daily: Check sales. Adjust pricing. Track expenses. Respond to customer demand.\n\nWeekly: Launch product or service. Apply for investment or loan. Present pitch. Review profit/loss. Decide to expand or pivot.',
        salary: 6000.00,
        company_name: 'Town Business',
        location: 'Town Market',
        requirements: 'Types of businesses they could start (keep it simple): Food stall; Tech service; Construction service; Tourism business; Transport service; Health products; Event service. Or linked to biome: Desert → solar company; Coastal → tourism; Grassland → agriculture; Forest → timber business.'
      },
      // 🎨 Media & Tech
      {
        name: 'Assistant Marketing Manager',
        description: 'Daily: Oversee messaging and tone. Approve designs and articles.\n\nWeekly: Promote town initiatives. Run campaigns (elections, events). Update town brand assets. Report engagement to Mayor.',
        salary: 7000.00,
        company_name: 'Town Media',
        location: 'Marketing Office'
      },
      {
        name: 'Assistant Graphic Designer',
        description: 'Daily: Design posters, signs or visuals.\n\nWeekly: Support campaigns and events. Update town branding. Collaborate with Journalist and Marketing.',
        salary: 6000.00,
        company_name: 'Town Media',
        location: 'Design Studio'
      },
      {
        name: 'Assistant Journalist',
        description: 'Daily: Observe town activity. Take notes and conduct interviews.\n\nWeekly: Write and submit articles. Publish approved news. Cover events and elections. Maintain news archive.',
        salary: 5500.00,
        company_name: 'Town News',
        location: 'News Office'
      },
      {
        name: 'Assistant Software Engineer',
        description: 'Daily: Check the Software Requests board (a list of problems learners want solved). Choose 1 task to work on or continue. Test the app with 1–2 users and capture feedback.\n\nWeekly: Bug hunt in CivicLab. Deliver one working micro-app or feature improvement. Publish it in the Town Hub as a "plugin" or tool link. Run a 2–3 minute demo to the class. Log: what problem it solves, how to use it, what changed after feedback.',
        salary: 6000.00,
        company_name: 'Town Government / Tech Department',
        location: 'Development Lab'
      }
    ];

    // Multi-tenant: use school_id NULL for global jobs. ON CONFLICT must match the unique
    // constraint: (school_id, name) after migration 022, or (name) on older DBs.
    let jobsUseSchoolIdConflict = false;
    try {
      await pool.query('SELECT school_id FROM jobs LIMIT 1');
      const constraintCheck = await pool.query(
        `SELECT 1 FROM pg_constraint WHERE conrelid = 'jobs'::regclass AND conname = 'jobs_school_name_unique' LIMIT 1`
      );
      jobsUseSchoolIdConflict = constraintCheck.rows && constraintCheck.rows.length > 0;
    } catch (_) {
      // Column or table issue; use ON CONFLICT (name)
    }
    for (const job of jobs) {
      if (jobsUseSchoolIdConflict) {
        await pool.query(
          `INSERT INTO jobs (name, description, salary, company_name, location, requirements, school_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (school_id, name) DO UPDATE SET
             description = EXCLUDED.description,
             salary = EXCLUDED.salary,
             company_name = EXCLUDED.company_name,
             location = EXCLUDED.location,
             requirements = EXCLUDED.requirements`,
          [job.name, job.description, job.salary, job.company_name || null, job.location || null, job.requirements || null, null]
        );
      } else {
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
    }
    // Assistant Software Engineer is already in the jobs array above; do not insert duplicate "Software Engineer".
    // Ensure new roles start at R2000 (base_salary)
    if (jobsUseSchoolIdConflict) {
      await pool.query(
        `UPDATE jobs SET base_salary = 2000 WHERE name IN ($1, $2) AND school_id IS NULL`,
        ['Assistant Risk & Insurance Manager', 'Entrepreneur – Town Business Founder']
      );
    } else {
      await pool.query(
        `UPDATE jobs SET base_salary = 2000 WHERE name IN ($1, $2)`,
        ['Assistant Risk & Insurance Manager', 'Entrepreneur – Town Business Founder']
      );
    }
    console.log('✅ Jobs seeded');

    // Seed Town Settings. After migration 022, unique is (school_id, class).
    console.log('🏘️ Seeding town settings...');
    const towns = [
      { class: '6A', town_name: '6A Town', mayor_name: 'TBD', tax_rate: 5.0 },
      { class: '6B', town_name: '6B Town', mayor_name: 'TBD', tax_rate: 5.0 },
      { class: '6C', town_name: '6C Town', mayor_name: 'TBD', tax_rate: 5.0 }
    ];

    let townSettingsHaveSchoolId = false;
    try {
      await pool.query('SELECT school_id FROM town_settings LIMIT 1');
      townSettingsHaveSchoolId = true;
    } catch (_) {
      // Column doesn't exist (pre-022)
    }
    for (const town of towns) {
      if (townSettingsHaveSchoolId) {
        await pool.query(
          `INSERT INTO town_settings (class, town_name, mayor_name, tax_rate, school_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (school_id, class) DO UPDATE SET
             town_name = EXCLUDED.town_name,
             mayor_name = EXCLUDED.mayor_name,
             tax_rate = EXCLUDED.tax_rate`,
          [town.class, town.town_name, town.mayor_name, town.tax_rate, null]
        );
      } else {
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
    console.log('  - Plugins: 8 (all enabled)');
    console.log(`  - Shop Items: ${shopItems.length} (consumables & privileges)`);
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

