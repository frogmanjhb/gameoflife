export const ENGINEER_APPROVAL_FEE_RATE = 0.10;

export const ACTIVE_PURCHASE_STATUSES = ['pending_engineer', 'pending_teacher'] as const;

export type LandPurchaseStatus =
  | 'pending_engineer'
  | 'pending_teacher'
  | 'approved'
  | 'denied';

export function hasArchitectJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('architect');
}

export function hasCivilEngineerJob(jobName: string | null | undefined): boolean {
  return (jobName || '').toLowerCase().trim().includes('civil engineer');
}

export function isLandEngineerJob(jobName: string | null | undefined): boolean {
  return hasArchitectJob(jobName) || hasCivilEngineerJob(jobName);
}

export function calculateTotalEngineerFee(offeredPrice: number): number {
  return Math.round(offeredPrice * ENGINEER_APPROVAL_FEE_RATE);
}

export function calculateEngineerFeeShare(offeredPrice: number, approverCount: number): number {
  if (approverCount <= 0) return 0;
  return Math.round(calculateTotalEngineerFee(offeredPrice) / approverCount);
}

export function calculateTotalPurchaseCost(offeredPrice: number): number {
  return offeredPrice + calculateTotalEngineerFee(offeredPrice);
}

export interface RequiredEngineer {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  job_name: string;
}

export interface EngineerApprovalRow {
  approver_id: number;
  approver_username?: string;
  approver_first_name?: string;
  approver_last_name?: string;
  job_name?: string;
  fee_amount: number;
  approved_at: string;
}
