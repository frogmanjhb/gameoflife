export declare const INSURANCE_RATE = 0.05;
export declare const INSURANCE_BROKER_EARNINGS = 500;
export declare const INSURANCE_BROKER_XP = 5;
/** Max rewarded broker actions per broker per game day (resets 04:00). */
export declare const INSURANCE_BROKER_DAILY_REWARD_LIMIT = 10;
export declare const INSURANCE_BROKER_EARN_DESCRIPTION = "INSURANCE_BROKER_EARN";
export declare const INSURANCE_TEACHER_REFUND_RATE = 0.9;
export declare const VALID_INSURANCE_TYPES: readonly ["health", "cyber", "property"];
export type InsuranceType = (typeof VALID_INSURANCE_TYPES)[number];
export type InsurancePurchaseStatus = 'pending_broker' | 'approved' | 'denied' | 'refunded';
export declare function todayInSA(): string;
export declare function toDateString(val: Date | string | null | undefined): string;
export declare function formatDateUTC(date: Date): string;
export declare function isPolicyCoverageActive(weekStart: string | null | undefined, weeks: number, today?: string): boolean;
export declare function isPolicyEffectivelyActive(status: string, weekStart: string | null | undefined, weeks: number, today?: string): boolean;
/** Premium paid; coverage applies while approved or awaiting broker sign-off (denial refunds premium). */
export declare function isPolicyProvidingCoverage(status: string, weekStart: string | null | undefined, weeks: number, today?: string): boolean;
export declare function resolvePolicyWeekStartDate(weekStart: string | Date | null | undefined, createdAt: string | Date | null | undefined, today?: string): string;
export declare function isInsuranceBrokerJob(jobName: string | null | undefined): boolean;
export declare function calculateTeacherRefundAmount(totalCost: number): number;
export declare function canTeacherRefundInsuranceStatus(status: string): boolean;
export interface InsuranceBroker {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
}
export declare function getClassInsuranceBrokers(schoolId: number | null, townClass: string): Promise<InsuranceBroker[]>;
export declare function classRequiresBrokerApproval(schoolId: number | null, townClass: string | null | undefined, requestingUserId?: number | null): Promise<boolean>;
export declare function getDisabledInsuranceTypes(schoolId: number | null): Promise<InsuranceType[]>;
export declare function getEnabledInsuranceTypes(schoolId: number | null): Promise<InsuranceType[]>;
export declare function getInsuranceTypeSettings(schoolId: number | null): Promise<Array<{
    id: InsuranceType;
    enabled: boolean;
}>>;
export declare function setInsuranceTypeEnabled(schoolId: number, insuranceType: InsuranceType, enabled: boolean, teacherUserId: number): Promise<void>;
export declare function hasActiveApprovedHealthInsurance(userId: number): Promise<boolean>;
export declare function hasActiveApprovedCyberInsurance(userId: number): Promise<boolean>;
type Queryable = {
    query: (text: string, params?: unknown[]) => Promise<unknown>;
};
export declare function payHealthInsuranceClinicClaim(executor: Queryable, assignmentId: number, doctorUserId: number, doctorAccountId: number, cureFee: number, illnessType: string, opts?: {
    townClass?: string | null;
    schoolId?: number | null;
}): Promise<void>;
export declare function payCyberInsuranceRepairClaim(executor: Queryable, assignmentId: number, engineerAccountId: number, repairFee: number, attackType: string): Promise<void>;
export type InsuranceBrokerRewardInput = {
    /** Premium or claim amount — purchase rewards are capped at this value. */
    referenceAmount?: number;
    /** Skip reward when another type in the same purchase batch was already approved. */
    purchaseBatchAlreadyRewarded?: boolean;
};
export type InsuranceBrokerRewardResult = {
    earnings: number;
    experience_points: number;
    new_level: number | null;
    reward_skipped_reason: string | null;
};
export declare function purchaseBatchAlreadyRewarded(executor: Queryable, brokerUserId: number, applicantUserId: number, purchaseCreatedAt: string | Date, purchaseId: number): Promise<boolean>;
export declare function awardInsuranceBroker(executor: Queryable, brokerUserId: number, brokerUsername: string, schoolId: number | null, townClass: string | null, earningsLabel: string, input?: InsuranceBrokerRewardInput): Promise<InsuranceBrokerRewardResult>;
export {};
//# sourceMappingURL=insurance.d.ts.map