
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixSchema() {
  try {
    console.log('🛠️ Fixing order_items schema...');
    
    // Add image column
    await pool.query("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image TEXT");
    console.log('✅ Added image column');
    
    // Add sku column
    await pool.query("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku TEXT");
    console.log('✅ Added sku column');

    // Add category column (useful for analytics)
    await pool.query("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS category TEXT");
    console.log('✅ Added category column');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to fix schema:', err);
    process.exit(1);
  }
}

fixSchema();
