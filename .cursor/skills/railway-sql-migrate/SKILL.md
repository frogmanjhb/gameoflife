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

## Steps (every new migration)

1. **Add migration file** — idempotent `.sql` in `server/migrations/` (next sequential number, e.g. `103_...sql`). Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` where possible.
2. **Wire npm script** in `server/package.json`:
   ```json
   "migrate:<short-name>": "node run-sql-migration.js migrations/<file>.sql"
   ```
3. **Run on Railway** from `server/` (see commands below).
4. **Confirm success** — output must include `Migration completed successfully.`
5. **Tell the user** — script name, success, or exact error + fallback (dashboard SQL / hotspot).

## CLI commands (use these, not bare `railway`)

On Windows, the global `railway` shim often prints **nothing** or fails silently. Always use:

```powershell
cd server
# One-time per machine (interactive browser):
npx @railway/cli@latest login
npx @railway/cli@latest link
```

**Link:** pick the CivicLab project. Backend service is often **`bank front_backends`** (may have a space). Database is **`Postgres`** (not `gameoflife-db` from template).

**Run migration (preferred — Postgres service):**

```powershell
npx @railway/cli@latest run --service Postgres npm run migrate:<short-name>
```

**Alternative (linked to backend, needs public DB URL on service):**

```powershell
npx @railway/cli@latest run npm run migrate:<short-name>
```

Expect: `🔗 Using DATABASE_PUBLIC_URL` or `DATABASE_URL`, then `✅ Migration completed successfully.`

### Do not

| Mistake | Why |
|--------|-----|
| `cd server` when prompt is already `...\server>` | Tries `server\server` |
| `npm run migrate:*` without `railway run` | Uses `.env`; often `ETIMEDOUT` or wrong host |
| `railway` without `npx @railway/cli@latest` | Silent failure on some PCs |
| `--service gameoflife-db` | Template name; production DB is **`Postgres`** |
| `railway login railway link` on one line | Invalid |

## How `run-sql-migration.js` picks the database

`server/run-sql-migration.js` resolves connection in this order:

1. **`DATABASE_PUBLIC_URL`** if valid (required for local `railway run` from a laptop)
2. **`DATABASE_URL`** only if host is **not** `*.railway.internal`
3. **`PGHOST` / `PGUSER` / …** if valid and not internal

Invalid placeholder URLs in `.env` (e.g. `${{...}}`) are skipped — avoids `Cannot read properties of undefined (reading 'searchParams')`.

**Internal host error:** `ENOTFOUND postgres-….railway.internal` — `DATABASE_URL` is in-cluster only; use `--service Postgres` or set `DATABASE_PUBLIC_URL` on the backend service.

## Work / school network (common for this repo)

**Symptom:** `connect ETIMEDOUT` to an IP like `66.33.x.x:46299` even with `DATABASE_PUBLIC_URL` and `--service Postgres`.

**Cause:** Corporate/school firewall blocks Railway’s public Postgres proxy port (non-5432).

**Confirmed fix:** Same command on **phone hotspot** or **home network** succeeds.

**Fallback when CLI cannot connect (no code deploy needed):**

1. [railway.app](https://railway.app) → project → **Postgres** → **Data** → **Query**
2. Paste SQL from `server/migrations/<file>.sql`
3. Run; verify columns/tables exist

Tell the user to run CLI migrate from home/hotspot when possible; dashboard SQL is acceptable when work network blocks outbound DB ports.

## Troubleshooting

| Error | Action |
|-------|--------|
| `Unauthorized` | `npx @railway/cli@latest login` |
| `No linked project` | `npx @railway/cli@latest link` from `server/` |
| `Service not found` | `npx @railway/cli@latest status` — use real names (`Postgres`, `bank front_backends`) |
| `searchParams` | Bad URL in `.env`; script now skips invalid URLs — use `railway run` |
| `ENOTFOUND *.railway.internal` | Use `--service Postgres` or public URL |
| `ETIMEDOUT` public IP:port | Work network; hotspot/home CLI or dashboard Query |
| Plain `railway` no output | Use `npx @railway/cli@latest` |

## Production Railway layout (this project)

| Template name | Typical production name |
|---------------|-------------------------|
| `gameoflife-backend` | `bank front_backends` |
| `gameoflife-db` | `Postgres` |

Always confirm with `npx @railway/cli@latest status` or the dashboard before assuming service names.

## Agent checklist

```
- [ ] migration .sql added (idempotent)
- [ ] migrate:<short-name> in server/package.json
- [ ] Attempt: npx @railway/cli@latest run --service Postgres npm run migrate:<short-name>
- [ ] Success: "Migration completed successfully." OR user told to use dashboard SQL / hotspot
- [ ] Report which path succeeded
```

## Example (doctor reputation)

```powershell
cd "...\gameoflife\server"
npx @railway/cli@latest run --service Postgres npm run migrate:doctor-reputation
```

File: `server/migrations/102_add_doctor_reputation.sql`
