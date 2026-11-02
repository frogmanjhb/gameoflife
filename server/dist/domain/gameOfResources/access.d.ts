import type { Response } from 'express';
import type { PoolClient } from 'pg';
import type { AuthenticatedRequest } from '../../middleware/auth';
import type { User } from '../../types';
import type { ProfessionId } from './shared';
import type { TownClass } from './types';
export declare function isTownClass(v: unknown): v is TownClass;
export declare function displayNameForUser(user: Pick<User, 'first_name' | 'last_name' | 'username'>): string;
export declare function tablesReady(): Promise<boolean>;
export declare function requireApprovedStudentWithRules(req: AuthenticatedRequest, res: Response): Promise<User | null>;
export declare function resolveStudentTown(user: User): TownClass;
export declare function resolveTeacherTown(req: AuthenticatedRequest, res: Response): TownClass | null;
export declare function loadDisplayNameMap(client: PoolClient, schoolId: number, townClass: TownClass): Promise<Map<number, string>>;
export declare function generateNickname(userId: number, worldSeed: number): string;
export declare function stripHtml(text: string): string;
export declare function jobChangeOptsFromSettings(settings: {
    jobChange?: {
        xpCost?: number;
        perRound?: number;
        xpSource?: string;
    };
}): {
    xpCost: number;
    perRound: number;
    xpSource: "game" | "civiclab";
};
export declare function isProfessionId(v: unknown): v is ProfessionId;
export declare function requireStudentInTown(client: PoolClient, schoolId: number, townClass: TownClass, userId: number, res: Response): Promise<boolean>;
export declare function requireTeacherForSchool(req: AuthenticatedRequest, res: Response): Promise<User | null>;
export declare function schoolIdFromRequest(req: AuthenticatedRequest): number;
//# sourceMappingURL=access.d.ts.map