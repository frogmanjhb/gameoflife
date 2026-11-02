export type RuleResult = {
    ok: boolean;
    reason?: string;
    state: unknown;
    event?: Record<string, unknown>;
    summary?: Record<string, unknown>;
};
export declare const RULES: {
    ITEMS: string[];
    ENV_KEYS: string[];
    ENV_NAMES: {
        forest: string;
        soil: string;
        water: string;
        pollution: string;
        habitat: string;
    };
    TILES: any[];
    TILE: any;
    clone: (o: any) => any;
    activeTiles: (s: any) => any[];
    tilesOfType: (s: any, type: any) => any[];
    citizen: (s: any, id: any) => any;
    levelFor: (xp: any) => number;
    waterBand: (w: any) => {
        min: number;
        key: string;
        name: string;
        mult: number;
        words: string;
        colour: string;
    };
    farmYield: (s: any) => number;
    treesOn: (s: any, key: any) => number;
    storeBuyPrice: (s: any, item: any) => number;
    storeSellPrice: (s: any, item: any) => number;
    gaugeStatus: (key: any, v: any) => "good" | "warn" | "bad";
    projectProgress: (s: any, k: any) => {
        mat: number;
        labour: number;
        combined: number;
        stage: number;
    };
    defaultState: (rng?: () => number) => {
        schema: number;
        seq: number;
        round: {
            n: number;
            open: boolean;
            settled: never[];
        };
        treasury: number;
        env: {
            forest: number;
            soil: number;
            water: number;
            pollution: number;
            habitat: number;
        };
        harvest: {};
        minedTotal: number;
        citizens: never[];
        activeId: null;
        listings: never[];
        projects: {};
        log: never[];
        stats: null;
        summaries: {};
        lastSummary: null;
        land: {};
        works: {
            reclaim: null;
            link: null;
        };
        tileHealth: {};
        rested: {};
    };
    isValidState: (s: any) => any;
    plan: (s: any, cid: any, id: any, opt?: {}) => {
        ok: boolean;
        reason: string;
        id: any;
        ap: any;
        gains: {};
        costs: {};
        env: {};
        coins: number;
        treasury: number;
        tiles: never[];
        tileKey: null;
        project: any;
        item: any;
        qty: number;
        note: string;
    };
    doAction: (s: any, cid: any, id: any, opt?: {}) => {
        ok: boolean;
        reason: string;
        state: any;
        event?: undefined;
    } | {
        ok: boolean;
        state: any;
        event: {
            citizenId: any;
            levelUp: boolean;
            completed: null;
            ok: boolean;
            reason: string;
            id: any;
            ap: any;
            gains: {};
            costs: {};
            env: {};
            coins: number;
            treasury: number;
            tiles: never[];
            tileKey: null;
            project: any;
            item: any;
            qty: number;
            note: string;
        };
        reason?: undefined;
    };
    storeBuy: (s: any, cid: any, item: any, qty?: number) => {
        ok: boolean;
        reason: string;
        state: any;
        event?: undefined;
    } | {
        ok: boolean;
        state: any;
        event: {
            citizenId: any;
            gains: {
                [x: number]: number;
            };
            coins: number;
        };
        reason?: undefined;
    };
    storeSell: (s: any, cid: any, item: any, qty?: number) => {
        ok: boolean;
        reason: string;
        state: any;
        event?: undefined;
    } | {
        ok: boolean;
        state: any;
        event: {
            citizenId: any;
            coins: number;
        };
        reason?: undefined;
    };
    createListing: (s: any, cid: any, item: any, qty: any, price: any) => {
        ok: boolean;
        reason: string;
        state: any;
        event?: undefined;
    } | {
        ok: boolean;
        state: any;
        event: {
            citizenId: any;
            listingId: string;
        };
        reason?: undefined;
    };
    cancelListing: (s: any, cid: any, lid: any) => {
        ok: boolean;
        reason: string;
        state: any;
        event?: undefined;
    } | {
        ok: boolean;
        state: any;
        event: {
            citizenId: any;
        };
        reason?: undefined;
    };
    buyListing: (s: any, cid: any, lid: any, qty: any) => {
        ok: boolean;
        reason: string;
        state: any;
        event?: undefined;
    } | {
        ok: boolean;
        state: any;
        event: {
            citizenId: any;
            gains: {
                [x: number]: any;
            };
            coins: number;
        };
        reason?: undefined;
    };
    saleSplit: (total: any) => {
        total: any;
        tax: number;
        seller: number;
    };
    addCitizen: (s: any, prof: any, rng?: () => number) => {
        ok: boolean;
        reason: string;
        state: any;
    } | {
        ok: boolean;
        state: any;
        reason?: undefined;
    };
    setActive: (s: any, cid: any) => {
        ok: boolean;
        reason: string;
        state: any;
    } | {
        ok: boolean;
        state: any;
        reason?: undefined;
    };
    saveReflection: (s: any, cid: any, round: any, text: any) => {
        ok: boolean;
        reason: string;
        state: any;
    } | {
        ok: boolean;
        state: any;
        reason?: undefined;
    };
    openRound: (s: any) => {
        ok: boolean;
        state: any;
    };
    closeRound: (s: any) => {
        ok: boolean;
        state: any;
    };
    settleRound: (s: any) => {
        ok: boolean;
        reason: string;
        state: any;
        summary?: undefined;
    } | {
        ok: boolean;
        state: any;
        summary: {
            round: any;
            before: any;
            after: any;
            treasuryBefore: any;
            treasuryAfter: any;
            produced: any;
            traded: any;
            projects: {
                key: string;
                before: any;
                after: number;
                done: any;
            }[];
            hungry: any[];
            nightChange: {
                forest: number;
                soil: number;
                water: number;
                pollution: number;
            };
        };
        reason?: undefined;
    };
    advanceRound: (s: any) => {
        ok: boolean;
        reason: string;
        state: any;
        summary?: undefined;
    } | {
        ok: boolean;
        state: any;
        summary: {
            round: any;
            before: any;
            after: any;
            treasuryBefore: any;
            treasuryAfter: any;
            produced: any;
            traded: any;
            projects: {
                key: string;
                before: any;
                after: number;
                done: any;
            }[];
            hungry: any[];
            nightChange: {
                forest: number;
                soil: number;
                water: number;
                pollution: number;
            };
        } | undefined;
    };
    resetWorld: (rng: any) => {
        ok: boolean;
        state: {
            schema: number;
            seq: number;
            round: {
                n: number;
                open: boolean;
                settled: never[];
            };
            treasury: number;
            env: {
                forest: number;
                soil: number;
                water: number;
                pollution: number;
                habitat: number;
            };
            harvest: {};
            minedTotal: number;
            citizens: never[];
            activeId: null;
            listings: never[];
            projects: {};
            log: never[];
            stats: null;
            summaries: {};
            lastSummary: null;
            land: {};
            works: {
                reclaim: null;
                link: null;
            };
            tileHealth: {};
            rested: {};
        };
    };
    health: (s: any, key: any) => any;
    tileYield: (base: any, h: any) => any;
    habLevel: (s: any) => "good" | "warn" | "bad";
    habPen: (s: any, kind: any) => any;
    workplaces: (s: any, type: any) => any[];
    fishable: (s: any, id: any, vl: any) => boolean;
    cellKey: (id: any) => string;
    cellIdOf: (key: any) => number | null;
    cellType: (s: any, id: any) => any;
    isLand: (type: any) => boolean;
    isSea: (type: any) => boolean;
    villageLand: (s: any) => Set<unknown>;
    seaStaysOpen: (s: any, without: any) => boolean;
    workCheck: (s: any, kind: any, id: any) => "" | "Choose a tile first." | "This water is kept for the Stone Bridge." | "Choose water next to your land." | "This ocean is too deep to fill. Choose shallow ocean." | "Only shallow ocean can be turned into land." | "New land must touch land your village already uses." | "Finish the land reclamation that has already started." | "This would cut off part of the ocean. Every ocean must stay joined to the open sea." | "Island bridges are built over water: ocean, a river or a lake." | "A bridge must start from land your village already uses." | "There is no new land to reach on the far side of this water." | "Finish the island bridge that has already started.";
    startWork: (s: any, cid: any, kind: any, id: any) => {
        ok: boolean;
        reason: string;
        state: any;
        event?: undefined;
    } | {
        ok: boolean;
        state: any;
        event: {
            citizenId: any;
            tileKey: string;
        };
        reason?: undefined;
    };
    workProgress: (s: any, kind: any) => number;
    devCounts: (s: any) => {
        farm: number;
        forest: number;
        quarry: number;
        houses: number;
    };
    devBonus: (s: any) => {
        food: number;
        forest: number;
        stone: number;
        pollution: number;
        coins: number;
        counts: {
            farm: number;
            forest: number;
            quarry: number;
            houses: number;
        };
    };
    upgradeState: (s: any) => any;
    isCitizenActive: (c: any, roundN: any) => boolean;
    autoAssignProfession: (s: any, rng?: () => number) => string;
    changeJob: (s: any, cid: any, profession: any, opts: any) => {
        ok: boolean;
        reason: string;
        state: any;
        event?: undefined;
    } | {
        ok: boolean;
        state: any;
        event: {
            citizenId: any;
            from: any;
            to: any;
            xpSpent: any;
            xpSource: any;
        };
        reason?: undefined;
    };
    teacherSetProfession: (s: any, cid: any, profession: any) => {
        ok: boolean;
        reason: string;
        state: any;
        event?: undefined;
    } | {
        ok: boolean;
        state: any;
        event: {
            citizenId: any;
            from: any;
            to: any;
            teacher: boolean;
        };
        reason?: undefined;
    };
};
//# sourceMappingURL=rules.d.ts.map