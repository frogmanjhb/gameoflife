---
name: railway-sql-migrate
description: >-
  Adds and runs CivicLab Postgres migrations on Railway. Use when creating or
  editing server/migrations/*.sql, adding migrate:* scripts in server/package.json,
  wiring schema for new tables/columns, or when the user says migrate, migration,
  or run the migration.
---

# Railway SQL migrations (CivicLab)

## Mandatory workflow

When you add or change a SQL migration in this repo, you **must run it on Railway in the same task** — do not stop after only committing the `.sql` file or npm script. Treat an unapplied migration as incomplete work.

## Steps

1. **Add migration file** — idempotent `.sql` in `server/migrations/` (next sequential number, e.g. `097_...sql`).
2. **Wire npm script** in `server/package.json`:
   ```json
   "migrate:<short-name>": "node run-sql-migration.js migrations/<file>.sql"
   ```
3. **Run on Railway** (from repo root, PowerShell-safe):
   ```bash
   cd server
   railway run npm run migrate:<short-name>
   ```
4. **Confirm success** — output must include `Migration completed successfully.` If it fails, fix the SQL or environment and retry; do not ask the user to migrate unless Railway CLI is unavailable or auth fails.
5. **Tell the user** — report the script name and that Railway migration succeeded (or the exact error).

## Rules

- Use `railway run` + `run-sql-migration.js` — **not** local `psql`.
- Run from the `server` directory so `DATABASE_URL` is injected.
- If code checks `tablesReady()` or similar, the feature is broken until step 3 succeeds.
- When the user says **"migrate this"**, run the script for the migration you just added (or the one they mean).

## After coding checklist

```
- [ ] migration .sql added (idempotent)
- [ ] migrate:* script in server/package.json
- [ ] railway run npm run migrate:<short-name> executed
- [ ] success confirmed in terminal output
```

## Example

```bash
cd c:\Users\frogm\github_repos\gameoflife\server
railway run npm run migrate:accountant-client-advice
```
