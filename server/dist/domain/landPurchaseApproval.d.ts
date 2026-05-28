export declare const ENGINEER_APPROVAL_FEE_RATE = 0.1;
export declare const ACTIVE_PURCHASE_STATUSES: readonly ["pending_engineer", "pending_teacher"];
export type LandPurchaseStatus = 'pending_engineer' | 'pending_teacher' | 'approved' | 'denied';
export declare function hasArchitectJob(jobName: string | null | undefined): boolean;
export declare function hasCivilEngineerJob(jobName: string | null | undefined): boolean;
export declare function isLandEngineerJob(jobName: string | null | undefined): boolean;
export declare function calculateTotalEngineerFee(offeredPrice: number): number;
export declare function calculateEngineerFeeShare(offeredPrice: number, approverCount: number): number;
export declare function calculateTotalPurchaseCost(offeredPrice: number): number;
export interface RequiredEngineer {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    job_name: string;
}
export interface EngineerApprovalRow {
    approver_id: number;
    approver_username?: string;
    approver_first_name?: string;
    approver_last_name?: string;
    job_name?: string;
    fee_amount: number;
    approved_at: string;
}
//# sourceMappingURL=landPurchaseApproval.d.ts.map