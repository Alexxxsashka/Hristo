-- Baseline Schema Migration
-- 001_baseline.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    points INTEGER DEFAULT 0,
    rank TEXT DEFAULT 'recruit',
    discount_level INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_hr TEXT,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    filters JSONB DEFAULT '[]',
    discount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_hr TEXT,
    description TEXT,
    description_hr TEXT,
    long_description TEXT,
    long_description_hr TEXT,
    price DECIMAL(10,2) NOT NULL,
    landing_cost DECIMAL(10,2),
    msrp DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    discount INTEGER DEFAULT 0,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    subcategory TEXT REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    images JSONB DEFAULT '[]',
    model_3d_url TEXT,
    model3d_name TEXT,
    has_3d BOOLEAN DEFAULT FALSE,
    type TEXT, -- e.g., 'primary', 'secondary', 'attachment'
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
    barcode TEXT,
    variants_group_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders Table
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
);

-- 5. Order Items Table
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
);

-- 6. Blog Posts Table
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
);

-- 7. Site Settings Table
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
);

-- 8. Product Compatibility
CREATE TABLE IF NOT EXISTS product_compatibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_uid TEXT NOT NULL,
    child_uid TEXT NOT NULL,
    slot_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_uid, child_uid, slot_name)
);

-- 9. Coupons Table
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

-- 10. Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Audit Logs Table
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
);

-- 12. Inventory Logs Table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id SERIAL PRIMARY KEY,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT,
    change_amount INTEGER NOT NULL,
    previous_balance INTEGER,
    new_balance INTEGER,
    reason TEXT,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Saved Builds Table
CREATE TABLE IF NOT EXISTS saved_builds (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    configuration JSONB NOT NULL,
    preview_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Currency Rates Table
CREATE TABLE IF NOT EXISTS currency_rates (
    code TEXT PRIMARY KEY,
    rate DECIMAL(15,6) NOT NULL,
    symbol TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 🎯 Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
