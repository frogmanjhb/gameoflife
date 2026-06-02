export declare const DOCTOR_REPUTATION_START = 20;
export declare const DOCTOR_REPUTATION_MAX = 20;
export declare const DOCTOR_REPUTATION_ASSIGN_PENALTY = 3;
export declare const DOCTOR_REPUTATION_DAILY_GAIN = 1;
export interface DoctorReputationStatus {
    current: number;
    max: number;
    earnings_multiplier: number;
    earnings_percent: number;
    penalty_label: string | null;
}
export declare function getDoctorEarningsMultiplier(reputation: number): number;
export declare function buildDoctorReputationStatus(reputation: number): DoctorReputationStatus;
export declare function applyDoctorEarningsMultiplier(grossAmount: number, reputation: number): number;
/** Apply civic-day recovery (+1 per day missed, capped at max). */
export declare function syncDoctorReputation(userId: number): Promise<DoctorReputationStatus>;
export declare function decrementDoctorReputationOnAssign(userId: number): Promise<DoctorReputationStatus>;
/** Gross doctor earnings after reputation sync (for games, salary, clinic). */
export declare function resolveDoctorNetEarnings(doctorUserId: number, grossAmount: number): Promise<{
    netAmount: number;
    reputation: DoctorReputationStatus;
}>;
export declare function getDoctorReputationIfDoctor(userId: number, jobName: string | null | undefined): Promise<DoctorReputationStatus | null>;
//# sourceMappingURL=doctor-reputation.d.ts.map