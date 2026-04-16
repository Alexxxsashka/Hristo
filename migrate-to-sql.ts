import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PGlite } from '@electric-sql/pglite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new PGlite(path.join(__dirname, 'data', 'pglite-data')) as any;

async function migrate() {
  console.log('🚀 Starting migration to Cloud SQL...');
  
  try {
    const dataDir = path.join(__dirname, 'data');
    
    // 1. Migrate Categories
    const categoriesPath = path.join(dataDir, 'categories.json');
    if (fs.existsSync(categoriesPath)) {
      const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
      
      // Ensure 'attachments' category exists
      await pool.query(
        `INSERT INTO categories (id, name, slug) VALUES ('attachments', 'Attachments', 'attachments') ON CONFLICT (id) DO NOTHING`
      );

      console.log(`📦 Migrating ${categories.length} categories...`);
      for (const cat of categories) {
        await pool.query(
          `INSERT INTO categories (id, name, name_hr, slug, image_url, parent_id) 
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [cat.id, cat.name, cat.nameHr, cat.slug, cat.image, cat.parent]
        );
      }
    }

    // 2. Migrate Products
    const productsPath = path.join(dataDir, 'products.json');
    if (fs.existsSync(productsPath)) {
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      console.log(`🔫 Migrating ${products.length} products...`);
      for (const p of products) {
        await pool.query(
          `INSERT INTO products (id, uid, sku, barcode, slug, name, description, type, category_id, subcategory, brand, model, price, stock, image_url, model_3d_url, has_3d) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) ON CONFLICT (id) DO NOTHING`,
          [p.id, p.uid, p.sku, p.barcode, p.slug, p.name, p.description, p.type, p.category, p.subcategory, p.brand, p.model, p.price, p.stock, p.image, p.model3D, p.has3D]
        );
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    // await pool.close();
  }
}

migrate();
