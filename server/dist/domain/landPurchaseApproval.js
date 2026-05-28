"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_PURCHASE_STATUSES = exports.ENGINEER_APPROVAL_FEE_RATE = void 0;
exports.hasArchitectJob = hasArchitectJob;
exports.hasCivilEngineerJob = hasCivilEngineerJob;
exports.isLandEngineerJob = isLandEngineerJob;
exports.calculateTotalEngineerFee = calculateTotalEngineerFee;
exports.calculateEngineerFeeShare = calculateEngineerFeeShare;
exports.calculateTotalPurchaseCost = calculateTotalPurchaseCost;
exports.ENGINEER_APPROVAL_FEE_RATE = 0.10;
exports.ACTIVE_PURCHASE_STATUSES = ['pending_engineer', 'pending_teacher'];
function hasArchitectJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('architect');
}
function hasCivilEngineerJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('civil engineer');
}
function isLandEngineerJob(jobName) {
    return hasArchitectJob(jobName) || hasCivilEngineerJob(jobName);
}
function calculateTotalEngineerFee(offeredPrice) {
    return Math.round(offeredPrice * exports.ENGINEER_APPROVAL_FEE_RATE);
}
function calculateEngineerFeeShare(offeredPrice, approverCount) {
    if (approverCount <= 0)
        return 0;
    return Math.round(calculateTotalEngineerFee(offeredPrice) / approverCount);
}
function calculateTotalPurchaseCost(offeredPrice) {
    return offeredPrice + calculateTotalEngineerFee(offeredPrice);
}
//# sourceMappingURL=landPurchaseApproval.js.map