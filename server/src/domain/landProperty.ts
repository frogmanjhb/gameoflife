export const WEEKLY_APPRECIATION_RATE = 0.01;
export const WEEKLY_RENTAL_YIELD = 0.05;

export type TownClass = '6A' | '6B' | '6C';

export function isTownClass(value: unknown): value is TownClass {
  return value === '6A' || value === '6B' || value === '6C';
}

export function getCompleteWeeksBetween(
  startIso: string | Date | null | undefined,
  endIso: string | Date
): number {
  if (!startIso) return 0;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
}

export function getCompleteWeeksSince(
  dateIso: string | Date | null | undefined,
  asOf: string | Date = new Date()
): number {
  return getCompleteWeeksBetween(dateIso, asOf);
}

export function calculateAppreciatedValue(
  purchasePrice: number,
  purchasedAt: string,
  asOf: string | Date = new Date()
): number {
  const weeks = getCompleteWeeksSince(purchasedAt, asOf);
  if (weeks === 0) return Math.round(purchasePrice);
  const value = purchasePrice * Math.pow(1 + WEEKLY_APPRECIATION_RATE, weeks);
  return Math.round(value);
}

export function calculateWeeklyRent(currentValue: number): number {
  return Math.round(currentValue * WEEKLY_RENTAL_YIELD);
}

export function getRentWeeksDue(
  purchasedAt: string | null | undefined,
  lastRentCollectedAt: string | null | undefined,
  asOf: string | Date = new Date()
): number {
  if (!purchasedAt) return 0;
  const anchor = lastRentCollectedAt || purchasedAt;
  return getCompleteWeeksBetween(anchor, asOf);
}

export function canCollectWeeklyRent(
  purchasedAt: string | null | undefined,
  lastRentCollectedAt: string | null | undefined
): boolean {
  return getRentWeeksDue(purchasedAt, lastRentCollectedAt) >= 1;
}

/** Sum weekly rent (5% of appreciated value) for each complete week since last collection. */
export function calculateAccruedRent(
  purchasePrice: number,
  purchasedAt: string,
  lastRentCollectedAt: string | null | undefined,
  asOf: string | Date = new Date()
): number {
  const weeksDue = getRentWeeksDue(purchasedAt, lastRentCollectedAt, asOf);
  if (weeksDue < 1) return 0;

  const totalWeeksOwnedNow = getCompleteWeeksSince(purchasedAt, asOf);
  let totalRent = 0;
  for (let i = 1; i <= weeksDue; i++) {
    const weeksOwnedForRent = totalWeeksOwnedNow - weeksDue + i;
    if (weeksOwnedForRent < 1) continue;
    const valueForWeek = Math.round(
      purchasePrice * Math.pow(1 + WEEKLY_APPRECIATION_RATE, weeksOwnedForRent)
    );
    totalRent += calculateWeeklyRent(valueForWeek);
  }
  return totalRent;
}

export interface LandRentCollectionEvent {
  amount: number;
  collectedAt: string | Date;
}

export interface LandRentReplayResult {
  totalExpected: number;
  totalPaid: number;
  shortfall: number;
  correctedLastRentCollectedAt: string | null;
}

/** Replay rent collections under corrected multi-week rules (for backpay). */
export function replayLandRentCollections(
  purchasePrice: number,
  purchasedAt: string,
  collections: LandRentCollectionEvent[]
): LandRentReplayResult {
  const sorted = [...collections].sort(
    (a, b) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime()
  );

  let rentAnchor: string | null = null;
  let totalExpected = 0;
  let totalPaid = 0;

  for (const event of sorted) {
    const paid = Number(event.amount) || 0;
    totalPaid += paid;

    const weeksDue = getRentWeeksDue(purchasedAt, rentAnchor, event.collectedAt);
    if (weeksDue < 1) continue;

    totalExpected += calculateAccruedRent(purchasePrice, purchasedAt, rentAnchor, event.collectedAt);
    rentAnchor = advanceRentCollectionAnchor(purchasedAt, rentAnchor, weeksDue).toISOString();
  }

  return {
    totalExpected,
    totalPaid,
    shortfall: Math.max(0, Math.round(totalExpected - totalPaid)),
    correctedLastRentCollectedAt: rentAnchor,
  };
}

export function advanceRentCollectionAnchor(
  purchasedAt: string,
  lastRentCollectedAt: string | null | undefined,
  weeksDue: number
): Date {
  const anchor = lastRentCollectedAt || purchasedAt;
  const anchorMs = new Date(anchor).getTime();
  return new Date(anchorMs + weeksDue * 7 * 24 * 60 * 60 * 1000);
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
  const rentWeeksDue = getRentWeeksDue(purchasedAt, parcel.last_rent_collected_at ?? null);
  const canCollectRent = rentWeeksDue >= 1;
  const accruedRent = calculateAccruedRent(
    purchasePrice,
    purchasedAt,
    parcel.last_rent_collected_at ?? null
  );
  const weeksOwned = getCompleteWeeksSince(purchasedAt);

  return {
    ...parcel,
    purchase_price: purchasePrice,
    current_value: currentValue,
    value: currentValue,
    weekly_rent: weeklyRent,
    rent_weeks_due: rentWeeksDue,
    accrued_rent: accruedRent,
    can_collect_rent: canCollectRent,
    weeks_owned: weeksOwned,
    appreciation: currentValue - purchasePrice,
  };
}
