// Fix Daniel Bailey's account issue
// Run this on Railway: node fix-daniel-bailey.js
// Or locally with DATABASE_URL set

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function fixDanielBailey() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // 1. Find all students named Daniel or Bailey
    console.log('\n=== Searching for Daniel Bailey ===\n');
    const searchResult = await pool.query(`
      SELECT 
        id,
        username,
        first_name,
        last_name,
        class,
        email,
        status,
        password_hash IS NOT NULL as has_password,
        LENGTH(password_hash) as password_length,
        created_at
      FROM users 
      WHERE (LOWER(first_name) LIKE '%daniel%' OR LOWER(last_name) LIKE '%bailey%')
        AND role = 'student'
    `);

    if (searchResult.rows.length === 0) {
      console.log('❌ No students found with name containing Daniel or Bailey');
      
      // Check all 6B students
      console.log('\n=== All students in class 6B ===\n');
      const class6bResult = await pool.query(`
        SELECT 
          id,
          username,
          first_name,
          last_name,
          status,
          password_hash IS NOT NULL as has_password
        FROM users 
        WHERE class = '6B' AND role = 'student'
        ORDER BY last_name, first_name
      `);
      
      if (class6bResult.rows.length === 0) {
        console.log('No students in class 6B');
      } else {
        class6bResult.rows.forEach(row => {
          console.log(`  ID: ${row.id}, Username: "${row.username}", Name: "${row.first_name} ${row.last_name}", Status: ${row.status}, Has Password: ${row.has_password}`);
        });
      }
      return;
    }

    console.log('Found students:');
    searchResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}`);
      console.log(`  Username: "${row.username}" (length: ${row.username ? row.username.length : 'null'})`);
      console.log(`  Name: "${row.first_name} ${row.last_name}"`);
      console.log(`  Class: ${row.class}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Has Password: ${row.has_password} (hash length: ${row.password_length})`);
      console.log(`  Created: ${row.created_at}`);
      console.log('');
      
      // Check for issues
      if (!row.username || row.username.trim() === '') {
        console.log('  ⚠️ ISSUE: Username is null or empty!');
      }
      if (!row.has_password) {
        console.log('  ⚠️ ISSUE: Password hash is missing!');
      }
      if (row.status !== 'approved') {
        console.log(`  ⚠️ ISSUE: Status is "${row.status}", not "approved"!`);
      }
    });

    // 2. Check if any need fixing
    const studentToFix = searchResult.rows.find(r => 
      !r.username || r.username.trim() === '' || !r.has_password || r.status !== 'approved'
    );

    if (studentToFix) {
      console.log('\n=== Fixing Issues ===\n');
      
      // Fix username if missing
      if (!studentToFix.username || studentToFix.username.trim() === '') {
        // Generate a username from first_name and last_name
        const newUsername = `${studentToFix.first_name || 'student'}${studentToFix.last_name || studentToFix.id}`.toLowerCase().replace(/\s+/g, '');
        console.log(`📝 Setting username to: "${newUsername}"`);
        await pool.query('UPDATE users SET username = $1 WHERE id = $2', [newUsername, studentToFix.id]);
        console.log('✅ Username updated');
      }
      
      // Fix password if missing - set to a default that can be reset
      if (!studentToFix.has_password) {
        const tempPassword = 'password123'; // Teacher should reset this
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        console.log(`📝 Setting temporary password to: "${tempPassword}"`);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, studentToFix.id]);
        console.log('✅ Password hash set - TEACHER SHOULD RESET THIS!');
      }
      
      // Fix status if not approved
      if (studentToFix.status !== 'approved') {
        console.log(`📝 Changing status from "${studentToFix.status}" to "approved"`);
        await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['approved', studentToFix.id]);
        console.log('✅ Status updated to approved');
      }

      // Check if has bank account
      const accountResult = await pool.query('SELECT id FROM accounts WHERE user_id = $1', [studentToFix.id]);
      if (accountResult.rows.length === 0) {
        console.log('📝 Creating bank account...');
        const accountNumber = `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
        await pool.query(
          'INSERT INTO accounts (user_id, account_number, balance) VALUES ($1, $2, $3)',
          [studentToFix.id, accountNumber, 0.00]
        );
        console.log(`✅ Bank account created: ${accountNumber}`);
      }

      // Show final state
      console.log('\n=== Final State ===\n');
      const finalResult = await pool.query(`
        SELECT u.*, a.account_number, a.balance
        FROM users u
        LEFT JOIN accounts a ON u.id = a.user_id
        WHERE u.id = $1
      `, [studentToFix.id]);
      
      const final = finalResult.rows[0];
      console.log(`  ID: ${final.id}`);
      console.log(`  Username: "${final.username}"`);
      console.log(`  Name: "${final.first_name} ${final.last_name}"`);
      console.log(`  Class: ${final.class}`);
      console.log(`  Status: ${final.status}`);
      console.log(`  Account: ${final.account_number}`);
      console.log(`  Balance: ${final.balance}`);
      console.log('\n🎉 Fix completed! The student should now be able to log in.');
      console.log('⚠️ NOTE: If password was set, the teacher should reset it using the "Reset Password" button.');
    } else {
      console.log('\n✅ No issues found with Daniel Bailey\'s account.');
      console.log('The problem might be elsewhere. Check:');
      console.log('  1. Is the username being typed correctly when logging in?');
      console.log('  2. Is the password correct?');
      console.log('  3. Try using the "Reset Password" button on the teacher dashboard.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixDanielBailey();
