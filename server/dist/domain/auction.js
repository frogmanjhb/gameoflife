"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_AUCTION_NAME_LENGTH = exports.AUCTION_BID_INCREMENTS = void 0;
exports.isTownClass = isTownClass;
exports.isAuctionBidIncrement = isAuctionBidIncrement;
exports.sanitizeAuctionName = sanitizeAuctionName;
exports.parseStartingPrice = parseStartingPrice;
exports.nextBidAmount = nextBidAmount;
exports.AUCTION_BID_INCREMENTS = [1000, 5000, 10000, 50000];
exports.MAX_AUCTION_NAME_LENGTH = 200;
function isTownClass(value) {
    return value === '6A' || value === '6B' || value === '6C';
}
function isAuctionBidIncrement(value) {
    const n = typeof value === 'string' ? Number(value) : value;
    return exports.AUCTION_BID_INCREMENTS.includes(n);
}
function sanitizeAuctionName(name) {
    if (typeof name !== 'string')
        return null;
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > exports.MAX_AUCTION_NAME_LENGTH)
        return null;
    return trimmed;
}
function parseStartingPrice(value) {
    const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
    if (!Number.isFinite(n) || n < 0)
        return null;
    return Math.round(n * 100) / 100;
}
/** Next bid = current high (or starting price if none) + increment */
function nextBidAmount(currentHighOrStarting, increment) {
    return Math.round((currentHighOrStarting + increment) * 100) / 100;
}
//# sourceMappingURL=auction.js.map