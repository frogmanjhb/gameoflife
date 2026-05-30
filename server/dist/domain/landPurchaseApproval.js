"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_PURCHASE_STATUSES = exports.CIVIL_ENGINEER_LAND_REVIEW_XP = exports.LAND_ENGINEER_REVIEW_XP = exports.FM_LAND_REVIEW_XP = exports.TOTAL_PROFESSIONAL_FEE_RATE = void 0;
exports.hasArchitectJob = hasArchitectJob;
exports.hasCivilEngineerJob = hasCivilEngineerJob;
exports.isLandEngineerJob = isLandEngineerJob;
exports.calculateTotalProfessionalFee = calculateTotalProfessionalFee;
exports.allocateProfessionalFees = allocateProfessionalFees;
exports.calculateFmFee = calculateFmFee;
exports.calculateTotalEngineerFee = calculateTotalEngineerFee;
exports.calculateEngineerFeeShare = calculateEngineerFeeShare;
exports.calculateTotalPurchaseCost = calculateTotalPurchaseCost;
exports.buildPurchaseCostBreakdown = buildPurchaseCostBreakdown;
/** Total professional fees (FM + architects + civil engineers) = 5% of plot price */
exports.TOTAL_PROFESSIONAL_FEE_RATE = 0.05;
exports.FM_LAND_REVIEW_XP = 10;
exports.LAND_ENGINEER_REVIEW_XP = 50;
/** @deprecated Use LAND_ENGINEER_REVIEW_XP */
exports.CIVIL_ENGINEER_LAND_REVIEW_XP = exports.LAND_ENGINEER_REVIEW_XP;
exports.ACTIVE_PURCHASE_STATUSES = [
    'pending_fm',
    'pending_engineer',
    'pending_teacher',
];
function hasArchitectJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('architect');
}
function hasCivilEngineerJob(jobName) {
    return (jobName || '').toLowerCase().trim().includes('civil engineer');
}
function isLandEngineerJob(jobName) {
    return hasArchitectJob(jobName) || hasCivilEngineerJob(jobName);
}
function calculateTotalProfessionalFee(offeredPrice) {
    return Math.round(offeredPrice * exports.TOTAL_PROFESSIONAL_FEE_RATE);
}
function allocateProfessionalFees(offeredPrice, engineerCount) {
    const professional_fee_total = calculateTotalProfessionalFee(offeredPrice);
    if (engineerCount <= 0) {
        return {
            professional_fee_total,
            fm_fee: professional_fee_total,
            engineer_fee_total: 0,
            engineer_fee_per_approver: 0,
        };
    }
    const parties = 1 + engineerCount;
    const fm_fee = Math.floor(professional_fee_total / parties);
    const engineer_fee_total = professional_fee_total - fm_fee;
    const engineer_fee_per_approver = Math.floor(engineer_fee_total / engineerCount);
    return {
        professional_fee_total,
        fm_fee,
        engineer_fee_total,
        engineer_fee_per_approver,
    };
}
function calculateFmFee(offeredPrice, engineerCount = 0) {
    return allocateProfessionalFees(offeredPrice, engineerCount).fm_fee;
}
function calculateTotalEngineerFee(offeredPrice, engineerCount) {
    return allocateProfessionalFees(offeredPrice, engineerCount).engineer_fee_total;
}
function calculateEngineerFeeShare(offeredPrice, approverCount) {
    if (approverCount <= 0)
        return 0;
    return allocateProfessionalFees(offeredPrice, approverCount).engineer_fee_per_approver;
}
function calculateTotalPurchaseCost(offeredPrice, engineerCount = 0) {
    return offeredPrice + calculateTotalProfessionalFee(offeredPrice);
}
function buildPurchaseCostBreakdown(offeredPrice, engineerCount, buyerBalance) {
    const plot_price = offeredPrice;
    const allocation = allocateProfessionalFees(offeredPrice, engineerCount);
    const total_required = calculateTotalPurchaseCost(offeredPrice);
    return {
        plot_price,
        professional_fee_total: allocation.professional_fee_total,
        fm_fee: allocation.fm_fee,
        engineer_fee_total: allocation.engineer_fee_total,
        engineer_fee_per_approver: allocation.engineer_fee_per_approver,
        total_required,
        buyer_balance: buyerBalance,
        can_afford: buyerBalance >= total_required,
    };
}
//# sourceMappingURL=landPurchaseApproval.js.map