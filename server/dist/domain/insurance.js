"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_INSURANCE_TYPES = exports.INSURANCE_TEACHER_REFUND_RATE = exports.INSURANCE_BROKER_EARN_DESCRIPTION = exports.INSURANCE_BROKER_DAILY_REWARD_LIMIT = exports.INSURANCE_BROKER_XP = exports.INSURANCE_BROKER_EARNINGS = exports.INSURANCE_RATE = void 0;
exports.todayInSA = todayInSA;
exports.toDateString = toDateString;
exports.formatDateUTC = formatDateUTC;
exports.isPolicyCoverageActive = isPolicyCoverageActive;
exports.isPolicyEffectivelyActive = isPolicyEffectivelyActive;
exports.isPolicyProvidingCoverage = isPolicyProvidingCoverage;
exports.resolvePolicyWeekStartDate = resolvePolicyWeekStartDate;
exports.isInsuranceBrokerJob = isInsuranceBrokerJob;
exports.calculateTeacherRefundAmount = calculateTeacherRefundAmount;
exports.canTeacherRefundInsuranceStatus = canTeacherRefundInsuranceStatus;
exports.getClassInsuranceBrokers = getClassInsuranceBrokers;
exports.classRequiresBrokerApproval = classRequiresBrokerApproval;
exports.getDisabledInsuranceTypes = getDisabledInsuranceTypes;
exports.getEnabledInsuranceTypes = getEnabledInsuranceTypes;
exports.getInsuranceTypeSettings = getInsuranceTypeSettings;
exports.setInsuranceTypeEnabled = setInsuranceTypeEnabled;
exports.hasActiveApprovedHealthInsurance = hasActiveApprovedHealthInsurance;
exports.hasActiveApprovedCyberInsurance = hasActiveApprovedCyberInsurance;
exports.payHealthInsuranceClinicClaim = payHealthInsuranceClinicClaim;
exports.payCyberInsuranceRepairClaim = payCyberInsuranceRepairClaim;
exports.purchaseBatchAlreadyRewarded = purchaseBatchAlreadyRewarded;
exports.awardInsuranceBroker = awardInsuranceBroker;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const jobs_1 = require("../routes/jobs");
const doctor_reputation_1 = require("./doctor-reputation");
exports.INSURANCE_RATE = 0.05;
exports.INSURANCE_BROKER_EARNINGS = 500;
exports.INSURANCE_BROKER_XP = 5;
/** Max rewarded broker actions per broker per game day (resets 04:00). */
exports.INSURANCE_BROKER_DAILY_REWARD_LIMIT = 10;
exports.INSURANCE_BROKER_EARN_DESCRIPTION = 'INSURANCE_BROKER_EARN';
const GAME_DAY_START_SQL = `
  CASE
    WHEN CURRENT_TIME < '04:00:00'
    THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
    ELSE CURRENT_DATE + INTERVAL '4 hours'
  END
`;
exports.INSURANCE_TEACHER_REFUND_RATE = 0.9;
exports.VALID_INSURANCE_TYPES = ['health', 'cyber', 'property'];
const SA_TIMEZONE = 'Africa/Johannesburg';
function todayInSA() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: SA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year').value;
    const m = parts.find((p) => p.type === 'month').value;
    const d = parts.find((p) => p.type === 'day').value;
    return `${y}-${m}-${d}`;
}
function toDateString(val) {
    if (val == null)
        return '';
    if (typeof val === 'string')
        return val.slice(0, 10);
    const d = new Date(val);
    if (isNaN(d.getTime()))
        return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function formatDateUTC(date) {
    return date.toISOString().split('T')[0];
}
function isPolicyCoverageActive(weekStart, weeks, today = todayInSA()) {
    const startStr = toDateString(weekStart);
    if (!startStr)
        return false;
    const [y, m, day] = startStr.split('-').map(Number);
    const startUTC = Date.UTC(y, m - 1, day);
    const endUTC = startUTC + (weeks * 7 - 1) * 24 * 60 * 60 * 1000;
    const end = formatDateUTC(new Date(endUTC));
    return today >= startStr && today <= end;
}
function isPolicyEffectivelyActive(status, weekStart, weeks, today = todayInSA()) {
    return isPolicyProvidingCoverage(status, weekStart, weeks, today);
}
/** Premium paid; coverage applies while approved or awaiting broker sign-off (denial refunds premium). */
function isPolicyProvidingCoverage(status, weekStart, weeks, today = todayInSA()) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'denied' || normalized === 'refunded')
        return false;
    if (normalized !== 'approved' && normalized !== 'pending_broker')
        return false;
    return isPolicyCoverageActive(weekStart, weeks, today);
}
function resolvePolicyWeekStartDate(weekStart, createdAt, today = todayInSA()) {
    const fromWeekStart = toDateString(weekStart);
    if (fromWeekStart)
        return fromWeekStart;
    const fromCreated = toDateString(createdAt);
    return fromCreated || today;
}
function isInsuranceBrokerJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('insurance');
}
function calculateTeacherRefundAmount(totalCost) {
    return Math.round(totalCost * exports.INSURANCE_TEACHER_REFUND_RATE * 100) / 100;
}
function canTeacherRefundInsuranceStatus(status) {
    const normalized = String(status || '').toLowerCase();
    return normalized === 'approved' || normalized === 'pending_broker';
}
async function getClassInsuranceBrokers(schoolId, townClass) {
    const params = [townClass];
    let schoolFilter = 'u.school_id IS NULL';
    if (schoolId !== null) {
        schoolFilter = 'u.school_id = $2';
        params.push(schoolId);
    }
    return database_prod_1.default.query(`SELECT u.id, u.username, u.first_name, u.last_name
     FROM users u
     JOIN jobs j ON j.id = u.job_id
     WHERE u.role = 'student'
       AND u.status = 'approved'
       AND u.class = $1
       AND ${schoolFilter}
       AND LOWER(j.name) LIKE '%insurance%'
     ORDER BY u.id`, params);
}
async function classRequiresBrokerApproval(schoolId, townClass, requestingUserId) {
    if (!townClass)
        return false;
    const brokers = await getClassInsuranceBrokers(schoolId, townClass);
    if (requestingUserId != null) {
        return brokers.some((b) => b.id !== requestingUserId);
    }
    return brokers.length > 0;
}
async function getDisabledInsuranceTypes(schoolId) {
    if (schoolId === null)
        return [];
    try {
        const rows = await database_prod_1.default.query(`SELECT insurance_type FROM insurance_disabled_types WHERE school_id = $1`, [schoolId]);
        return rows
            .map((r) => r.insurance_type)
            .filter((t) => exports.VALID_INSURANCE_TYPES.includes(t));
    }
    catch {
        return [];
    }
}
async function getEnabledInsuranceTypes(schoolId) {
    const disabled = await getDisabledInsuranceTypes(schoolId);
    return exports.VALID_INSURANCE_TYPES.filter((t) => !disabled.includes(t));
}
async function getInsuranceTypeSettings(schoolId) {
    const disabled = new Set(await getDisabledInsuranceTypes(schoolId));
    return exports.VALID_INSURANCE_TYPES.map((id) => ({
        id,
        enabled: !disabled.has(id),
    }));
}
async function setInsuranceTypeEnabled(schoolId, insuranceType, enabled, teacherUserId) {
    if (enabled) {
        await database_prod_1.default.query(`DELETE FROM insurance_disabled_types WHERE school_id = $1 AND insurance_type = $2`, [schoolId, insuranceType]);
        return;
    }
    await database_prod_1.default.query(`INSERT INTO insurance_disabled_types (school_id, insurance_type, disabled_by, disabled_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (school_id, insurance_type) DO UPDATE
       SET disabled_by = EXCLUDED.disabled_by,
           disabled_at = CURRENT_TIMESTAMP`, [schoolId, insuranceType, teacherUserId]);
}
async function hasActiveApprovedHealthInsurance(userId) {
    return hasActiveApprovedInsuranceOfType(userId, 'health');
}
async function hasActiveApprovedCyberInsurance(userId) {
    return hasActiveApprovedInsuranceOfType(userId, 'cyber');
}
async function hasActiveApprovedInsuranceOfType(userId, insuranceType) {
    const today = todayInSA();
    const rows = await database_prod_1.default.query(`SELECT weeks, week_start_date, status, created_at
     FROM insurance_purchases
     WHERE user_id = $1 AND insurance_type = $2 AND status IN ('approved', 'pending_broker')
     ORDER BY created_at DESC`, [userId, insuranceType]);
    return rows.some((p) => isPolicyProvidingCoverage(p.status, resolvePolicyWeekStartDate(p.week_start_date, p.created_at, today), p.weeks, today));
}
async function payHealthInsuranceClinicClaim(executor, assignmentId, doctorUserId, doctorAccountId, cureFee, illnessType, opts) {
    const { netAmount: doctorPay, reputation } = await (0, doctor_reputation_1.resolveDoctorNetEarnings)(doctorUserId, cureFee);
    const withheld = Math.round((cureFee - doctorPay) * 100) / 100;
    await executor.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [doctorPay, doctorAccountId]);
    const description = reputation.penalty_label && withheld > 0
        ? `Health insurance claim — ${illnessType} clinic fee (R${doctorPay.toFixed(2)} after reputation penalty)`
        : `Health insurance claim — ${illnessType} clinic fee (awaiting doctor approval)`;
    await executor.query(`INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
     VALUES (NULL, $1, $2, 'insurance', $3)`, [doctorAccountId, doctorPay, description]);
    if (withheld > 0 && opts?.townClass) {
        if (opts.schoolId != null) {
            await executor.query('UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [withheld, opts.townClass, opts.schoolId]);
        }
        else {
            await executor.query('UPDATE town_settings SET treasury_balance = treasury_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [withheld, opts.townClass]);
        }
        await executor.query(`INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
       VALUES ($1, $2, $3, 'deposit', $4, $5)`, [opts.schoolId ?? null, opts.townClass, withheld, 'Doctor clinic reputation withholding (insurance)', doctorUserId]);
    }
    await executor.query(`UPDATE doctor_illness_assignments
     SET cure_requested_at = CURRENT_TIMESTAMP,
         cure_paid_at = CURRENT_TIMESTAMP,
         paid_by_insurance = TRUE
     WHERE id = $1`, [assignmentId]);
}
async function payCyberInsuranceRepairClaim(executor, assignmentId, engineerAccountId, repairFee, attackType) {
    await executor.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [repairFee, engineerAccountId]);
    await executor.query(`INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
     VALUES (NULL, $1, $2, 'insurance', $3)`, [
        engineerAccountId,
        repairFee,
        `Cyber insurance claim — ${attackType} IT repair fee (awaiting engineer approval)`,
    ]);
    await executor.query(`UPDATE cyber_attack_assignments
     SET repair_requested_at = CURRENT_TIMESTAMP,
         repair_paid_at = CURRENT_TIMESTAMP,
         paid_by_insurance = TRUE
     WHERE id = $1`, [assignmentId]);
}
function roundMoney(amount) {
    return Math.round(amount * 100) / 100;
}
async function countBrokerRewardsToday(executor, brokerUserId) {
    const result = (await executor.query(`SELECT COUNT(*)::int AS count
     FROM transactions t
     JOIN accounts a ON t.to_account_id = a.id
     WHERE a.user_id = $1
       AND t.transaction_type = 'deposit'
       AND t.description = $2
       AND t.created_at >= (${GAME_DAY_START_SQL})`, [brokerUserId, exports.INSURANCE_BROKER_EARN_DESCRIPTION]));
    const row = result.rows?.[0];
    return typeof row?.count === 'number' ? row.count : parseInt(String(row?.count ?? '0'), 10) || 0;
}
async function purchaseBatchAlreadyRewarded(executor, brokerUserId, applicantUserId, purchaseCreatedAt, purchaseId) {
    const result = (await executor.query(`SELECT EXISTS (
       SELECT 1
       FROM insurance_purchases
       WHERE user_id = $1
         AND created_at = $2::timestamp
         AND status = 'approved'
         AND reviewed_by = $3
         AND id != $4
     ) AS exists`, [applicantUserId, purchaseCreatedAt, brokerUserId, purchaseId]));
    const row = result.rows?.[0];
    return row?.exists === true || row?.exists === 't';
}
function resolveBrokerRewardAmounts(input) {
    if (input.purchaseBatchAlreadyRewarded) {
        return {
            experience_points: 0,
            earnings: 0,
            reward_skipped_reason: 'Broker reward already paid for this insurance purchase',
        };
    }
    const referenceAmount = input.referenceAmount != null && !Number.isNaN(input.referenceAmount)
        ? roundMoney(input.referenceAmount)
        : null;
    if (referenceAmount != null && referenceAmount <= 0) {
        return {
            experience_points: 0,
            earnings: 0,
            reward_skipped_reason: 'No broker reward for zero-cost insurance',
        };
    }
    const earnings = referenceAmount != null
        ? roundMoney(Math.min(exports.INSURANCE_BROKER_EARNINGS, referenceAmount))
        : exports.INSURANCE_BROKER_EARNINGS;
    if (earnings <= 0) {
        return {
            experience_points: 0,
            earnings: 0,
            reward_skipped_reason: 'Broker reward amount is zero',
        };
    }
    return {
        experience_points: exports.INSURANCE_BROKER_XP,
        earnings,
        reward_skipped_reason: null,
    };
}
async function awardInsuranceBroker(executor, brokerUserId, brokerUsername, schoolId, townClass, earningsLabel, input = {}) {
    let { experience_points, earnings, reward_skipped_reason } = resolveBrokerRewardAmounts(input);
    if (!reward_skipped_reason && experience_points > 0) {
        const rewardedToday = await countBrokerRewardsToday(executor, brokerUserId);
        if (rewardedToday >= exports.INSURANCE_BROKER_DAILY_REWARD_LIMIT) {
            experience_points = 0;
            earnings = 0;
            reward_skipped_reason = `Daily broker reward limit reached (${exports.INSURANCE_BROKER_DAILY_REWARD_LIMIT} per day)`;
        }
    }
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [brokerUserId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    let newLevel = currentLevel;
    if (experience_points > 0) {
        const newXP = currentXP + experience_points;
        newLevel = currentLevel;
        for (let level = currentLevel; level < 10; level++) {
            if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
                newLevel = level + 1;
            else
                break;
        }
        await executor.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, brokerUserId]);
    }
    if (earnings <= 0 || !townClass) {
        return {
            earnings: 0,
            experience_points,
            new_level: experience_points > 0 && newLevel > currentLevel ? newLevel : null,
            reward_skipped_reason,
        };
    }
    const account = await database_prod_1.default.get('SELECT id FROM accounts WHERE user_id = $1', [brokerUserId]);
    if (!account) {
        return {
            earnings: 0,
            experience_points,
            new_level: experience_points > 0 && newLevel > currentLevel ? newLevel : null,
            reward_skipped_reason: reward_skipped_reason ?? 'Account not found for reward payout',
        };
    }
    const townSettings = schoolId != null
        ? await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
        : await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
    const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
    if (treasuryBalance < earnings) {
        throw new Error('Town treasury has insufficient funds to pay insurance broker earnings.');
    }
    if (schoolId != null) {
        await executor.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [earnings, townClass, schoolId]);
    }
    else {
        await executor.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [earnings, townClass]);
    }
    await executor.query(`INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`, [schoolId, townClass, earnings, 'withdrawal', `${earningsLabel} payout to ${brokerUsername}`, brokerUserId]);
    await executor.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [earnings, account.id]);
    await executor.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
     VALUES ($1, $2, 'deposit', $3)`, [account.id, earnings, exports.INSURANCE_BROKER_EARN_DESCRIPTION]);
    return {
        earnings,
        experience_points,
        new_level: newLevel > currentLevel ? newLevel : null,
        reward_skipped_reason,
    };
}
//# sourceMappingURL=insurance.js.map