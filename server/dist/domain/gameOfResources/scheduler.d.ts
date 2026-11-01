import type { PoolClient } from 'pg';
import type { GorWorldRow } from './types';
export type SchedulerTickResult = {
    scanned: number;
    advanced: number;
    scheduled: number;
    skipped: number;
    errors: number;
};
export declare function tryAdvanceScheduledWorld(client: PoolClient, worldId: number, now: Date): Promise<'advanced' | 'scheduled' | 'skipped' | 'busy'>;
export declare function runGameOfResourcesSchedulerTick(now?: Date): Promise<SchedulerTickResult>;
export declare function startGameOfResourcesScheduler(options?: {
    intervalMs?: number;
}): void;
export declare function stopGameOfResourcesSchedulerForTests(): void;
export declare function ensureWorldSchedule(client: PoolClient, row: GorWorldRow, now: Date): Promise<GorWorldRow>;
//# sourceMappingURL=scheduler.d.ts.map