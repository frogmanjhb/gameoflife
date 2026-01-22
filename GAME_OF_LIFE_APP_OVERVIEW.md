# Game of Life (Classroom Simulation) — App Overview

This repository contains a classroom-focused web application that simulates a small “town economy” to help Grade 6 students learn financial literacy and civic/economic concepts through structured gameplay.

The app is often described as a “Game of Life” simulation, but technically it is a **town/role economy simulator** with a bank account system, teacher administration tools, and optional “Town Hub” modules (plugins) such as Jobs, Land, Government/Treasury, Tenders, News, and a Math Game.

---

## What the app is (in one paragraph)

Students and teachers log into a web app. Students receive a **bank account** and can participate in classroom economy activities (transfers, salaries, loans, tenders, property purchases, and mini-games). Teachers act as administrators: they can view all student balances and activity, approve or deny loan and purchase requests, run bulk class operations, manage town settings, and reset the simulation when needed. The experience is organized around **classes/towns** (currently `6A`, `6B`, `6C`), where each class represents a “town” with its own settings, announcements, and treasury.

---

## Primary user roles

### Students

Students can:
- View their account balance and transaction history
- Transfer money to classmates (same class) via the “classmates” list
- Apply for jobs and (once assigned) earn salaries
- Apply for loans (with eligibility rules) and repay them
- Apply to town tenders (projects/contracts) and receive payouts when awarded and paid
- Request to buy land parcels (teacher approval workflow)
- Play a Math Game (limited plays per day) to earn money
- Read town announcements and updates

### Teachers (admins)

Teachers can:
- View all students, balances, jobs, and activity
- Deposit/withdraw money to/from student accounts
- Run bulk payments/removals for a whole class
- Review/approve/deny loan applications and (optionally) trigger weekly loan payment processing
- Review/approve/deny land purchase requests
- Create and manage town announcements
- Create and manage tenders; review tender applications; award tenders; pay awarded tenders from the town treasury
- Manage town settings (town name, mayor name, tax settings, treasury)
- Enable/disable “plugins” (feature modules) for the whole system
- Export data as CSV (students / loans / transactions)
- Perform a “factory reset” that wipes student economy data and restores town defaults

---

## Core gameplay/economy concepts

### Classes are towns (`6A`, `6B`, `6C`)

Many features are **scoped by class**:
- Town settings and treasury exist per class (“town”)
- Announcements and tenders are per class
- Students are linked to a class and are automatically placed into that town in the UI

> Note: Class values are validated and hard-coded in multiple places (e.g. auth registration validation and several routes). Out-of-range class values are rejected.

### Banking and transactions

Every student has exactly one bank account (`accounts`) and money movement is captured in `transactions`.

Key transaction types include:
- `deposit`, `withdrawal`, `transfer`
- `salary`
- `loan_disbursement`, `loan_repayment`

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
- A catalog of jobs (seeded with detailed “role” descriptions and salaries)
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
- Difficulty tiers (`easy`, `medium`, `hard`) with multipliers
- A “streak” bonus multiplier based on consecutive correct answers
- Automatic deposit of earnings to the student’s bank account and a corresponding transaction record

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
- `/login` — authentication screen
- `/` — dashboard (teacher or student)
- `/bank`, `/land`, `/jobs`, `/news`, `/government`, `/tenders` — “Town Hub plugin” screens

The UI is organized around a few key contexts:
- `AuthContext`: stores current user + account and manages login/register/logout via JWT
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
  - register/login/profile
- **Banking / transactions**: `/api/transactions/*`
  - history, transfer, teacher deposit/withdraw, class bulk ops, bank settings, basic salary utilities
- **Loans**: `/api/loans/*`
  - list, eligibility, apply, approve/activate, pay, process weekly payments
- **Students**: `/api/students/*`
  - teacher list/detail/delete; student classmates list
- **Plugins**: `/api/plugins/*`
  - list and teacher toggle
- **Town**: `/api/town/*`
  - town settings; treasury; taxes; salary runs; tax reporting
- **Land**: `/api/land/*`
  - parcels, my properties, purchase requests + approvals, seeding, stats, biome config
- **Jobs**: `/api/jobs/*`
  - list, job detail, apply, application review, job assignment
- **Tenders**: `/api/tenders/*`
  - list, create, apply, review applications, award, pay
- **Announcements**: `/api/announcements/*`
  - list, create/update/delete
- **Export**: `/api/export/*`
  - CSV exports for teacher use
- **Admin**: `/api/admin/*`
  - teacher-only “factory reset” of the simulation

Authentication model:
- Most endpoints require `Authorization: Bearer <token>`.
- Teacher-only endpoints are protected by role checks.
- Some endpoints enforce town/class scoping for students (e.g. tenders).

---

## Database overview

### Core tables

The application uses PostgreSQL tables for:
- **Identity**: `users`
- **Banking**: `accounts`, `transactions`
- **Loans**: `loans`, `loan_payments`
- **Town Hub**: `plugins`, `town_settings`, `announcements`
- **Jobs**: `jobs`, `job_applications`
- **Treasury/Tax**: `treasury_transactions`, `tax_transactions`, `tax_brackets` (created by migrations)
- **Land registry**: `land_parcels`, `land_purchase_requests`
- **Tenders**: `tenders`, `tender_applications`
- **Math game**: `math_game_sessions`, `math_game_high_scores`

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

- **Class validation is strict**: many routes and registration validation assume only `6A`, `6B`, `6C`.
- **Student email restriction**: registration validation enforces `@stpeters.co.za` when an email is provided.
- **Transaction blocking**: students can be blocked from transfers if balance is negative or a loan payment is overdue.
- **Math game daily limit**: 3 plays/day, resetting at 06:00 (server time).
- **Factory reset is destructive**: teacher-only `/api/admin/factory-reset` requires `confirm: "RESET"` and deletes student economy data and resets towns/bank settings.

---

## Where to look next (for deeper documentation)

- `README.md` — features, architecture, and deployment basics
- `QUICK_START.md` — local development setup and seed instructions
- `TOWN_HUB_DEPLOYMENT.md` — Town Hub deployment and migration/seed steps (Railway)

