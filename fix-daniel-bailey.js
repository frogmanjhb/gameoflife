// Fix Daniel Bailey's username (contains a space which causes issues)
// Run this on Railway: node fix-daniel-bailey.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function fixDanielBailey() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // Find Daniel Bailey by name or username with space
    console.log('\n=== Finding Daniel Bailey ===\n');
    const searchResult = await pool.query(`
      SELECT 
        id,
        username,
        first_name,
        last_name,
        class,
        email,
        status,
        password_hash IS NOT NULL as has_password
      FROM users 
      WHERE username = 'Daniel Bailey'
         OR (LOWER(first_name) = 'daniel' AND LOWER(last_name) = 'bailey')
    `);

    if (searchResult.rows.length === 0) {
      console.log('❌ Daniel Bailey not found in database');
      return;
    }

    const student = searchResult.rows[0];
    console.log('Found student:');
    console.log(`  ID: ${student.id}`);
    console.log(`  Current Username: "${student.username}"`);
    console.log(`  Name: ${student.first_name} ${student.last_name}`);
    console.log(`  Class: ${student.class}`);
    console.log(`  Status: ${student.status}`);
    console.log(`  Has Password: ${student.has_password}`);

    // Check if username has a space (the problem)
    if (student.username && student.username.includes(' ')) {
      console.log('\n⚠️ ISSUE FOUND: Username contains a space!');
      
      // Generate new username without space
      const newUsername = student.username.toLowerCase().replace(/\s+/g, '');
      console.log(`\n📝 Fixing username: "${student.username}" → "${newUsername}"`);
      
      // Check if new username already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [newUsername]);
      if (existingUser.rows.length > 0) {
        // Use alternative format
        const altUsername = `${student.first_name.toLowerCase()}.${student.last_name.toLowerCase()}`;
        console.log(`   Username "${newUsername}" already exists, trying "${altUsername}"`);
        
        const existingAlt = await pool.query('SELECT id FROM users WHERE username = $1', [altUsername]);
        if (existingAlt.rows.length > 0) {
          // Use format with number
          const finalUsername = `${student.first_name.toLowerCase()}${student.last_name.toLowerCase()}${student.id}`;
          console.log(`   Username "${altUsername}" also exists, using "${finalUsername}"`);
          await pool.query('UPDATE users SET username = $1 WHERE id = $2', [finalUsername, student.id]);
          console.log(`✅ Username updated to: "${finalUsername}"`);
        } else {
          await pool.query('UPDATE users SET username = $1 WHERE id = $2', [altUsername, student.id]);
          console.log(`✅ Username updated to: "${altUsername}"`);
        }
      } else {
        await pool.query('UPDATE users SET username = $1 WHERE id = $2', [newUsername, student.id]);
        console.log(`✅ Username updated to: "${newUsername}"`);
      }
    }

    // Reset password to a known value
    console.log('\n📝 Resetting password...');
    const tempPassword = 'password123';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, student.id]);
    console.log(`✅ Password reset to: "${tempPassword}"`);

    // Ensure status is approved
    if (student.status !== 'approved') {
      console.log(`\n📝 Updating status from "${student.status}" to "approved"...`);
      await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['approved', student.id]);
      console.log('✅ Status updated to approved');
    }

    // Verify bank account exists
    const accountResult = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [student.id]);
    if (accountResult.rows.length === 0) {
      console.log('\n📝 Creating bank account...');
      const accountNumber = `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await pool.query(
        'INSERT INTO accounts (user_id, account_number, balance) VALUES ($1, $2, $3)',
        [student.id, accountNumber, 0.00]
      );
      console.log(`✅ Bank account created: ${accountNumber}`);
    } else {
      console.log(`\n✅ Bank account exists: ${accountResult.rows[0].account_number}`);
    }

    // Show final state
    console.log('\n=== FINAL STATE ===\n');
    const finalResult = await pool.query(`
      SELECT u.username, u.first_name, u.last_name, u.status, a.account_number, a.balance
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE u.id = $1
    `, [student.id]);
    
    const final = finalResult.rows[0];
    console.log(`  Username: "${final.username}"`);
    console.log(`  Name: ${final.first_name} ${final.last_name}`);
    console.log(`  Status: ${final.status}`);
    console.log(`  Account: ${final.account_number}`);
    console.log(`  Balance: R ${final.balance}`);
    console.log(`\n  Temporary Password: "${tempPassword}"`);
    console.log('\n🎉 Fix complete! Daniel Bailey can now login with:');
    console.log(`   Username: ${final.username}`);
    console.log(`   Password: ${tempPassword}`);
    console.log('\n⚠️ Please use the "Reset Password" button to give him a new password!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixDanielBailey();
