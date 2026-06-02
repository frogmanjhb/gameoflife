import { TownClass } from './townScope';
export declare const COURT_ROUTE_PATH = "/court";
export declare const LAWSUIT_PROCESS_COST = 10000;
export declare const LAWYER_LAWSUIT_FEE = 10000;
export declare const LAWYER_LAWSUIT_XP = 20;
export declare const DEFENSE_LAWYER_FEE = 5000;
export declare const DEFENSE_LAWYER_XP = 15;
export declare const JURY_LAWSUIT_XP = 10;
export declare const HR_MEDIATION_XP = 10;
export declare const LAWSUIT_CLAIM_CAP = 5000;
export declare const JURY_SIZE = 5;
export declare const JURY_MIN_ELIGIBLE = 3;
export declare const TERMINAL_STATUSES: readonly ["approved", "denied", "withdrawn", "resolved_mediation"];
export declare const LAWYER_OPINIONS: readonly ["recommend_approve", "recommend_partial", "recommend_dismiss"];
export type LawsuitStatus = 'pending_hr' | 'pending_lawyer' | 'pending_jury' | 'pending_teacher' | 'approved' | 'denied' | 'withdrawn' | 'resolved_mediation';
export type LinkedActionType = 'police_fine_bonus' | 'cyber_attack' | 'doctor_illness' | 'land_sale';
export interface ProceedingsStep {
    key: string;
    label: string;
    state: 'complete' | 'current' | 'pending' | 'skipped';
    summary?: string;
    detail?: string;
    at?: string | null;
    waiting_message?: string;
}
export declare function tablesReady(): Promise<boolean>;
export declare function isCourtPluginEnabled(schoolId: number | null): Promise<boolean>;
export declare function awardJobXp(userId: number, xpAmount: number): Promise<{
    experience_points: number;
    new_level: number | null;
}>;
export declare function checkStudentCanTransact(userId: number): Promise<{
    canTransact: boolean;
    reason?: string;
}>;
export declare function getStudentBalance(userId: number): Promise<number>;
export declare function resolveLawyerSetup(plaintiffUserId: number, defendantUserId: number, townClass: string, schoolId: number | null): Promise<{
    plaintiffLawyerId: number | null;
    defendantLawyerId: number | null;
    lawyerConflict: boolean;
    plaintiffAcceptance: 'pending' | 'not_required';
}>;
export declare function tryAdvanceToJury(lawsuitId: number): Promise<void>;
export declare function holdEscrow(lawsuitId: number, lawyerUserId: number): Promise<void>;
export declare function refundEscrowIfHeld(lawsuitId: number): Promise<void>;
export declare function payPlaintiffLawyerOnClose(lawsuit: Record<string, unknown>, client: {
    query: (sql: string, params?: unknown[]) => Promise<{
        rows: Record<string, unknown>[];
    }>;
}): Promise<{
    lawyerId?: number;
}>;
export declare function payDefenseLawyerParticipation(lawsuitId: number, lawyerUserId: number): Promise<{
    experience_points: number;
    new_level: number | null;
}>;
export declare function isJuryEligibleStudent(userId: number, jobName: string | null | undefined): Promise<boolean>;
export declare function seatJury(lawsuitId: number): Promise<void>;
export declare function recordJuryVote(lawsuitId: number, jurorUserId: number, vote: 'guilty' | 'not_guilty'): Promise<{
    jury_complete: boolean;
    experience_points?: number;
    new_level?: number | null;
}>;
export declare function validateLinkedAction(type: LinkedActionType, actionId: number, plaintiffUserId: number, defendantUserId: number, schoolId: number | null, townClass: string): Promise<boolean>;
export declare function getLinkableActions(plaintiffUserId: number, defendantUserId: number, schoolId: number | null, townClass: string): Promise<Array<{
    type: LinkedActionType;
    id: number;
    label: string;
    created_at: string;
}>>;
export declare function buildProceedingsTimeline(row: Record<string, unknown>, juryAssignments?: Array<{
    vote: string | null;
    voted_at: string | null;
}>): ProceedingsStep[];
export declare const LAWSUIT_LIST_SELECT = "\n  sl.*,\n  p.username AS plaintiff_username,\n  p.first_name AS plaintiff_first_name,\n  p.last_name AS plaintiff_last_name,\n  d.username AS defendant_username,\n  d.first_name AS defendant_first_name,\n  d.last_name AS defendant_last_name,\n  hr.username AS hr_reviewer_username,\n  tr.username AS teacher_reviewer_username,\n  pl.username AS plaintiff_lawyer_username,\n  dl.username AS defendant_lawyer_username,\n  al.username AS accepting_lawyer_username\n";
export declare const LAWSUIT_LIST_JOINS = "\n  FROM student_lawsuits sl\n  JOIN users p ON p.id = sl.plaintiff_user_id\n  JOIN users d ON d.id = sl.defendant_user_id\n  LEFT JOIN users hr ON hr.id = sl.hr_reviewer_id\n  LEFT JOIN users tr ON tr.id = sl.teacher_reviewer_id\n  LEFT JOIN users pl ON pl.id = sl.plaintiff_lawyer_id\n  LEFT JOIN users dl ON dl.id = sl.defendant_lawyer_id\n  LEFT JOIN users al ON al.id = sl.accepting_lawyer_id\n";
export declare function isValidTownClassForLawsuit(value: unknown): value is TownClass;
//# sourceMappingURL=lawsuits.d.ts.map