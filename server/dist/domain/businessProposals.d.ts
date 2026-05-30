export declare const PROPOSAL_APPROVE_XP = 50;
export declare function hasEntrepreneurJob(jobName: string | null | undefined): boolean;
export declare function awardProposalApprovalXp(userId: number): Promise<{
    experience_points: number;
    new_level: number | null;
}>;
//# sourceMappingURL=businessProposals.d.ts.map