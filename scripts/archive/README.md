# Archived one-off scripts

These scripts were one-time fixes or migrations run against the database (e.g. on Railway). They are kept for reference only. Do not run them in production unless you understand the impact.

| File | Purpose |
|------|--------|
| `fix-daniel-bailey.js` | Fix one user's username (space in username). |
| `fix-status-column.js` | Add `status` column to `users` and set to approved. |
| `migrate-db.js` | Create math game tables (older style, uses `DATABASE_URL` only). |
| `run-migration.js` | Math game tables (uses `DATABASE_URL` or `DATABASE_PUBLIC_URL`). |
| `run-treasury-migration.js` | Treasury/tax columns and related tables. |

To run from project root: `node scripts/archive/<filename>` (with appropriate env vars set).
