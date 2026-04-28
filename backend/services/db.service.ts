import pg from 'pg';
import { runMigrations } from './migration.service.js';


const createPool = () => {
  const connectionString = 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.hrdatabase_DATABASE_URL || 
    process.env.hrdatabase_POSTGRES_URL;

  if (connectionString) {
    return new pg.Pool({
      connectionString,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
  }
  
  return new pg.Pool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "postgres",
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });
};

export const pool = createPool();

export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Cloud DB Connected at:', res.rows[0].now);
    await runMigrations();
  } catch (err: any) {
    console.error('❌ Cloud DB Connection Error:', err.message);
    throw err;
  }
};
