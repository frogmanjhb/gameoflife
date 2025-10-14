import { Pool } from 'pg';

class Database {
  private _pool: Pool;

  constructor() {
    // Railway uses DATABASE_PUBLIC_URL for external access, DATABASE_URL for internal
    const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL or DATABASE_PUBLIC_URL environment variable is required for PostgreSQL connection');
    }
    
    console.log('🔗 Database URL found:', databaseUrl ? 'Yes' : 'No');
    console.log('🔗 Using DATABASE_PUBLIC_URL:', !!process.env.DATABASE_PUBLIC_URL);
    console.log('🔗 Using DATABASE_URL:', !!process.env.DATABASE_URL);
    console.log('🔗 Database URL preview:', databaseUrl.substring(0, 20) + '...');
    
    // Configure SSL based on the URL type
    const isInternalUrl = databaseUrl.includes('railway.internal');
    const sslConfig = process.env.NODE_ENV === 'production' ? 
      (isInternalUrl ? false : { rejectUnauthorized: false }) : false;
    
    console.log('🔗 Using internal URL:', isInternalUrl);
    console.log('🔗 SSL config:', sslConfig);
    
    this._pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslConfig
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

  async getClient() {
    return await this._pool.connect();
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
