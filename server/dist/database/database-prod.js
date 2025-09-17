"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const isProduction = process.env.NODE_ENV === 'production';
class Database {
    constructor() {
        this.pool = null;
        if (isProduction) {
            this.pool = new pg_1.Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                }
            });
        }
    }
    async query(sql, params = []) {
        if (isProduction && this.pool) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(sql, params);
                return result.rows;
            }
            finally {
                client.release();
            }
        }
        else {
            // Fallback to SQLite for development
            const sqlite3 = require('sqlite3');
            const DB_PATH = process.env.DB_PATH || './gameoflife.db';
            const db = new sqlite3.Database(DB_PATH);
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(rows || []);
                    }
                });
            });
        }
    }
    async run(sql, params = []) {
        if (isProduction && this.pool) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(sql, params);
                return { lastID: result.rows[0]?.id || 0, changes: result.rowCount || 0 };
            }
            finally {
                client.release();
            }
        }
        else {
            // Fallback to SQLite for development
            const sqlite3 = require('sqlite3');
            const DB_PATH = process.env.DB_PATH || './gameoflife.db';
            const db = new sqlite3.Database(DB_PATH);
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve({ lastID: this.lastID, changes: this.changes });
                    }
                });
            });
        }
    }
    async get(sql, params = []) {
        if (isProduction && this.pool) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(sql, params);
                return result.rows[0] || null;
            }
            finally {
                client.release();
            }
        }
        else {
            // Fallback to SQLite for development
            const sqlite3 = require('sqlite3');
            const DB_PATH = process.env.DB_PATH || './gameoflife.db';
            const db = new sqlite3.Database(DB_PATH);
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(row);
                    }
                });
            });
        }
    }
    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}
exports.default = new Database();
//# sourceMappingURL=database-prod.js.map