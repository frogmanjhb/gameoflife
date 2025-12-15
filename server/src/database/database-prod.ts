import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load .env before anything else
dotenv.config();

class Database {
  private _pool: Pool;

  constructor() {
    // Try different connection methods in order of preference
    let databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
    
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
    
    // Disable SSL completely for Railway connections
    const sslConfig = false;
    
    console.log('🔗 Using internal URL:', isInternalUrl);
    console.log('🔗 Using external URL:', isExternalUrl);
    console.log('🔗 SSL config:', sslConfig);
    
    this._pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslConfig,
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 30000,
      max: 10,
      min: 2
    });
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`🔍 DB Query: ${sql.substring(0, 50)}...`);
        const client = await this._pool.connect();
        try {
        const result = await client.query(sql, params);
        console.log(`✅ DB Query successful, returned ${result.rows?.length || 0} rows`);
        return result.rows || [];
        } finally {
          client.release();
        }
      } catch (error) {
        retries--;
        console.error(`❌ Database query failed (${retries} attempts left):`, error);
        if (retries === 0) throw error;
        console.log(`🔄 Retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('All retry attempts failed');
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`🔍 DB Run: ${sql.substring(0, 50)}...`);
        const client = await this._pool.connect();
        try {
        const result = await client.query(sql, params);
        console.log(`✅ DB Run successful, ${result.rowCount || 0} rows affected`);
        return { lastID: result.rows?.[0]?.id || 0, changes: result.rowCount || 0 };
        } finally {
          client.release();
        }
      } catch (error) {
        retries--;
        console.error(`❌ Database run failed (${retries} attempts left):`, error);
        if (retries === 0) throw error;
        console.log(`🔄 Retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('All retry attempts failed');
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`🔍 DB Get: ${sql.substring(0, 50)}...`);
        const client = await this._pool.connect();
        try {
        const result = await client.query(sql, params);
        console.log(`✅ DB Get successful, ${result.rows?.length || 0} rows returned`);
        return result.rows?.[0] || null;
        } finally {
          client.release();
        }
      } catch (error) {
        retries--;
        console.error(`❌ Database get failed (${retries} attempts left):`, error);
        if (retries === 0) throw error;
        console.log(`🔄 Retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('All retry attempts failed');
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
