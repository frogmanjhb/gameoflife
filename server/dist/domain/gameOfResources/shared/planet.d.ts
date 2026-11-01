export type PlanetCell = {
    id: number;
    n: [number, number, number];
    nb: number[];
    key: string | null;
    extra: boolean;
    type?: string;
    home?: boolean;
    islet?: boolean;
    land?: boolean;
    under?: string;
    tileType?: string;
    e?: number;
    m?: number;
    d?: number;
    comp?: number;
};
export type Planet = {
    UP: [number, number, number];
    E1: [number, number, number];
    G0: [number, number, number];
    verts: [number, number, number][];
    tris: number[][];
    cells: PlanetCell[];
    cellOfKey: Record<string, number>;
    hash3: (x: number, y: number, z: number, s: number) => number;
    HOME_MAX: number;
};
export declare const PLANET: Planet;
//# sourceMappingURL=planet.d.ts.map