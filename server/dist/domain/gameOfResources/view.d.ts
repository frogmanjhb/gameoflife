import type { GameState, InventoryItem } from './shared';
import type { GorWorldRow, GorWorldSettings } from './types';
export type PublicCitizenView = {
    id: string;
    userId: number;
    name: string;
    profession: string;
    professionName: string;
    hungry: boolean;
    level: number;
    actions: number;
    contrib: number;
};
export type SelfCitizenView = PublicCitizenView & {
    coins: number;
    inv: Record<InventoryItem, number>;
    ap: number;
    apUsed: number;
    xp: number;
    jobChangedThisRound: boolean;
    jobChangeXpCost: number;
    jobChangeXpAfter: number | null;
    levelAfterJobChange: number | null;
};
export type GorListingView = {
    id: string;
    sellerId: string;
    sellerName: string;
    item: InventoryItem;
    qty: number;
    price: number;
};
export type GorLogView = {
    id: number;
    round: number;
    citizenId: string | null;
    name: string;
    professionName: string;
    kind: string;
    text: string;
};
export type GorWorldPlayerView = {
    version: number;
    worldId: number;
    seed: number;
    settings: GorWorldSettings;
    round: {
        n: number;
        open: boolean;
        settled: number[];
        startedAt: string | null;
        endsAt: string | null;
    };
    treasury: number;
    env: GameState['env'];
    projects: GameState['projects'];
    land: GameState['land'];
    works: GameState['works'];
    tileHealth: GameState['tileHealth'];
    listings: GorListingView[];
    log: GorLogView[];
    citizens: PublicCitizenView[];
    self: SelfCitizenView | null;
    summaries: GameState['summaries'];
    lastSummary: number | null;
};
export type BuildViewInput = {
    row: GorWorldRow;
    state: GameState;
    viewerUserId: number;
    displayNameForUser: (userId: number) => string;
    useNicknames: boolean;
};
export declare function buildPlayerView(input: BuildViewInput): GorWorldPlayerView;
/** Strip private fields from full state for non-owner clients (API safety net). */
export declare function redactStateForUser(state: GameState, viewerUserId: number): GameState;
//# sourceMappingURL=view.d.ts.map