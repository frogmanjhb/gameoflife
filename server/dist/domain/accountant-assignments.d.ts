export declare function hasAccountantJob(jobName: string | null | undefined): boolean;
export interface AccountantContext {
    accountant: {
        id: number;
        class: string | null;
        school_id: number | null;
        job_name: string | null;
    };
    responsibleStudentIds: number[];
    supervisedAccountantId: number | null;
}
export declare function classUsesManualAccountantAssignments(schoolId: number | null, townClass: string): Promise<boolean>;
export declare function getClassAccountantRoster(className: string, schoolId: number | null): Promise<{
    accountantIds: number[];
    nonAccountantStudentIds: number[];
    students: {
        id: number;
        job_name: string | null;
    }[];
}>;
export declare function seedManualAssignmentsFromAutoSplit(className: string, schoolId: number | null): Promise<void>;
export declare function getAccountantContext(userId: number): Promise<AccountantContext>;
export declare function getManualClientRows(accountantUserId: number, className: string, schoolId: number | null): Promise<any[]>;
//# sourceMappingURL=accountant-assignments.d.ts.map