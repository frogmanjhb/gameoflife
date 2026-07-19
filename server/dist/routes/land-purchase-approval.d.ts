import { RequiredEngineer } from '../domain/landPurchaseApproval';
declare const router: import("express-serve-static-core").Router;
export declare function getRequiredLandEngineers(schoolId: number | null, townClass: string, excludeUserId?: number): Promise<RequiredEngineer[]>;
export declare function getEngineerApprovalsForRequest(requestId: number): Promise<any[]>;
export declare function getEngineerReviewStartedAt(request: Record<string, unknown>): Date | null;
export declare function getEngineerReviewDeadlineAt(request: Record<string, unknown>): string | null;
/** After 3 days, record absent architect/engineer approvals (no fee or XP) and advance if complete. */
export declare function processAutoEngineerApprovals(request: Record<string, unknown>): Promise<boolean>;
export declare function executeTeacherPurchaseApproval(purchaseRequest: {
    id: number;
    user_id: number;
    parcel_id: number;
    offered_price: number | string;
}, teacherId: number): Promise<void>;
export declare function maybeAdvanceToTeacherReview(requestId: number, buyerId: number, schoolId: number | null, townClass: string): Promise<void>;
export declare function townHasFinancialManager(schoolId: number | null, townClass: string): Promise<boolean>;
export declare function enrichPurchaseRequestWithEngineers(request: Record<string, unknown>): Promise<{
    required_engineers: RequiredEngineer[];
    engineer_approvals: any[];
    engineer_approvals_received: number;
    engineer_approvals_required: number;
    engineer_fee_total: number;
    engineer_fee_per_approver: number;
    professional_fee_total: number;
    fm_fee: number;
    cost_breakdown: import("../domain/landPurchaseApproval").PurchaseCostBreakdown;
    engineer_review_deadline_at: string | null;
    engineer_auto_approval_after_days: number;
}>;
export default router;
//# sourceMappingURL=land-purchase-approval.d.ts.map