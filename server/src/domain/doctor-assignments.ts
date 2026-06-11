import database from '../database/database-prod';
import { hasDoctorJob } from './attendance';

const DOCTOR_CLIENT_OVERLAP = 2;

function computeAutoClientIds(
  doctorId: number,
  doctorIds: number[],
  studentIds: number[]
): number[] {
  if (!doctorIds.length || !studentIds.length) return [];
  if (doctorIds.length === 1) return studentIds;

  const sortedDoctorIds = doctorIds.slice().sort((a, b) => a - b);
  const index = sortedDoctorIds.indexOf(doctorId);
  if (index === -1) return [];

  const n = studentIds.length;
  const perDoctor = Math.max(1, Math.ceil(n / doctorIds.length));
  const start = Math.max(0, index * perDoctor - DOCTOR_CLIENT_OVERLAP);
  const end = Math.min(n, (index + 1) * perDoctor + DOCTOR_CLIENT_OVERLAP);
  return studentIds.slice(start, end);
}

export async function getClassDoctorRoster(
  className: string,
  schoolId: number | null
): Promise<{
  doctorIds: number[];
  nonDoctorStudentIds: number[];
}> {
  const students = await database.query(
    `SELECT u.id, j.name as job_name
     FROM users u
     LEFT JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student'
       AND u.class = $1
       AND ${schoolId !== null ? 'u.school_id = $2' : 'u.school_id IS NULL'}
     ORDER BY u.id`,
    schoolId !== null ? [className, schoolId] : [className]
  );
  const doctorIds: number[] = [];
  const nonDoctorStudentIds: number[] = [];
  for (const s of students) {
    if (hasDoctorJob(s.job_name)) {
      doctorIds.push(s.id);
    } else {
      nonDoctorStudentIds.push(s.id);
    }
  }
  return { doctorIds, nonDoctorStudentIds };
}

export async function getDoctorIdsForStudent(
  studentUserId: number,
  townClass: string,
  schoolId: number | null
): Promise<number[]> {
  const { doctorIds, nonDoctorStudentIds } = await getClassDoctorRoster(townClass, schoolId);
  if (!doctorIds.length) return [];
  if (!nonDoctorStudentIds.includes(studentUserId)) {
    return [];
  }
  return doctorIds.filter((doctorId) =>
    computeAutoClientIds(doctorId, doctorIds, nonDoctorStudentIds).includes(studentUserId)
  );
}
