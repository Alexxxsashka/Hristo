-- Схема базы данных для Airsoft Store (PostgreSQL)

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    display_name TEXT,
    callsign TEXT,
    team_name TEXT,
    password TEXT,
    role TEXT DEFAULT 'user',
    points INTEGER DEFAULT 0,
    rank TEXT DEFAULT 'Recruit',
    discount_level INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Категории товаров
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_hr TEXT,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    parent_id TEXT REFERENCES categories(id),
    discount INTEGER DEFAULT 0,
    filters JSONB DEFAULT '[]'
);

-- Товары
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    sku TEXT,
    barcode TEXT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    type TEXT NOT NULL, -- weapon, module, gear, part, consumable
    category_id TEXT REFERENCES categories(id),
    subcategory TEXT,
    brand TEXT,
    model TEXT,
    price DECIMAL(10, 2) NOT NULL,
    landing_cost DECIMAL(10, 2),
    msrp DECIMAL(10, 2),
    currency TEXT DEFAULT 'EUR',
    discount INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    image_url TEXT,
    images JSONB DEFAULT '[]',
    model_3d_url TEXT,
    mesh_name TEXT,
    has_3d BOOLEAN DEFAULT false,
    mount_type TEXT,
    characteristics JSONB DEFAULT '[]',
    variant_attributes JSONB DEFAULT '[]',
    variants JSONB DEFAULT '[]',
    category_filters JSONB DEFAULT '{}',
    slots JSONB DEFAULT '[]',
    compatible_module_categories JSONB DEFAULT '[]',
    attach_points JSONB DEFAULT '[]',
    allowed_slots JSONB DEFAULT '[]',
    compatible_ids JSONB DEFAULT '[]',
    socket_point JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Заказы
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id TEXT, -- Может быть NULL для гостей
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    profit DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    shipping_method TEXT,
    shipping_address JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Позиции в заказе
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    variant_info JSONB
);

-- Блог
CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    excerpt TEXT,
    content TEXT,
    category TEXT,
    author TEXT,
    date TEXT,
    tags JSONB DEFAULT '[]',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Политики
CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    title_hr TEXT,
    content_hr TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Сообщения обратной связи
CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Сервисные заявки
CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    weapon_name TEXT,
    description TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Снаряжение (Loadouts)
CREATE TABLE IF NOT EXISTS loadouts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    name TEXT NOT NULL,
    items JSONB DEFAULT '[]',
    total_weight DECIMAL(10, 2) DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Сохраненные сборки (Saved Builds)
CREATE TABLE IF NOT EXISTS saved_builds (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    product_id TEXT REFERENCES products(id),
    name TEXT NOT NULL,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Склады (Warehouses)
CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    capacity INTEGER,
    type TEXT, -- main, regional, partner
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Поставщики (Suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    categories JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Запасы (Stock)
CREATE TABLE IF NOT EXISTS stock (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id),
    warehouse_id TEXT REFERENCES warehouses(id),
    quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    location_in_warehouse TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Логи инвентаризации (Inventory Logs)
CREATE TABLE IF NOT EXISTS inventory_logs (
    id SERIAL PRIMARY KEY,
    product_id TEXT REFERENCES products(id),
    warehouse_id TEXT REFERENCES warehouses(id),
    user_id TEXT REFERENCES users(id),
    change_amount INTEGER NOT NULL,
    previous_balance INTEGER,
    new_balance INTEGER,
    reason TEXT, -- sale, restock, adjustment, return
    reference_id TEXT, -- order_id or purchase_order_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
