import type { PoolClient } from 'pg';
import { citizenIdForUser } from './worldRepository';
import type { LockedWorldBundle } from './types';
import { RULES } from './shared';

export type BridgeSettings = {
  bankBridgeEnabled?: boolean;
  bankBridgeCoinsPerRand?: number;
};

export function bridgeSettingsFromWorld(settings: BridgeSettings) {
  return {
    enabled: !!settings.bankBridgeEnabled,
    coinsPerRand: Math.max(1, Math.floor(settings.bankBridgeCoinsPerRand ?? 10)),
  };
}

export function bankRandFromCoins(coins: number, coinsPerRand: number): number {
  const wholeCoins = Math.floor(coins);
  const units = Math.floor(wholeCoins / coinsPerRand);
  return units;
}

export function citizenCoins(bundle: LockedWorldBundle, userId: number): number {
  const cid = citizenIdForUser(userId);
  const c = bundle.state.citizens.find((x) => x.id === cid);
  return c?.coins ?? 0;
}

export function deductGameCoins(
  bundle: LockedWorldBundle,
  userId: number,
  amount: number
): { ok: boolean; reason?: string; state?: typeof bundle.state } {
  const cid = citizenIdForUser(userId);
  const c = RULES.citizen(bundle.state, cid);
  if (!c) return { ok: false, reason: 'You are not a citizen in this world yet.' };
  if (c.coins < amount) return { ok: false, reason: 'You do not have enough game coins.' };
  const n = RULES.clone(bundle.state) as typeof bundle.state;
  const citizen = RULES.citizen(n, cid);
  citizen.coins -= amount;
  return { ok: true, state: n };
}

export async function countPendingRedemptionsForUser(
  client: PoolClient,
  worldId: number,
  userId: number
): Promise<number> {
  const res = await client.query(
    `SELECT COALESCE(SUM(game_coins), 0)::int AS total
     FROM gor_coin_redemptions
     WHERE world_id = $1 AND user_id = $2 AND status = 'pending'`,
    [worldId, userId]
  );
  return Number(res.rows[0]?.total ?? 0);
}
