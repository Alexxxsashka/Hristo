import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations/sql');

export const runMigrations = async () => {
  console.log('🚀 Checking for database migrations...');
  
  const client = await pool.connect();
  try {
    // 1. Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Get list of files in migrations/sql
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // 3. Get applied migrations
    const { rows: applied } = await client.query('SELECT name FROM migrations');
    const appliedNames = new Set(applied.map(r => r.name));

    // 4. Run pending migrations
    for (const file of files) {
      if (!appliedNames.has(file)) {
        console.log(`📜 Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        
        await client.query('BEGIN');
        try {
          // Split SQL by semicolon if needed, but simple query(sql) works for multiple statements in PG
          await client.query(sql);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`✅ Successfully applied ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Failed to apply ${file}:`, error);
          throw error;
        }
      }
    }
    
    console.log('✨ All migrations are up to date.');
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
