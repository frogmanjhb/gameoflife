"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEEKLY_RENTAL_YIELD = exports.WEEKLY_APPRECIATION_RATE = void 0;
exports.isTownClass = isTownClass;
exports.getCompleteWeeksBetween = getCompleteWeeksBetween;
exports.getCompleteWeeksSince = getCompleteWeeksSince;
exports.calculateAppreciatedValue = calculateAppreciatedValue;
exports.calculateWeeklyRent = calculateWeeklyRent;
exports.getRentWeeksDue = getRentWeeksDue;
exports.canCollectWeeklyRent = canCollectWeeklyRent;
exports.calculateAccruedRent = calculateAccruedRent;
exports.replayLandRentCollections = replayLandRentCollections;
exports.advanceRentCollectionAnchor = advanceRentCollectionAnchor;
exports.hasFinancialManagerJob = hasFinancialManagerJob;
exports.enrichOwnedParcel = enrichOwnedParcel;
exports.WEEKLY_APPRECIATION_RATE = 0.01;
exports.WEEKLY_RENTAL_YIELD = 0.05;
function isTownClass(value) {
    return value === '6A' || value === '6B' || value === '6C';
}
function getCompleteWeeksBetween(startIso, endIso) {
    if (!startIso)
        return 0;
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
        return 0;
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
}
function getCompleteWeeksSince(dateIso, asOf = new Date()) {
    return getCompleteWeeksBetween(dateIso, asOf);
}
function calculateAppreciatedValue(purchasePrice, purchasedAt, asOf = new Date()) {
    const weeks = getCompleteWeeksSince(purchasedAt, asOf);
    if (weeks === 0)
        return Math.round(purchasePrice);
    const value = purchasePrice * Math.pow(1 + exports.WEEKLY_APPRECIATION_RATE, weeks);
    return Math.round(value);
}
function calculateWeeklyRent(currentValue) {
    return Math.round(currentValue * exports.WEEKLY_RENTAL_YIELD);
}
function getRentWeeksDue(purchasedAt, lastRentCollectedAt, asOf = new Date()) {
    if (!purchasedAt)
        return 0;
    const anchor = lastRentCollectedAt || purchasedAt;
    return getCompleteWeeksBetween(anchor, asOf);
}
function canCollectWeeklyRent(purchasedAt, lastRentCollectedAt) {
    return getRentWeeksDue(purchasedAt, lastRentCollectedAt) >= 1;
}
/** Sum weekly rent (5% of appreciated value) for each complete week since last collection. */
function calculateAccruedRent(purchasePrice, purchasedAt, lastRentCollectedAt, asOf = new Date()) {
    const weeksDue = getRentWeeksDue(purchasedAt, lastRentCollectedAt, asOf);
    if (weeksDue < 1)
        return 0;
    const totalWeeksOwnedNow = getCompleteWeeksSince(purchasedAt, asOf);
    let totalRent = 0;
    for (let i = 1; i <= weeksDue; i++) {
        const weeksOwnedForRent = totalWeeksOwnedNow - weeksDue + i;
        if (weeksOwnedForRent < 1)
            continue;
        const valueForWeek = Math.round(purchasePrice * Math.pow(1 + exports.WEEKLY_APPRECIATION_RATE, weeksOwnedForRent));
        totalRent += calculateWeeklyRent(valueForWeek);
    }
    return totalRent;
}
/** Replay rent collections under corrected multi-week rules (for backpay). */
function replayLandRentCollections(purchasePrice, purchasedAt, collections) {
    const sorted = [...collections].sort((a, b) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime());
    let rentAnchor = null;
    let totalExpected = 0;
    let totalPaid = 0;
    for (const event of sorted) {
        const paid = Number(event.amount) || 0;
        totalPaid += paid;
        const weeksDue = getRentWeeksDue(purchasedAt, rentAnchor, event.collectedAt);
        if (weeksDue < 1)
            continue;
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
function advanceRentCollectionAnchor(purchasedAt, lastRentCollectedAt, weeksDue) {
    const anchor = lastRentCollectedAt || purchasedAt;
    const anchorMs = new Date(anchor).getTime();
    return new Date(anchorMs + weeksDue * 7 * 24 * 60 * 60 * 1000);
}
function hasFinancialManagerJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('financial manager');
}
function enrichOwnedParcel(parcel) {
    const purchasePrice = Number(parcel.purchase_price ?? parcel.value) || 0;
    const purchasedAt = parcel.purchased_at || new Date().toISOString();
    const currentValue = calculateAppreciatedValue(purchasePrice, purchasedAt);
    const weeklyRent = calculateWeeklyRent(currentValue);
    const rentWeeksDue = getRentWeeksDue(purchasedAt, parcel.last_rent_collected_at ?? null);
    const canCollectRent = rentWeeksDue >= 1;
    const accruedRent = calculateAccruedRent(purchasePrice, purchasedAt, parcel.last_rent_collected_at ?? null);
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
//# sourceMappingURL=landProperty.js.map