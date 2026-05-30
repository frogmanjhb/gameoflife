export declare const POLICE_FINE_BONUS_SUBMIT_XP = 5;
export declare const LAWYER_FINE_REVIEW_XP = 10;
export declare function hasPoliceLieutenantJob(jobName: string | null | undefined): boolean;
export declare function awardPoliceSubmitXp(userId: number): Promise<{
    experience_points: number;
    new_level: number | null;
}>;
export declare function awardLawyerFineReviewXp(userId: number): Promise<{
    experience_points: number;
    new_level: number | null;
}>;
//# sourceMappingURL=police-fines.d.ts.map