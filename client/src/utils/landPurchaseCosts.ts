/** Keep in sync with server/src/domain/landPurchaseApproval.ts */
export const TOTAL_PROFESSIONAL_FEE_RATE = 0.05;

export function calculateTotalProfessionalFee(offeredPrice: number): number {
  return Math.round(offeredPrice * TOTAL_PROFESSIONAL_FEE_RATE);
}

export function calculateTotalPurchaseCost(offeredPrice: number): number {
  return offeredPrice + calculateTotalProfessionalFee(offeredPrice);
}
