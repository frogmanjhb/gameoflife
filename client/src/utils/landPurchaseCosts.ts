/** Keep in sync with server/src/domain/landPurchaseApproval.ts */
export const TOTAL_PROFESSIONAL_FEE_RATE = 0.05;

export function hasArchitectJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('architect');
}

export function hasCivilEngineerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('civil engineer');
}

export function isLandEngineerJob(jobName: string | null | undefined): boolean {
  return hasArchitectJob(jobName) || hasCivilEngineerJob(jobName);
}

/** Keep in sync with server/src/domain/landPurchaseApproval.ts */
export const LAND_ENGINEER_APPROVAL_AUTO_AFTER_DAYS = 3;

export function calculateTotalProfessionalFee(offeredPrice: number): number {
  return Math.round(offeredPrice * TOTAL_PROFESSIONAL_FEE_RATE);
}

export function calculateTotalPurchaseCost(offeredPrice: number): number {
  return offeredPrice + calculateTotalProfessionalFee(offeredPrice);
}
