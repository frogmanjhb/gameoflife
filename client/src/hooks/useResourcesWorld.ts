import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gameOfResourcesApi } from '../services/api';
import type { GorPlayerView } from '../types/gameOfResources';
import { viewToGameState } from '../components/game-of-resources/viewAdapter';
import type { GameState } from '@game-of-resources';

const POLL_MS = 8000;

function mergeViewPayload(
  data: GorPlayerView & { unchanged?: boolean; version?: number },
  prev: GorPlayerView | null
): GorPlayerView | null {
  if (data.unchanged) {
    if (!prev) return prev;
    return { ...prev, version: data.version ?? prev.version };
  }
  if (typeof data.worldId !== 'number') return prev;
  return data;
}

export type TeacherPreviewTarget = { townClass: string; userId: number };

export function useResourcesWorld(enabled: boolean, teacherPreview?: TeacherPreviewTarget | null) {
  const [view, setView] = useState<GorPlayerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const viewRef = useRef<GorPlayerView | null>(null);
  viewRef.current = view;

  const loadStatus = useCallback(async () => {
    if (!enabled) return;
    try {
      setError('');
      const since = viewRef.current?.version;
      const res = teacherPreview
        ? await gameOfResourcesApi.teacherStatus(teacherPreview.townClass, teacherPreview.userId, since)
        : await gameOfResourcesApi.status(since);
      const merged = mergeViewPayload(res.data, viewRef.current);
      if (!merged) return;
      if (merged.firstVisit && !teacherPreview) setShowWelcome(true);
      setView(merged);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not load the game world.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [enabled, teacherPreview?.townClass, teacherPreview?.userId]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setView(null);
      return;
    }
    setLoading(true);
    loadStatus();
  }, [enabled, loadStatus]);

  useEffect(() => {
    if (!enabled || !view) return;
    const id = window.setInterval(() => {
      loadStatus();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, view?.version, loadStatus]);

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : import.meta.env.PROD
        ? '/api'
        : 'http://localhost:5000/api';
    let closed = false;
    let abort: AbortController | null = null;

    (async () => {
      abort = new AbortController();
      try {
        const res = await fetch(`${base}/game-of-resources/events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: abort.signal,
        });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop() ?? '';
          for (const chunk of parts) {
            const line = chunk.split('\n').find((l) => l.startsWith('data: '));
            if (!line) continue;
            try {
              const payload = JSON.parse(line.slice(6)) as { version?: number };
              if (payload.version != null && payload.version !== viewRef.current?.version) {
                loadStatus();
              }
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* polling fallback */
      }
    })();

    return () => {
      closed = true;
      abort?.abort();
    };
  }, [enabled, loadStatus]);

  const applyResponse = useCallback((data: GorPlayerView) => {
    setView(data);
    const tail = data.log?.[data.log.length - 1];
    if (tail) setLiveMessage(tail.text);
  }, []);

  const runMutation = useCallback(
    async (fn: () => Promise<{ data: GorPlayerView }>) => {
      if (!viewRef.current) return null;
      setBusy(true);
      setActionError('');
      try {
        const res = await fn();
        applyResponse(res.data);
        return res.data.event ?? null;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'That action did not work. Try again.';
        setActionError(msg);
        if (status === 409) loadStatus();
        return null;
      } finally {
        setBusy(false);
      }
    },
    [applyResponse, loadStatus]
  );

  const gameState: GameState | null = useMemo(() => (view ? viewToGameState(view) : null), [view]);

  return {
    view,
    gameState,
    loading,
    error,
    actionError,
    busy,
    liveMessage,
    showWelcome,
    readOnly: !!teacherPreview,
    dismissWelcome: () => setShowWelcome(false),
    refresh: loadStatus,
    doAction: (type: string, opt: Record<string, unknown> = {}) =>
      runMutation(() =>
        gameOfResourcesApi.action({ type, opt, clientVersion: viewRef.current!.version })
      ),
    changeJob: (profession: string) =>
      runMutation(() =>
        gameOfResourcesApi.changeJob({ profession, clientVersion: viewRef.current!.version })
      ),
    storeBuy: (item: string, qty = 1) =>
      runMutation(() =>
        gameOfResourcesApi.storeBuy({ item, qty, clientVersion: viewRef.current!.version })
      ),
    storeSell: (item: string, qty = 1) =>
      runMutation(() =>
        gameOfResourcesApi.storeSell({ item, qty, clientVersion: viewRef.current!.version })
      ),
    requestBankBridge: async (coins: number) => {
      setActionError('');
      try {
        await gameOfResourcesApi.requestBankBridge(coins);
        await loadStatus();
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not submit your conversion request.';
        setActionError(msg);
        return false;
      }
    },
    saveAvatar: async (patch: Record<string, unknown>) => {
      setBusy(true);
      setActionError('');
      try {
        const res = await gameOfResourcesApi.saveAvatar(patch);
        applyResponse(res.data);
        return true;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not save your character.';
        setActionError(msg);
        return false;
      } finally {
        setBusy(false);
      }
    },
  };
}
