"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_INSURANCE_TYPES = exports.INSURANCE_RATE = void 0;
exports.todayInSA = todayInSA;
exports.toDateString = toDateString;
exports.formatDateUTC = formatDateUTC;
exports.isPolicyCoverageActive = isPolicyCoverageActive;
exports.isPolicyEffectivelyActive = isPolicyEffectivelyActive;
exports.isInsuranceBrokerJob = isInsuranceBrokerJob;
exports.getClassInsuranceBrokers = getClassInsuranceBrokers;
exports.classRequiresBrokerApproval = classRequiresBrokerApproval;
exports.hasActiveApprovedHealthInsurance = hasActiveApprovedHealthInsurance;
const database_prod_1 = __importDefault(require("../database/database-prod"));
exports.INSURANCE_RATE = 0.05;
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
async function classRequiresBrokerApproval(schoolId, townClass) {
    if (!townClass)
        return false;
    const brokers = await getClassInsuranceBrokers(schoolId, townClass);
    return brokers.length > 0;
}
async function hasActiveApprovedHealthInsurance(userId) {
    const today = todayInSA();
    const rows = await database_prod_1.default.query(`SELECT weeks, week_start_date, status
     FROM insurance_purchases
     WHERE user_id = $1 AND insurance_type = 'health' AND status = 'approved'
     ORDER BY created_at DESC`, [userId]);
    return rows.some((p) => isPolicyEffectivelyActive(p.status, p.week_start_date, p.weeks, today));
}
//# sourceMappingURL=insurance.js.map