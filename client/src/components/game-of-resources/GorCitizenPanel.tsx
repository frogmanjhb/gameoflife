import { CONFIG, RULES } from '@game-of-resources';
import type { GorPlayerView } from '../../types/gameOfResources';
import { GorIcon } from './GorIconSprite';

type Props = {
  view: GorPlayerView;
  onChangeJob?: () => void;
  onRequestBridge?: (coins: number) => void;
  bridgeBusy?: boolean;
  readOnly?: boolean;
};

export default function GorCitizenPanel({ view, onChangeJob, onRequestBridge, bridgeBusy, readOnly }: Props) {
  const self = view.self;
  if (!self) {
    return (
      <aside className="citizen" aria-label="Your citizen">
        <div className="cz-body">
          <p className="small">Loading your citizen…</p>
        </div>
      </aside>
    );
  }

  const prof = CONFIG.professions[self.profession as keyof typeof CONFIG.professions];
  const level = RULES.levelFor(self.xp);
  const xpPct = Math.min(100, (self.xp % 30) / 30 * 100 || 100);

  return (
    <aside className="citizen" aria-label="Your citizen">
      <div className="cz-body">
        <div className="who">
          <div
            className="avatar"
            style={{ ['--pc' as string]: self.avatar?.clothes ?? prof?.colour ?? '#888' }}
          >
            <GorIcon id={prof?.icon || 'i-user'} />
          </div>
          <div>
            <h2 className="pseudo">{self.name}</h2>
            <span className="badge">
              <GorIcon id={prof?.icon || 'i-user'} className="ic sm" />
              {prof?.name || self.professionName}
            </span>
          </div>
        </div>
        {self.hungry && (
          <div className="notice warn">
            <GorIcon id="i-alert" />
            You are hungry. Eat food or buy food from the market.
          </div>
        )}
        <div>
          <p className="sec-title">Level {level}</p>
          <div className="xpbar">
            <span style={{ width: `${xpPct}%` }} />
          </div>
          <p className="small">
            {self.xp} XP · {self.ap - self.apUsed} action points left
          </p>
          <div className="pips" aria-label="Action points">
            {Array.from({ length: self.ap }).map((_, i) => (
              <span key={i} className={`pip${i < self.apUsed ? ' spent' : ' on'}`} />
            ))}
          </div>
        </div>
        <div className="wallet">
          <GorIcon id="i-coin" />
          {self.coins} coins
        </div>
        <div className="inv">
          {(['food', 'wood', 'stone', 'tools'] as const).map((k) => (
            <div key={k} className="inv-item">
              <GorIcon id={`i-${k === 'food' ? 'wheat' : k === 'tools' ? 'tool' : k}`} />
              <b>{self.inv[k]}</b>
              <span>{k}</span>
            </div>
          ))}
        </div>
        {!readOnly ? (
          <p className="small">Tap your figure on the island to change colours or move them.</p>
        ) : null}
        {onChangeJob && !readOnly ? (
          <button type="button" className="btn block" onClick={onChangeJob} disabled={self.jobChangedThisRound}>
            Change job ({self.jobChangeXpCost} XP)
          </button>
        ) : null}
        {view.settings.bankBridgeEnabled && onRequestBridge && !readOnly && (
          <div className="card">
            <p className="sec-title">Convert coins to bank money</p>
            <p className="small">
              {view.settings.bankBridgeCoinsPerRand ?? 10} game coins = R1 after your teacher approves.
            </p>
            <button
              type="button"
              className="btn block"
              disabled={bridgeBusy}
              onClick={() => {
                const rate = view.settings.bankBridgeCoinsPerRand ?? 10;
                const coins = Math.floor(self.coins / rate) * rate;
                if (coins < rate) return;
                onRequestBridge(coins);
              }}
            >
              Request conversion ({Math.floor(self.coins / (view.settings.bankBridgeCoinsPerRand ?? 10)) * (view.settings.bankBridgeCoinsPerRand ?? 10)} coins)
            </button>
          </div>
        )}
        {self.jobChangedThisRound && (
          <p className="small">You already changed job this round.</p>
        )}
      </div>
    </aside>
  );
}
