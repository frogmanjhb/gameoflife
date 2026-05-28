export declare const CYBER_ATTACK_DAILY_LIMIT = 5;
export declare const CYBER_REPAIR_FEE = 5000;
export declare const CYBER_REPAIR_APPROVE_XP = 10;
export declare const CYBER_ATTACK_TYPES: readonly ["spyware_popup_storm"];
export type CyberAttackType = (typeof CYBER_ATTACK_TYPES)[number];
export declare const CYBER_ATTACK_META: Record<CyberAttackType, {
    name: string;
    description: string;
}>;
export declare function pickRandomCyberAttackType(): CyberAttackType;
/** Same day window as job challenge games (resets 04:00). */
export declare const CYBER_ATTACK_DAY_START_SQL = "\n  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'\n  ELSE CURRENT_DATE + INTERVAL '4 hours' END\n";
//# sourceMappingURL=cyber-attack.d.ts.map