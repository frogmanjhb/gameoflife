import type { GameState, InventoryItem, ProfessionId } from './shared';

export type TownClass = '6A' | '6B' | '6C';

export type GorWorldSettings = {
  roundLengthHours?: number;
  settleTime?: string;
  timezone?: string;
  weekendPause?: boolean;
  automationPaused?: boolean;
  useNicknames?: boolean;
  jobChange?: {
    xpCost?: number;
    perRound?: number;
    xpSource?: 'game' | 'civiclab';
  };
  bankBridgeEnabled?: boolean;
  /** Whole game coins exchanged for R1 when the teacher approves a conversion. Default 10. */
  bankBridgeCoinsPerRand?: number;
};

export type GorWorldRow = {
  id: number;
  school_id: number;
  town_class: TownClass;
  seed: number;
  seq: number;
  round_number: number;
  round_open: boolean;
  round_started_at: Date | null;
  round_ends_at: Date | null;
  paused: boolean;
  treasury: number;
  env: Record<string, number>;
  mined_total: number;
  projects: GameState['projects'];
  land: Record<string, unknown>;
  works: GameState['works'];
  harvest: Record<string, number>;
  tile_health: Record<string, number>;
  rested: Record<string, boolean>;
  stats: Record<string, unknown> | null;
  settled_rounds: number[];
  settings: GorWorldSettings;
  version: number;
};

export type GorCitizenRow = {
  id: number;
  world_id: number;
  user_id: number;
  profession: ProfessionId;
  nickname: string | null;
  coins: number;
  food: number;
  wood: number;
  stone: number;
  tools: number;
  ap: number;
  xp: number;
  hungry: boolean;
  ap_used: number;
  actions: number;
  contrib: number;
  reflections: Record<string, string>;
  last_active_round: number | null;
  job_changed_round: number | null;
  avatar: Record<string, unknown> | null;
};

export type GorListingRow = {
  id: number;
  world_id: number;
  listing_key: string;
  seller_user_id: number;
  item: InventoryItem;
  qty: number;
  price: number;
};

export type GorLogRow = {
  id: number;
  world_id: number;
  round_number: number;
  citizen_user_id: number | null;
  kind: string;
  text: string;
  seq: number;
};

export type LockedWorldBundle = {
  row: GorWorldRow;
  state: GameState;
  citizenRows: GorCitizenRow[];
  userIdToCitizenRowId: Map<number, number>;
};

export const DEFAULT_GOR_SETTINGS: GorWorldSettings = {
  roundLengthHours: 24,
  settleTime: '06:00',
  timezone: 'Africa/Johannesburg',
  weekendPause: true,
  automationPaused: false,
  useNicknames: false,
  jobChange: {
    xpCost: 30,
    perRound: 1,
    xpSource: 'game',
  },
  bankBridgeEnabled: false,
  bankBridgeCoinsPerRand: 10,
};
