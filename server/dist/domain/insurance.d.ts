export declare const INSURANCE_RATE = 0.05;
export declare const VALID_INSURANCE_TYPES: readonly ["health", "cyber", "property"];
export type InsuranceType = (typeof VALID_INSURANCE_TYPES)[number];
export type InsurancePurchaseStatus = 'pending_broker' | 'approved' | 'denied';
export declare function todayInSA(): string;
export declare function toDateString(val: Date | string | null | undefined): string;
export declare function formatDateUTC(date: Date): string;
export declare function isPolicyCoverageActive(weekStart: string | null | undefined, weeks: number, today?: string): boolean;
export declare function isPolicyEffectivelyActive(status: string, weekStart: string | null | undefined, weeks: number, today?: string): boolean;
export declare function isInsuranceBrokerJob(jobName: string | null | undefined): boolean;
export interface InsuranceBroker {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
}
export declare function getClassInsuranceBrokers(schoolId: number | null, townClass: string): Promise<InsuranceBroker[]>;
export declare function classRequiresBrokerApproval(schoolId: number | null, townClass: string | null | undefined): Promise<boolean>;
export declare function hasActiveApprovedHealthInsurance(userId: number): Promise<boolean>;
//# sourceMappingURL=insurance.d.ts.map