export declare const STAR_XP_REWARD = 5;
export declare const STAR_EARNINGS_REWARD = 1000;
export declare const CLICK_XP_REWARD = 5;
export declare const CLICK_EARNINGS_REWARD = 500;
export declare const MAX_APPS_PER_ENGINEER = 10;
export declare const MAX_TITLE_LENGTH = 200;
export declare const MAX_URL_LENGTH = 2048;
export type TownClass = '6A' | '6B' | '6C';
export declare function isTownClass(value: unknown): value is TownClass;
export declare function hasSoftwareEngineerJob(jobName: string | null | undefined): boolean;
export declare function sanitizeTitle(raw: unknown): string;
export declare function sanitizeUrl(raw: unknown): string | null;
//# sourceMappingURL=codeBoard.d.ts.map