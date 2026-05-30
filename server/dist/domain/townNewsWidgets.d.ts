export declare const TOWN_NEWS_BADGES: readonly ["breaking", "exclusive", "sponsored", "grand_opening", "town_alert"];
export declare const TOWN_NEWS_HEADLINE_STYLES: readonly ["classic", "tabloid", "business_ad", "event_poster"];
export declare const TOWN_NEWS_ACCENTS: readonly ["teal", "gold", "red"];
export declare const TOWN_NEWS_EMOJIS: readonly ["🏛️", "💰", "🎉", "⚠️", "🛍️", "🏥", "📢", "🎯", "⭐", "🚌"];
export type TownNewsBadge = (typeof TOWN_NEWS_BADGES)[number];
export type TownNewsHeadlineStyle = (typeof TOWN_NEWS_HEADLINE_STYLES)[number];
export type TownNewsAccent = (typeof TOWN_NEWS_ACCENTS)[number];
export interface TownNewsWidgets {
    badge?: TownNewsBadge;
    headline_style?: TownNewsHeadlineStyle;
    accent?: TownNewsAccent;
    emojis?: string[];
}
export declare const EMPTY_TOWN_NEWS_WIDGETS: TownNewsWidgets;
export declare function parseTownNewsWidgetsFromDb(raw: unknown): TownNewsWidgets;
export declare function sanitizeTownNewsWidgets(raw: unknown): TownNewsWidgets;
export declare function widgetsToJson(widgets: TownNewsWidgets): string;
//# sourceMappingURL=townNewsWidgets.d.ts.map