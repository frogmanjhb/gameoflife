export const WEEKLY_APPRECIATION_RATE = 0.01;
export const WEEKLY_RENTAL_YIELD = 0.05;

export type TownClass = '6A' | '6B' | '6C';

export function isTownClass(value: unknown): value is TownClass {
  return value === '6A' || value === '6B' || value === '6C';
}

export function getCompleteWeeksSince(dateIso: string | Date | null | undefined): number {
  if (!dateIso) return 0;
  const start = new Date(dateIso);
  if (Number.isNaN(start.getTime())) return 0;
  const diffMs = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
}

export function calculateAppreciatedValue(purchasePrice: number, purchasedAt: string): number {
  const weeks = getCompleteWeeksSince(purchasedAt);
  if (weeks === 0) return Math.round(purchasePrice);
  const value = purchasePrice * Math.pow(1 + WEEKLY_APPRECIATION_RATE, weeks);
  return Math.round(value);
}

export function calculateWeeklyRent(currentValue: number): number {
  return Math.round(currentValue * WEEKLY_RENTAL_YIELD);
}

export function canCollectWeeklyRent(
  purchasedAt: string | null | undefined,
  lastRentCollectedAt: string | null | undefined
): boolean {
  if (!purchasedAt) return false;
  const anchor = lastRentCollectedAt || purchasedAt;
  return getCompleteWeeksSince(anchor) >= 1;
}

export function hasFinancialManagerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('financial manager');
}

export interface LandParcelRow {
  id: number;
  value: number | string;
  purchase_price?: number | string | null;
  purchased_at?: string | null;
  last_rent_collected_at?: string | null;
  owner_id?: number | null;
  biome_type: string;
  grid_code: string;
  town_class?: string;
  risk_level?: string;
  row_index?: number;
  col_index?: number;
}

export function enrichOwnedParcel(parcel: LandParcelRow) {
  const purchasePrice = Number(parcel.purchase_price ?? parcel.value) || 0;
  const purchasedAt = parcel.purchased_at || new Date().toISOString();
  const currentValue = calculateAppreciatedValue(purchasePrice, purchasedAt);
  const weeklyRent = calculateWeeklyRent(currentValue);
  const canCollectRent = canCollectWeeklyRent(purchasedAt, parcel.last_rent_collected_at ?? null);
  const weeksOwned = getCompleteWeeksSince(purchasedAt);

  return {
    ...parcel,
    purchase_price: purchasePrice,
    current_value: currentValue,
    value: currentValue,
    weekly_rent: weeklyRent,
    can_collect_rent: canCollectRent,
    weeks_owned: weeksOwned,
    appreciation: currentValue - purchasePrice,
  };
}
