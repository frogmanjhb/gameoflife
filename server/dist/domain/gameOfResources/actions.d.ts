import type { PoolClient } from 'pg';
import type { GameState, ProfessionId } from './shared';
import type { LockedWorldBundle } from './types';
import type { GorWorldSettings } from './types';
export type GameplayResult = {
    ok: boolean;
    reason?: string;
    state?: GameState;
    event?: Record<string, unknown>;
    summary?: Record<string, unknown>;
};
export declare function validateActionOpt(type: string, opt: Record<string, unknown>): string | null;
export declare function runDoAction(bundle: LockedWorldBundle, userId: number, actionId: string, opt?: Record<string, unknown>): GameplayResult;
export declare function runMarketAction(bundle: LockedWorldBundle, userId: number, kind: 'storeBuy' | 'storeSell' | 'list' | 'cancel' | 'buy', payload: Record<string, unknown>): GameplayResult;
export declare function runStartWork(bundle: LockedWorldBundle, userId: number, kind: 'reclaim' | 'link', cellId: number): GameplayResult;
export declare function runJobChange(client: PoolClient, bundle: LockedWorldBundle, userId: number, profession: ProfessionId, settings: GorWorldSettings): Promise<GameplayResult>;
export declare function runSaveReflection(client: PoolClient, bundle: LockedWorldBundle, userId: number, round: number, text: string): Promise<GameplayResult>;
export declare function runTeacherSetProfession(bundle: LockedWorldBundle, targetUserId: number, profession: ProfessionId): GameplayResult;
export declare function runTeacherRound(bundle: LockedWorldBundle, op: 'open' | 'close' | 'advance'): GameplayResult;
export declare function persistAdvanceSummary(client: PoolClient, bundle: LockedWorldBundle, summary: Record<string, unknown> | undefined): Promise<void>;
export declare function runRuleChecks(): {
    name: string;
    pass: boolean;
    err?: string;
}[];
//# sourceMappingURL=actions.d.ts.map