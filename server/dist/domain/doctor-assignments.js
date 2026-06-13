"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassDoctorRoster = getClassDoctorRoster;
exports.getDoctorIdsForStudent = getDoctorIdsForStudent;
const database_prod_1 = __importDefault(require("../database/database-prod"));
const attendance_1 = require("./attendance");
const DOCTOR_CLIENT_OVERLAP = 2;
function computeAutoClientIds(doctorId, doctorIds, studentIds) {
    if (!doctorIds.length || !studentIds.length)
        return [];
    if (doctorIds.length === 1)
        return studentIds;
    const sortedDoctorIds = doctorIds.slice().sort((a, b) => a - b);
    const index = sortedDoctorIds.indexOf(doctorId);
    if (index === -1)
        return [];
    const n = studentIds.length;
    const perDoctor = Math.max(1, Math.ceil(n / doctorIds.length));
    const start = Math.max(0, index * perDoctor - DOCTOR_CLIENT_OVERLAP);
    const end = Math.min(n, (index + 1) * perDoctor + DOCTOR_CLIENT_OVERLAP);
    return studentIds.slice(start, end);
}
async function getClassDoctorRoster(className, schoolId) {
    const students = await database_prod_1.default.query(`SELECT u.id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student'
       AND u.class = $1
       AND ${schoolId !== null ? 'u.school_id = $2' : 'u.school_id IS NULL'}
     ORDER BY u.id`, schoolId !== null ? [className, schoolId] : [className]);
    const doctorIds = [];
    const nonDoctorStudentIds = [];
    for (const s of students) {
        if ((0, attendance_1.hasDoctorJob)(s.job_name)) {
            doctorIds.push(s.id);
        }
        else {
            nonDoctorStudentIds.push(s.id);
        }
    }
    return { doctorIds, nonDoctorStudentIds };
}
async function getDoctorIdsForStudent(studentUserId, townClass, schoolId) {
    const { doctorIds, nonDoctorStudentIds } = await getClassDoctorRoster(townClass, schoolId);
    if (!doctorIds.length)
        return [];
    if (!nonDoctorStudentIds.includes(studentUserId)) {
        return [];
    }
    return doctorIds.filter((doctorId) => computeAutoClientIds(doctorId, doctorIds, nonDoctorStudentIds).includes(studentUserId));
}
//# sourceMappingURL=doctor-assignments.js.map