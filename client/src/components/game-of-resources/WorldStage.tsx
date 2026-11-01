import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import type { GameState } from '@game-of-resources';
import { createWorld, type World3DCallbacks } from './world3d/createWorld';

export type WorldStageHandle = {
  playAction: (citizenId: string, tileKey: string) => void;
  floatLabel: (text: string, key?: string) => void;
  flyTo: (key: string) => void;
  setPlacingMode: (on: boolean) => void;
};

type Props = {
  state: GameState | null;
  onSelectTile: (key: string) => void;
  onFigureClick?: (citizenId: string) => void;
  onPlaceFigure?: (tileKey: string, fx: number, fz: number) => void;
  placingMode?: boolean;
  onCancelPlacing?: () => void;
  selectedKey: string | null;
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
  moodCaption?: string;
};

const WorldStage = forwardRef<WorldStageHandle, Props>(function WorldStage(
  { state, onSelectTile, onFigureClick, onPlaceFigure, placingMode, onCancelPlacing, selectedKey, expanded, onExpandedChange, moodCaption },
  ref
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ReturnType<typeof createWorld> | null>(null);
  const labelsOn = useRef(true);
  const onSelectRef = useRef(onSelectTile);
  const onFigureRef = useRef(onFigureClick);
  const onPlaceRef = useRef(onPlaceFigure);
  onSelectRef.current = onSelectTile;
  onFigureRef.current = onFigureClick;
  onPlaceRef.current = onPlaceFigure;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const host = hostRef.current;
    const labelsEl = labelsRef.current;
    if (!host || !labelsEl) return;

    const cb: World3DCallbacks = {
      onSelect: (key) => onSelectRef.current(key),
      onFigureClick: (cid) => onFigureRef.current?.(cid),
      onPlaceFigure: (cid, key, fx, fz) => {
        if (stateRef.current?.activeId === cid) onPlaceRef.current?.(key, fx, fz);
      },
    };
    const api = createWorld(host, labelsEl, cb);
    apiRef.current = api;
    if (stateRef.current) api.sync(stateRef.current);

    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (state && apiRef.current) apiRef.current.sync(state);
  }, [state]);

  useEffect(() => {
    if (!apiRef.current || !selectedKey) return;
    apiRef.current.select(selectedKey);
  }, [selectedKey]);

  useEffect(() => {
    apiRef.current?.setPlacingMode(!!placingMode);
  }, [placingMode]);

  useImperativeHandle(ref, () => ({
    playAction: (cid, key) => apiRef.current?.playAction(cid, key),
    floatLabel: (text, key) => apiRef.current?.floatLabel(text, key),
    flyTo: (key) => apiRef.current?.flyTo(key),
    setPlacingMode: (on) => apiRef.current?.setPlacingMode(on),
  }));

  return (
    <section
      className={`stage${!state?.round.open ? ' is-night' : ''}`}
      tabIndex={0}
      aria-label="Planet map"
    >
      <div className="canvas-host" ref={hostRef} />
      <div className="labels" ref={labelsRef} />
      <div className="rail" role="toolbar" aria-label="View controls">
        <button type="button" aria-label="Zoom in" onClick={() => apiRef.current?.zoomBy(1.25)}>
          <svg className="ic">
            <use href="#i-zin" />
          </svg>
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => apiRef.current?.zoomBy(0.8)}>
          <svg className="ic">
            <use href="#i-zout" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={expanded ? 'Close the expanded view' : 'Expand the planet view'}
          aria-pressed={expanded}
          onClick={() => onExpandedChange(!expanded)}
        >
          <svg className="ic">
            <use href="#i-expand" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={labelsOn.current ? 'Hide tile labels' : 'Show tile labels'}
          onClick={() => {
            labelsOn.current = !labelsOn.current;
            apiRef.current?.setLabels(labelsOn.current);
          }}
        >
          <svg className="ic">
            <use href="#i-tag" />
          </svg>
        </button>
        <button type="button" aria-label="Reset the view" onClick={() => apiRef.current?.home()}>
          <svg className="ic">
            <use href="#i-home" />
          </svg>
        </button>
      </div>
      {placingMode ? (
        <div className="hint gor-place-hint" role="status">
          <span>Tap a land tile to place your character.</span>
          {onCancelPlacing ? (
            <button type="button" className="btn lite-btn" onClick={onCancelPlacing}>
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}
      {!state?.round.open && (
        <div className="closed-banner">
          <svg className="ic" aria-hidden="true">
            <use href="#i-lock" />
          </svg>
          <span>The round is closed. Your teacher will open the next round.</span>
        </div>
      )}
      {moodCaption ? (
        <p className="caption" aria-live="polite">
          {moodCaption}
        </p>
      ) : null}
      <div className="turn" role="group" aria-label="Turn the planet">
        <button type="button" aria-label="Turn left" onClick={() => apiRef.current?.rotate(-1)}>
          <svg className="ic">
            <use href="#i-rotl" />
          </svg>
        </button>
        <button type="button" className="wide" onClick={() => apiRef.current?.tour()}>
          <svg className="ic">
            <use href="#i-tour" />
          </svg>
          Tour
        </button>
        <button type="button" aria-label="Turn right" onClick={() => apiRef.current?.rotate(1)}>
          <svg className="ic">
            <use href="#i-rotr" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        className="btn lite-btn"
        onClick={() => {
          apiRef.current?.disableAutoLite();
          apiRef.current?.setLite(!apiRef.current?.isLite());
        }}
      >
        <svg className="ic sm" aria-hidden="true">
          <use href="#i-bolt" />
        </svg>
        <span>Graphics</span>
      </button>
    </section>
  );
});

export default WorldStage;
