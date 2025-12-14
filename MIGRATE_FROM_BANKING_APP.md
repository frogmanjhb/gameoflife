# Migrating from Banking App to Town Hub

## Overview

The Town Hub is designed to work with your **existing PostgreSQL database** from the banking app. All your existing data (users, accounts, transactions, loans) will be preserved and continue to work.

## What Happens to Existing Data?

✅ **All existing data is preserved:**
- Users and their accounts
- All transactions
- All loans and loan payments
- Math game sessions and scores

✅ **New tables are added:**
- `plugins` - Plugin system
- `jobs` - Job listings
- `town_settings` - Town configuration (one per class)
- `announcements` - Town announcements

✅ **One new column added:**
- `users.job_id` - Links users to jobs (nullable, won't break existing users)

## Migration Strategy

### Option 1: Use Same Database (Recommended)

**Best for:** Keeping all existing data and users

1. **Backup your database first** (recommended):
   ```bash
   # In Railway: PostgreSQL service → Data → Backup
   # Or use pg_dump if you have direct access
   ```

2. **Run the Town Hub migration** on your existing database:
   - Railway Dashboard → **PostgreSQL - Townhub** → Data → Query
   - Copy/paste `server/migrations/002_town_hub_tables.sql`
   - Click Run

3. **Seed Town Hub data**:
   ```bash
   railway run --service backend node server/seed-town-hub.js
   ```

4. **Result:**
   - ✅ All existing users, accounts, transactions, loans remain
   - ✅ New Town Hub tables added
   - ✅ Existing users can log in and see their banking data
   - ✅ New Town Hub features available

### Option 2: Fresh Start (Optional)

**Best for:** Starting completely fresh with Town Hub

1. Create a new PostgreSQL database in Railway
2. Run the full schema (`server/src/database/schema-postgres.sql`)
3. Run the migration (`server/migrations/002_town_hub_tables.sql`)
4. Run the seed script
5. Users will need to re-register

## Step-by-Step: Migrating Existing Database

### Step 1: Verify Your Current Database

Check what tables you currently have:

```sql
-- Run this in Railway Dashboard → PostgreSQL → Query
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- `users`
- `accounts`
- `transactions`
- `loans`
- `loan_payments`
- `math_game_sessions`
- `math_game_high_scores`

### Step 2: Backup (Recommended)

**Via Railway Dashboard:**
1. Go to PostgreSQL service → Settings
2. Look for backup/export options
3. Or use Railway's built-in backup feature

**Via CLI (if you have direct access):**
```bash
pg_dump $DATABASE_URL > backup_before_townhub.sql
```

### Step 3: Run Town Hub Migration

**Method 1: Railway CLI (Recommended)**

**Linux/Mac:**
```bash
# Make sure you're linked
railway link

# Run the migration (replace "bank front_backends" with your service name)
railway run --service "bank front_backends" psql $DATABASE_URL < server/migrations/002_town_hub_tables.sql
```

**Windows PowerShell:**
```powershell
# Make sure you're linked
railway link

# PowerShell syntax - use Get-Content and pipe
Get-Content server/migrations/002_town_hub_tables.sql | railway run --service "bank front_backends" psql $env:DATABASE_URL
```

**Note:** To find your service name, run: `railway status`

**Method 2: Railway CLI**
```bash
railway run --service backend psql $DATABASE_URL < server/migrations/002_town_hub_tables.sql
```

### Step 4: Verify Migration

Check that new tables were created using Railway CLI:

```bash
# Connect to database and run query
railway run --service backend psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

Or use an external database client (pgAdmin, DBeaver, etc.) with connection details from Railway.

You should now see:
- ✅ All existing tables (users, accounts, transactions, etc.)
- ✅ New tables: `plugins`, `jobs`, `town_settings`, `announcements`
- ✅ `users` table should have `job_id` column

### Step 5: Seed Town Hub Data

```bash
railway run --service backend node server/seed-town-hub.js
```

This will:
- Create 5 plugins (Bank, Land, Jobs, News, Government)
- Create 8 jobs
- Create 3 towns (6A, 6B, 6C)
- Create seed users (only if they don't exist)

**Note:** The seed script uses `ON CONFLICT DO NOTHING`, so it won't overwrite existing users.

### Step 6: Test

1. **Existing users can still log in** with their original credentials
2. **They'll see the new Town Hub interface** with:
   - Their existing account balance
   - Their transaction history
   - Access to new plugins
   - Town information based on their class

3. **Banking functionality** will eventually be moved to the Bank plugin, but for now:
   - Existing banking routes still work
   - Data is preserved
   - Students can access their accounts

## Important Notes

### Existing Users

- ✅ All existing users keep their accounts and balances
- ✅ All transactions remain intact
- ✅ All loans remain active
- ✅ Users are automatically assigned to towns based on their `class` field
- ⚠️ If a user doesn't have a `class` set, they won't see town-specific features

### Assigning Classes to Existing Users

If you have existing users without classes, you can assign them:

```sql
-- Example: Assign user to class 6A
UPDATE users SET class = '6A' WHERE username = 'student1';

-- Or assign all students to a default class
UPDATE users SET class = '6A' WHERE role = 'student' AND class IS NULL;
```

### Banking Data Integration

The existing banking tables will be used by the Bank plugin:
- `accounts` - Student bank accounts
- `transactions` - All financial transactions
- `loans` - Student loans
- `loan_payments` - Loan payment history

When the Bank plugin is fully implemented, it will use these same tables.

## Troubleshooting

### Migration Fails: "relation already exists"

This is safe to ignore. The migration uses `CREATE TABLE IF NOT EXISTS`, so if tables already exist, it skips them.

### Users Can't See Their Town

1. Check that users have a `class` set:
   ```sql
   SELECT username, class FROM users WHERE role = 'student';
   ```

2. If `class` is NULL, assign them:
   ```sql
   UPDATE users SET class = '6A' WHERE username = 'student1';
   ```

### Existing Users Can't Log In

1. Verify users table still exists and has data
2. Check that password hashes weren't affected (they shouldn't be)
3. Try resetting a password if needed

### Duplicate Seed Users

The seed script won't create duplicate users. If `teacher1` or `student1-3` already exist, they'll be skipped.

## Rollback Plan

If something goes wrong:

1. **Restore from backup** (if you created one)
2. **Or manually drop new tables:**
   ```sql
   DROP TABLE IF EXISTS announcements;
   DROP TABLE IF EXISTS town_settings;
   DROP TABLE IF EXISTS jobs;
   DROP TABLE IF EXISTS plugins;
   ALTER TABLE users DROP COLUMN IF EXISTS job_id;
   ```

## Next Steps After Migration

1. ✅ Test login with existing users
2. ✅ Verify account balances are correct
3. ✅ Assign classes to users if needed
4. ✅ Log in as teacher and configure towns
5. ✅ Post welcome announcements for each town
6. ✅ Test plugin access

## Summary

**You can safely run the Town Hub migration on your existing PostgreSQL database.** 

- ✅ No data loss
- ✅ All existing functionality preserved
- ✅ New Town Hub features added
- ✅ Existing users can continue using the app
- ✅ Banking data remains intact for future Bank plugin integration

The migration is designed to be **additive only** - it adds new tables and one new column, but doesn't modify or delete existing data.

