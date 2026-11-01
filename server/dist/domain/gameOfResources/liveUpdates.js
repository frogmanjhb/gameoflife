"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeWorld = subscribeWorld;
exports.notifyWorldVersion = notifyWorldVersion;
exports.clearLiveListenersForTests = clearLiveListenersForTests;
const byWorld = new Map();
function subscribeWorld(worldId, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(': connected\n\n');
    const heartbeat = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        }
        catch {
            /* closed */
        }
    }, 25000);
    const listener = { res, heartbeat };
    if (!byWorld.has(worldId))
        byWorld.set(worldId, new Set());
    byWorld.get(worldId).add(listener);
    res.on('close', () => {
        clearInterval(heartbeat);
        byWorld.get(worldId)?.delete(listener);
    });
}
function notifyWorldVersion(worldId, version) {
    const set = byWorld.get(worldId);
    if (!set)
        return;
    const payload = `data: ${JSON.stringify({ version })}\n\n`;
    for (const { res } of set) {
        try {
            res.write(payload);
        }
        catch {
            /* ignore */
        }
    }
}
function clearLiveListenersForTests() {
    for (const set of byWorld.values()) {
        for (const l of set)
            clearInterval(l.heartbeat);
    }
    byWorld.clear();
}
//# sourceMappingURL=liveUpdates.js.map