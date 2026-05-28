export const DOCTOR_ILLNESS_DAILY_LIMIT = 5;
export const DOCTOR_SEE_DOCTOR_DELAY_MS = 2 * 60 * 1000;
export const DOCTOR_CURE_FEE = 5000;
export const DOCTOR_CURE_APPROVE_XP = 10;

export const DOCTOR_ILLNESS_TYPES = [
  'verdigris_vertigo',
  'button_lock_fever',
  'creep_crawlies',
] as const;

export type DoctorIllnessType = (typeof DOCTOR_ILLNESS_TYPES)[number];

export const DOCTOR_ILLNESS_META: Record<
  DoctorIllnessType,
  { name: string; description: string }
> = {
  verdigris_vertigo: {
    name: 'Verdigris Vertigo',
    description: 'Intense wavy green haze—the whole screen lurches and sways.',
  },
  button_lock_fever: {
    name: 'Town Hall Lockdown',
    description: 'About 85% of the screen greys out—Town Hub is locked until clinic opens.',
  },
  creep_crawlies: {
    name: 'Treasury Beetle Plague',
    description: 'Hundreds of treasury beetles swarm across your screen.',
  },
};

export function pickRandomIllnessType(): DoctorIllnessType {
  const idx = Math.floor(Math.random() * DOCTOR_ILLNESS_TYPES.length);
  return DOCTOR_ILLNESS_TYPES[idx];
}

/** Same day window as job challenge games (resets 04:00). */
export const DOCTOR_ILLNESS_DAY_START_SQL = `
  CASE WHEN CURRENT_TIME < '04:00:00' THEN CURRENT_DATE - INTERVAL '1 day' + INTERVAL '4 hours'
  ELSE CURRENT_DATE + INTERVAL '4 hours' END
`;
