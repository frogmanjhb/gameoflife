export type TownClass = '6A' | '6B' | '6C';
export declare function isTownClass(value: unknown): value is TownClass;
export declare function resolveViewerTownClass(user: {
    role?: string;
    class?: string | null;
} | null | undefined, queryClass: unknown): TownClass | null;
export declare function viewerTownClassError(userRole: string | undefined): string;
//# sourceMappingURL=townScope.d.ts.map