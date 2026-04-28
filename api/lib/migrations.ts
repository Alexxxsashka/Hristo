
import pg from 'pg';
const { Pool } = pg;
type Pool = pg.Pool;

export interface MigrationResult {
  name: string;
  success: boolean;
  message?: string;
  error?: string;
}

export async function runAllMigrations(pool: Pool): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  const migrations = [
    migrateSchema,
    migrateSiteSettings,
    migrateCategoryFilters,
    cleanupOrphanedBlobs
  ];

  for (const migration of migrations) {
    try {
      const res = await migration(pool);
      results.push(res);
    } catch (err: any) {
      results.push({
        name: migration.name,
        success: false,
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Basic Schema Migrations (Tables and Columns)
 */
async function migrateSchema(pool: Pool): Promise<MigrationResult> {
  const tasks = [
    // Extensions
    "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"",
    
    // Products
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS attachment_slot TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS mount_type TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS model3d_name TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS has_3d BOOLEAN DEFAULT FALSE",
    
    // Categories
    "ALTER TABLE categories ADD COLUMN IF NOT EXISTS filters JSONB DEFAULT '[]'",
    
    // Orders
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS first_name TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_name TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0",
    
    // Order Items
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image TEXT",
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku TEXT",
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS category TEXT",
    
    // Users
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT",
    
    // Tables
    `CREATE TABLE IF NOT EXISTS product_compatibility (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_uid TEXT NOT NULL,
      child_uid TEXT NOT NULL,
      slot_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(parent_uid, child_uid, slot_name)
    )`,
    
    `CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      hero_slides JSONB DEFAULT '[]',
      promo_banners JSONB DEFAULT '[]',
      announcement_bar JSONB DEFAULT '{}',
      footer_settings JSONB DEFAULT '{}',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      user_email TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      severity TEXT DEFAULT 'info',
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tasks) {
    await pool.query(sql);
  }

  return { name: 'migrateSchema', success: true, message: `Executed ${tasks.length} schema tasks` };
}

/**
 * Site Settings specific migrations (e.g. adding columns for new features)
 */
async function migrateSiteSettings(pool: Pool): Promise<MigrationResult> {
  const tasks = [
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_feature_image TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_feature_video TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_feature_media_type TEXT DEFAULT 'image'",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_feature_title TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_feature_subtitle TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_feature_link TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_feature_link_text TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_url TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_image_url TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_title TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_subtitle TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS featured_categories_list JSONB DEFAULT '[]'",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_email TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS address TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS youtube_url TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS announcement TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS show_announcement BOOLEAN DEFAULT TRUE",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS announcement_link TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_us_title TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_us_text TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_us_image TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS about_us_link TEXT",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_tags TEXT[] DEFAULT '{}'",
    "ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_description TEXT"
  ];

  for (const sql of tasks) {
    await pool.query(sql);
  }

  return { name: 'migrateSiteSettings', success: true, message: `Executed ${tasks.length} settings tasks` };
}

/**
 * Category Filters Data Migration
 */
async function migrateCategoryFilters(pool: Pool): Promise<MigrationResult> {
  // Example: Migrate old string filters to JSONB if needed
  // Currently just a placeholder for logic
  return { name: 'migrateCategoryFilters', success: true, message: 'No data migration needed at this time' };
}

/**
 * Blob Storage Cleanup (Placeholder)
 * In a real scenario, this would list blobs and cross-reference with DB
 */
async function cleanupOrphanedBlobs(pool: Pool): Promise<MigrationResult> {
  // Logic to find blobs not referenced in products/settings
  return { name: 'cleanupOrphanedBlobs', success: true, message: 'Orphaned blob cleanup skipped (safety)' };
}
