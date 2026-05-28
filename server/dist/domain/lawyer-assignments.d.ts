export declare const LAWYER_TARGET_CLIENTS = 10;
export declare const LAWYER_CLIENT_OVERLAP = 2;
export declare function hasLawyerJob(jobName: string | null | undefined): boolean;
export interface LawyerContext {
    lawyer: {
        id: number;
        class: string | null;
        school_id: number | null;
        job_name: string | null;
    };
    clientStudentIds: number[];
}
export declare function classUsesManualLawyerAssignments(schoolId: number | null, townClass: string): Promise<boolean>;
export declare function getClassLawyerRoster(className: string, schoolId: number | null): Promise<{
    lawyerIds: number[];
    nonLawyerStudentIds: number[];
}>;
export declare function seedManualAssignmentsFromAutoSplit(className: string, schoolId: number | null): Promise<void>;
export declare function getLawyerClientIds(lawyerUserId: number): Promise<number[]>;
export declare function getLawyerIdsForStudent(studentUserId: number, townClass: string, schoolId: number | null): Promise<number[]>;
export declare function getManualClientRows(lawyerUserId: number, className: string, schoolId: number | null): Promise<any[]>;
//# sourceMappingURL=lawyer-assignments.d.ts.map