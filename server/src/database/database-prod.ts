import { Pool } from 'pg';

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      // Connection pool optimization
      max: 20, // Maximum number of clients in the pool
      min: 2,  // Minimum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      acquireTimeoutMillis: 60000, // Return an error after 60 seconds if a client could not be acquired
    });
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return { lastID: result.rows[0]?.id || 0, changes: result.rowCount || 0 };
    } finally {
      client.release();
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

export default new Database();
