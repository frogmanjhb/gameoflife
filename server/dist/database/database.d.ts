declare class Database {
    private db;
    constructor();
    private initializeDatabase;
    query(sql: string, params?: any[]): Promise<any[]>;
    run(sql: string, params?: any[]): Promise<{
        lastID: number;
        changes: number;
    }>;
    get(sql: string, params?: any[]): Promise<any>;
    close(): void;
}
declare const _default: Database;
export default _default;
//# sourceMappingURL=database.d.ts.map