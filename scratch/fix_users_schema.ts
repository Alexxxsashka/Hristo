
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixUsersSchema() {
  try {
    console.log('🛠️ Fixing users schema...');
    
    // Add phone column
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT");
    console.log('✅ Added phone column');
    
    // Add address column
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT");
    console.log('✅ Added address column');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to fix schema:', err);
    process.exit(1);
  }
}

fixUsersSchema();
