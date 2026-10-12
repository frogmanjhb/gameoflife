export declare const AUCTION_BID_INCREMENTS: readonly [1000, 5000, 10000, 50000];
export type AuctionBidIncrement = (typeof AUCTION_BID_INCREMENTS)[number];
export type TownClass = '6A' | '6B' | '6C';
export type AuctionStatus = 'draft' | 'live' | 'ended';
export declare const MAX_AUCTION_NAME_LENGTH = 200;
export declare function isTownClass(value: unknown): value is TownClass;
export declare function isAuctionBidIncrement(value: unknown): value is AuctionBidIncrement;
export declare function sanitizeAuctionName(name: unknown): string | null;
export declare function parseStartingPrice(value: unknown): number | null;
/** Next bid = current high (or starting price if none) + increment */
export declare function nextBidAmount(currentHighOrStarting: number, increment: AuctionBidIncrement): number;
//# sourceMappingURL=auction.d.ts.map