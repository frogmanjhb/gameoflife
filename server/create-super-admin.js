// Script to create super admin user
// Usage: node create-super-admin.js [username] [password]
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const readline = require('readline');

async function createSuperAdmin() {
  // Get connection string
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
    // Get username and password from command line args or prompt
    let username = process.argv[2];
    let password = process.argv[3];

    if (!username || !password) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const question = (query) => new Promise((resolve) => rl.question(query, resolve));

      if (!username) {
        username = await question('Enter super admin username: ');
      }
      if (!password) {
        password = await question('Enter super admin password: ');
      }

      rl.close();
    }

    if (!username || !password) {
      console.error('❌ Username and password are required');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      console.log(`⚠️ User "${username}" already exists.`);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      const question = (query) => new Promise((resolve) => rl.question(query, resolve));
      const update = await question('Do you want to update this user to super_admin? (y/n): ');
      rl.close();

      if (update.toLowerCase() !== 'y') {
        console.log('❌ Cancelled');
        process.exit(0);
      }

      // Update existing user to super_admin
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users 
         SET password_hash = $1, role = 'super_admin', school_id = NULL 
         WHERE username = $2`,
        [passwordHash, username]
      );
      console.log(`✅ User "${username}" updated to super_admin`);
    } else {
      // Create new super admin user
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (username, password_hash, role, school_id, status)
         VALUES ($1, $2, 'super_admin', NULL, 'approved')`,
        [username, passwordHash]
      );
      console.log(`✅ Super admin user "${username}" created successfully`);
    }

    console.log('\n🔑 Login credentials:');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log('\n⚠️ IMPORTANT: Change the password after first login!');
    console.log('💡 Access the super admin dashboard at: /admin');

  } catch (error) {
    console.error('❌ Failed to create super admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createSuperAdmin().catch(console.error);
