/** Total professional fees (FM + architects + civil engineers) = 5% of plot price */
export const TOTAL_PROFESSIONAL_FEE_RATE = 0.05;

export const FM_LAND_REVIEW_XP = 10;
export const LAND_ENGINEER_REVIEW_XP = 50;
/** @deprecated Use LAND_ENGINEER_REVIEW_XP */
export const CIVIL_ENGINEER_LAND_REVIEW_XP = LAND_ENGINEER_REVIEW_XP;

export const ACTIVE_PURCHASE_STATUSES = [
  'pending_fm',
  'pending_engineer',
  'pending_teacher',
] as const;

export type LandPurchaseStatus =
  | 'pending_fm'
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

export function calculateTotalProfessionalFee(offeredPrice: number): number {
  return Math.round(offeredPrice * TOTAL_PROFESSIONAL_FEE_RATE);
}

export function allocateProfessionalFees(
  offeredPrice: number,
  engineerCount: number
): {
  professional_fee_total: number;
  fm_fee: number;
  engineer_fee_total: number;
  engineer_fee_per_approver: number;
} {
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

export function calculateFmFee(offeredPrice: number, engineerCount = 0): number {
  return allocateProfessionalFees(offeredPrice, engineerCount).fm_fee;
}

export function calculateTotalEngineerFee(offeredPrice: number, engineerCount: number): number {
  return allocateProfessionalFees(offeredPrice, engineerCount).engineer_fee_total;
}

export function calculateEngineerFeeShare(offeredPrice: number, approverCount: number): number {
  if (approverCount <= 0) return 0;
  return allocateProfessionalFees(offeredPrice, approverCount).engineer_fee_per_approver;
}

export function calculateTotalPurchaseCost(offeredPrice: number, engineerCount = 0): number {
  return offeredPrice + calculateTotalProfessionalFee(offeredPrice);
}

export interface PurchaseCostBreakdown {
  plot_price: number;
  professional_fee_total: number;
  fm_fee: number;
  engineer_fee_total: number;
  engineer_fee_per_approver: number;
  total_required: number;
  buyer_balance: number;
  can_afford: boolean;
}

export function buildPurchaseCostBreakdown(
  offeredPrice: number,
  engineerCount: number,
  buyerBalance: number
): PurchaseCostBreakdown {
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

/** Cooldown before the same seller can re-list a plot to the same buyer after FM denial. */
export const LAND_SALE_FM_RESUBMIT_COOLDOWN_HOURS = 24;

type DbGet = {
  get: (sql: string, params?: unknown[]) => Promise<Record<string, unknown> | undefined>;
};

/**
 * FM land-purchase XP is only earned once per parcel+buyer until a purchase completes.
 * Prevents approve/deny/resubmit loops from farming +10 XP repeatedly.
 */
export async function fmPurchaseReviewXpAlreadyEarned(
  db: DbGet,
  parcelId: number,
  buyerId: number,
  currentRequestId: number
): Promise<boolean> {
  const row = await db.get(
    `SELECT id FROM land_purchase_requests
     WHERE parcel_id = $1 AND user_id = $2 AND id <> $3
       AND fm_reviewed_at IS NOT NULL
       AND status <> 'approved'
     LIMIT 1`,
    [parcelId, buyerId, currentRequestId]
  );
  return !!row;
}

/** Blocks rapid re-listing after FM denial of the same parcel to the same buyer. */
export async function landSaleResubmitBlockedByCooldown(
  db: DbGet,
  parcelId: number,
  sellerId: number,
  buyerId: number
): Promise<boolean> {
  const row = await db.get(
    `SELECT id FROM land_sale_requests
     WHERE parcel_id = $1 AND seller_id = $2 AND buyer_id = $3
       AND status = 'denied'
       AND fm_reviewed_at > NOW() - ($4::text || ' hours')::interval
     LIMIT 1`,
    [parcelId, sellerId, buyerId, String(LAND_SALE_FM_RESUBMIT_COOLDOWN_HOURS)]
  );
  return !!row;
}
