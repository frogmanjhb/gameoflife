// Simple script to run the math game migration
// Run this on Railway to add the new tables

const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
    ssl: false
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // Math game sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS math_game_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
        score INTEGER NOT NULL DEFAULT 0,
        correct_answers INTEGER NOT NULL DEFAULT 0,
        total_problems INTEGER NOT NULL DEFAULT 0,
        earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created math_game_sessions table');

    // Math game high scores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS math_game_high_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
        high_score INTEGER NOT NULL DEFAULT 0,
        achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, difficulty)
      );
    `);
    console.log('✅ Created math_game_high_scores table');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_math_game_sessions_user_id ON math_game_sessions(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_math_game_sessions_played_at ON math_game_sessions(played_at);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_math_game_high_scores_user_id ON math_game_high_scores(user_id);
    `);
    console.log('✅ Created indexes');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
