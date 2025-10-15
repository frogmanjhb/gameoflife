# Math Game Earnings - Deployment Guide

## 🚨 Current Issue
The build succeeded but the healthcheck is failing because the new math game database tables don't exist in production yet.

## 🔧 Solution Steps

### 1. Deploy the Updated Code
The code changes are ready and will handle missing tables gracefully. Deploy the current changes to Railway.

### 2. Run Database Migration
After deployment, you need to add the new tables to your production database. You have two options:

#### Option A: Use Railway CLI (Recommended)
```bash
# Connect to your Railway project
railway login
railway link

# Run the migration script
railway run node run-migration.js
```

#### Option B: Manual Database Access
1. Go to your Railway dashboard
2. Open your Postgres database
3. Run this SQL in the query editor:

```sql
-- Math game sessions table
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

-- Math game high scores table
CREATE TABLE IF NOT EXISTS math_game_high_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    high_score INTEGER NOT NULL DEFAULT 0,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, difficulty)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_math_game_sessions_user_id ON math_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_math_game_sessions_played_at ON math_game_sessions(played_at);
CREATE INDEX IF NOT EXISTS idx_math_game_high_scores_user_id ON math_game_high_scores(user_id);
```

### 3. Verify Deployment
After running the migration:
1. Check that the healthcheck passes: `https://your-app.railway.app/api/health`
2. Test the math game feature by logging in as a student
3. Navigate to the "Earn Money" tab
4. Try starting a math game

## 🎮 Features Ready
- ✅ Math game with 3 difficulty levels
- ✅ 60-second timer with visual feedback
- ✅ Daily play limits (3 per day, resets at 6 AM)
- ✅ Earnings calculation with multipliers
- ✅ High score tracking
- ✅ Automatic deposit to student accounts
- ✅ Modern dark theme UI matching reference image

## 🔍 Troubleshooting
If the healthcheck still fails after migration:
1. Check Railway logs for any error messages
2. Verify database connection in Railway dashboard
3. Test the `/api/health` endpoint manually
4. Check that all environment variables are set correctly

The server now gracefully handles missing tables, so it should start even before the migration is run.
