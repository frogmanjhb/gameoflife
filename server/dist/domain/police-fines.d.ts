export declare const POLICE_FINE_BONUS_SUBMIT_XP = 5;
export declare const LAWYER_FINE_REVIEW_XP = 10;
export declare const POLICE_BONUS_APPROVAL_EARNINGS = 3000;
export declare const POLICE_FINE_APPROVAL_EARNINGS = 1000;
type TxClient = {
    query: (sql: string, params?: unknown[]) => Promise<{
        rows: Record<string, unknown>[];
    }>;
};
export declare function hasPoliceLieutenantJob(jobName: string | null | undefined): boolean;
export declare function awardPoliceSubmitXp(userId: number): Promise<{
    experience_points: number;
    new_level: number | null;
}>;
export declare function awardLawyerFineReviewXp(userId: number): Promise<{
    experience_points: number;
    new_level: number | null;
}>;
export declare function payPoliceBonusApprovalReward(client: TxClient, policeUserId: number, policeUsername: string, townClass: string, schoolId: number | null): Promise<{
    earnings: number;
}>;
export declare function payPoliceFineApprovalReward(client: TxClient, policeUserId: number, policeUsername: string, townClass: string, schoolId: number | null): Promise<{
    earnings: number;
}>;
export {};
//# sourceMappingURL=police-fines.d.ts.map