import { TownNewsWidgets } from '../types';

export const TOWN_NEWS_BADGE_OPTIONS: { id: NonNullable<TownNewsWidgets['badge']>; label: string }[] = [
  { id: 'breaking', label: 'Breaking' },
  { id: 'exclusive', label: 'Exclusive' },
  { id: 'sponsored', label: 'Sponsored' },
  { id: 'grand_opening', label: 'Grand Opening' },
  { id: 'town_alert', label: 'Town Alert' },
];

export const TOWN_NEWS_HEADLINE_STYLE_OPTIONS: {
  id: NonNullable<TownNewsWidgets['headline_style']>;
  label: string;
}[] = [
  { id: 'classic', label: 'Classic news' },
  { id: 'tabloid', label: 'Tabloid (SHOCK!)' },
  { id: 'business_ad', label: 'Business ad' },
  { id: 'event_poster', label: 'Event poster' },
];

export const TOWN_NEWS_ACCENT_OPTIONS: { id: NonNullable<TownNewsWidgets['accent']>; label: string }[] = [
  { id: 'teal', label: 'Teal' },
  { id: 'gold', label: 'Gold' },
  { id: 'red', label: 'Red' },
];

export const TOWN_NEWS_EMOJI_OPTIONS = ['🏛️', '💰', '🎉', '⚠️', '🛍️', '🏥', '📢', '🎯', '⭐', '🚌'] as const;

export const EMPTY_TOWN_NEWS_WIDGETS: TownNewsWidgets = {};

export function badgeLabel(badge: NonNullable<TownNewsWidgets['badge']>): string {
  return TOWN_NEWS_BADGE_OPTIONS.find((b) => b.id === badge)?.label.toUpperCase() ?? badge;
}

export function badgeClassName(badge: NonNullable<TownNewsWidgets['badge']>): string {
  switch (badge) {
    case 'breaking':
      return 'bg-red-600 text-white';
    case 'exclusive':
      return 'bg-purple-700 text-white';
    case 'sponsored':
      return 'bg-slate-600 text-white';
    case 'grand_opening':
      return 'bg-amber-500 text-slate-900';
    case 'town_alert':
      return 'bg-orange-500 text-white';
    default:
      return 'bg-gray-700 text-white';
  }
}

export function headlineStyleClassName(style: NonNullable<TownNewsWidgets['headline_style']>): string {
  switch (style) {
    case 'tabloid':
      return 'text-2xl sm:text-3xl font-black uppercase tracking-tight text-red-700 leading-tight';
    case 'business_ad':
      return 'text-xl sm:text-2xl font-semibold text-slate-800 leading-snug';
    case 'event_poster':
      return 'text-2xl sm:text-3xl font-bold text-purple-700 leading-tight';
    case 'classic':
    default:
      return 'text-xl sm:text-2xl font-bold text-gray-900 font-serif leading-snug';
  }
}

export function accentBarClassName(accent: NonNullable<TownNewsWidgets['accent']>): string {
  switch (accent) {
    case 'teal':
      return 'bg-teal-500';
    case 'gold':
      return 'bg-amber-500';
    case 'red':
      return 'bg-red-600';
    default:
      return 'bg-gray-400';
  }
}

export function hasWidgets(widgets?: TownNewsWidgets | null): boolean {
  if (!widgets) return false;
  return Boolean(
    widgets.badge ||
      widgets.headline_style ||
      widgets.accent ||
      (widgets.emojis && widgets.emojis.length > 0)
  );
}
