export const AUCTION_BID_INCREMENTS = [1000, 5000, 10000, 50000] as const;
export type AuctionBidIncrement = (typeof AUCTION_BID_INCREMENTS)[number];

export type TownClass = '6A' | '6B' | '6C';
export type AuctionStatus = 'draft' | 'live' | 'ended';

export const MAX_AUCTION_NAME_LENGTH = 200;

export function isTownClass(value: unknown): value is TownClass {
  return value === '6A' || value === '6B' || value === '6C';
}

export function isAuctionBidIncrement(value: unknown): value is AuctionBidIncrement {
  const n = typeof value === 'string' ? Number(value) : value;
  return AUCTION_BID_INCREMENTS.includes(n as AuctionBidIncrement);
}

export function sanitizeAuctionName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > MAX_AUCTION_NAME_LENGTH) return null;
  return trimmed;
}

export function parseStartingPrice(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

/** Next bid = current high (or starting price if none) + increment */
export function nextBidAmount(currentHighOrStarting: number, increment: AuctionBidIncrement): number {
  return Math.round((currentHighOrStarting + increment) * 100) / 100;
}
