export type CyberAttackType = 'spyware_popup_storm';

export const CYBER_ATTACK_MAX_POPUPS = 20;
export const CYBER_ATTACK_INITIAL_POPUPS = 3;
export const CYBER_ATTACK_POPUP_AUTO_DISMISS_MS = 45_000;
export const CYBER_ATTACK_TRAP_SPAWN_COUNT = 2;

export const CYBER_ATTACK_LABELS: Record<CyberAttackType, { name: string; description: string }> = {
  spyware_popup_storm: {
    name: 'Spyware Pop-up Storm',
    description:
      'Fake prize pop-ups flood your screen. Close them with × or wait — never click the prize!',
  },
};

export function randomPopupPosition(index: number): { x: number; y: number } {
  const maxX = Math.max(80, (typeof window !== 'undefined' ? window.innerWidth : 800) - 280);
  const maxY = Math.max(80, (typeof window !== 'undefined' ? window.innerHeight : 600) - 160);
  return {
    x: Math.floor((index * 97 + Math.random() * 120) % maxX),
    y: Math.floor((index * 53 + Math.random() * 100) % maxY),
  };
}

export function createPopupId(): string {
  return `popup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
