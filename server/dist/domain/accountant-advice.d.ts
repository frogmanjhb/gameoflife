export declare const ADVICE_XP_REWARD = 10;
export declare const ADVICE_EARNINGS_REWARD = 500;
export declare const MIN_ADVICE_LENGTH = 20;
export declare const MAX_ADVICE_LENGTH = 2000;
/** Max rewarded advice submissions per accountant per game day (resets 04:00). */
export declare const ACCOUNTANT_ADVICE_DAILY_REWARD_LIMIT = 10;
export declare function sanitizeAdvice(text: string): string;
export declare function tablesReady(): Promise<boolean>;
export declare function resolveAccountantClient(accountantUserId: number, clientUsername: string): Promise<{
    accountant: {
        id: number;
        class: string | null;
        school_id: number | null;
    };
    client: {
        id: number;
        username: string;
        first_name: string | null;
        last_name: string | null;
        class: string | null;
        school_id: number | null;
        job_name: string | null;
    };
}>;
export type AdviceRewardInput = {
    clientUserId: number;
};
export type AdviceRewardResult = {
    experience_points: number;
    earnings: number;
    new_level: number | null;
    reward_skipped_reason: string | null;
};
export declare function payAdviceReward(userId: number, username: string, townClass: string, schoolId: number | null, input: AdviceRewardInput): Promise<AdviceRewardResult>;
//# sourceMappingURL=accountant-advice.d.ts.map