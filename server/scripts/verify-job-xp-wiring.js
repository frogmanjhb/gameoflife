/**
 * Static verification: job challenge games, server routes, and XP award paths.
 * Run: node scripts/verify-job-xp-wiring.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const clientRoot = path.join(root, '..', 'client', 'src');

const JOB_GAMES = [
  { key: 'architect', route: 'architect-game', api: 'architectGameApi' },
  { key: 'accountant', route: 'accountant-game', api: 'accountantGameApi' },
  { key: 'softwareEngineer', route: 'software-engineer-game', api: 'softwareEngineerGameApi' },
  { key: 'marketingManager', route: 'marketing-manager-game', api: 'marketingManagerGameApi' },
  { key: 'graphicDesigner', route: 'graphic-designer-game', api: 'graphicDesignerGameApi' },
  { key: 'journalist', route: 'journalist-game', api: 'journalistGameApi' },
  { key: 'eventPlanner', route: 'event-planner-game', api: 'eventPlannerGameApi' },
  { key: 'financialManager', route: 'financial-manager-game', api: 'financialManagerGameApi' },
  { key: 'hrDirector', route: 'hr-director-game', api: 'hrDirectorGameApi' },
  { key: 'policeLieutenant', route: 'police-lieutenant-game', api: 'policeLieutenantGameApi' },
  { key: 'lawyer', route: 'lawyer-game', api: 'lawyerGameApi' },
  { key: 'townPlanner', route: 'town-planner-game', api: 'townPlannerGameApi' },
  { key: 'electricalEngineer', route: 'electrical-engineer-game', api: 'electricalEngineerGameApi' },
  { key: 'civilEngineer', route: 'civil-engineer-game', api: 'civilEngineerGameApi' },
  { key: 'principal', route: 'principal-game', api: 'principalGameApi' },
  { key: 'teacher', route: 'teacher-game', api: 'teacherGameApi' },
  { key: 'nurse', route: 'nurse-game', api: 'nurseGameApi' },
  { key: 'doctor', route: 'doctor-game', api: 'doctorGameApi' },
  { key: 'retailManager', route: 'retail-manager-game', api: 'retailManagerGameApi' },
  { key: 'entrepreneur', route: 'entrepreneur-game', api: 'entrepreneurGameApi' },
  { key: 'insuranceManager', route: 'insurance-manager-game', api: 'insuranceManagerGameApi' },
];

const TASK_XP_PATHS = [
  { job: 'Accountant', action: 'Approve transfer', file: 'routes/transactions.ts', pattern: 'xp_awarded' },
  { job: 'Accountant', action: 'Submit client advice', file: 'domain/accountant-advice.ts', pattern: 'ADVICE_XP_REWARD' },
  { job: 'Software Engineer', action: 'Approve cyber repair', file: 'routes/cyber-attack.ts', pattern: 'CYBER_REPAIR_APPROVE_XP' },
  { job: 'Software Engineer', action: 'Code board star/click', file: 'routes/code-board.ts', pattern: 'STAR_XP_REWARD' },
  { job: 'Journalist/Designer/Entrepreneur', action: 'Town news approved', file: 'domain/townNews.ts', pattern: 'STORY_XP_REWARD' },
  { job: 'Event Planner', action: 'Suggest class event', file: 'routes/class-events.ts', pattern: 'SUGGESTION_XP_REWARD' },
  { job: 'Entrepreneur', action: 'Business proposal approved', file: 'domain/businessProposals.ts', pattern: 'PROPOSAL_APPROVE_XP' },
  { job: 'Financial Manager', action: 'Land purchase FM review', file: 'domain/landPurchaseApproval.ts', pattern: 'FM_LAND_REVIEW_XP' },
  { job: 'Architect/Civil Engineer', action: 'Land purchase engineer review', file: 'domain/landPurchaseApproval.ts', pattern: 'LAND_ENGINEER_REVIEW_XP' },
  { job: 'Lawyer', action: 'Review fine/bonus', file: 'domain/police-fines.ts', pattern: 'LAWYER_FINE_REVIEW_XP' },
  { job: 'HR/FM/Lawyer', action: 'Approve sick note', file: 'routes/attendance.ts', pattern: 'SICK_NOTE_APPROVE_XP' },
  { job: 'Doctor/Nurse', action: 'Submit attendance register', file: 'routes/attendance.ts', pattern: 'ATTENDANCE_REGISTER_XP' },
  { job: 'Doctor', action: 'Approve cure', file: 'routes/doctor-illness.ts', pattern: 'DOCTOR_CURE_APPROVE_XP' },
  { job: 'Teacher/Principal', action: 'Five minute lesson approved', file: 'routes/five-minute-lessons.ts', pattern: 'SUGGESTION_XP_REWARD' },
  { job: 'Police Lieutenant', action: 'Submit fine/bonus', file: 'domain/police-fines.ts', pattern: 'POLICE_FINE_BONUS_SUBMIT_XP' },
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

const failures = [];
const warnings = [];

console.log('=== Job XP wiring verification ===\n');

// 1. Job challenge games: route file, server mount, client API, XP on submit
console.log('1. Job challenge games (21 expected)');
const serverTs = read(path.join(src, 'server.ts'));
const apiTs = read(path.join(clientRoot, 'services', 'api.ts'));
const myJobDetails = read(path.join(clientRoot, 'components', 'MyJobDetails.tsx'));
const jobGameTests = read(path.join(clientRoot, 'utils', 'jobGameTests.ts'));

for (const game of JOB_GAMES) {
  const routeFile = path.join(src, 'routes', 'jobchallenges', `${game.route}.ts`);
  if (!exists(routeFile)) {
    failures.push(`Missing route file: ${game.route}.ts`);
    continue;
  }
  const content = read(routeFile);
  if (!content.includes("router.post('/submit'") && !content.includes('router.post("/submit"')) {
    failures.push(`${game.route}: no /submit route`);
  }
  if (!content.includes('job_experience_points')) {
    failures.push(`${game.route}: submit does not update job_experience_points`);
  }
  if (!content.includes('experience_points: totalXP') && !content.includes('experience_points: totalXP,')) {
    warnings.push(`${game.route}: response may not return experience_points`);
  }
  const mount = `/api/${game.route}`;
  if (!serverTs.includes(mount)) {
    failures.push(`server.ts missing mount: ${mount}`);
  }
  if (!apiTs.includes(game.api)) {
    failures.push(`client api.ts missing ${game.api}`);
  }
  if (!myJobDetails.includes(game.api)) {
    failures.push(`MyJobDetails.tsx missing ${game.api}`);
  }
  if (!jobGameTests.includes(`'${game.key}'`)) {
    warnings.push(`jobGameTests.ts missing key: ${game.key}`);
  }
}
console.log(`   Checked ${JOB_GAMES.length} games`);

// 2. Task-based XP paths
console.log('\n2. Job task XP paths');
for (const task of TASK_XP_PATHS) {
  const filePath = path.join(src, task.file);
  if (!exists(filePath)) {
    failures.push(`Missing task file: ${task.file}`);
    continue;
  }
  const content = read(filePath);
  if (!content.includes(task.pattern)) {
    failures.push(`${task.job} — ${task.action}: pattern "${task.pattern}" not found in ${task.file}`);
  }
}

// 3. Known gaps (documented intentionally — warn only)
console.log('\n3. Documented XP gaps (workflow tasks without XP)');
const engineerLand = read(path.join(src, 'routes', 'land-purchase-approval.ts'));
if (!engineerLand.includes('LAND_ENGINEER_REVIEW_XP') || !engineerLand.includes('isLandEngineerJob(reviewer.job_name)')) {
  warnings.push('Land engineer review: architects/civil engineers may not receive XP on approve');
}
const businessProposals = read(path.join(src, 'routes', 'business-proposals.ts'));
if (!businessProposals.includes('awardProposalApprovalXp')) {
  warnings.push('Entrepreneur business proposal approval: XP reward may be missing');
}

// 4. Client profile refresh after XP (UI wiring)
console.log('\n4. Client XP display refresh');
const panelsNeedingRefresh = [
  'MyJobDetails.tsx',
  'AttendanceRegisterPanel.tsx',
  'SickNoteApprovalPanel.tsx',
  'AccountantClientDetailView.tsx',
  'ClassEventSuggestForm.tsx',
  'FiveMinuteLessonSuggestForm.tsx',
];
for (const panel of panelsNeedingRefresh) {
  const content = read(path.join(clientRoot, 'components', panel));
  if (content.includes('experience_points') && !content.includes('refreshProfile')) {
    warnings.push(`${panel}: shows XP but does not call refreshProfile — XP bar may stay stale until reload`);
  }
}

// Summary
console.log('\n=== Results ===');
if (failures.length === 0) {
  console.log('PASS: No critical wiring failures.');
} else {
  console.log(`FAIL: ${failures.length} critical issue(s):`);
  failures.forEach((f) => console.log(`  ✗ ${f}`));
}
if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
}

process.exit(failures.length > 0 ? 1 : 0);
