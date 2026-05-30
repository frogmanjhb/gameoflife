export declare const ADVICE_XP_REWARD = 10;
export declare const ADVICE_EARNINGS_REWARD = 500;
export declare const MIN_ADVICE_LENGTH = 20;
export declare const MAX_ADVICE_LENGTH = 2000;
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
export declare function payAdviceReward(userId: number, username: string, townClass: string, schoolId: number | null): Promise<{
    experience_points: number;
    earnings: number;
    new_level: number | null;
}>;
//# sourceMappingURL=accountant-advice.d.ts.map