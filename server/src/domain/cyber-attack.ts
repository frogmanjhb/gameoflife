export const CYBER_ATTACK_DAILY_LIMIT = 5;
export const CYBER_REPAIR_FEE = 5000;
export const CYBER_REPAIR_APPROVE_XP = 10;

export const CYBER_ATTACK_TYPES = ['spyware_popup_storm'] as const;

export type CyberAttackType = (typeof CYBER_ATTACK_TYPES)[number];

export const CYBER_ATTACK_META: Record<
  CyberAttackType,
  { name: string; description: string }
> = {
  spyware_popup_storm: {
    name: 'Spyware Pop-up Storm',
    description:
      'Fake prize pop-ups flood your screen. Close them with × or wait — never click the prize!',
  },
};

export function pickRandomCyberAttackType(): CyberAttackType {
  const idx = Math.floor(Math.random() * CYBER_ATTACK_TYPES.length);
  return CYBER_ATTACK_TYPES[idx];
}

/** Same day window as job challenge games (resets 04:00). */
export const CYBER_ATTACK_DAY_START_SQL = `
  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
  ELSE CURRENT_DATE + INTERVAL '4 hours' END
`;
