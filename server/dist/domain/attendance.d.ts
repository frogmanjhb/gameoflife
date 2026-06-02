export declare const ATTENDANCE_REGISTER_XP = 20;
export declare const SICK_NOTE_APPROVE_XP = 10;
/** Multiplier applied to gross salary when absent without submitting a sick note. */
export declare const ABSENT_NO_SICK_NOTE_PAY_FACTOR = 0.5;
/** Same day window as job challenge games (resets 04:00). */
export declare const ATTENDANCE_DAY_START_SQL = "\n  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'\n  ELSE CURRENT_DATE + INTERVAL '4 hours' END\n";
export type AttendanceEntryStatus = 'present' | 'absent';
export type SickNoteStatus = 'awaiting_submission' | 'pending_review' | 'approved' | 'denied';
export type SickNoteReviewerRole = 'hr_director' | 'financial_manager' | 'lawyer' | 'none';
export declare function hasNurseJob(jobName: string | null | undefined): boolean;
export declare function hasDoctorJob(jobName: string | null | undefined): boolean;
export declare function hasHrDirectorJob(jobName: string | null | undefined): boolean;
export declare function townHasNurse(schoolId: number | null, townClass: string): Promise<boolean>;
export declare function townHasDoctor(schoolId: number | null, townClass: string): Promise<boolean>;
export declare function townHasHrDirector(schoolId: number | null, townClass: string): Promise<boolean>;
export type RegisterSubmitterRole = 'nurse' | 'doctor' | null;
export declare function resolveRegisterSubmitterRole(schoolId: number | null, townClass: string): Promise<RegisterSubmitterRole>;
export interface SickNoteReviewer {
    user_id: number;
    role: SickNoteReviewerRole;
}
export declare function resolveSickNoteReviewer(schoolId: number | null, townClass: string): Promise<SickNoteReviewer | null>;
export declare function userCanSubmitRegister(jobName: string | null | undefined, submitterRole: RegisterSubmitterRole): boolean;
export declare function userCanReviewSickNotes(jobName: string | null | undefined): boolean;
export declare function getTodayRegisterId(schoolId: number | null, townClass: string): Promise<number | null>;
/** Student IDs marked absent who never submitted a sick note (pay penalty applies). */
export declare function getAbsentWithoutSickNoteStudentIds(townClass: string, schoolId: number | null, studentIds?: number[]): Promise<Set<number>>;
export declare function reviewerRoleLabel(role: SickNoteReviewerRole): string;
//# sourceMappingURL=attendance.d.ts.map