
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Adding stripe_customer_id to users...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT');
    
    console.log('Adding stripe_payment_intent_id to orders...');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT');
    
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

main();
