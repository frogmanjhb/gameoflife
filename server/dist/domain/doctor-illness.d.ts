export declare const DOCTOR_ILLNESS_DAILY_LIMIT = 2;
export declare const DOCTOR_ILLNESS_UNTREATED_EXPIRY_DAYS = 2;
export declare const DOCTOR_ILLNESS_UNTREATED_EXPIRY_MS: number;
export declare const DOCTOR_SEE_DOCTOR_DELAY_MS: number;
export declare const DOCTOR_CURE_FEE = 5000;
export declare const DOCTOR_CURE_APPROVE_XP = 10;
export declare const DOCTOR_ILLNESS_TYPES: readonly ["verdigris_vertigo", "button_lock_fever", "creep_crawlies"];
export type DoctorIllnessType = (typeof DOCTOR_ILLNESS_TYPES)[number];
export declare const DOCTOR_ILLNESS_META: Record<DoctorIllnessType, {
    name: string;
    description: string;
}>;
export declare function pickRandomIllnessType(): DoctorIllnessType;
/** Same day window as job challenge games (resets 04:00). */
export declare const DOCTOR_ILLNESS_DAY_START_SQL = "\n  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'\n  ELSE CURRENT_DATE + INTERVAL '4 hours' END\n";
/** Untreated = no clinic payment or insurance claim submitted. Sets cured_at for natural recovery. */
export declare function expireUntreatedIllnesses(patientUserId?: number): Promise<void>;
//# sourceMappingURL=doctor-illness.d.ts.map