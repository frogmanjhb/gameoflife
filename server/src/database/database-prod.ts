import { Pool } from 'pg';

class Database {
  private _pool: Pool;

  constructor() {
    this._pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const client = await this._pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    const client = await this._pool.connect();
    try {
      const result = await client.query(sql, params);
      return { lastID: result.rows[0]?.id || 0, changes: result.rowCount || 0 };
    } finally {
      client.release();
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const client = await this._pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async close() {
    await this._pool.end();
  }

  // Get pool for transactions
  get pool() {
    return this._pool;
  }
}

export default new Database();
