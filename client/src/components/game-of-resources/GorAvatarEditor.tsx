import { useEffect, useState } from 'react';
import type { GorAvatar, GorSelfCitizen } from '../../types/gameOfResources';
import { CONFIG } from '@game-of-resources';

type Props = {
  open: boolean;
  self: GorSelfCitizen;
  placing: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (patch: Partial<GorAvatar>) => Promise<void>;
  onStartPlace: () => void;
  onCancelPlace: () => void;
};

const SKIN_PRESETS = ['#f0c8a0', '#c98e5e', '#8d5a3b', '#5c3a26', '#e8b4a0', '#6b4423'];
const CLOTHES_PRESETS = ['#d9a425', '#2f7d6d', '#c4473a', '#3a8fc7', '#9b5aa0', '#5f6f7d', '#ffffff', '#22303a'];
const RING_PRESETS = ['#ffd166', '#2f7d6d', '#c4473a', '#3a8fc7', '#ffffff', '#9b5aa0'];

export default function GorAvatarEditor({
  open,
  self,
  placing,
  busy,
  onClose,
  onSave,
  onStartPlace,
  onCancelPlace,
}: Props) {
  const profColour = CONFIG.professions[self.profession as keyof typeof CONFIG.professions]?.colour ?? '#888';
  const [skin, setSkin] = useState(self.avatar?.skin ?? '#f0c8a0');
  const [clothes, setClothes] = useState(self.avatar?.clothes ?? profColour);
  const [ring, setRing] = useState(self.avatar?.ring ?? '#ffd166');
  const [useJobColour, setUseJobColour] = useState(self.avatar?.clothes == null);

  useEffect(() => {
    if (!open) return;
    setSkin(self.avatar?.skin ?? '#f0c8a0');
    setRing(self.avatar?.ring ?? '#ffd166');
    setUseJobColour(self.avatar?.clothes == null);
    setClothes(self.avatar?.clothes ?? profColour);
  }, [open, self.avatar, profColour]);

  if (!open) return null;

  const saveColours = async () => {
    await onSave({
      skin,
      clothes: useJobColour ? null : clothes,
      ring,
    });
  };

  return (
    <dialog className="gor-avatar-dlg" open aria-labelledby="gorAvatarTitle">
      <div className="dlg-head row">
        <h2 id="gorAvatarTitle">Your character</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="dlg-body stack">
        <p className="small">Customise how you look on the island. Other players in your town will see this too.</p>
        <label className="field">
          Skin
          <input type="color" value={skin} onChange={(e) => setSkin(e.target.value)} />
        </label>
        <div className="gor-colour-row">
          {SKIN_PRESETS.map((c) => (
            <button key={c} type="button" className="gor-swatch" style={{ background: c }} aria-label={`Skin ${c}`} onClick={() => setSkin(c)} />
          ))}
        </div>
        <label className="row">
          <input type="checkbox" checked={useJobColour} onChange={(e) => setUseJobColour(e.target.checked)} />
          Use job colour for clothes
        </label>
        {!useJobColour ? (
          <>
            <label className="field">
              Clothes
              <input type="color" value={clothes} onChange={(e) => setClothes(e.target.value)} />
            </label>
            <div className="gor-colour-row">
              {CLOTHES_PRESETS.map((c) => (
                <button key={c} type="button" className="gor-swatch" style={{ background: c }} aria-label={`Clothes ${c}`} onClick={() => setClothes(c)} />
              ))}
            </div>
          </>
        ) : null}
        <label className="field">
          Ring around you
          <input type="color" value={ring} onChange={(e) => setRing(e.target.value)} />
        </label>
        <div className="gor-colour-row">
          {RING_PRESETS.map((c) => (
            <button key={c} type="button" className="gor-swatch" style={{ background: c }} aria-label={`Ring ${c}`} onClick={() => setRing(c)} />
          ))}
        </div>
        <div className="btn-row">
          <button type="button" className="btn primary" disabled={busy} onClick={() => saveColours()}>
            Save look
          </button>
          {placing ? (
            <button type="button" className="btn" onClick={onCancelPlace}>
              Cancel placing
            </button>
          ) : (
            <button type="button" className="btn" disabled={busy} onClick={onStartPlace}>
              Pick up and place on island
            </button>
          )}
        </div>
        {placing ? (
          <p className="notice info">Tap a land tile on the island to set your character down.</p>
        ) : null}
        {self.avatar?.pos ? (
          <p className="small">Your character stays where you placed them until you move them again.</p>
        ) : (
          <p className="small">Until you place yourself, your character wanders near the town.</p>
        )}
      </div>
    </dialog>
  );
}
