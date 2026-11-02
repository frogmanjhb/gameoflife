import type { PoolClient } from 'pg';
import type { GameState, ProfessionId } from './shared';
import { type GorCitizenRow, type GorWorldRow, type LockedWorldBundle, type TownClass } from './types';
export declare function citizenIdForUser(userId: number): string;
export declare function userIdFromCitizenId(citizenId: string): number | null;
export declare function worldSeedForTown(schoolId: number, townClass: string): number;
export declare function createInitialGameState(seed: number): GameState;
export declare function lockWorldRow(client: PoolClient, schoolId: number, townClass: TownClass): Promise<GorWorldRow | null>;
export declare function loadLockedWorld(client: PoolClient, schoolId: number, townClass: TownClass): Promise<LockedWorldBundle | null>;
export declare function createWorld(client: PoolClient, schoolId: number, townClass: TownClass): Promise<LockedWorldBundle>;
export declare function getOrCreateWorldLocked(client: PoolClient, schoolId: number, townClass: TownClass): Promise<LockedWorldBundle>;
export type DisplayNameLookup = (userId: number) => string;
export declare function applyDisplayNamesToState(state: GameState, lookup: DisplayNameLookup, useNicknames: boolean): GameState;
export declare function ensureCitizen(client: PoolClient, bundle: LockedWorldBundle, userId: number, opts: {
    profession: ProfessionId;
    nickname?: string | null;
    displayName: string;
}): Promise<LockedWorldBundle>;
export type SaveWorldOptions = {
    expectedVersion: number;
    newLogFromSeq?: number;
    /** When set, UPDATE fails if round_number changed (scheduler / concurrent safety). */
    expectedRoundNumber?: number;
    roundStartedAt?: Date | null;
    roundEndsAt?: Date | null;
};
export declare function saveWorldState(client: PoolClient, bundle: LockedWorldBundle, state: GameState, options: SaveWorldOptions): Promise<GorWorldRow | null>;
export declare function loadLockedWorldById(client: PoolClient, worldId: number): Promise<LockedWorldBundle | null>;
export declare function updateWorldRoundSchedule(client: PoolClient, worldId: number, startedAt: Date, endsAt: Date): Promise<GorWorldRow>;
export declare function insertJobChangeAudit(client: PoolClient, worldId: number, citizenRowId: number, fromProf: string, toProf: string, xpSpent: number, xpSource: string, roundNumber: number): Promise<void>;
export declare function tablesReady(client: PoolClient): Promise<boolean>;
export declare function persistReflectionRow(client: PoolClient, citizenRowId: number, worldId: number, roundNumber: number, text: string): Promise<void>;
export declare function saveRoundSummaryRow(client: PoolClient, worldId: number, roundNumber: number, summary: Record<string, unknown>): Promise<void>;
export declare function updateWorldSettings(client: PoolClient, worldId: number, settings: GorWorldRow['settings'], expectedVersion: number, paused?: boolean): Promise<GorWorldRow>;
export declare function updateCitizenAvatar(client: PoolClient, worldId: number, userId: number, avatar: import('./avatar').GorAvatar): Promise<GorCitizenRow | null>;
export declare function resetWorldForTown(client: PoolClient, worldId: number): Promise<void>;
//# sourceMappingURL=worldRepository.d.ts.map