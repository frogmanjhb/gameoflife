import type { Response } from 'express';

type Listener = { res: Response; heartbeat: ReturnType<typeof setInterval> };

const byWorld = new Map<number, Set<Listener>>();

export function subscribeWorld(worldId: number, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(': connected\n\n');

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      /* closed */
    }
  }, 25000);

  const listener: Listener = { res, heartbeat };
  if (!byWorld.has(worldId)) byWorld.set(worldId, new Set());
  byWorld.get(worldId)!.add(listener);

  res.on('close', () => {
    clearInterval(heartbeat);
    byWorld.get(worldId)?.delete(listener);
  });
}

export function notifyWorldVersion(worldId: number, version: number): void {
  const set = byWorld.get(worldId);
  if (!set) return;
  const payload = `data: ${JSON.stringify({ version })}\n\n`;
  for (const { res } of set) {
    try {
      res.write(payload);
    } catch {
      /* ignore */
    }
  }
}

export function clearLiveListenersForTests(): void {
  for (const set of byWorld.values()) {
    for (const l of set) clearInterval(l.heartbeat);
  }
  byWorld.clear();
}
