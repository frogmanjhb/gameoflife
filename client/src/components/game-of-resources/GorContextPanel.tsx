import React from 'react';
import { CONFIG, RULES } from '@game-of-resources';
import type { GameState, InventoryItem } from '@game-of-resources';
import type { GorPlayerView } from '../../types/gameOfResources';
import GorActionCard from './GorActionCard';
import { GorIcon } from './GorIconSprite';
import GorTilePanel from './GorTilePanel';

const PROJECT_KEYS = Object.keys(CONFIG.projects);

type Props = {
  view: GorPlayerView;
  gameState: GameState;
  tab: string;
  selectedTile: string | null;
  onTab: (t: string) => void;
  onAction: (id: string, opt?: Record<string, unknown>) => void;
  onStoreBuy: (item: string) => void;
  onStoreSell: (item: string) => void;
  busy: boolean;
};

function selForWork(state: GameState, type: string, selected: string | null): string | undefined {
  if (selected && RULES.workplaces(state, type).includes(selected)) return selected;
  return undefined;
}

function condWord(h: number): string {
  const P = CONFIG.places;
  if (h >= P.full) return 'Healthy';
  if (h >= P.low) return 'Worn';
  return 'Exhausted';
}

function placeWorkNote(
  gameState: GameState,
  selfId: string,
  actionId: string,
  opt: Record<string, unknown>,
  verb: string
): React.ReactNode | null {
  const p = RULES.plan(gameState, selfId, actionId, opt);
  if (!p.tileKey || typeof p.tileKey !== 'string') return null;
  const h = RULES.health(gameState, p.tileKey);
  const tile = RULES.TILE[p.tileKey];
  const where = tile?.type === 'farm' ? 'farm' : tile?.type === 'quarry' ? 'quarry' : 'tile';
  return (
    <p className="small">
      <GorIcon id="i-pin" className="ic sm" /> {verb} the {where} with condition {h} ({condWord(h)}). Select
      another workplace to spread the work.
    </p>
  );
}

export default function GorContextPanel({
  view,
  gameState,
  tab,
  selectedTile,
  onTab,
  onAction,
  onStoreBuy,
  onStoreSell,
  busy,
}: Props) {
  const self = view.self;
  const tabs = [
    { id: 'tile', label: 'Tile', icon: 'i-pin' },
    { id: 'work', label: 'Work', icon: 'i-hand' },
    { id: 'market', label: 'Market', icon: 'i-scale' },
    { id: 'build', label: 'Build', icon: 'i-brick' },
    { id: 'log', label: 'Log', icon: 'i-list' },
  ];

  const run = (id: string, opt: Record<string, unknown> = {}) => {
    if (!busy && view.round.open) onAction(id, opt);
  };

  return (
    <aside className="context" aria-label="Game panels">
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTab(t.id)}
          >
            <GorIcon id={t.icon} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="panel-wrap" role="tabpanel">
        {tab === 'tile' && (
          <GorTilePanel
            selectedTile={selectedTile}
            gameState={gameState}
            roundOpen={view.round.open}
            busy={busy}
            onTab={onTab}
            onAction={(id, opt) => run(id, opt ?? {})}
          />
        )}
        {tab === 'work' && self && (
          <WorkPanel
            view={view}
            gameState={gameState}
            self={self}
            selectedTile={selectedTile}
            busy={busy}
            onRun={run}
            onTab={onTab}
          />
        )}
        {tab === 'market' && self && (
          <MarketPanel view={view} self={self} busy={busy} onStoreBuy={onStoreBuy} onStoreSell={onStoreSell} />
        )}
        {tab === 'build' && self && (
          <BuildPanel gameState={gameState} selfId={self.id} busy={busy} roundOpen={view.round.open} onRun={run} />
        )}
        {tab === 'log' && <LogPanel log={view.log} />}
      </div>
    </aside>
  );
}

function WorkPanel({
  view,
  gameState,
  self,
  selectedTile,
  busy,
  onRun,
  onTab,
}: {
  view: GorPlayerView;
  gameState: GameState;
  self: NonNullable<GorPlayerView['self']>;
  selectedTile: string | null;
  busy: boolean;
  onRun: (id: string, opt?: Record<string, unknown>) => void;
  onTab: (t: string) => void;
}) {
  const cards: React.ReactNode[] = [];
  const band = RULES.waterBand(gameState.env.water);
  const apLeft = self.ap - self.apUsed;

  switch (self.profession) {
    case 'farmer':
      cards.push(
        <GorActionCard
          key="farm"
          iconId="i-wheat"
          title="Grow food"
          buttonLabel="Grow food"
          plan={RULES.plan(gameState, self.id, 'farm', { tileKey: selForWork(gameState, 'farm', selectedTile) })}
          busy={busy}
          roundOpen={view.round.open}
          hint={
            <>
              <p className="small">The river is {band.name.toLowerCase()}, so farms give {band.words}.</p>
              {placeWorkNote(
                gameState,
                self.id,
                'farm',
                { tileKey: selForWork(gameState, 'farm', selectedTile) },
                'Working on'
              )}
            </>
          }
          onRun={() => onRun('farm', { tileKey: selForWork(gameState, 'farm', selectedTile) })}
        />
      );
      cards.push(
        <GorActionCard
          key="rest"
          iconId="i-soil"
          title="Rest and compost a field"
          buttonLabel="Rest and compost this field"
          plan={RULES.plan(gameState, self.id, 'rest', { tileKey: selForWork(gameState, 'farm', selectedTile) })}
          busy={busy}
          roundOpen={view.round.open}
          hint={
            <>
              <p className="small">
                Skip a harvest: no food this time, but Soil improves, the field gains {CONFIG.actions.rest.condition}{' '}
                condition and it recovers twice as fast tonight.
              </p>
              {placeWorkNote(
                gameState,
                self.id,
                'rest',
                { tileKey: selForWork(gameState, 'farm', selectedTile) },
                'Resting on'
              )}
            </>
          }
          onRun={() => onRun('rest', { tileKey: selForWork(gameState, 'farm', selectedTile) })}
        />
      );
      break;
    case 'logger':
      cards.push(
        <GorActionCard
          key="chop"
          iconId="i-axe"
          title="Chop wood"
          buttonLabel="Chop wood"
          plan={RULES.plan(gameState, self.id, 'chop', { tileKey: selForWork(gameState, 'forest', selectedTile) })}
          busy={busy}
          roundOpen={view.round.open}
          onRun={() => onRun('chop', { tileKey: selForWork(gameState, 'forest', selectedTile) })}
        />
      );
      break;
    case 'miner':
      cards.push(
        <GorActionCard
          key="mine"
          iconId="i-pick"
          title="Mine stone"
          buttonLabel="Mine stone"
          plan={RULES.plan(gameState, self.id, 'mine', { tileKey: selForWork(gameState, 'quarry', selectedTile) })}
          busy={busy}
          roundOpen={view.round.open}
          onRun={() => onRun('mine', { tileKey: selForWork(gameState, 'quarry', selectedTile) })}
        />
      );
      break;
    case 'craftsperson':
      cards.push(
        <GorActionCard
          key="craft"
          iconId="i-tool"
          title="Make a tool"
          buttonLabel="Make a tool"
          plan={RULES.plan(gameState, self.id, 'craft', {})}
          busy={busy}
          roundOpen={view.round.open}
          onRun={() => onRun('craft', {})}
        />
      );
      break;
    case 'trader':
      cards.push(
        <GorActionCard
          key="deliver"
          iconId="i-scale"
          title="Make a delivery"
          buttonLabel="Make a delivery"
          plan={RULES.plan(gameState, self.id, 'deliver', {})}
          busy={busy}
          roundOpen={view.round.open}
          hint={<p className="small">The village pays you from the treasury.</p>}
          onRun={() => onRun('deliver', {})}
        />
      );
      break;
    case 'builder': {
      const open = PROJECT_KEYS.filter((k) => !gameState.projects[k]?.done);
      if (!open.length) {
        cards.push(<p className="empty">Every project is finished. Well done, village!</p>);
      }
      open.forEach((k) => {
        const cfg = CONFIG.projects[k as keyof typeof CONFIG.projects];
        cards.push(
          <GorActionCard
            key={`shift-${k}`}
            iconId={cfg.icon}
            title={`Shift: ${cfg.name}`}
            buttonLabel={`Work a shift on the ${cfg.name}`}
            plan={RULES.plan(gameState, self.id, 'shift', { project: k })}
            busy={busy}
            roundOpen={view.round.open}
            onRun={() => onRun('shift', { project: k })}
          />
        );
      });
      break;
    }
    default:
      break;
  }

  const fishPlan = RULES.plan(gameState, self.id, 'fish', {});
  const comm = CONFIG.communityActions
    ? [
        <GorActionCard
          key="plant"
          iconId="i-tree"
          title="Plant trees"
          buttonLabel="Plant trees"
          plan={RULES.plan(gameState, self.id, 'plant', {})}
          busy={busy}
          roundOpen={view.round.open}
          onRun={() => onRun('plant', {})}
        />,
        <GorActionCard
          key="clean"
          iconId="i-river"
          title="Clean the river"
          buttonLabel="Clean the river"
          plan={RULES.plan(gameState, self.id, 'clean', {})}
          busy={busy}
          roundOpen={view.round.open}
          onRun={() => onRun('clean', {})}
        />,
      ]
    : [];

  return (
    <div className="stack">
      <p className="small">
        <GorIcon id="i-hand" className="ic sm" /> {self.name} has {apLeft} of {self.ap} action points left this
        round.
      </p>
      <div className="stack">{cards}</div>
      <div className="stack" style={{ marginTop: 12 }}>
        <h3 className="sec-title">Any job</h3>
        <GorActionCard
          iconId="i-fish"
          title="Catch fish"
          buttonLabel="Catch fish"
          plan={fishPlan}
          busy={busy}
          roundOpen={view.round.open}
          onRun={() => onRun('fish', {})}
        />
        {comm}
      </div>
      <button type="button" className="btn block" onClick={() => onTab('build')}>
        <GorIcon id="i-brick" className="ic sm" />
        Donate to a project in the Build tab
      </button>
    </div>
  );
}

function BuildPanel({
  gameState,
  selfId,
  busy,
  roundOpen,
  onRun,
}: {
  gameState: GameState;
  selfId: string;
  busy: boolean;
  roundOpen: boolean;
  onRun: (id: string, opt?: Record<string, unknown>) => void;
}) {
  const items: InventoryItem[] = ['food', 'wood', 'stone', 'tools'];
  return (
    <div className="stack">
      <p className="small">
        <GorIcon id="i-brick" className="ic sm" /> Projects need materials and builder shifts. Each donation costs 1
        action point.
      </p>
      {PROJECT_KEYS.map((k) => {
        const cfg = CONFIG.projects[k as keyof typeof CONFIG.projects];
        const pr = RULES.projectProgress(gameState, k);
        const done = gameState.projects[k]?.done;
        if (done) {
          return (
            <div key={k} className="card">
              <h3>
                <GorIcon id={cfg.icon} />
                {cfg.name}
              </h3>
              <p className="small">Finished.</p>
            </div>
          );
        }
        return (
          <div key={k} className="card">
            <h3>
              <GorIcon id={cfg.icon} />
              {cfg.name}
            </h3>
            <p className="small">
              Materials {pr.mat}% · Builder shifts {pr.labour}%
            </p>
            <p className="small">{cfg.benefit}</p>
            {items.map((item) => {
              const plan = RULES.plan(gameState, selfId, 'donate', { project: k, item, qty: 1 });
              return (
                <GorActionCard
                  key={`${k}-${item}`}
                  iconId={cfg.icon}
                  title={`Donate 1 ${item}`}
                  buttonLabel={`Donate 1 ${item}`}
                  plan={plan}
                  busy={busy}
                  roundOpen={roundOpen}
                  onRun={() => onRun('donate', { project: k, item, qty: 1 })}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function MarketPanel({
  view,
  self,
  busy,
  onStoreBuy,
  onStoreSell,
}: {
  view: GorPlayerView;
  self: NonNullable<GorPlayerView['self']>;
  busy: boolean;
  onStoreBuy: (item: string) => void;
  onStoreSell: (item: string) => void;
}) {
  return (
    <div className="stack">
      {(['food', 'wood', 'stone', 'tools'] as const).map((item) => (
        <div key={item} className="store-row">
          <strong>{item}</strong>
          <div className="row">
            <button type="button" className="btn" disabled={busy} onClick={() => onStoreBuy(item)}>
              Buy 1
            </button>
            <button type="button" className="btn" disabled={busy} onClick={() => onStoreSell(item)}>
              Sell 1
            </button>
          </div>
        </div>
      ))}
      {view.listings.length > 0 && (
        <>
          <h3 className="sec-title">Player listings</h3>
          {view.listings.map((l) => (
            <div key={l.id} className="card">
              <p>
                {l.sellerName}: {l.qty} {l.item} @ {l.price} coins
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function LogPanel({ log }: { log: GorPlayerView['log'] }) {
  return (
    <div className="stack">
      {[...log].reverse().slice(0, 40).map((e) => (
        <div key={e.id} className="card">
          <p>
            <strong>{e.name}</strong> — {e.text}
          </p>
        </div>
      ))}
    </div>
  );
}
