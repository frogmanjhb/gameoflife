import { CONFIG } from '@game-of-resources';
import type { ProfessionId } from '@game-of-resources';
import { RULES } from '@game-of-resources';
import type { GorSelfCitizen } from '../../types/gameOfResources';

type Props = {
  open: boolean;
  self: GorSelfCitizen;
  onClose: () => void;
  onConfirm: (prof: ProfessionId) => void;
  busy: boolean;
};

export default function JobChangeDialog({ open, self, onClose, onConfirm, busy }: Props) {
  if (!open) return null;
  const cost = self.jobChangeXpCost;

  return (
    <dialog open className="card" style={{ position: 'fixed', inset: '10% 15%', zIndex: 50, maxWidth: 480 }}>
      <h2>Change your job</h2>
      <p>Changing job costs {cost} XP. Your level may go down.</p>
      <div className="stack">
        {(Object.keys(CONFIG.professions) as ProfessionId[]).map((id) => {
          if (id === self.profession) return null;
          const p = CONFIG.professions[id];
          const xpAfter = self.xp - cost;
          const can = self.xp >= cost && !self.jobChangedThisRound;
          return (
            <button
              key={id}
              type="button"
              className="btn block"
              disabled={!can || busy}
              onClick={() => onConfirm(id)}
            >
              {p.name} — after change: {xpAfter} XP (level {RULES.levelFor(xpAfter)})
            </button>
          );
        })}
      </div>
      <button type="button" className="btn" onClick={onClose}>
        Cancel
      </button>
    </dialog>
  );
}

type WelcomeProps = {
  open: boolean;
  professionName?: string;
  onClose: () => void;
};

export function WelcomeJobCard({ open, professionName, onClose }: WelcomeProps) {
  if (!open || !professionName) return null;
  return (
    <dialog open className="card" style={{ position: 'fixed', inset: '20% 20%', zIndex: 60, maxWidth: 420 }}>
      <h2>Welcome to the village</h2>
      <p>
        You are a <strong>{professionName}</strong>. Your job helps the whole town. Read the Work tab to see what you
        can do this round.
      </p>
      <button type="button" className="btn primary" onClick={onClose}>
        Start playing
      </button>
    </dialog>
  );
}
