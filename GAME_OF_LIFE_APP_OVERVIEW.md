# Game of Life (Classroom Simulation) — App Overview

This repository contains a classroom-focused web application that simulates a small “town economy” to help Grade 6 students learn financial literacy and civic/economic concepts through structured gameplay.

The app is often described as a “Game of Life” simulation, but technically it is a **town/role economy simulator** with a bank account system, teacher and super-admin tools, and optional “Town Hub” modules (plugins) such as Jobs, Land, Government/Treasury, Tenders, News, Math Game, Leaderboard, Town Rules, Winkel (shop), Pizza Time, Suggestions/Bugs, Disasters, and Chores. The system supports **multi-tenant schools**: each school has its own towns, students, and settings; a **super admin** can manage multiple schools from a central dashboard.

---

## What the app is (in one paragraph)

Students and teachers log into a web app (selecting their **school** at login). Students register with **pending approval**; once a teacher approves them, they receive a **bank account** and can participate in classroom economy activities (transfers, salaries, loans, tenders, property purchases, shop purchases, donations, and mini-games). Teachers act as administrators for their school: they can approve/deny student registrations, view all student balances and activity, approve or deny loan and purchase requests, run bulk class operations, manage town settings, and reset the simulation when needed. A **super admin** can create schools, create teachers for any school, and view system-wide analytics. The experience is organized around **schools** and **classes/towns** (e.g. `6A`, `6B`, `6C` per school), where each class represents a “town” with its own settings, announcements, treasury, and optional plugins.

---

## Primary user roles

### Students

Students can (after teacher approval):
- View their account balance and transaction history
- Transfer money to classmates (same class) via the “classmates” list
- Apply for jobs and (once assigned) earn salaries
- Apply for loans (with eligibility rules) and repay them
- Apply to town tenders (projects/contracts) and receive payouts when awarded and paid
- Request to buy land parcels (teacher approval workflow)
- Play a Math Game (limited plays per day) to earn money; optional “Chores” plugin uses the same math game for chore challenges
- Buy items from the **Winkel** (shop) and set a **profile emoji** from owned emoji items
- Donate to **Pizza Time** class funds and see progress toward goals
- Submit **suggestions** and **bug reports** for teacher review (with optional rewards)
- View the **Leaderboard** (math game rankings: overall and per class)
- Read town announcements and **Town Rules**
- Be affected by **Disasters** (teacher-triggered events that apply balance/salary effects to a class or all classes)

### Teachers (admins)

Teachers can (scoped to their school):
- Approve or deny **student registrations** (pending students); reset student passwords
- View all students (by list or by account number), balances, jobs, and activity
- Deposit/withdraw money to/from student accounts
- Run bulk payments/removals for a whole class
- Review/approve/deny loan applications and (optionally) trigger weekly loan payment processing
- Review/approve/deny land purchase requests; **swap** parcel positions; **recalculate** land values from biome config
- Create and manage town announcements and **Town Rules** (editable rules text per town)
- Create and manage tenders; review tender applications; award tenders; pay awarded tenders from the town treasury
- Manage town settings (town name, mayor name, tax settings, treasury); toggle **job applications enabled** per town
- Manage **bank settings** (e.g. transfer/payment rules)
- Enable/disable “plugins” (feature modules) for the system
- **Winkel**: manage shop items, mark purchases as paid, view shop balance and stats; run “pay all” for unpaid purchases
- **Pizza Time**: create/manage class fund goals, toggle active state, reset funds, view donation history
- **Disasters**: create disaster types (balance/salary effects), trigger disasters for a class or all classes, view recent disaster events
- **Suggestions/Bugs**: review and approve/deny suggestions and bug reports; pay rewards
- Export data as CSV (students / loans / transactions)
- Perform a “factory reset” that wipes student economy data and restores town defaults

### Super Admin

Super admins can (system-wide, no school_id):
- View all **schools** with aggregated statistics
- Create new schools and create teachers for any school (including first teacher for new schools)
- View detailed school information (financial, users, activity)
- Archive or reactivate schools
- View system-wide analytics
- **Cannot** see individual student data (only aggregated statistics)
- Log in from the login screen by selecting any school (or without school for dashboard access)

---

## Core gameplay/economy concepts

### Multi-tenant schools and student approval

The app supports **multiple schools**. Each school has its own towns (classes), students, teachers, town settings, and data. Users register and log in with a **school selection**; teachers and students are scoped to their school. Student registration can require **teacher approval**: new students get status `pending` until a teacher approves or denies them; only approved students can log in and use the economy features. Teachers can also **reset a student’s password**.

### Classes are towns (`6A`, `6B`, `6C`) per school

Many features are **scoped by class** (within a school):
- Town settings and treasury exist per class (“town”)
- Announcements, tenders, town rules, Pizza Time funds, and disaster targets are per class (or all classes)
- Students are linked to a class and are automatically placed into that town in the UI
- **Job applications** can be enabled/disabled per town via town settings

> Note: Class values are validated and hard-coded in multiple places (e.g. auth registration validation and several routes). Out-of-range class values are rejected.

### Banking and transactions

Every student has exactly one bank account (`accounts`) and money movement is captured in `transactions`.

Key transaction types include:
- `deposit`, `withdrawal`, `transfer`
- `salary`
- `loan_disbursement`, `loan_repayment`
- (Plus types used by Winkel, tenders, Pizza Time, disaster effects, etc.)

**Bank settings** (teacher-configurable) control behavior such as transfer rules.

Important constraints:
- Students can be blocked from transferring money if they have a **negative balance** or an **overdue loan payment**.
- Teachers can deposit/withdraw to any student, and can do class-wide bulk operations.

### Loans

Loans are request/approval based and include:
- Eligibility checks (e.g., a student must have a job; a student can’t have an in-progress loan; negative balances are disqualifying)
- Term limits (up to 12 weeks)
- Interest rates that vary by term length
- Weekly repayment processing (automatic/teacher-triggered) and manual payments

Operational details:
- When a teacher approves a loan, it becomes **active**, is **disbursed to the student’s account**, and a **next payment date** is set (next Monday).
- Weekly loan processing can deduct payments even if it makes an account negative; negative balances then restrict other student transactions.

### Jobs and salaries

The Jobs module supports:
- A catalog of jobs (seeded with detailed “role” descriptions; base salary R2,000 at Level 1, scaling by level 1–10 to ~R15,000; contractual 1.5×)
- Student job applications with answer forms
- Teacher approval/denial of applications
- Teacher ability to assign/remove jobs directly

Salaries are paid via the town treasury routes:
- Teachers can pay salaries to employed students (with optional progressive tax)
- Teachers can pay a “basic salary” (unemployed support) from the treasury

### Town treasury and tax

Each town has a treasury balance and tax configuration:
- Treasury operations (deposit/withdraw) are tracked as `treasury_transactions`
- Salary payments draw from treasury; when tax is enabled, a portion is tracked as tax and can remain in treasury
- Tax reporting is available per town/class and summarizes per-student tax contributions and recent tax transactions

### Land and property registry

The Land module models a grid of parcels:
- Parcels have a biome type, risk level, pros/cons, and value
- Students can submit purchase requests (must have enough balance at request time)
- Teachers approve/deny purchase requests; approval deducts funds and transfers ownership
- Teachers can **swap** positions of two parcels and **recalculate** all parcel values from the current biome config
- The UI supports viewport filtering for performance (fetch only a subset of parcels)

Seeding:
- There are scripts and endpoints to seed land parcels; seeding is blocked if parcels already exist.

### Tenders (town projects/contracts)

Teachers can create tenders per town/class. Students can apply to tenders in their own class.

Workflow:
1. Teacher creates an “open” tender for a town.
2. Students apply (one application per tender per student).
3. Teacher approves one application, which awards the tender and denies other pending applications.
4. Teacher can pay the awarded tender, which deducts from treasury and credits the student’s bank account.

### Announcements

Announcements are per town/class:
- Teachers can create, update, and delete announcements.
- Students and teachers can view announcements (optionally filtered by `town_class`).

### Math Game (student earnings mini-game)

The Math Game module provides:
- A limited number of plays per day (3), with a daily reset at **06:00**
- Difficulty tiers (`easy`, `medium`, `hard`, and optional `extreme`) with multipliers
- A “streak” bonus multiplier based on consecutive correct answers
- Automatic deposit of earnings to the student’s bank account and a corresponding transaction record
- **Chores** plugin reuses the same math game for “chore challenges” (students earn money by solving sums).

### Town Rules

Town Rules is a plugin that stores editable **rules text** per town/class. Teachers can view and edit the rules; students can view them. Used for classroom expectations and town-specific guidelines.

### Winkel (shop)

The Winkel plugin provides a **school shop**:
- Teachers create and manage **shop items** (name, price, optional weekly purchase limit, optional “profile emoji” flag)
- Students purchase items (deducts from bank balance); teachers can mark purchases as paid (e.g. when handing out physical items)
- **Profile emoji**: students can buy emoji items and set one as their **profile emoji** (displayed in UI); they must own the emoji to use it
- Shop has a **balance** (e.g. proceeds); teachers can view stats and run “pay all” for unpaid purchases
- Purchases and owned emojis are tracked per student

### Pizza Time

Pizza Time is a **class fund / donation** plugin:
- Teachers create a **goal amount** per class and can toggle the fund “active”
- Students donate from their balance toward the class goal
- Donation history and progress are visible; teachers can reset funds and view all-class status

### Leaderboard

The Leaderboard plugin shows **math game rankings**:
- **Overall** leaderboard: top performers across all classes (by total points)
- **Per-class** leaderboards: top 5 per class (6A, 6B, 6C)
- Rankings use total points from math game sessions; high scores per difficulty are shown
- Ties broken by games played (fewer games = higher rank)

### Suggestions and Bug Reports

Students can submit **suggestions** and **bug reports** (title + description for bugs). Teachers review them (approve/deny suggestions; verify/deny bugs) and can optionally **pay rewards** into the student’s account. Students can view their own submissions and status.

### Disasters

Teachers can define **disaster types** (name, icon, effect type and value, and whether they affect all classes or a target class). Effect types include balance percentage, balance fixed, and salary percentage. Teachers **trigger** a disaster, which creates a **disaster event** and applies the effect to affected students (e.g. deduct from balances). Recent disaster events are listed for visibility.

### Chores

The Chores plugin exposes the **math game** as “chore challenges”: students play the same math game to earn money. Teachers see an overview; students see their status and can open the game. When enabled, it appears as a separate plugin route (`/chores`).

---

## Frontend overview (client)

### Tech stack

- React 18 + TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios for API calls

### Navigation and pages

Frontend routes (client-side):
- `/login` — authentication screen (school selection; super admin can log in from any school)
- `/` — dashboard (teacher, student, or super admin)
- `/admin` — super admin dashboard (schools, create teachers, analytics); protected for `super_admin` role only
- `/student/:username`, `/account/:accountNumber` — teacher view of a specific student
- **Town Hub plugin screens**: `/bank`, `/land`, `/jobs`, `/news`, `/government`, `/tenders`, `/town-rules`, `/winkel`, `/pizza-time`, `/leaderboard`, `/suggestions-bugs`, `/disasters`, `/chores`

The UI is organized around a few key contexts:
- `AuthContext`: stores current user + account and manages login/register/logout via JWT (includes school_id for multi-tenant)
- `TownContext`: selects the current town/class, loads town settings and announcements
- `PluginContext`: fetches enabled plugins so the UI can display/hide modules

API base URL behavior:
- Uses `VITE_API_URL` (preferred) or `VITE_BACKEND_URL` if set
- In production builds, defaults to `'/api'` (same domain deployment)
- In development, defaults to `http://localhost:5000/api`

---

## Backend overview (server)

### Tech stack

- Node.js + Express
- TypeScript (compiled to `server/dist`)
- JWT authentication
- PostgreSQL via `pg` (connection pooling)

### Health endpoints

- `GET /health` — basic health check (no DB dependency)
- `GET /api/health` — detailed health check including DB connectivity

### API routing map (high level)

Base prefix: `/api`

- **Auth**: `/api/auth/*`
  - schools (list for login/register), register, login, profile, register-teacher (teacher creates another teacher)
- **Banking / transactions**: `/api/transactions/*`
  - history, transfer, teacher deposit/withdraw, class bulk ops, bank settings, basic salary utilities, can-transact, unemployed-students
- **Loans**: `/api/loans/*`
  - list, eligibility, apply, approve/activate, pay, process weekly payments, can-transact; admin: all, users, transactions, loan-payments, fix-approved, cleanup-zero-transactions, fix-outstanding-balances, reset-all-loans
- **Students**: `/api/students/*`
  - teacher: list, pending (approval queue), approve/deny, delete, reset-password, detail by username or account number; student: classmates, transfer-recipients; diagnose (teacher)
- **Plugins**: `/api/plugins/*`
  - list and teacher toggle
- **Town**: `/api/town/*`
  - town settings; treasury; taxes; salary runs; tax reporting; toggle-tax
- **Land**: `/api/land/*`
  - parcels, my properties, purchase requests + approvals, seeding, stats, biome config, **swap** (parcel positions), **recalculate-values**
- **Jobs**: `/api/jobs/*`
  - list, job detail, apply, application review, assign/remove, setup/software-engineer
- **Tenders**: `/api/tenders/*`
  - list, create, apply, review applications, award, pay
- **Announcements**: `/api/announcements/*`
  - list, create/update/delete
- **Town Rules**: `/api/town-rules/*`
  - get, put (by town_class)
- **Winkel**: `/api/winkel/*`
  - items, purchases, settings, can-purchase, purchase, balance, stats, pay (mark paid / pay all), owned-emojis, change-emoji
- **Pizza Time**: `/api/pizza-time/*`
  - status, status/all (teacher), create fund, donate, toggle active, reset
- **Leaderboard**: `/api/leaderboard/*`
  - overall, class/:className, all-classes
- **Math Game**: `/api/math-game/*`
  - status, start, submit
- **Suggestions/Bugs**: `/api/suggestions-bugs/*`
  - submit suggestion, submit bug; student: my; teacher: admin/queue, admin/all, update (review/reward)
- **Disasters**: `/api/disasters/*`
  - list, events/recent; teacher: create, update, delete, trigger, toggle
- **Export**: `/api/export/*`
  - CSV exports for teacher use (transactions, students, loans)
- **Admin**: `/api/admin/*`
  - teacher-only "factory reset" of the simulation
- **Super Admin**: `/api/super-admin/*`
  - schools (list, get, create, update, delete), schools/:id/stats, schools/:id/teachers (create), analytics
  - (duplicate line removed) “factory reset” of the simulation

Authentication model:
- Most endpoints require `Authorization: Bearer <token>`.
- Teacher-only and super-admin-only endpoints are protected by role checks.
- **Multi-tenant**: many endpoints use `requireTenant` or `school_id` so teachers/students only see data for their school.
- Some endpoints enforce town/class scoping for students (e.g. tenders).

---

## Database overview

### Core tables

The application uses PostgreSQL tables for:
- **Identity**: `users` (includes `school_id`, `status` for approval, `profile_emoji`)
- **Schools**: `schools` (multi-tenant)
- **Banking**: `accounts`, `transactions`
- **Loans**: `loans`, `loan_payments`
- **Town Hub**: `plugins`, `town_settings`, `announcements`, `town_rules`
- **Jobs**: `jobs`, `job_applications` (jobs can be global or per-school)
- **Treasury/Tax**: `treasury_transactions`, `tax_transactions`, `tax_brackets` (created by migrations)
- **Land registry**: `land_parcels`, `land_purchase_requests`
- **Tenders**: `tenders`, `tender_applications`
- **Math game**: `math_game_sessions`, `math_game_high_scores`
- **Winkel (shop)**: `shop_items`, `shop_purchases`, `shop_balance` (or similar); profile emoji stored on `users`
- **Pizza Time**: `pizza_time_funds` (or similar), donation records
- **Leaderboard**: computed from math game sessions (no separate table)
- **Suggestions/Bugs**: `suggestions`, `bug_reports` (or similar)
- **Disasters**: `disasters`, `disaster_events`

### Migrations

SQL migrations live in `server/migrations/` and are applied in two ways:
- Manually (e.g. via Railway CLI or a SQL client)
- Automatically on server startup: `server/src/server.ts` attempts to run multiple migration files if present

### Seeding

Seed scripts include:
- `server/seed-town-hub.js`: seeds plugins, jobs, town settings, and default demo users
- `server/seed-land.js`: seeds land parcels (standalone script)

The Quick Start guides also document a standard seed step to bootstrap the experience.

---

## Configuration and environment variables

### Backend (`server/.env`)

Common settings:
- `PORT`: API server port (defaults to `5000`)
- `NODE_ENV`: `development` or `production`
- `DATABASE_URL` (or `DATABASE_PUBLIC_URL`): PostgreSQL connection string
- `JWT_SECRET`: signing secret for JWTs
- `CLIENT_URL`: used for CORS in production deployments

### Frontend (`client` env)

- `VITE_API_URL`: full backend origin (e.g. `https://your-backend.up.railway.app`)
  - the frontend will call `${VITE_API_URL}/api`

---

## Repository structure (high level)

- `client/`: React frontend (Vite)
- `server/`: Express API backend (TypeScript)
  - `server/src/routes/`: feature modules implemented as route files
  - `server/src/database/`: PostgreSQL connection and schema SQL
  - `server/migrations/`: incremental SQL migrations for Town Hub features
- Root scripts in `package.json` orchestrate install, dev, and build for both apps

Key root scripts:
- `npm run install:all`
- `npm run dev`
- `npm run build`
- `npm start` (starts the backend, which also serves `client/dist` in production)

---

## Deployment (at a glance)

The repository includes Railway-oriented deployment config and docs:
- `README.md`, `TOWN_HUB_DEPLOYMENT.md`, `RAILWAY_QUICK_START.md`
- `.railway/` and GitHub workflow files for deployment automation

At runtime in production:
- The backend serves the built frontend from `client/dist` (SPA) when `NODE_ENV=production`.
- Health checks are available via `/health` and `/api/health`.

---

## Guardrails and “gotchas” (important behaviors)

- **Multi-tenant**: teachers and students are scoped to their school; many routes use `school_id` or `requireTenant`. Super admin has `school_id = NULL`.
- **Student approval**: new students can have status `pending` until a teacher approves; only approved students can log in.
- **Class validation is strict**: many routes and registration validation assume only `6A`, `6B`, `6C` (per school).
- **Student email restriction**: registration validation may enforce a specific domain (e.g. `@stpeters.co.za`) when an email is provided.
- **Transaction blocking**: students can be blocked from transfers if balance is negative or a loan payment is overdue.
- **Math game daily limit**: 3 plays/day, resetting at 06:00 (server time).
- **Factory reset is destructive**: teacher-only `/api/admin/factory-reset` requires `confirm: "RESET"` and deletes student economy data and restores towns/bank settings.
- **Super admin**: cannot see individual student data; can only create teachers and manage schools. Create via script: `node create-super-admin.js` (see `SUPER_ADMIN_SETUP.md`).

---

## Where to look next (for deeper documentation)

- `README.md` — features, architecture, and deployment basics
- `QUICK_START.md` — local development setup and seed instructions
- `TOWN_HUB_DEPLOYMENT.md` — Town Hub deployment and migration/seed steps (Railway)
- `SUPER_ADMIN_SETUP.md` — creating and using super admin accounts; multi-school management
- `LEADERBOARD_PLUGIN.md` — Leaderboard plugin (math game rankings, overall and per class)
- `LOCAL_SETUP.md`, `MATH_GAME_DEPLOYMENT.md`, `SALARIES_AND_LAND_PRICES.md` — additional setup and feature docs

