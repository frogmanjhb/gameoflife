export type EarningsActivitySource = 'wordle' | 'math_chores' | 'job_challenge_game' | 'salary' | 'job_task';
export interface StudentEarningsActivityItem {
    id: string;
    source: EarningsActivitySource;
    label: string;
    detail?: string;
    xp?: number;
    money?: number;
    occurred_at: string;
}
export interface StudentEarningsProfile {
    job_level: number;
    job_experience_points: number;
    job_name: string | null;
    account_balance: number;
    xp: {
        wordle: number;
        job_challenge_games: number;
        job_tasks_and_other: number;
        total: number;
    };
    money: {
        math_chores: number;
        wordle: number;
        job_challenge_games: number;
        salary: number;
        job_tasks: number;
        total_earned: number;
    };
    counts: {
        math_chores_sessions: number;
        wordle_games: number;
        job_challenge_sessions: number;
    };
    xp_history: StudentEarningsActivityItem[];
    money_history: StudentEarningsActivityItem[];
}
export declare function buildStudentEarningsProfile(userId: number): Promise<StudentEarningsProfile | null>;
//# sourceMappingURL=studentEarningsProfile.d.ts.map