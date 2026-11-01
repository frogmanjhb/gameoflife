import { CONFIG, RULES } from '@game-of-resources';
import type { GorPlayerView } from '../../types/gameOfResources';
import { formatCountdown } from './viewAdapter';
import { GorIcon } from './GorIconSprite';

const ENV_KEYS = ['forest', 'soil', 'water', 'pollution', 'habitat'] as const;
const ENV_ICON: Record<string, string> = {
  forest: 'i-tree',
  soil: 'i-soil',
  water: 'i-drop',
  pollution: 'i-smog',
  habitat: 'i-paw',
};

type Props = {
  view: GorPlayerView;
  liveMessage: string;
  onTeacher?: () => void;
  showTeacher?: boolean;
};

export default function GorTopBar({ view, liveMessage, onTeacher, showTeacher }: Props) {
  const countdown = formatCountdown(view.round.endsAt);
  return (
    <header className="topbar">
      <div className="topbar-meta">
        <h1 className="brand">Game of Resources</h1>
        <div className={`chip round-chip${view.round.open ? ' is-open' : ''}`}>
          Round {view.round.n}
          {view.round.open ? ' · Open' : ' · Closed'}
          {countdown && view.round.open ? (
            <span className="round-countdown"> · {countdown}</span>
          ) : null}
        </div>
        <div className="treasury" title="Village treasury">
          <GorIcon id="i-coin" className="ic" />
          <span className="num">{view.treasury}</span>
          <span className="lbl">Treasury</span>
        </div>
        {liveMessage ? <div className="chip topbar-news">{liveMessage}</div> : null}
        {showTeacher && onTeacher ? (
          <button type="button" className="btn teacher-btn" onClick={onTeacher}>
            <GorIcon id="i-key" />
            Teacher
          </button>
        ) : null}
      </div>
      <div className="gauges" aria-label="Environment">
        {ENV_KEYS.map((key) => {
          const val = view.env[key] ?? 0;
          const status = RULES.gaugeStatus(key, val);
          const words: Record<string, string> = { good: 'Healthy', warn: 'Under pressure', bad: 'Critical' };
          return (
            <div key={key} className="gauge" data-s={status}>
              <GorIcon id={ENV_ICON[key]} className="ic g-ic" />
              <div className="g-top">
                <span className="g-name">{RULES.ENV_NAMES[key]}</span>
                <span className="g-num">{Math.round(val)}</span>
              </div>
              <div className="g-bot">
                <span className="g-word">{words[status]}</span>
                <span className="g-bar">
                  <span style={{ width: `${val}%` }} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}
