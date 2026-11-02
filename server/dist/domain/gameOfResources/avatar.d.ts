import type { ProfessionId } from './shared';
export type GorAvatar = {
    skin: string;
    clothes: string | null;
    ring: string;
    pos: {
        fx: number;
        fz: number;
    } | null;
};
export declare function defaultGorAvatar(profession?: ProfessionId): GorAvatar;
export declare function parseGorAvatar(raw: unknown, profession?: ProfessionId): GorAvatar;
export declare function validateAvatarPatch(current: GorAvatar, patch: Record<string, unknown>): {
    ok: true;
    avatar: GorAvatar;
} | {
    ok: false;
    reason: string;
};
//# sourceMappingURL=avatar.d.ts.map