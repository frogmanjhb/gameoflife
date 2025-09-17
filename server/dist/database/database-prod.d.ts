declare class Database {
    private pool;
    constructor();
    query(sql: string, params?: any[]): Promise<any[]>;
    run(sql: string, params?: any[]): Promise<{
        lastID: number;
        changes: number;
    }>;
    get(sql: string, params?: any[]): Promise<any>;
    close(): Promise<void>;
}
declare const _default: Database;
export default _default;
//# sourceMappingURL=database-prod.d.ts.map