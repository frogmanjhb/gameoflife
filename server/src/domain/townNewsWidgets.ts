export const TOWN_NEWS_BADGES = [
  'breaking',
  'exclusive',
  'sponsored',
  'grand_opening',
  'town_alert',
] as const;

export const TOWN_NEWS_HEADLINE_STYLES = [
  'classic',
  'tabloid',
  'business_ad',
  'event_poster',
] as const;

export const TOWN_NEWS_ACCENTS = ['teal', 'gold', 'red'] as const;

export const TOWN_NEWS_EMOJIS = [
  '🏛️',
  '💰',
  '🎉',
  '⚠️',
  '🛍️',
  '🏥',
  '📢',
  '🎯',
  '⭐',
  '🚌',
] as const;

export type TownNewsBadge = (typeof TOWN_NEWS_BADGES)[number];
export type TownNewsHeadlineStyle = (typeof TOWN_NEWS_HEADLINE_STYLES)[number];
export type TownNewsAccent = (typeof TOWN_NEWS_ACCENTS)[number];

export interface TownNewsWidgets {
  badge?: TownNewsBadge;
  headline_style?: TownNewsHeadlineStyle;
  accent?: TownNewsAccent;
  emojis?: string[];
}

export const EMPTY_TOWN_NEWS_WIDGETS: TownNewsWidgets = {};

function isBadge(value: unknown): value is TownNewsBadge {
  return typeof value === 'string' && (TOWN_NEWS_BADGES as readonly string[]).includes(value);
}

function isHeadlineStyle(value: unknown): value is TownNewsHeadlineStyle {
  return typeof value === 'string' && (TOWN_NEWS_HEADLINE_STYLES as readonly string[]).includes(value);
}

function isAccent(value: unknown): value is TownNewsAccent {
  return typeof value === 'string' && (TOWN_NEWS_ACCENTS as readonly string[]).includes(value);
}

export function parseTownNewsWidgetsFromDb(raw: unknown): TownNewsWidgets {
  if (raw == null || raw === '') return { ...EMPTY_TOWN_NEWS_WIDGETS };
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ...EMPTY_TOWN_NEWS_WIDGETS };
    }
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { ...EMPTY_TOWN_NEWS_WIDGETS };
  }
  return sanitizeTownNewsWidgets(obj);
}

export function sanitizeTownNewsWidgets(raw: unknown): TownNewsWidgets {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY_TOWN_NEWS_WIDGETS };
  }

  const input = raw as Record<string, unknown>;
  const out: TownNewsWidgets = {};

  if (input.badge != null && input.badge !== '') {
    if (isBadge(input.badge)) out.badge = input.badge;
  }

  if (input.headline_style != null && input.headline_style !== '') {
    if (isHeadlineStyle(input.headline_style)) out.headline_style = input.headline_style;
  }

  if (input.accent != null && input.accent !== '') {
    if (isAccent(input.accent)) out.accent = input.accent;
  }

  if (Array.isArray(input.emojis)) {
    const allowed = new Set<string>(TOWN_NEWS_EMOJIS);
    const picked: string[] = [];
    for (const e of input.emojis) {
      if (typeof e !== 'string' || !allowed.has(e)) continue;
      if (picked.includes(e)) continue;
      picked.push(e);
      if (picked.length >= 5) break;
    }
    if (picked.length > 0) out.emojis = picked;
  }

  return out;
}

export function widgetsToJson(widgets: TownNewsWidgets): string {
  return JSON.stringify(widgets);
}
