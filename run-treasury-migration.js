// Script to run the treasury and tax system migration
// Run this on Railway or locally to add the new tables

const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
    ssl: false
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // Add treasury columns to town_settings
    console.log('📝 Adding treasury columns to town_settings...');
    try {
      await pool.query(`ALTER TABLE town_settings ADD COLUMN IF NOT EXISTS treasury_balance DECIMAL(12,2) DEFAULT 10000000.00`);
      console.log('✅ Added treasury_balance column');
    } catch (e) {
      console.log('⚠️ treasury_balance column may already exist');
    }
    
    try {
      await pool.query(`ALTER TABLE town_settings ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN DEFAULT true`);
      console.log('✅ Added tax_enabled column');
    } catch (e) {
      console.log('⚠️ tax_enabled column may already exist');
    }

    // Update existing rows to have default values
    await pool.query(`
      UPDATE town_settings 
      SET treasury_balance = COALESCE(treasury_balance, 10000000.00),
          tax_enabled = COALESCE(tax_enabled, true)
    `);
    console.log('✅ Updated existing town_settings with default values');

    // Tax brackets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tax_brackets (
        id SERIAL PRIMARY KEY,
        min_salary DECIMAL(10,2) NOT NULL,
        max_salary DECIMAL(10,2),
        tax_rate DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created tax_brackets table');

    // Tax transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tax_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
        gross_amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) NOT NULL,
        net_amount DECIMAL(10,2) NOT NULL,
        tax_rate_applied DECIMAL(5,2) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('salary', 'bonus', 'game_earnings')),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created tax_transactions table');

    // Treasury transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS treasury_transactions (
        id SERIAL PRIMARY KEY,
        town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
        amount DECIMAL(12,2) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('tax_collection', 'salary_payment', 'deposit', 'withdrawal', 'initial_balance')),
        description TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created treasury_transactions table');

    // Insert default progressive tax brackets
    console.log('📝 Inserting default tax brackets...');
    
    // Check if tax brackets already exist
    const existingBrackets = await pool.query('SELECT COUNT(*) FROM tax_brackets');
    if (parseInt(existingBrackets.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO tax_brackets (min_salary, max_salary, tax_rate) VALUES
          (0, 500, 0),
          (500.01, 1500, 5),
          (1500.01, 3000, 10),
          (3000.01, 5000, 15),
          (5000.01, 10000, 20),
          (10000.01, NULL, 25)
      `);
      console.log('✅ Inserted default tax brackets');
    } else {
      console.log('⚠️ Tax brackets already exist, skipping insert');
    }

    // Create indexes
    console.log('📝 Creating indexes...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tax_transactions_user_id ON tax_transactions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tax_transactions_town_class ON tax_transactions(town_class)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tax_transactions_created_at ON tax_transactions(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_treasury_transactions_town_class ON treasury_transactions(town_class)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_treasury_transactions_created_at ON treasury_transactions(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tax_brackets_salary ON tax_brackets(min_salary, max_salary)`);
    console.log('✅ Created indexes');

    // Record initial treasury balance for existing towns
    console.log('📝 Recording initial treasury transactions...');
    await pool.query(`
      INSERT INTO treasury_transactions (town_class, amount, transaction_type, description)
      SELECT class, 10000000.00, 'initial_balance', 'Initial town treasury allocation'
      FROM town_settings
      WHERE NOT EXISTS (
        SELECT 1 FROM treasury_transactions 
        WHERE treasury_transactions.town_class = town_settings.class 
        AND transaction_type = 'initial_balance'
      )
    `);
    console.log('✅ Recorded initial treasury transactions');

    console.log('');
    console.log('🎉 Treasury and Tax System Migration completed successfully!');
    console.log('');
    console.log('📊 Tax Brackets Summary:');
    console.log('   R0 - R500:        0% (Tax exempt)');
    console.log('   R500 - R1,500:    5%');
    console.log('   R1,500 - R3,000: 10%');
    console.log('   R3,000 - R5,000: 15%');
    console.log('   R5,000 - R10,000: 20%');
    console.log('   R10,000+:        25%');
    console.log('');
    console.log('💰 Each town starts with R10,000,000 in treasury');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();

