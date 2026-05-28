export declare const STORY_XP_REWARD = 20;
export declare const STORY_EARNINGS_REWARD = 5000;
export declare const MAX_HEADLINE_LENGTH = 200;
export declare const MAX_BODY_LENGTH = 8000;
export declare const MAX_IMAGE_BYTES: number;
export type TownClass = '6A' | '6B' | '6C';
export declare function isTownClass(value: unknown): value is TownClass;
export declare function hasJournalistJob(jobName: string | null | undefined): boolean;
export declare function hasGraphicDesignerJob(jobName: string | null | undefined): boolean;
export declare function canSubmitTownNews(jobName: string | null | undefined): boolean;
export declare function estimateImageBytes(imageData: string): number;
export declare function isValidImageData(imageData: unknown): imageData is string;
export declare function sanitizeHeadline(raw: unknown): string;
export declare function sanitizeBody(raw: unknown): string;
export declare function sanitizeOptionalImage(raw: unknown): string | null;
export declare function payStorySubmissionReward(journalistUserId: number, journalistUsername: string, townClass: string, schoolId: number | null, headline: string): Promise<{
    new_level: number | null;
    experience_points: number;
    earnings: number;
}>;
//# sourceMappingURL=townNews.d.ts.map