# Game of Resources

Cooperative civilisation side game for CivicLab towns (Grade 5/6 Resources inquiry). One persistent hex world per `(school_id, town_class)`. Game coins and village treasury are **separate** from the CivicLab bank unless the optional **bank bridge** is enabled.

## Plugin

| Item | Value |
|------|--------|
| Display name | Game of Resources |
| Plugin key | `game_of_resources` |
| Client route | `/game-of-resources` |
| API prefix | `/api/game-of-resources` |
| Default | Disabled in Town Hub until a teacher enables it |

Students need **teacher approval** and **Town Rules agreed** before playing.

## Architecture

```
shared/game-of-resources/     CONFIG, FACTS, PLANET, RULES (pure TS)
server/src/domain/gameOfResources/
  worldRepository.ts          Load/save world + citizens (row lock)
  view.ts                     Per-student redacted view
  actions.ts                  Rule wrappers
  scheduler.ts                Auto round advance (60s tick)
  bankBridge.ts               Optional coin → bank conversion
server/src/routes/game-of-resources.ts
client/src/components/game-of-resources/   UI + world3d/
```

Rules live in `shared/game-of-resources/`. The server syncs a copy into `server/src/domain/gameOfResources/shared/` on build.

## Database (`gor_*`)

| Table | Purpose |
|-------|---------|
| `gor_worlds` | One row per town; round, env, projects, land, settings, version |
| `gor_citizens` | Per-student inventory, AP, XP, activity |
| `gor_listings` | Player market |
| `gor_log` | Activity log |
| `gor_round_summaries` | End-of-round JSON summaries |
| `gor_reflections` | Student text per round (280 chars) |
| `gor_job_changes` | Job change audit |
| `gor_coin_redemptions` | Pending/approved bank bridge requests (migration `116`) |

Migrations:

- `115_game_of_resources.sql` — core schema + plugin row  
- `116_game_of_resources_bank_bridge.sql` — redemptions table  

From `server/`:

```bash
npm run migrate:game-of-resources
npm run migrate:game-of-resources-bank-bridge
```

On Railway: `railway run npm run migrate:game-of-resources-bank-bridge` (from `server/`).

## World settings (JSON on `gor_worlds.settings`)

| Setting | Default | Notes |
|---------|---------|--------|
| `roundLengthHours` | 24 | Used with settle time for `round_ends_at` |
| `settleTime` | `06:00` | Africa/Johannesburg |
| `timezone` | `Africa/Johannesburg` | Scheduler uses UTC+2 for Johannesburg |
| `weekendPause` | true | Skips weekend settle targets |
| `automationPaused` | false | Also mirrored on `gor_worlds.paused` when teacher toggles |
| `useNicknames` | false | Generated nicknames instead of real names |
| `jobChange.xpCost` | 30 | Game XP by default |
| `jobChange.perRound` | 1 | Max job changes per round |
| `jobChange.xpSource` | `game` | `civiclab` is stubbed on server |
| `bankBridgeEnabled` | false | Student conversion requests |
| `bankBridgeCoinsPerRand` | 10 | Whole game coins per R1 |

## Student API

| Method | Path | Notes |
|--------|------|--------|
| GET | `/status` | Creates world/citizen on first visit; `?since=version` for polling |
| GET | `/events` | SSE (`Authorization: Bearer`); client also polls every 8s |
| POST | `/action` | `{ type, opt?, clientVersion? }` |
| POST | `/market/store-buy` … | Market helpers |
| POST | `/works/start` | Land reclamation / bridge |
| POST | `/job/change` | `{ profession }` |
| POST | `/reflection` | `{ round, text }` |
| POST | `/bank-bridge/request` | `{ coins }` if bridge enabled |

## Teacher API (same school)

| Method | Path |
|--------|------|
| GET | `/teacher/worlds` |
| GET | `/teacher/citizens?town_class=` |
| POST | `/teacher/round/open` \| `close` \| `advance` |
| PUT | `/teacher/settings` |
| GET | `/teacher/export.csv?town_class=` |
| POST | `/teacher/reset` | `{ town_class, confirm: "RESET" }` |
| POST | `/teacher/run-checks` |
| GET | `/bank-bridge/pending?town_class=` |
| POST | `/bank-bridge/:id/approve` \| `deny` | `{ town_class }` |

## Bank bridge (optional)

1. Teacher enables `bankBridgeEnabled` and sets `bankBridgeCoinsPerRand` in the teacher panel (or `PUT /teacher/settings`).
2. Student requests conversion; coins are reserved logically via pending rows (must still have balance when approved).
3. Teacher approves → game coins deducted in world transaction, **bank deposit** transaction created (`transaction_type: deposit`, description notes Game of Resources).
4. Never automatic; deny leaves game coins unchanged.

## Scheduler

- Starts with the server (`startGameOfResourcesScheduler`, 60s interval).
- Uses `pg_try_advisory_xact_lock(world_id)` and `UPDATE … AND round_number = expected`.
- Calls `RULES.advanceRound`, stores summary, updates `round_ends_at`.

## Tests

From repo root: `npm run test:gor` or `cd server && npm test`.

## Troubleshooting

| Issue | Check |
|-------|--------|
| 503 on API | Run migration `115` |
| Bank bridge 500 | Run migration `116` |
| World never advances | `automationPaused` / `paused`; `round_ends_at` null (scheduler sets on first tick) |
| 409 on action | Refresh; another player changed the world (`clientVersion`) |
| Empty teacher world | No student has opened the town yet — world is lazy-created |

## Manual smoke test

1. Enable plugin; run migrations.  
2. Student opens `/game-of-resources` → welcome + job.  
3. Work action; second browser sees update within ~10s.  
4. Teacher advance round; student sees new round number.  
5. Enable bridge; student requests conversion; teacher approves; bank balance increases, game coins decrease.
