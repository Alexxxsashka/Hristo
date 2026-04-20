
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateOrders() {
  try {
    console.log('🛠️ Migrating orders table with missing checkout fields...');
    
    const columns = [
      "first_name TEXT",
      "last_name TEXT",
      "email TEXT",
      "shipping_phone TEXT",
      "shipping_city TEXT",
      "shipping_postal_code TEXT",
      "discount_amount DECIMAL(10,2) DEFAULT 0",
      "points_earned INTEGER DEFAULT 0"
    ];

    for (const col of columns) {
      const colName = col.split(' ')[0];
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${col}`);
      console.log(`✅ Checked/Added ${colName}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrateOrders();
