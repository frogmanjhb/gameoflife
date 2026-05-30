/** Total professional fees (FM + architects + civil engineers) = 5% of plot price */
export declare const TOTAL_PROFESSIONAL_FEE_RATE = 0.05;
export declare const FM_LAND_REVIEW_XP = 10;
export declare const LAND_ENGINEER_REVIEW_XP = 50;
/** @deprecated Use LAND_ENGINEER_REVIEW_XP */
export declare const CIVIL_ENGINEER_LAND_REVIEW_XP = 50;
export declare const ACTIVE_PURCHASE_STATUSES: readonly ["pending_fm", "pending_engineer", "pending_teacher"];
export type LandPurchaseStatus = 'pending_fm' | 'pending_engineer' | 'pending_teacher' | 'approved' | 'denied';
export declare function hasArchitectJob(jobName: string | null | undefined): boolean;
export declare function hasCivilEngineerJob(jobName: string | null | undefined): boolean;
export declare function isLandEngineerJob(jobName: string | null | undefined): boolean;
export declare function calculateTotalProfessionalFee(offeredPrice: number): number;
export declare function allocateProfessionalFees(offeredPrice: number, engineerCount: number): {
    professional_fee_total: number;
    fm_fee: number;
    engineer_fee_total: number;
    engineer_fee_per_approver: number;
};
export declare function calculateFmFee(offeredPrice: number, engineerCount?: number): number;
export declare function calculateTotalEngineerFee(offeredPrice: number, engineerCount: number): number;
export declare function calculateEngineerFeeShare(offeredPrice: number, approverCount: number): number;
export declare function calculateTotalPurchaseCost(offeredPrice: number, engineerCount?: number): number;
export interface PurchaseCostBreakdown {
    plot_price: number;
    professional_fee_total: number;
    fm_fee: number;
    engineer_fee_total: number;
    engineer_fee_per_approver: number;
    total_required: number;
    buyer_balance: number;
    can_afford: boolean;
}
export declare function buildPurchaseCostBreakdown(offeredPrice: number, engineerCount: number, buyerBalance: number): PurchaseCostBreakdown;
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