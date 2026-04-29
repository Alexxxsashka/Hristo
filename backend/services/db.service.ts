import pg from 'pg';
import { seedDatabase } from './seed.service.js';

const createPool = () => {
  const connectionString = 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.hrdatabase_DATABASE_URL || 
    process.env.hrdatabase_POSTGRES_URL ||
    "postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

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

const initSchema = async () => {
  console.log('🚀 Initializing database schema...');
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // 1. Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        username TEXT,
        password TEXT,
        password_hash TEXT,
        role TEXT DEFAULT 'user',
        points INTEGER DEFAULT 0,
        rank TEXT DEFAULT 'recruit',
        discount_level INTEGER DEFAULT 0,
        stripe_customer_id TEXT,
        phone TEXT,
        address TEXT,
        callsign TEXT,
        team_name TEXT,
        addresses JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_hr TEXT,
        slug TEXT UNIQUE,
        image_url TEXT,
        parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        parent TEXT,
        filters JSONB DEFAULT '[]',
        discount INTEGER DEFAULT 0,
        slots JSONB DEFAULT '[]',
        compatible_module_categories JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        uid TEXT,
        sku TEXT,
        barcode TEXT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        name_hr TEXT,
        description TEXT,
        description_hr TEXT,
        long_description TEXT,
        long_description_hr TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        landing_cost DECIMAL(10,2),
        msrp DECIMAL(10,2),
        stock INTEGER DEFAULT 0,
        discount INTEGER DEFAULT 0,
        category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        subcategory TEXT,
        brand TEXT,
        model TEXT,
        image_url TEXT,
        images JSONB DEFAULT '[]',
        model_3d_url TEXT,
        model3d_name TEXT,
        has_3d BOOLEAN DEFAULT FALSE,
        type TEXT,
        characteristics JSONB DEFAULT '[]',
        variants JSONB DEFAULT '[]',
        variant_attributes JSONB DEFAULT '[]',
        category_filters JSONB DEFAULT '{}',
        compatible_ids JSONB DEFAULT '[]',
        compatible_module_categories JSONB DEFAULT '[]',
        socket_point JSONB DEFAULT '[0,0,0]',
        slots JSONB DEFAULT '[]',
        attachment_slot TEXT,
        mount_type TEXT,
        variants_group_id TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        total DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        shipping_cost DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        shipping_address JSONB,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        shipping_city TEXT,
        shipping_phone TEXT,
        shipping_postal_code TEXT,
        tracking_number TEXT,
        stripe_payment_intent_id TEXT,
        notes TEXT,
        profit DECIMAL(10,2),
        points_earned INTEGER DEFAULT 0,
        stock_deducted BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Order Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL,
        image TEXT,
        sku TEXT,
        category TEXT,
        variant_info JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Blog Posts
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT,
        author TEXT,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        image_url TEXT,
        category TEXT,
        tags JSONB DEFAULT '[]',
        slug TEXT UNIQUE NOT NULL,
        read_time TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Site Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        hero_slides JSONB DEFAULT '[]',
        promo_banners JSONB DEFAULT '[]',
        announcement_bar JSONB DEFAULT '{}',
        footer_settings JSONB DEFAULT '{}',
        hero_feature_image TEXT,
        hero_feature_video TEXT,
        hero_feature_media_type TEXT DEFAULT 'image',
        hero_feature_title TEXT,
        hero_feature_subtitle TEXT,
        hero_feature_link TEXT,
        hero_feature_link_text TEXT,
        logo_url TEXT,
        hero_image_url TEXT,
        hero_title TEXT,
        hero_subtitle TEXT,
        featured_categories_list JSONB DEFAULT '[]',
        contact_email TEXT,
        contact_phone TEXT,
        address TEXT,
        facebook_url TEXT,
        instagram_url TEXT,
        youtube_url TEXT,
        announcement TEXT,
        show_announcement BOOLEAN DEFAULT TRUE,
        announcement_link TEXT,
        about_us_title TEXT,
        about_us_text TEXT,
        about_us_image TEXT,
        about_us_link TEXT,
        footer_tags TEXT[] DEFAULT '{}',
        footer_description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Product Compatibility
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_compatibility (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_uid TEXT NOT NULL,
        child_uid TEXT NOT NULL,
        slot_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(parent_uid, child_uid, slot_name)
      )
    `);

    // 9. Coupons
    await client.query(`
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
      )
    `);

    // 10. Contact Messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Audit Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT,
        user_email TEXT,
        user_name TEXT,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        severity TEXT DEFAULT 'info',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 12. Policies
    await client.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT,
        title_hr TEXT,
        content_hr TEXT,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 13. Saved Builds
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_builds (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        configuration JSONB NOT NULL,
        preview_image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 🎯 Patching columns if they don't exist (for existing databases)
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
    await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent TEXT');
    await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS slots JSONB DEFAULT \'[]\'');
    await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS compatible_module_categories JSONB DEFAULT \'[]\'');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS uid TEXT');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS model TEXT');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS landing_cost DECIMAL');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS msrp DECIMAL');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS model3d_name TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS callsign TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS team_name TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT \'[]\'');

    console.log('✅ Database schema initialized/verified');
  } catch (err) {
    console.error('❌ Database schema initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
};

export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Cloud DB Connected at:', res.rows[0].now);
    await initSchema();
    await seedDatabase();
  } catch (err: any) {
    console.error('❌ Cloud DB Connection Error:', err.message);
    throw err;
  }
};
