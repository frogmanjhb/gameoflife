"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_INSURANCE_TYPES = exports.INSURANCE_TEACHER_REFUND_RATE = exports.INSURANCE_BROKER_XP = exports.INSURANCE_BROKER_EARNINGS = exports.INSURANCE_RATE = void 0;
exports.todayInSA = todayInSA;
exports.toDateString = toDateString;
exports.formatDateUTC = formatDateUTC;
exports.isPolicyCoverageActive = isPolicyCoverageActive;
exports.isPolicyEffectivelyActive = isPolicyEffectivelyActive;
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
exports.awardInsuranceBroker = awardInsuranceBroker;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const jobs_1 = require("../routes/jobs");
exports.INSURANCE_RATE = 0.05;
exports.INSURANCE_BROKER_EARNINGS = 500;
exports.INSURANCE_BROKER_XP = 5;
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
    return status === 'approved' && isPolicyCoverageActive(weekStart, weeks, today);
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
    const rows = await database_prod_1.default.query(`SELECT weeks, week_start_date, status
     FROM insurance_purchases
     WHERE user_id = $1 AND insurance_type = $2 AND status = 'approved'
     ORDER BY created_at DESC`, [userId, insuranceType]);
    return rows.some((p) => isPolicyEffectivelyActive(p.status, p.week_start_date, p.weeks, today));
}
async function payHealthInsuranceClinicClaim(executor, assignmentId, doctorAccountId, cureFee, illnessType) {
    await executor.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [cureFee, doctorAccountId]);
    await executor.query(`INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description)
     VALUES (NULL, $1, $2, 'insurance', $3)`, [
        doctorAccountId,
        cureFee,
        `Health insurance claim — ${illnessType} clinic fee (awaiting doctor approval)`,
    ]);
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
async function awardInsuranceBroker(executor, brokerUserId, brokerUsername, schoolId, townClass, earningsLabel) {
    const currentUser = await database_prod_1.default.get('SELECT job_level, job_experience_points FROM users WHERE id = $1', [brokerUserId]);
    const currentLevel = currentUser?.job_level || 1;
    const currentXP = currentUser?.job_experience_points || 0;
    const newXP = currentXP + exports.INSURANCE_BROKER_XP;
    let newLevel = currentLevel;
    for (let level = currentLevel; level < 10; level++) {
        if (newXP >= (0, jobs_1.getXPForLevel)(level + 1))
            newLevel = level + 1;
        else
            break;
    }
    await executor.query('UPDATE users SET job_experience_points = $1, job_level = $2 WHERE id = $3', [newXP, newLevel, brokerUserId]);
    const account = await database_prod_1.default.get('SELECT id FROM accounts WHERE user_id = $1', [brokerUserId]);
    if (account && townClass) {
        const townSettings = schoolId != null
            ? await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id = $2', [townClass, schoolId])
            : await database_prod_1.default.get('SELECT treasury_balance FROM town_settings WHERE class = $1 AND school_id IS NULL', [townClass]);
        const treasuryBalance = parseFloat(townSettings?.treasury_balance || '0');
        if (treasuryBalance < exports.INSURANCE_BROKER_EARNINGS) {
            throw new Error('Town treasury has insufficient funds to pay insurance broker earnings.');
        }
        if (schoolId != null) {
            await executor.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id = $3', [exports.INSURANCE_BROKER_EARNINGS, townClass, schoolId]);
        }
        else {
            await executor.query('UPDATE town_settings SET treasury_balance = treasury_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE class = $2 AND school_id IS NULL', [exports.INSURANCE_BROKER_EARNINGS, townClass]);
        }
        await executor.query(`INSERT INTO treasury_transactions (school_id, town_class, amount, transaction_type, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            schoolId,
            townClass,
            exports.INSURANCE_BROKER_EARNINGS,
            'withdrawal',
            `${earningsLabel} payout to ${brokerUsername}`,
            brokerUserId,
        ]);
        await executor.query('UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [exports.INSURANCE_BROKER_EARNINGS, account.id]);
        await executor.query(`INSERT INTO transactions (to_account_id, amount, transaction_type, description)
       VALUES ($1, $2, 'deposit', $3)`, [account.id, exports.INSURANCE_BROKER_EARNINGS, earningsLabel]);
    }
    return {
        earnings: exports.INSURANCE_BROKER_EARNINGS,
        experience_points: exports.INSURANCE_BROKER_XP,
        new_level: newLevel > currentLevel ? newLevel : null,
    };
}
//# sourceMappingURL=insurance.js.map