export type DoctorIllnessType = 'verdigris_vertigo' | 'button_lock_fever' | 'creep_crawlies';

/** Teacher preview: full illness demo per click. */
export const DOCTOR_ILLNESS_TEST_DURATION_MS = 10_000;
/** Scaled clinic wait during teacher preview (production: 2 minutes). */
export const DOCTOR_ILLNESS_TEST_SEE_DOCTOR_DELAY_MS = 2_000;

export const DOCTOR_ILLNESS_TEST_OPTIONS: { type: DoctorIllnessType; label: string }[] = [
  { type: 'verdigris_vertigo', label: 'Verdigris Vertigo' },
  { type: 'button_lock_fever', label: 'Town Hall Lockdown' },
  { type: 'creep_crawlies', label: 'Treasury Beetle Plague' },
];

export const DOCTOR_ILLNESS_LABELS: Record<DoctorIllnessType, { name: string; description: string }> = {
  verdigris_vertigo: {
    name: 'Verdigris Vertigo',
    description: 'Intense wavy green haze — the whole screen lurches and sways.',
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
