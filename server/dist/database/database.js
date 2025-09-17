"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const fs_1 = require("fs");
const path_1 = require("path");
const DB_PATH = process.env.DB_PATH || './gameoflife.db';
class Database {
    constructor() {
        this.db = new sqlite3_1.default.Database(DB_PATH);
        this.initializeDatabase();
    }
    initializeDatabase() {
        const schemaPath = (0, path_1.join)(__dirname, 'schema.sql');
        const schema = (0, fs_1.readFileSync)(schemaPath, 'utf8');
        this.db.exec(schema, (err) => {
            if (err) {
                console.error('Error initializing database:', err);
            }
            else {
                console.log('Database initialized successfully');
            }
        });
    }
    // Generic query method
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows || []);
                }
            });
        });
    }
    // Generic run method for INSERT, UPDATE, DELETE
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }
    // Get single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }
    // Close database connection
    close() {
        this.db.close();
    }
}
exports.default = new Database();
//# sourceMappingURL=database.js.map