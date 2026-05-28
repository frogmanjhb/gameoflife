export declare const WEEKLY_APPRECIATION_RATE = 0.01;
export declare const WEEKLY_RENTAL_YIELD = 0.05;
export type TownClass = '6A' | '6B' | '6C';
export declare function isTownClass(value: unknown): value is TownClass;
export declare function getCompleteWeeksSince(dateIso: string | Date | null | undefined): number;
export declare function calculateAppreciatedValue(purchasePrice: number, purchasedAt: string): number;
export declare function calculateWeeklyRent(currentValue: number): number;
export declare function canCollectWeeklyRent(purchasedAt: string | null | undefined, lastRentCollectedAt: string | null | undefined): boolean;
export declare function hasFinancialManagerJob(jobName: string | null | undefined): boolean;
export interface LandParcelRow {
    id: number;
    value: number | string;
    purchase_price?: number | string | null;
    purchased_at?: string | null;
    last_rent_collected_at?: string | null;
    owner_id?: number | null;
    biome_type: string;
    grid_code: string;
    town_class?: string;
    risk_level?: string;
    row_index?: number;
    col_index?: number;
}
export declare function enrichOwnedParcel(parcel: LandParcelRow): {
    purchase_price: number;
    current_value: number;
    value: number;
    weekly_rent: number;
    can_collect_rent: boolean;
    weeks_owned: number;
    appreciation: number;
    id: number;
    purchased_at?: string | null;
    last_rent_collected_at?: string | null;
    owner_id?: number | null;
    biome_type: string;
    grid_code: string;
    town_class?: string;
    risk_level?: string;
    row_index?: number;
    col_index?: number;
};
//# sourceMappingURL=landProperty.d.ts.map