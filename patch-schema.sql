-- Financials and ERP extension
CREATE TABLE IF NOT EXISTS currency_rates (
    code TEXT PRIMARY KEY,
    rate DECIMAL(10, 4) NOT NULL,
    symbol TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    site_name TEXT DEFAULT 'Airsoft Store',
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    currency TEXT DEFAULT 'EUR',
    footer_text TEXT,
    social_links JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    supplier_id TEXT REFERENCES suppliers(id),
    warehouse_id TEXT REFERENCES warehouses(id),
    total_cost DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, ordered, received, cancelled
    currency TEXT DEFAULT 'EUR',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id TEXT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL
);

-- Ensure default currency rates
INSERT INTO currency_rates (code, rate, symbol) VALUES ('EUR', 1.0, '€') ON CONFLICT DO NOTHING;
INSERT INTO currency_rates (code, rate, symbol) VALUES ('USD', 1.08, '$') ON CONFLICT DO NOTHING;
INSERT INTO currency_rates (code, rate, symbol) VALUES ('HRK', 7.5345, 'kn') ON CONFLICT DO NOTHING;
