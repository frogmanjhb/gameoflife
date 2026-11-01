import type { ReactNode } from 'react';
import { CONFIG, PLANET, RULES } from '@game-of-resources';
import type { GameState } from '@game-of-resources';
import GorActionCard from './GorActionCard';
import { GorIcon } from './GorIconSprite';

function condWord(h: number): string {
  if (h >= 80) return 'healthy';
  if (h >= 50) return 'worn';
  return 'poor';
}

function DevelopLandCards({
  cellKey,
  gameState,
  selfId,
  roundOpen,
  busy,
  onRun,
}: {
  cellKey: string;
  gameState: GameState;
  selfId: string;
  roundOpen: boolean;
  busy: boolean;
  onRun: (id: string, opt?: Record<string, unknown>) => void;
}) {
  return (
    <div className="stack">
      <h3 className="sec-title">Develop this land</h3>
      {Object.entries(CONFIG.dev.to).map(([to, d]) => (
        <GorActionCard
          key={to}
          iconId={d.icon}
          title={`Make a ${d.name.toLowerCase()}`}
          buttonLabel={`Turn it into a ${d.name.toLowerCase()}`}
          plan={RULES.plan(gameState, selfId, 'develop', { cell: cellKey, to })}
          busy={busy}
          roundOpen={roundOpen}
          onRun={() => onRun('develop', { cell: cellKey, to })}
          hint={<p className="small">{d.effect}</p>}
        />
      ))}
    </div>
  );
}

function FixedTilePanel({
  tileKey,
  gameState,
  onTab,
  roundOpen,
  busy,
  onRun,
}: {
  tileKey: string;
  gameState: GameState;
  onTab: (t: string) => void;
  roundOpen: boolean;
  busy: boolean;
  onRun: (id: string, opt?: Record<string, unknown>) => void;
}) {
  const t = RULES.TILE[tileKey];
  if (!t) {
    return (
      <div className="card">
        <p>Unknown tile.</p>
      </div>
    );
  }
  const band = RULES.waterBand(gameState.env.water);
  const st = (k: keyof typeof gameState.env) =>
    `${gameState.env[k]} out of 100 (${RULES.gaugeStatus(k, gameState.env[k]) === 'good' ? 'Healthy' : RULES.gaugeStatus(k, gameState.env[k]) === 'warn' ? 'Under pressure' : 'Critical'})`;

  let title = t.type;
  let icon = 'i-pin';
  let prod = '';
  let cond = '';
  let how = '';

  switch (t.type) {
    case 'forest':
      title = 'Forest';
      icon = 'i-tree';
      prod = 'Wood, when a logger chops trees.';
      cond = `${RULES.treesOn(gameState, tileKey)} of ${CONFIG.treesPerTile} trees on this tile. Forest health is ${st('forest')}.`;
      how = 'Chop wood here. Plant trees to help the forest recover.';
      break;
    case 'farm':
      title = 'Farm';
      icon = 'i-wheat';
      prod = 'Food, when a farmer grows crops.';
      cond = `Soil is ${st('soil')}. The river is ${band.name.toLowerCase()}, so a harvest gives about ${RULES.farmYield(gameState)} food.`;
      how = 'Farmers grow food here. Resting a field helps the soil recover.';
      break;
    case 'quarry':
      title = 'Quarry';
      icon = 'i-stone';
      prod = 'Stone, when a miner digs.';
      cond = `${gameState.minedTotal} stone mined so far. Pollution is ${st('pollution')}.`;
      how = 'Miners dig stone here.';
      break;
    case 'river':
      title = 'River';
      icon = 'i-river';
      prod = 'Water for farms and for people.';
      cond = `The water is ${band.name.toLowerCase()}. Water health is ${st('water')}.`;
      how = 'Farming and mining use river water. Anyone can help clean the river.';
      break;
    case 'land':
      title = 'Open land';
      icon = 'i-land';
      prod = 'Nothing yet.';
      cond = 'Grass and wild plants grow here.';
      how = 'Develop it into a farm, forest, quarry or houses.';
      break;
    case 'town':
      title = 'Town centre';
      icon = 'i-town';
      prod = 'Homes for the citizens. Craftspeople make tools here.';
      cond = `${gameState.citizens.length} citizens live in ${Math.max(1, Math.ceil(gameState.citizens.length / 5))} houses.`;
      how = 'Add citizens to see the town grow.';
      break;
    case 'site': {
      const k = t.project as keyof typeof CONFIG.projects;
      const cfg = CONFIG.projects[k];
      const pr = RULES.projectProgress(gameState, k);
      title = cfg?.name ?? String(t.project);
      icon = cfg?.icon ?? 'i-brick';
      prod = cfg?.benefit ?? '';
      cond = gameState.projects[k]?.done
        ? 'Finished.'
        : `Materials ${pr.mat}%. Builder shifts ${pr.labour}%.`;
      how = 'Donate materials and ask a builder to work shifts.';
      break;
    }
    default:
      break;
  }

  const health = RULES.health(gameState, tileKey);
  const selfId = gameState.activeId;

  let developBlock: ReactNode = null;
  let restoreBlock: ReactNode = null;

  if (t.type === 'land') {
    const cid = PLANET.cellOfKey[tileKey];
    if (cid != null) {
      const cellKey = RULES.cellKey(cid);
      const ov = gameState.land[cid];
      if (ov?.dev) {
        const d = CONFIG.dev.to[ov.type as keyof typeof CONFIG.dev.to];
        if (d) {
          title = `${d.name} (was open land)`;
          icon = d.icon;
          prod = d.effect;
          cond = 'Developed by the village.';
          how = 'This land has been developed.';
        }
        if (ov.type !== 'forest' && selfId) {
          restoreBlock = (
            <GorActionCard
              iconId="i-paw"
              title="Restore to wild land"
              buttonLabel="Restore to wild land"
              plan={RULES.plan(gameState, selfId, 'restore', { cell: cellKey })}
              busy={busy}
              roundOpen={roundOpen}
              onRun={() => onRun('restore', { cell: cellKey })}
              hint={
                <p className="small">
                  Takes {CONFIG.actions.restore.ap} AP plus tools and wood. Repairing nature costs more than protecting
                  it.
                </p>
              }
            />
          );
        }
      } else if (selfId && RULES.villageLand(gameState).has(cid)) {
        developBlock = (
          <DevelopLandCards
            cellKey={cellKey}
            gameState={gameState}
            selfId={selfId}
            roundOpen={roundOpen}
            busy={busy}
            onRun={onRun}
          />
        );
      }
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h3>
          <GorIcon id={icon} />
          {title}
        </h3>
        {prod ? (
          <dl className="kv">
            <dt>Makes</dt>
            <dd>{prod}</dd>
            <dt>Now</dt>
            <dd>{cond}</dd>
            <dt>Actions</dt>
            <dd>{how}</dd>
          </dl>
        ) : (
          <dl className="kv">
            <dt>Tile</dt>
            <dd>{tileKey}</dd>
            {health != null ? (
              <>
                <dt>Condition</dt>
                <dd>{health}</dd>
              </>
            ) : null}
          </dl>
        )}
        {t.type === 'site' ? (
          <button type="button" className="btn block" onClick={() => onTab('build')}>
            Help build in the Build tab
          </button>
        ) : null}
      </div>
      {developBlock}
      {restoreBlock}
    </div>
  );
}

function CellTilePanel({
  cellId,
  gameState,
  roundOpen,
  busy,
  onTab,
  onRun,
}: {
  cellId: number;
  gameState: GameState;
  roundOpen: boolean;
  busy: boolean;
  onTab: (t: string) => void;
  onRun: (id: string, opt?: Record<string, unknown>) => void;
}) {
  const c = PLANET.cells[cellId];
  if (!c) {
    return (
      <div className="card">
        <p>Unknown cell.</p>
      </div>
    );
  }

  const t = RULES.cellType(gameState, cellId);
  if (t === 'island' && c.key) {
    return (
      <FixedTilePanel
        tileKey={c.key}
        gameState={gameState}
        onTab={onTab}
        roundOpen={roundOpen}
        busy={busy}
        onRun={onRun}
      />
    );
  }

  const key = RULES.cellKey(cellId);
  const T = CONFIG.terrain[t as keyof typeof CONFIG.terrain] ?? { name: 'Land', water: false, sea: false };
  const vl = RULES.villageLand(gameState);
  const mine = vl.has(cellId);

  let icon = 'i-land';
  let status = '';

  if (c.key) {
    status = `${T.name}. This water is kept for the Stone Bridge. When the bridge is finished, new land rises here.`;
  } else if (t === 'bridge') {
    const u = CONFIG.terrain[(gameState.land[cellId]?.under as keyof typeof CONFIG.terrain) || 'shallow'];
    status = `An island bridge over the ${u.name.toLowerCase()}. It joins the village to the land across the water.`;
    icon = 'i-bridge';
  } else if (T.sea) {
    status = mine ? 'Ocean next to your village land.' : 'Ocean. Reclaim shallow ocean that touches your land to reach new places.';
    icon = 'i-river';
  } else if (T.water) {
    status = 'Fresh water. Lakes and rivers cannot be filled, but an island bridge can cross them.';
    icon = 'i-river';
  } else if (mine) {
    status =
      gameState.land[cellId]?.dev
        ? 'Village land, developed by the village.'
        : 'Village land. It is joined to your island.';
  } else {
    status = 'This land is not joined to your village. Reclaim ocean and build an island bridge to reach it.';
  }

  if (t === 'forest') icon = 'i-tree';
  else if (t === 'farm') icon = 'i-wheat';
  else if (t === 'quarry') icon = 'i-stone';
  else if (t === 'houses') icon = 'i-town';

  const dev = gameState.land[cellId]?.dev ? CONFIG.dev.to[gameState.land[cellId].type as keyof typeof CONFIG.dev.to] : null;
  if (dev && (t === 'farm' || t === 'quarry')) {
    const h = RULES.health(gameState, key);
    status += ` A new place of work. Condition ${h} (${condWord(h)}).`;
  }
  if (dev && t === 'forest') {
    status += ` A new place of work for loggers: ${RULES.treesOn(gameState, key)} of ${CONFIG.treesPerTile} trees.`;
  }

  const selfId = gameState.activeId;
  if (!selfId) {
    return (
      <div className="card">
        <p>No citizen selected.</p>
      </div>
    );
  }

  const developBlock =
    mine && CONFIG.dev.from.includes(t as string) ? (
      <DevelopLandCards
        cellKey={key}
        gameState={gameState}
        selfId={selfId}
        roundOpen={roundOpen}
        busy={busy}
        onRun={onRun}
      />
    ) : null;

  const fishBlock = RULES.fishable(gameState, cellId, vl) ? (
    <GorActionCard
      iconId="i-fish"
      title="Catch fish here"
      buttonLabel="Catch fish here"
      plan={RULES.plan(gameState, selfId, 'fish', { cell: key })}
      busy={busy}
      roundOpen={roundOpen}
      onRun={() => onRun('fish', { cell: key })}
      hint={<p className="small">Any job can fish here when this ocean touches your land.</p>}
    />
  ) : null;

  return (
    <div className="stack">
      <div className="card">
        <h3>
          <GorIcon id={icon} />
          {T.name}
        </h3>
        <p>{status}</p>
        {dev ? (
          <p className="small">
            <GorIcon id="i-star" className="ic sm" /> {dev.effect}
          </p>
        ) : null}
      </div>
      {developBlock}
      {fishBlock}
    </div>
  );
}

type Props = {
  selectedTile: string | null;
  gameState: GameState;
  roundOpen: boolean;
  busy: boolean;
  onTab: (t: string) => void;
  onAction: (id: string, opt?: Record<string, unknown>) => void;
};

export default function GorTilePanel({ selectedTile, gameState, roundOpen, busy, onTab, onAction }: Props) {
  if (!selectedTile) {
    return (
      <div className="stack">
        <div className="card">
          <h3>
            <GorIcon id="i-pin" />
            Choose a tile
          </h3>
          <p>Tap a tile or a pin on the island to learn about it.</p>
        </div>
      </div>
    );
  }

  if (selectedTile.startsWith('cell:')) {
    const id = Number(selectedTile.slice(5));
    if (!Number.isFinite(id)) {
      return (
        <div className="card">
          <p>Unknown tile.</p>
        </div>
      );
    }
    return (
      <CellTilePanel
        cellId={id}
        gameState={gameState}
        roundOpen={roundOpen}
        busy={busy}
        onTab={onTab}
        onRun={onAction}
      />
    );
  }

  return <FixedTilePanel tileKey={selectedTile} gameState={gameState} onTab={onTab} roundOpen={roundOpen} busy={busy} onRun={onAction} />;
}
