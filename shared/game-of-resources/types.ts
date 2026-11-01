import type { CONFIG } from './config';

export type ProfessionId = keyof typeof CONFIG.professions;
export type InventoryItem = 'food' | 'wood' | 'stone' | 'tools';
export type Rng = () => number;

export type Citizen = {
  id: string;
  name: string;
  prof: ProfessionId;
  coins: number;
  inv: Record<InventoryItem, number>;
  ap: number;
  xp: number;
  hungry: boolean;
  apUsed: number;
  actions: number;
  contrib: number;
  reflections: Record<number, string>;
  /** Last round number this citizen took an action (for inactivity). */
  lastActiveRound?: number;
  /** Round number when this citizen last changed job (one change per round). */
  jobChangedRound?: number;
};

export type GameState = {
  schema: number;
  seq: number;
  round: { n: number; open: boolean; settled: number[] };
  treasury: number;
  env: Record<string, number>;
  harvest: Record<string, number>;
  minedTotal: number;
  citizens: Citizen[];
  activeId: string | null;
  listings: Array<{ id: string; sellerId: string; item: InventoryItem; qty: number; price: number }>;
  projects: Record<string, { mat: Record<string, number>; labour: number; done: boolean }>;
  log: Array<Record<string, unknown>>;
  stats: Record<string, unknown> | null;
  summaries: Record<number, unknown>;
  lastSummary: number | null;
  land: Record<number, { type: string; dev?: boolean; under?: string }>;
  works: { reclaim: unknown; link: unknown };
  tileHealth: Record<string, number>;
  rested: Record<string, boolean>;
};
