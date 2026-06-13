"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATTENDANCE_WEEKEND_DISABLED_REASON = exports.ATTENDANCE_DAY_START_SQL = exports.ABSENT_NO_SICK_NOTE_PAY_FACTOR = exports.SICK_NOTE_APPROVE_XP = exports.ATTENDANCE_REGISTER_XP = void 0;
exports.getAttendanceGameDay = getAttendanceGameDay;
exports.isAttendanceRegisterDayEnabled = isAttendanceRegisterDayEnabled;
exports.hasNurseJob = hasNurseJob;
exports.hasDoctorJob = hasDoctorJob;
exports.hasHrDirectorJob = hasHrDirectorJob;
exports.townHasNurse = townHasNurse;
exports.townHasDoctor = townHasDoctor;
exports.townHasHrDirector = townHasHrDirector;
exports.resolveRegisterSubmitterRole = resolveRegisterSubmitterRole;
exports.resolveSickNoteReviewer = resolveSickNoteReviewer;
exports.userCanSubmitRegister = userCanSubmitRegister;
exports.userCanReviewSickNotes = userCanReviewSickNotes;
exports.getTodayRegisterId = getTodayRegisterId;
exports.getAbsentWithoutSickNoteStudentIds = getAbsentWithoutSickNoteStudentIds;
exports.reviewerRoleLabel = reviewerRoleLabel;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const landProperty_1 = require("./landProperty");
const lawyer_assignments_1 = require("./lawyer-assignments");
exports.ATTENDANCE_REGISTER_XP = 20;
exports.SICK_NOTE_APPROVE_XP = 10;
/** Multiplier applied to gross salary when absent without submitting a sick note. */
exports.ABSENT_NO_SICK_NOTE_PAY_FACTOR = 0.5;
/** Same day window as job challenge games (resets 04:00 UTC). */
exports.ATTENDANCE_DAY_START_SQL = `
  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
  ELSE CURRENT_DATE + INTERVAL '4 hours' END
`;
exports.ATTENDANCE_WEEKEND_DISABLED_REASON = 'Attendance register is not available on weekends.';
/** Game day for attendance (resets 04:00 UTC, same as job challenge games). */
function getAttendanceGameDay(date = new Date()) {
    const gameDay = new Date(date);
    if (gameDay.getUTCHours() < 4) {
        gameDay.setUTCDate(gameDay.getUTCDate() - 1);
    }
    return gameDay;
}
/** Nurse/Doctor register is weekdays only (Mon–Fri game days). */
function isAttendanceRegisterDayEnabled(date = new Date()) {
    const dayOfWeek = getAttendanceGameDay(date).getUTCDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6;
}
function hasNurseJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('nurse');
}
function hasDoctorJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('doctor');
}
function hasHrDirectorJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('hr director');
}
async function townHasNurse(schoolId, townClass) {
    const row = await database_prod_1.default.get(`SELECT 1 FROM users u
     JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2
       AND LOWER(j.name) LIKE '%nurse%'
     LIMIT 1`, [townClass, schoolId]);
    return !!row;
}
async function townHasDoctor(schoolId, townClass) {
    const row = await database_prod_1.default.get(`SELECT 1 FROM users u
     JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2
       AND LOWER(j.name) LIKE '%doctor%'
     LIMIT 1`, [townClass, schoolId]);
    return !!row;
}
async function townHasHrDirector(schoolId, townClass) {
    const row = await database_prod_1.default.get(`SELECT 1 FROM users u
     JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2
       AND LOWER(j.name) LIKE '%hr director%'
     LIMIT 1`, [townClass, schoolId]);
    return !!row;
}
async function resolveRegisterSubmitterRole(schoolId, townClass) {
    if (await townHasNurse(schoolId, townClass))
        return 'nurse';
    if (await townHasDoctor(schoolId, townClass))
        return 'doctor';
    return null;
}
async function resolveSickNoteReviewer(schoolId, townClass) {
    const students = await database_prod_1.default.query(`SELECT u.id, j.name AS job_name FROM users u
     JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2`, [townClass, schoolId]);
    for (const s of students) {
        if (hasHrDirectorJob(s.job_name)) {
            return { user_id: s.id, role: 'hr_director' };
        }
    }
    for (const s of students) {
        if ((0, landProperty_1.hasFinancialManagerJob)(s.job_name)) {
            return { user_id: s.id, role: 'financial_manager' };
        }
    }
    for (const s of students) {
        if ((0, lawyer_assignments_1.hasLawyerJob)(s.job_name)) {
            return { user_id: s.id, role: 'lawyer' };
        }
    }
    return null;
}
function userCanSubmitRegister(jobName, submitterRole) {
    if (submitterRole === 'nurse')
        return hasNurseJob(jobName);
    if (submitterRole === 'doctor')
        return hasDoctorJob(jobName);
    return false;
}
function userCanReviewSickNotes(jobName) {
    return (hasHrDirectorJob(jobName) ||
        (0, landProperty_1.hasFinancialManagerJob)(jobName) ||
        (0, lawyer_assignments_1.hasLawyerJob)(jobName));
}
async function getTodayRegisterId(schoolId, townClass) {
    const row = await database_prod_1.default.get(`SELECT id FROM attendance_registers
     WHERE town_class = $1 AND school_id IS NOT DISTINCT FROM $2
       AND submitted_at >= (${exports.ATTENDANCE_DAY_START_SQL})
     ORDER BY submitted_at DESC LIMIT 1`, [townClass, schoolId]);
    return row?.id ?? null;
}
/** Student IDs marked absent who never submitted a sick note (pay penalty applies). */
async function getAbsentWithoutSickNoteStudentIds(townClass, schoolId, studentIds) {
    const params = [townClass, schoolId];
    let studentFilter = '';
    if (studentIds && studentIds.length > 0) {
        params.push(studentIds);
        studentFilter = ` AND e.student_user_id = ANY($${params.length}::int[])`;
    }
    const rows = await database_prod_1.default.query(`SELECT DISTINCT e.student_user_id
     FROM attendance_register_entries e
     JOIN attendance_registers r ON r.id = e.register_id
     JOIN sick_notes sn ON sn.register_entry_id = e.id
     WHERE e.status = 'absent'
       AND sn.status = 'awaiting_submission'
       AND r.town_class = $1
       AND r.school_id IS NOT DISTINCT FROM $2
       ${studentFilter}`, params);
    return new Set(rows.map((r) => r.student_user_id));
}
function reviewerRoleLabel(role) {
    switch (role) {
        case 'hr_director':
            return 'HR Director';
        case 'financial_manager':
            return 'Financial Manager';
        case 'lawyer':
            return 'Lawyer';
        default:
            return 'Town staff';
    }
}
//# sourceMappingURL=attendance.js.map