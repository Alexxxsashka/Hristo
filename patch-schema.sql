-- Patch columns missing from Data Connect's original schema
-- All columns below are used by the app. Safe to run multiple times.

ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slots JSONB DEFAULT '[]';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS compatible_module_categories JSONB DEFAULT '[]';

ALTER TABLE products ADD COLUMN IF NOT EXISTS attach_points JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS socket_point JSONB DEFAULT '[]';

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS read_time TEXT;

ALTER TABLE policies ADD COLUMN IF NOT EXISTS type TEXT;
