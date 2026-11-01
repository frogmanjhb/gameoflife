import type { PoolClient } from 'pg';
import type { LockedWorldBundle } from './types';
export type BridgeSettings = {
    bankBridgeEnabled?: boolean;
    bankBridgeCoinsPerRand?: number;
};
export declare function bridgeSettingsFromWorld(settings: BridgeSettings): {
    enabled: boolean;
    coinsPerRand: number;
};
export declare function bankRandFromCoins(coins: number, coinsPerRand: number): number;
export declare function citizenCoins(bundle: LockedWorldBundle, userId: number): number;
export declare function deductGameCoins(bundle: LockedWorldBundle, userId: number, amount: number): {
    ok: boolean;
    reason?: string;
    state?: typeof bundle.state;
};
export declare function countPendingRedemptionsForUser(client: PoolClient, worldId: number, userId: number): Promise<number>;
//# sourceMappingURL=bankBridge.d.ts.map