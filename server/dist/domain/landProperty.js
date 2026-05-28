"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEEKLY_RENTAL_YIELD = exports.WEEKLY_APPRECIATION_RATE = void 0;
exports.isTownClass = isTownClass;
exports.getCompleteWeeksSince = getCompleteWeeksSince;
exports.calculateAppreciatedValue = calculateAppreciatedValue;
exports.calculateWeeklyRent = calculateWeeklyRent;
exports.canCollectWeeklyRent = canCollectWeeklyRent;
exports.hasFinancialManagerJob = hasFinancialManagerJob;
exports.enrichOwnedParcel = enrichOwnedParcel;
exports.WEEKLY_APPRECIATION_RATE = 0.01;
exports.WEEKLY_RENTAL_YIELD = 0.05;
function isTownClass(value) {
    return value === '6A' || value === '6B' || value === '6C';
}
function getCompleteWeeksSince(dateIso) {
    if (!dateIso)
        return 0;
    const start = new Date(dateIso);
    if (Number.isNaN(start.getTime()))
        return 0;
    const diffMs = Date.now() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
}
function calculateAppreciatedValue(purchasePrice, purchasedAt) {
    const weeks = getCompleteWeeksSince(purchasedAt);
    if (weeks === 0)
        return Math.round(purchasePrice);
    const value = purchasePrice * Math.pow(1 + exports.WEEKLY_APPRECIATION_RATE, weeks);
    return Math.round(value);
}
function calculateWeeklyRent(currentValue) {
    return Math.round(currentValue * exports.WEEKLY_RENTAL_YIELD);
}
function canCollectWeeklyRent(purchasedAt, lastRentCollectedAt) {
    if (!purchasedAt)
        return false;
    const anchor = lastRentCollectedAt || purchasedAt;
    return getCompleteWeeksSince(anchor) >= 1;
}
function hasFinancialManagerJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('financial manager');
}
function enrichOwnedParcel(parcel) {
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
//# sourceMappingURL=landProperty.js.map