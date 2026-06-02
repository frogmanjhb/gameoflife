export declare const SALARY_PAYMENT_XP_REWARD = 3;
export declare const SALARY_PAYMENT_EARNINGS_REWARD = 300;
export interface AccountantSalaryClientStatus {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    class: string | null;
    job_name: string | null;
    gross_salary: number | null;
    net_salary: number | null;
    paid_this_week: boolean;
    paid_by_accountant_username: string | null;
    can_pay: boolean;
    ineligible_reason: string | null;
}
export interface AccountantSalaryPaymentRecord {
    id: number;
    student_user_id: number;
    student_username: string;
    student_first_name: string | null;
    student_last_name: string | null;
    gross_salary: number;
    tax_amount: number;
    net_salary: number;
    job_name: string | null;
    week_start: string;
    paid_at: string;
}
export declare function getWeekStartMonday(date?: Date): string;
export declare function getWeekEndSunday(weekStart: string): string;
export declare function tablesReady(): Promise<boolean>;
export declare function getAccountantSalaryDashboard(accountantUserId: number): Promise<{
    week_start: string;
    week_end: string;
    payment_xp_reward: number;
    payment_earnings_reward: number;
    clients: AccountantSalaryClientStatus[];
    payment_history: AccountantSalaryPaymentRecord[];
}>;
export declare function resolveAccountantSalaryClient(accountantUserId: number, clientUsername: string): Promise<{
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
export declare function payClientWeeklySalary(accountantUserId: number, clientUsername: string): Promise<{
    gross_salary: number;
    tax_amount: number;
    net_salary: number;
    job_name: string;
    experience_points: number;
    earnings: number;
    new_level: number | null;
    week_start: string;
}>;
//# sourceMappingURL=accountant-salary-payments.d.ts.map