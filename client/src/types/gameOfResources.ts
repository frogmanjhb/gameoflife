import type { GameState, InventoryItem, ProfessionId } from '@game-of-resources';

export type GorAvatar = {
  skin: string;
  clothes: string | null;
  ring: string;
  pos: { fx: number; fz: number } | null;
};

export type GorPublicCitizen = {
  id: string;
  userId: number;
  name: string;
  profession: string;
  professionName: string;
  hungry: boolean;
  level: number;
  actions: number;
  contrib: number;
  avatar: GorAvatar;
};

export type GorSelfCitizen = GorPublicCitizen & {
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

export type GorWorldSettings = {
  roundLengthHours?: number;
  settleTime?: string;
  timezone?: string;
  weekendPause?: boolean;
  automationPaused?: boolean;
  useNicknames?: boolean;
  jobChange?: { xpCost?: number; perRound?: number; xpSource?: 'game' | 'civiclab' };
  bankBridgeEnabled?: boolean;
  bankBridgeCoinsPerRand?: number;
};

export type GorPlayerView = {
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
  citizens: GorPublicCitizen[];
  self: GorSelfCitizen | null;
  summaries: GameState['summaries'];
  lastSummary: number | null;
  firstVisit?: boolean;
  assignedProfession?: ProfessionId;
  assignedProfessionName?: string;
  unchanged?: boolean;
  event?: Record<string, unknown> | null;
};

export type GorStatusResponse = GorPlayerView;

export type GorActionEvent = Record<string, unknown> | null;
