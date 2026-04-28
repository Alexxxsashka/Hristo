import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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

export const initSchema = async () => {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
      
      ALTER TABLE products ADD COLUMN IF NOT EXISTS long_description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS name_hr TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description_hr TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS long_description_hr TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS characteristics JSONB DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_attributes JSONB DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category_filters JSONB DEFAULT '{}';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_ids JSONB DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_module_categories JSONB DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS socket_point JSONB DEFAULT '[0,0,0]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS slots JSONB DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS attachment_slot TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS mount_type TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS variants_group_id TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS model TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS landing_cost DECIMAL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS msrp DECIMAL;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;

      ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_hr TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS filters JSONB DEFAULT '[]';

      CREATE TABLE IF NOT EXISTS product_compatibility (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_uid TEXT NOT NULL,
        child_uid TEXT NOT NULL,
        slot_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(parent_uid, child_uid, slot_name)
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        value DECIMAL NOT NULL,
        product_id TEXT,
        category_id TEXT,
        min_order_amount DECIMAL DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ DB Schema verified');
  } catch (err) {
    console.error('❌ DB Schema update error:', err);
    throw err;
  }
};

export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Cloud DB Connected at:', res.rows[0].now);
    await initSchema();
  } catch (err: any) {
    console.error('❌ Cloud DB Connection Error:', err.message);
    throw err;
  }
};
