import type { PoolClient } from 'pg';
import type { ProfessionId } from './shared';
import type { LockedWorldBundle, GorWorldRow } from './types';
import { buildPlayerView } from './view';
import type { TownClass } from './types';
import type { GameplayResult } from './actions';
export type StatusPayload = {
    view: ReturnType<typeof buildPlayerView>;
    firstVisit: boolean;
    assignedProfession?: ProfessionId;
    assignedProfessionName?: string;
};
export declare function withWorldTransaction<T>(schoolId: number, townClass: TownClass, fn: (client: PoolClient, bundle: LockedWorldBundle) => Promise<T>): Promise<T>;
export declare function ensureStudentCitizen(client: PoolClient, bundle: LockedWorldBundle, userId: number, displayName: string): Promise<{
    bundle: LockedWorldBundle;
    firstVisit: boolean;
    profession?: ProfessionId;
    dirty: boolean;
}>;
export declare function buildStatusForStudent(client: PoolClient, bundle: LockedWorldBundle, userId: number, displayName: string): Promise<StatusPayload>;
export declare function applyGameplayAndSave(client: PoolClient, bundle: LockedWorldBundle, userId: number, gameplay: GameplayResult, options?: {
    advanceSummary?: boolean;
    roundStartedAt?: Date;
    roundEndsAt?: Date;
}): Promise<{
    bundle: LockedWorldBundle;
    row: GorWorldRow;
}>;
export declare function saveBundleIfDirty(client: PoolClient, bundle: LockedWorldBundle): Promise<void>;
//# sourceMappingURL=worldSession.d.ts.map