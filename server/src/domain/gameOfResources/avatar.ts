import { CONFIG } from './shared';
import type { ProfessionId } from './shared';

export type GorAvatar = {
  skin: string;
  clothes: string | null;
  ring: string;
  pos: { fx: number; fz: number } | null;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function defaultGorAvatar(profession?: ProfessionId): GorAvatar {
  const clothes =
    profession && profession in CONFIG.professions
      ? CONFIG.professions[profession as keyof typeof CONFIG.professions].colour
      : null;
  return { skin: '#f0c8a0', clothes, ring: '#ffd166', pos: null };
}

export function parseGorAvatar(raw: unknown, profession?: ProfessionId): GorAvatar {
  const base = defaultGorAvatar(profession);
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const skin = typeof o.skin === 'string' && HEX.test(o.skin) ? o.skin : base.skin;
  const clothes =
    o.clothes === null ? null : typeof o.clothes === 'string' && HEX.test(o.clothes) ? o.clothes : base.clothes;
  const ring = typeof o.ring === 'string' && HEX.test(o.ring) ? o.ring : base.ring;
  let pos: GorAvatar['pos'] = null;
  if (o.pos && typeof o.pos === 'object') {
    const p = o.pos as Record<string, unknown>;
    const fx = Number(p.fx);
    const fz = Number(p.fz);
    if (Number.isFinite(fx) && Number.isFinite(fz)) pos = { fx, fz };
  }
  return { skin, clothes, ring, pos };
}

export function validateAvatarPatch(
  current: GorAvatar,
  patch: Record<string, unknown>
): { ok: true; avatar: GorAvatar } | { ok: false; reason: string } {
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
    } else if (typeof patch.pos === 'object') {
      const p = patch.pos as Record<string, unknown>;
      const fx = Number(p.fx);
      const fz = Number(p.fz);
      if (!Number.isFinite(fx) || !Number.isFinite(fz)) {
        return { ok: false, reason: 'Choose a valid place on the island.' };
      }
      if (Math.abs(fx) > 8 || Math.abs(fz) > 8) {
        return { ok: false, reason: 'That spot is off the island.' };
      }
      merged.pos = { fx, fz };
    } else {
      return { ok: false, reason: 'Choose a valid place on the island.' };
    }
  }
  return { ok: true, avatar: merged };
}
