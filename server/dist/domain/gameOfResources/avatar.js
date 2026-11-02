"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultGorAvatar = defaultGorAvatar;
exports.parseGorAvatar = parseGorAvatar;
exports.validateAvatarPatch = validateAvatarPatch;
const shared_1 = require("./shared");
const HEX = /^#[0-9a-fA-F]{6}$/;
function defaultGorAvatar(profession) {
    const clothes = profession && profession in shared_1.CONFIG.professions
        ? shared_1.CONFIG.professions[profession].colour
        : null;
    return { skin: '#f0c8a0', clothes, ring: '#ffd166', pos: null };
}
function parseGorAvatar(raw, profession) {
    const base = defaultGorAvatar(profession);
    if (!raw || typeof raw !== 'object')
        return base;
    const o = raw;
    const skin = typeof o.skin === 'string' && HEX.test(o.skin) ? o.skin : base.skin;
    const clothes = o.clothes === null ? null : typeof o.clothes === 'string' && HEX.test(o.clothes) ? o.clothes : base.clothes;
    const ring = typeof o.ring === 'string' && HEX.test(o.ring) ? o.ring : base.ring;
    let pos = null;
    if (o.pos && typeof o.pos === 'object') {
        const p = o.pos;
        const fx = Number(p.fx);
        const fz = Number(p.fz);
        if (Number.isFinite(fx) && Number.isFinite(fz))
            pos = { fx, fz };
    }
    return { skin, clothes, ring, pos };
}
function validateAvatarPatch(current, patch) {
    const merged = parseGorAvatar({ ...current, ...patch });
    if (patch.skin != null && (typeof patch.skin !== 'string' || !HEX.test(patch.skin))) {
        return { ok: false, reason: 'Choose a valid skin colour.' };
    }
    if (patch.clothes != null && patch.clothes !== null && (typeof patch.clothes !== 'string' || !HEX.test(patch.clothes))) {
        return { ok: false, reason: 'Choose a valid clothes colour.' };
    }
    if (patch.ring != null && (typeof patch.ring !== 'string' || !HEX.test(patch.ring))) {
        return { ok: false, reason: 'Choose a valid ring colour.' };
    }
    if (patch.pos != null) {
        if (patch.pos === null) {
            merged.pos = null;
        }
        else if (typeof patch.pos === 'object') {
            const p = patch.pos;
            const fx = Number(p.fx);
            const fz = Number(p.fz);
            if (!Number.isFinite(fx) || !Number.isFinite(fz)) {
                return { ok: false, reason: 'Choose a valid place on the island.' };
            }
            if (Math.abs(fx) > 8 || Math.abs(fz) > 8) {
                return { ok: false, reason: 'That spot is off the island.' };
            }
            merged.pos = { fx, fz };
        }
        else {
            return { ok: false, reason: 'Choose a valid place on the island.' };
        }
    }
    return { ok: true, avatar: merged };
}
//# sourceMappingURL=avatar.js.map