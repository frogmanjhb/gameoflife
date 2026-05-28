import database from '../database/database-prod';
import { hasFinancialManagerJob } from './landProperty';
import { hasLawyerJob } from './lawyer-assignments';

export const ATTENDANCE_REGISTER_XP = 20;
export const SICK_NOTE_APPROVE_XP = 10;
/** Multiplier applied to gross salary when absent without submitting a sick note. */
export const ABSENT_NO_SICK_NOTE_PAY_FACTOR = 0.5;

/** Same day window as job challenge games (resets 04:00). */
export const ATTENDANCE_DAY_START_SQL = `
  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
  ELSE CURRENT_DATE + INTERVAL '4 hours' END
`;

export type AttendanceEntryStatus = 'present' | 'absent';
export type SickNoteStatus = 'awaiting_submission' | 'pending_review' | 'approved' | 'denied';
export type SickNoteReviewerRole = 'hr_director' | 'financial_manager' | 'lawyer' | 'none';

export function hasNurseJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('nurse');
}

export function hasDoctorJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('doctor');
}

export function hasHrDirectorJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('hr director');
}

export async function townHasNurse(schoolId: number | null, townClass: string): Promise<boolean> {
  const row = await database.get(
    `SELECT 1 FROM users u
     JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2
       AND LOWER(j.name) LIKE '%nurse%'
     LIMIT 1`,
    [townClass, schoolId]
  );
  return !!row;
}

export async function townHasDoctor(schoolId: number | null, townClass: string): Promise<boolean> {
  const row = await database.get(
    `SELECT 1 FROM users u
     JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2
       AND LOWER(j.name) LIKE '%doctor%'
     LIMIT 1`,
    [townClass, schoolId]
  );
  return !!row;
}

export type RegisterSubmitterRole = 'nurse' | 'doctor' | null;

export async function resolveRegisterSubmitterRole(
  schoolId: number | null,
  townClass: string
): Promise<RegisterSubmitterRole> {
  if (await townHasNurse(schoolId, townClass)) return 'nurse';
  if (await townHasDoctor(schoolId, townClass)) return 'doctor';
  return null;
}

export interface SickNoteReviewer {
  user_id: number;
  role: SickNoteReviewerRole;
}

export async function resolveSickNoteReviewer(
  schoolId: number | null,
  townClass: string
): Promise<SickNoteReviewer | null> {
  const students = await database.query(
    `SELECT u.id, j.name AS job_name FROM users u
     JOIN jobs j ON u.job_id = j.id
     WHERE u.role = 'student' AND u.status = 'approved'
       AND u.class = $1 AND u.school_id IS NOT DISTINCT FROM $2`,
    [townClass, schoolId]
  );

  for (const s of students) {
    if (hasHrDirectorJob(s.job_name)) {
      return { user_id: s.id, role: 'hr_director' };
    }
  }
  for (const s of students) {
    if (hasFinancialManagerJob(s.job_name)) {
      return { user_id: s.id, role: 'financial_manager' };
    }
  }
  for (const s of students) {
    if (hasLawyerJob(s.job_name)) {
      return { user_id: s.id, role: 'lawyer' };
    }
  }
  return null;
}

export function userCanSubmitRegister(
  jobName: string | null | undefined,
  submitterRole: RegisterSubmitterRole
): boolean {
  if (submitterRole === 'nurse') return hasNurseJob(jobName);
  if (submitterRole === 'doctor') return hasDoctorJob(jobName);
  return false;
}

export function userCanReviewSickNotes(jobName: string | null | undefined): boolean {
  return (
    hasHrDirectorJob(jobName) ||
    hasFinancialManagerJob(jobName) ||
    hasLawyerJob(jobName)
  );
}

export async function getTodayRegisterId(
  schoolId: number | null,
  townClass: string
): Promise<number | null> {
  const row = await database.get(
    `SELECT id FROM attendance_registers
     WHERE town_class = $1 AND school_id IS NOT DISTINCT FROM $2
       AND submitted_at >= (${ATTENDANCE_DAY_START_SQL})
     ORDER BY submitted_at DESC LIMIT 1`,
    [townClass, schoolId]
  );
  return row?.id ?? null;
}

/** Student IDs marked absent who never submitted a sick note (pay penalty applies). */
export async function getAbsentWithoutSickNoteStudentIds(
  townClass: string,
  schoolId: number | null,
  studentIds?: number[]
): Promise<Set<number>> {
  const params: unknown[] = [townClass, schoolId];
  let studentFilter = '';
  if (studentIds && studentIds.length > 0) {
    params.push(studentIds);
    studentFilter = ` AND e.student_user_id = ANY($${params.length}::int[])`;
  }

  const rows = await database.query(
    `SELECT DISTINCT e.student_user_id
     FROM attendance_register_entries e
     JOIN attendance_registers r ON r.id = e.register_id
     JOIN sick_notes sn ON sn.register_entry_id = e.id
     WHERE e.status = 'absent'
       AND sn.status = 'awaiting_submission'
       AND r.town_class = $1
       AND r.school_id IS NOT DISTINCT FROM $2
       ${studentFilter}`,
    params
  );

  return new Set(rows.map((r: { student_user_id: number }) => r.student_user_id));
}

export function reviewerRoleLabel(role: SickNoteReviewerRole): string {
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
