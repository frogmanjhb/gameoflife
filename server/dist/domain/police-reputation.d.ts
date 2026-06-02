export declare const POLICE_REPUTATION_START = 10;
export declare const POLICE_REPUTATION_MAX = 20;
export declare const POLICE_REPUTATION_FINE_PENALTY = 1;
export declare const POLICE_REPUTATION_BONUS_GAIN = 2;
export declare const POLICE_REPUTATION_DAILY_GAIN = 1;
export declare const POLICE_REPUTATION_PEAK_MULTIPLIER = 1.25;
export interface PoliceReputationStatus {
    current: number;
    max: number;
    earnings_multiplier: number;
    earnings_percent: number;
    penalty_label: string | null;
    bonus_label: string | null;
}
export declare function getPoliceEarningsMultiplier(reputation: number): number;
export declare function buildPoliceReputationStatus(reputation: number): PoliceReputationStatus;
export declare function applyPoliceEarningsMultiplier(grossAmount: number, reputation: number): number;
/** Apply civic-day recovery (+1 per day missed, capped at max). */
export declare function syncPoliceReputation(userId: number): Promise<PoliceReputationStatus>;
export declare function adjustPoliceReputationOnSubmit(userId: number, type: 'fine' | 'bonus'): Promise<PoliceReputationStatus>;
export declare function resolvePoliceNetEarnings(policeUserId: number, grossAmount: number): Promise<{
    netAmount: number;
    reputation: PoliceReputationStatus;
}>;
export declare function getPoliceReputationIfPolice(userId: number, jobName: string | null | undefined): Promise<PoliceReputationStatus | null>;
//# sourceMappingURL=police-reputation.d.ts.map