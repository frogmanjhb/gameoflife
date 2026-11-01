import type { GorWorldRow, GorWorldSettings } from './types';
export declare function mergeWorldSettings(raw: GorWorldSettings | undefined): GorWorldSettings;
export declare function isAutomationPaused(row: Pick<GorWorldRow, 'paused' | 'settings'>): boolean;
export declare function parseSettleClock(settings: GorWorldSettings): {
    hour: number;
    minute: number;
};
export declare function localDateParts(date: Date, timeZone: string): {
    y: number;
    m: number;
    d: number;
};
export declare function localWeekdayIndex(date: Date, timeZone: string): number;
/** Fixed UTC+2 — South Africa has no daylight saving. */
export declare function zonedInstantUtc(y: number, m: number, d: number, hour: number, minute: number, timeZone: string): Date;
export declare function isWeekendLocal(date: Date, timeZone: string): boolean;
export declare function nextRoundEndsAt(settings: GorWorldSettings, after: Date): Date;
export declare function isWorldDueForAdvance(row: GorWorldRow, now: Date): boolean;
export declare function advisoryLockKey(worldId: number): number;
//# sourceMappingURL=scheduleTime.d.ts.map