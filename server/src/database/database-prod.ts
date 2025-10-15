import { Pool } from 'pg';

class Database {
  private _pool: Pool;

  constructor() {
    // Try different connection methods in order of preference
    let databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
    
    // If no URL available, construct from individual parameters
    if (!databaseUrl && process.env.PGHOST) {
      const host = process.env.PGHOST;
      const port = process.env.PGPORT || '5432';
      const user = process.env.PGUSER || 'postgres';
      const password = process.env.PGPASSWORD;
      const database = process.env.PGDATABASE || 'railway';
      
      databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${database}`;
      console.log('🔗 Constructed URL from individual parameters');
    }
    
    if (!databaseUrl) {
      throw new Error('No database connection configuration found');
    }
    
    console.log('🔗 Database URL found:', databaseUrl ? 'Yes' : 'No');
    console.log('🔗 Using DATABASE_PUBLIC_URL:', !!process.env.DATABASE_PUBLIC_URL);
    console.log('🔗 Using DATABASE_URL:', !!process.env.DATABASE_URL);
    console.log('🔗 Using individual params:', !!process.env.PGHOST);
    console.log('🔗 PGHOST:', process.env.PGHOST);
    console.log('🔗 PGPORT:', process.env.PGPORT);
    console.log('🔗 PGUSER:', process.env.PGUSER);
    console.log('🔗 PGDATABASE:', process.env.PGDATABASE);
    console.log('🔗 Database URL preview:', databaseUrl.substring(0, 50) + '...');
    
    // Configure SSL based on the URL type
    const isInternalUrl = databaseUrl.includes('railway.internal');
    const isExternalUrl = databaseUrl.includes('switchback.proxy.rlwy.net');
    
    // For Railway external URLs, disable SSL
    const sslConfig = process.env.NODE_ENV === 'production' ? 
      (isExternalUrl ? false : { rejectUnauthorized: false }) : false;
    
    console.log('🔗 Using internal URL:', isInternalUrl);
    console.log('🔗 Using external URL:', isExternalUrl);
    console.log('🔗 SSL config:', sslConfig);
    
    this._pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslConfig,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
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
