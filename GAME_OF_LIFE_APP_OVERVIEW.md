# CivicLab — App Overview

This repository contains a classroom-focused web application that simulates a small “town economy” to help Grade 6 students learn financial literacy and civic/economic concepts through structured gameplay.

CivicLab is a **town/role economy simulator** with a bank account system, teacher and super-admin tools, and optional “Town Hub” modules (plugins) such as Jobs, Land, Government/Treasury, Tenders, News, Math Game, Leaderboard, Town Rules, Winkel (shop), Pizza Time, Suggestions/Bugs, Disasters, Chores, **Insurance**, **Court**, **Analytics**, **Code Board**, **Event Voting**, **Five Minute Lessons**, and **Doubles Day**. Jobs are deeply integrated with the town: most roles have **challenge mini-games**, **levels and XP**, and role-specific workflows (police fines, lawsuits, accountant oversight, doctor/clinic, cyber attacks, town news, and more). The system supports **multi-tenant schools**: each school has its own towns, students, and settings; a **super admin** can manage multiple schools from a central dashboard.

---

## What the app is (in one paragraph)

Students and teachers log into a web app (selecting their **school** at login). Students register with **pending approval**; once a teacher approves them and they **agree to Town Rules**, they receive a **bank account** and can participate in classroom economy activities (transfers, salaries, loans, tenders, property purchases, shop purchases, insurance, donations, lawsuits, and mini-games). Most jobs include **challenge games**, **levels**, and **XP**. Teachers act as administrators for their school: they approve registrations and transfers, manage town settings and plugins, oversee role workflows (police, court, insurance, news, etc.), and reset the simulation when needed. A **super admin** can create schools, create teachers for any school, and view system-wide analytics. The experience is organized around **schools** and **classes/towns** (e.g. `6A`, `6B`, `6C` per school), where each class represents a “town” with its own settings, announcements, treasury, and optional plugins.

---

## Primary user roles

### Students

Students can (after teacher approval and **Town Rules agreement**):
- View their account balance, transaction history, and **earnings profile** (`/my-profile`)
- Submit **transfer requests** to classmates (same school); transfers require teacher approval (and may require **accountant** sign-off for assigned clients)
- Apply for jobs on the **Employment Board**, **withdraw** pending applications, and (once assigned) earn salaries with **job levels (1–10)** and **XP**
- Play **job challenge games** on **My Job** (`/my-job/:jobId`) to earn money and XP toward the next level
- Apply for loans (with eligibility rules) and repay them
- Apply to town tenders (projects/contracts) and receive payouts when awarded and paid
- Request to buy land parcels (multi-step approval: Financial Manager, engineer, then teacher)
- Play **Chores** — math sums and/or **Wordle** (teacher-configurable daily limits) to earn money
- Buy **insurance** (health, cyber, property) at 5% of salary per type per week; file claims when applicable
- Buy items from the **Winkel** (shop) and set a **profile emoji** from owned emoji items
- Donate to **Pizza Time** class funds (doubled on **Doubles Day** when enabled)
- Submit **suggestions** and **bug reports** for teacher review (with optional rewards)
- View the **Leaderboard** (math game rankings: overall and per class)
- Read town announcements, the **Town News Board**, and **Town Rules** (must agree before accessing most plugins)
- Vote on **class events** and **Five Minute Lessons** when those plugins are enabled
- Star apps on the **Code Board**; read town news with optional visual widgets
- **File lawsuits** in **Court** (when enabled): civil disputes with HR mediation, lawyer review, jury, and teacher final ruling
- Be affected by **Disasters** (teacher-triggered events that apply balance/salary effects to a class or all classes)
- Experience **role-linked town systems**: police fines/bonuses, illness/clinic overlay, cyber attacks, attendance/sick notes, and accountant client views (depending on town jobs)

### Teachers (admins)

Teachers can (scoped to their school):
- Approve or deny **student registrations** (pending students); reset student passwords
- View all students (by list, account number, or **accountant client** view), balances, jobs, and activity
- Deposit/withdraw money to/from student accounts
- **Approve or deny pending transfer requests** submitted by students
- Run bulk payments/removals for a whole class
- Review/approve/deny loan applications and (optionally) trigger weekly loan payment processing
- Review/approve/deny land purchase requests (after Financial Manager and engineer steps when those roles exist); **swap** parcel positions; **recalculate** land values from biome config
- Create and manage town announcements and **Town Rules** (editable rules text per town)
- Create and manage tenders; review tender applications; award tenders; pay awarded tenders from the town treasury
- Manage town settings (town name, mayor name, tax settings, treasury); toggle **job applications enabled** per town
- Manage **bank settings** (transfer/payment rules; enable/disable **math** and **Wordle** chores separately)
- Enable/disable “plugins” (feature modules) for the system, including **Doubles Day**, **Court**, **Insurance**, **Analytics**, etc.
- **Winkel**: manage shop items, mark purchases as paid, view shop balance and stats; run “pay all” for unpaid purchases
- **Pizza Time**: create/manage class fund goals, toggle active state, reset funds, view donation history
- **Insurance**: view all purchases, filter by class/type/student, refund policies, enable/disable insurance types per school
- **Disasters**: create disaster types (balance/salary effects), trigger disasters for a class or all classes, view recent disaster events
- **Suggestions/Bugs**: review and approve/deny suggestions and bug reports; pay rewards
- **Content submissions**: approve/deny **Town News** stories, popups, and **Code Board** apps submitted by students
- **Court**: final authority on lawsuits, settlements, and money movement (Court plugin disabled by default)
- **Analytics** (teacher-only plugin): engagement metrics, activity by class/student, and student login history
- **Event Voting** / **Five Minute Lessons**: manage voting boards, close rounds, approve lesson suggestions
- **Business proposals**: review and approve/deny entrepreneur business proposals
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

**Bank settings** (teacher-configurable) control behavior such as transfer rules and which chore types (math, Wordle) are enabled.

Important constraints:
- Student **transfers create pending requests**; money does not move until a teacher approves (accountants may approve transfers for assigned clients).
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

### Jobs, salaries, levels, and challenge games

The Jobs module supports a large **Employment Board** grouped by sector (Government & Finance, Infrastructure & Design, Education, Health, Economy & Events, Media & Tech). Jobs include Mayor, Financial Manager, Accountant, HR Director, Police Lieutenant, Lawyer, Town Planner, Insurance Manager, Civil/Electrical Engineer, Architect, Principal, Teacher, Doctor, Nurse, Retail Manager, Event Planner, Entrepreneur, Marketing Manager, Graphic Designer, Journalist, Software Engineer, and more.

**Job titles and levels:**
- Entry titles use **Assistant** or **Junior**; levels **4–8** become **Associate**; levels **9–10** become **Senior** (Mayor is elected and uses a separate title system).
- Every assigned job starts at **Level 1** (~R2,000/pay period). Salary scales by level up to **R15,000** at Level 10.
- **Contractual** jobs pay **1.5×** at the same level (e.g. Level 10 contractual = R22,500).
- Students earn **XP** from job challenge games and role tasks; XP drives level-ups (max level 10).

**Applications and assignment:**
- Students apply with a form (including CV confirmation); teachers approve/deny.
- Students can **withdraw** pending applications.
- One job at a time; application limits apply.
- Teachers can assign/remove jobs directly.

**Job challenge games** (on `/my-job/:jobId`):
- Almost every job has a daily-limited challenge mini-game (typically 3/day; teacher-configurable).
- Games require a minimum play time before submit; earnings and XP are server-calculated.
- Roles with games include: Architect, Accountant, Software Engineer, Marketing Manager, Graphic Designer, Journalist, Event Planner, Financial Manager, HR Director, Police Lieutenant, Lawyer, Town Planner, Civil Engineer, Electrical Engineer, Principal, Teacher, Nurse, Doctor, Retail Manager, Entrepreneur, Insurance Manager.

**Role-specific job workflows** (examples):
- **Police Lieutenant**: log fines/bonuses for classmates → Lawyer review → teacher final decision.
- **Lawyer**: review/approve/dispute police fines; participate in **Court** lawsuits.
- **Accountant**: assigned clients; read-only client detail (`/accountant-client/:username`); submit advice; approve certain transfers.
- **Doctor/Nurse**: assign illnesses, approve cures, mark attendance register; sick students see a clinic overlay.
- **Insurance Manager**: broker approval for purchases; review health/cyber/property claims.
- **Entrepreneur**: submit **business proposals**; post to Town News (teacher approval).
- **Software Engineer**: manage **cyber-attack** repair assignments.
- **Assistant Teacher**: suggest **Five Minute Lessons** for class voting.
- **Financial Manager / Civil Engineer / Architect**: involved in **land purchase** approval steps.

Salaries are paid via the town treasury routes:
- Teachers can pay salaries to employed students (with optional progressive tax by job level)
- Teachers can pay a “basic salary” (unemployed support) from the treasury
- Students can view estimated tax/take-home for their level via **Town Information** (Government plugin)

### Town treasury and tax

Each town has a treasury balance and tax configuration:
- Treasury operations (deposit/withdraw) are tracked as `treasury_transactions`
- Salary payments draw from treasury; when tax is enabled, a portion is tracked as tax and can remain in treasury
- Tax reporting is available per town/class and summarizes per-student tax contributions and recent tax transactions

### Land and property registry

The Land module models a grid of parcels:
- Parcels have a biome type, risk level, pros/cons, and value
- Students can submit purchase requests (must have enough balance at request time)
- **Multi-step approval**: Financial Manager review → Architect/Civil Engineer review → teacher final approval; approval deducts funds and transfers ownership
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

### Announcements and Town News

**Announcements** are per town/class:
- Teachers can create, update, and delete announcements (with optional customization).
- Students and teachers can view announcements (optionally filtered by `town_class`).

**Town News Board** (`/news`):
- Students in certain jobs (Journalist, Graphic Designer, Entrepreneur) can submit stories (headline, body, optional photo) with optional **widgets** (story badge, headline style, colour bar, emoji strip).
- Teachers approve submissions via **content submissions** before stories go live.
- Teachers can also manage **news popups** (dismissible overlays for the class).

### Math Game and Chores

The Math Game module provides:
- A limited number of plays per day (3), with a daily reset at **06:00**
- Difficulty tiers (`easy`, `medium`, `hard`, and optional `extreme`) with multipliers
- A “streak” bonus multiplier based on consecutive correct answers
- Automatic deposit of earnings to the student’s bank account and a corresponding transaction record

The **Chores** plugin (`/chores`) exposes chore challenges for students:
- **Math chores**: same math game as above (teacher can disable via bank settings).
- **Wordle chores**: guess the word in 6 tries; earns money and job XP (if employed). Separate daily limit; **Wordle leaderboard** at `/api/wordle-leaderboard`.
- Teachers see an overview and can test games without recording scores.
- When enabled, Chores appears as a separate plugin route.

### Town Rules and rules agreement

Town Rules is a plugin that stores editable **rules text** per town/class. Teachers can view and edit the rules; students must **agree to the rules** (`rules_agreed_at` on the user) before accessing most Town Hub plugins. The `RequireRulesAgreed` wrapper redirects students to `/town-rules` until they sign. Used for classroom expectations and town-specific guidelines.

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

A separate **Wordle leaderboard** (`/api/wordle-leaderboard`) ranks Wordle chore performance (overall and all-classes).

### Suggestions and Bug Reports

Students can submit **suggestions** and **bug reports** (title + description for bugs). Teachers review them (approve/deny suggestions; verify/deny bugs) and can optionally **pay rewards** into the student’s account. Students can view their own submissions and status.

### Disasters

Teachers can define **disaster types** (name, icon, effect type and value, and whether they affect all classes or a target class). Effect types include balance percentage, balance fixed, and salary percentage. Teachers **trigger** a disaster, which creates a **disaster event** and applies the effect to affected students (e.g. deduct from balances). Recent disaster events are listed for visibility.

### Insurance

The Insurance plugin (`/insurance`) lets employed students buy **health**, **cyber**, and **property** insurance:
- Cost is **5% of current job salary per type per week** (server-calculated quote; 1–52 weeks).
- Teachers can enable/disable types per school, view/refund purchases, and filter by class.
- **Insurance Manager** (broker) may need to approve purchases and **claims** (health clinic, cyber incidents, property after disasters).
- Active policies are tracked in `insurance_purchases`; claims integrate with doctor/clinic and cyber-attack flows.

### Court (Lawsuits)

The Court plugin (`/court`, **disabled by default**) handles in-town **civil disputes**:
- Plaintiffs file cases (R10,000 process cost held in escrow; damages capped at R5,000) citing Town Rules and optional linked actions (fines, cyber attacks, land sales, etc.).
- Workflow: HR mediation → plaintiff lawyer accept/decline → defendant response → lawyer opinions → optional **jury trial** → **teacher final ruling** (money never moves without teacher approval).
- Lawyers, HR Director, and assigned jurors participate via job panels and Court routes.
- Tables: `student_lawsuits`, `lawsuit_jury_assignments`, etc.

### Doubles Day

Teacher-toggle plugin (`/doubles-day`, off by default): when enabled, **Chores (math) earnings** and **Pizza Time donation credit** are doubled (students still pay the same donation amount).

### Analytics

Teacher-only plugin (`/analytics`): engagement dashboards — overview metrics, time-series activity, breakdowns by class and student, and **student login** history. Uses `/api/teacher-analytics/*`. Hidden from student plugin grid.

### Code Board

The Code Board (`/code-board`) showcases **student-built apps** (typically from Software Engineer / Entrepreneur roles):
- Students submit apps (title, URL, description); teachers approve via content submissions.
- Classmates can **star** apps (creator earns XP and money) and open links (click tracking).
- Software engineers/teachers can remove apps from the board.

### Event Voting

Class **event suggestion and voting** board (`/event-voting`):
- Students suggest events; classmates vote during an open window.
- Teachers manage settings (board visibility, timing), close voting rounds, and delete entries.
- API: `/api/class-events/*`

### Five Minute Lessons

Similar voting board (`/five-minute-lessons`) for short lesson ideas:
- **Assistant Teachers** (and teachers) suggest lessons; students vote.
- Teachers approve winning suggestions (student earns XP and payment from treasury).
- API: `/api/five-minute-lessons/*`

### Health, attendance, and cyber systems (job-linked)

These are not separate top-level plugins but integrate with jobs and the student dashboard:

- **Doctor / Nurse / Clinic** (`/api/doctor-illness/*`, `/api/doctor-game/*`, `/api/nurse-game/*`): doctors assign illnesses (daily limits); sick students see an overlay and pay for cures (or use health insurance); nurses/doctors mark attendance.
- **Attendance / sick notes** (`/api/attendance/*`): absent students submit sick notes; HR Director, Financial Manager, or Lawyer may review.
- **Cyber attacks** (`/api/cyber-attack/*`): Software Engineers assign attacks; affected students self-resolve or call for repair; cyber insurance claims go through Insurance Manager.
- **Police fines and bonuses** (`/api/police-fines-bonuses/*`): Police log fines/bonuses → Lawyer queue → teacher final approval.

### Business proposals

Entrepreneurs submit **business proposals** via `/api/jobs/business-proposals/*`; teachers approve or deny. Approved entrepreneurs follow job-page instructions to operate their town business.

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
- `/my-profile` — student earnings/profile breakdown
- `/student/:username`, `/account/:accountNumber` — teacher view of a specific student
- `/accountant-client/:username` — accountant read-only view of an assigned client
- `/my-job/:jobId` — student job details and challenge game
- **Town Hub plugin screens**: `/bank`, `/land`, `/jobs`, `/news`, `/government`, `/tenders`, `/town-rules`, `/winkel`, `/pizza-time`, `/leaderboard`, `/suggestions-bugs`, `/disasters`, `/chores`, `/insurance`, `/court`, `/doubles-day`, `/analytics`, `/code-board`, `/event-voting`, `/five-minute-lessons`

Most student plugin routes are wrapped in **`RequireRulesAgreed`** (redirect to `/town-rules` until the student agrees). Analytics is teacher-only and not rules-gated.

The UI is organized around a few key contexts:
- `AuthContext`: stores current user + account and manages login/register/logout via JWT (includes `school_id`, `rules_agreed_at` for multi-tenant)
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
  - history, transfer (creates **pending** request), pending-transfers (teacher approve/deny), teacher deposit/withdraw, class bulk ops, bank settings, basic salary utilities, can-transact, unemployed-students; accountant transfer approval for assigned clients
- **Loans**: `/api/loans/*`
  - list, eligibility, apply, approve/activate, pay, process weekly payments, can-transact; admin: all, users, transactions, loan-payments, fix-approved, cleanup-zero-transactions, fix-outstanding-balances, reset-all-loans
- **Students**: `/api/students/*`
  - teacher: list, pending (approval queue), approve/deny, delete, reset-password, detail by username or account number, accountant assignments; student: classmates, transfer-recipients, town professionals, earnings profile; diagnose (teacher)
- **Plugins**: `/api/plugins/*`
  - list and teacher toggle
- **Town**: `/api/town/*`
  - town settings; treasury; taxes; salary runs; tax reporting; toggle-tax
- **Land**: `/api/land/*`
  - parcels, my properties, purchase requests + approvals (teacher, **fm-review**, **engineer-review**), seeding, stats, biome config, **swap**, **recalculate-values**
- **Jobs**: `/api/jobs/*`
  - list, job detail, apply, withdraw application, application review, assign/remove, award XP, setup; per-role game routes under `/api/*-game/*` (see below)
- **Business proposals**: `/api/jobs/business-proposals/*`
  - submit (student), list/review (teacher)
- **Tenders**: `/api/tenders/*`
  - list, create, apply, review applications, award, pay
- **Announcements**: `/api/announcements/*`
  - list, create/update/delete
- **Town News**: `/api/town-news/*`
  - stories (read/submit/delete), popups (active/manage/dismiss)
- **Content submissions**: `/api/content-submissions/*`
  - teacher review/approve-all for news, popups, and code-board apps
- **Town Rules**: `/api/town-rules/*`
  - get, put (by town_class); student agree endpoint
- **Winkel**: `/api/winkel/*`
  - items, purchases, settings, can-purchase, purchase, balance, stats, pay (mark paid / pay all), owned-emojis, change-emoji
- **Insurance**: `/api/insurance/*`
  - quote, my-policies, purchase; broker pending/claims; teacher purchases, refunds, type settings, classes
- **Pizza Time**: `/api/pizza-time/*`
  - status, status/all (teacher), create fund, donate, toggle active, reset
- **Leaderboard**: `/api/leaderboard/*`
  - overall, class/:className, all-classes
- **Math Game**: `/api/math-game/*`
  - status, start, submit
- **Wordle Game**: `/api/wordle-game/*`
  - status, start, guess, complete
- **Wordle Leaderboard**: `/api/wordle-leaderboard/*`
  - overall, all-classes
- **Job challenge games** (one route file per role): `/api/architect-game/*`, `/api/accountant-game/*`, `/api/software-engineer-game/*`, `/api/marketing-manager-game/*`, `/api/graphic-designer-game/*`, `/api/journalist-game/*`, `/api/event-planner-game/*`, `/api/financial-manager-game/*`, `/api/hr-director-game/*`, `/api/police-lieutenant-game/*`, `/api/lawyer-game/*`, `/api/town-planner-game/*`, `/api/electrical-engineer-game/*`, `/api/civil-engineer-game/*`, `/api/principal-game/*`, `/api/teacher-game/*`, `/api/nurse-game/*`, `/api/doctor-game/*`, `/api/retail-manager-game/*`, `/api/entrepreneur-game/*`, `/api/insurance-manager-game/*`
  - typical pattern: status, start, submit
- **Doctor illness / clinic**: `/api/doctor-illness/*`
  - doctor-status, assign, my-status, see-doctor, approve-cure
- **Cyber attack**: `/api/cyber-attack/*`
  - engineer-status, assign, my-status, self-resolve, call-it, approve-repair
- **Attendance**: `/api/attendance/*`
  - register-status, mark register, sick notes (submit, queue, review)
- **Police fines/bonuses**: `/api/police-fines-bonuses/*`
  - create, status, my-history, lawyer-queue, teacher review/approve/deny
- **Lawsuits / Court**: `/api/lawsuits/*`
  - file, my-cases, school-cases, hr-queue, lawyer-queue, jury-duty, withdraw, defendant-response, hr-review, lawyer accept/decline/opinion, jury-vote, teacher ruling
- **Code Board**: `/api/code-board/*`
  - apps (list/submit/star/click/delete), manage
- **Class events**: `/api/class-events/*`
  - status, suggest, vote, settings, close, delete
- **Five Minute Lessons**: `/api/five-minute-lessons/*`
  - status, suggest, vote, approve/deny, settings, close, delete
- **Suggestions/Bugs**: `/api/suggestions-bugs/*`
  - submit suggestion, submit bug; student: my; teacher: admin/queue, admin/all, update (review/reward)
- **Disasters**: `/api/disasters/*`
  - list, events/recent; teacher: create, update, delete, trigger, toggle
- **Teacher Analytics**: `/api/teacher-analytics/*`
  - engagement, student-logins
- **Export**: `/api/export/*`
  - CSV exports for teacher use (transactions, students, loans)
- **Admin**: `/api/admin/*`
  - teacher-only "factory reset" of the simulation
- **Super Admin**: `/api/super-admin/*` (also mounted under `/api/admin`)
  - schools (list, get, create, update, delete), schools/:id/stats, schools/:id/teachers (create), analytics

Authentication model:
- Most endpoints require `Authorization: Bearer <token>`.
- Teacher-only and super-admin-only endpoints are protected by role checks.
- **Multi-tenant**: many endpoints use `requireTenant` or `school_id` so teachers/students only see data for their school.
- Some endpoints enforce town/class scoping for students (e.g. tenders).

---

## Database overview

### Core tables

The application uses PostgreSQL tables for:
- **Identity**: `users` (includes `school_id`, `status` for approval, `profile_emoji`, `job_id`, `job_level`, `job_experience_points`, `job_started_at`, `rules_agreed_at`)
- **Schools**: `schools` (multi-tenant)
- **Banking**: `accounts`, `transactions`, `pending_transfers`
- **Loans**: `loans`, `loan_payments`
- **Town Hub**: `plugins`, `town_settings`, `announcements`, `town_rules`
- **Jobs**: `jobs`, `job_applications` (jobs can be global or per-school); per-role `*_game_sessions` / high-score tables
- **Treasury/Tax**: `treasury_transactions`, `tax_transactions`, `tax_brackets` (created by migrations)
- **Land registry**: `land_parcels`, `land_purchase_requests`
- **Tenders**: `tenders`, `tender_applications`
- **Math / Wordle games**: `math_game_sessions`, `math_game_high_scores`; wordle game session tables
- **Winkel (shop)**: `shop_items`, `shop_purchases`, `shop_balance`; profile emoji stored on `users`
- **Pizza Time**: `pizza_time_funds`, donation records
- **Insurance**: `insurance_purchases`, insurance type settings, claim records
- **Leaderboard**: computed from math game sessions (no separate table); wordle leaderboard from wordle sessions
- **Suggestions/Bugs**: `suggestions`, `bug_reports`
- **Disasters**: `disasters`, `disaster_events`
- **Town News**: `town_news_stories`, news popups
- **Code Board**: `code_board_apps`
- **Content approval**: pending submission tracking for news/apps/popups
- **Court**: `student_lawsuits`, `lawsuit_jury_assignments`
- **Police**: `police_fine_bonus_requests` (and related)
- **Health**: doctor illness/cure tables, attendance register, sick notes
- **Cyber**: cyber attack assignment tables
- **Class events / lessons**: class event and five-minute lesson voting tables
- **Business proposals**: entrepreneur proposal tables
- **Accountant/Lawyer assignments**: `accountant_student_assignments`, lawyer client assignments
- **Analytics**: `login_events` and related engagement tracking

Many additional tables are added incrementally via migrations in `server/migrations/` (100+ migration files).

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
- **Rules agreement**: students must agree to Town Rules (`rules_agreed_at`) before most plugin routes; enforced client-side via `RequireRulesAgreed`.
- **Class validation is strict**: many routes and registration validation assume only `6A`, `6B`, `6C` (per school).
- **Student email restriction**: registration validation may enforce a specific domain (e.g. `@stpeters.co.za`) when an email is provided.
- **Pending transfers**: student transfers do not execute immediately; teachers (and accountants for assigned clients) must approve.
- **Transaction blocking**: students can be blocked from transfers if balance is negative or a loan payment is overdue.
- **Math game daily limit**: 3 plays/day, resetting at 06:00 (server time). Wordle chores have a separate daily limit.
- **Job games**: daily limits and minimum play time before submit; XP and earnings are server-calculated.
- **Court plugin**: disabled by default; lawsuits require teacher final approval for any money movement.
- **Insurance**: requires a job (salary-based pricing); broker approval may be required per school/class.
- **Doubles Day**: off by default; doubles chore points and pizza donation credit only.
- **Factory reset is destructive**: teacher-only `/api/admin/factory-reset` requires `confirm: "RESET"` and deletes student economy data and restores towns/bank settings.
- **Super admin**: cannot see individual student data; can only create teachers and manage schools. Create via script: `node create-super-admin.js` (see `SUPER_ADMIN_SETUP.md`).

---

## Where to look next (for deeper documentation)

- `README.md` — features, architecture, and deployment basics
- `QUICK_START.md` — local development setup and seed instructions
- `TOWN_HUB_DEPLOYMENT.md` — Town Hub deployment and migration/seed steps (Railway)
- `SUPER_ADMIN_SETUP.md` — creating and using super admin accounts; multi-school management
- `LEADERBOARD_PLUGIN.md` — Leaderboard plugin (math game rankings, overall and per class)
- `STUDENT_UPDATE.md` — student-facing guide to jobs, levels, challenge games, and role workflows
- `LOCAL_SETUP.md`, `MATH_GAME_DEPLOYMENT.md`, `SALARIES_AND_LAND_PRICES.md` — additional setup and feature docs
- `server/job-roles/*.md` — detailed role descriptions for individual jobs

