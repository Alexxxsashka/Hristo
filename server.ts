import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import axios from 'axios';
import Stripe from "stripe";
import { put } from "@vercel/blob";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB Strategy: Try Cloud SQL, fallback to PGLite for local/demo if SQL fails
let dbStrategy: 'sql' | 'pglite' = 'sql';
let pgliteInstance: PGlite | null = null;

const createPool = () => {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return new pg.Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return new pg.Pool({
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    host: process.env.DB_HOST || "34.29.209.72",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "postgres",
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
  });
};

let pool = createPool();

// Diagnostic DB Test
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Cloud SQL Connected at:', res.rows[0].now);
    dbStrategy = 'sql';
  } catch (err: any) {
    console.error('❌ Cloud SQL Connection Error:', err.message);
    console.log('🔄 Switching to local PGLite fallback...');
    dbStrategy = 'pglite';
    pgliteInstance = new PGlite();
    
    // Mimic the pool query interface for PGLite
    const pgliteQuery = async (text: string, params?: any[]) => {
      if (!pgliteInstance) throw new Error('PGLite not initialized');
      const result = await pgliteInstance.query(text, params);
      return { 
        rows: result.rows, 
        rowCount: result.rows.length,
        command: result.affectedRows ? 'UPDATE' : 'SELECT' // Mock command
      };
    };

    (pool as any).query = pgliteQuery;
    (pool as any).connect = async () => {
      return {
        query: pgliteQuery,
        release: () => {}
      };
    };
  }
};

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Stripe Initialization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

// Load Firebase Config
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(firebaseConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
}

// Initialize Firebase Admin with explicit service account key
let db: any = null;
const keyPath = path.join(__dirname, "key.json");
if (firebaseConfig.projectId) {
  try {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    } else if (fs.existsSync(keyPath)) {
      credential = admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf-8")));
    } else {
      try {
        credential = admin.credential.applicationDefault();
      } catch (e) {
        // applicationDefault throws if no environment variables are set
        credential = null;
      }
    }

    const initOptions: any = {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket || `${firebaseConfig.projectId}.firebasestorage.app`
    };
    if (credential) initOptions.credential = credential;

    const adminApp = admin.initializeApp(initOptions);
    db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)');
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
  }
}

let bucket: any = null;
try {
  if (firebaseConfig.projectId && admin.apps?.length) {
    bucket = admin.storage().bucket();
  }
} catch {
  bucket = null;
}

// Ensure data and models directories exist
const dataDir = path.join(__dirname, "data");
const modelsDir = process.env.NODE_ENV === "production" 
  ? path.join(__dirname, "build", "models")
  : path.join(__dirname, "public", "models");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, modelsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");

  // Helper to upload to Vercel Blob
  const uploadToFirebase = async (file: Express.Multer.File, folder: string) => {
    try {
      const filename = `${folder}/${Date.now()}-${file.originalname}`;
      const blob = await put(filename, file.buffer, {
        access: 'public',
        token: process.env.hrstorage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
      });
      return blob.url;
    } catch (error) {
      console.error("Vercel Blob upload error:", error);
      return null;
    }
  };

  // Multer configuration for memory storage
  const memoryStorage = multer.memoryStorage();
  const uploadMemory = multer({ storage: memoryStorage });

  app.use(express.json());
  app.use("/models", express.static(modelsDir));

  // Start listening immediately to avoid timeout
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    
    // Perform initialization in the background
    initializeDatabase();
  });

  async function initializeDatabase() {
    // 1. First test the standard connection
    await testConnection();

    // Seed default admin
    const seedAdmin = async () => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE role = $1', ['admin']);
      if (result.rows.length === 0) {
        const hashedPassword = bcrypt.hashSync("admin123", 10);
        const id = "admin-1";
        await pool.query(
          'INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)',
          [id, "admin", "admin@test.com", hashedPassword, "admin"]
        );
        console.log("Default admin user created: admin@test.com / admin123");
      }
    } catch (error) {
      console.error("Error seeding admin:", error);
    }
  };

  const seedPolicies = async () => {
    try {
      const result = await pool.query('SELECT * FROM policies');
      if (result.rows.length === 0) {
        const defaultPolicies = [
          { id: "terms", title: "Terms of Service", content: "# Terms of Service\n\nWelcome to Hristo Airsoft Store. By using our website, you agree to the following terms..." },
          { id: "privacy", title: "Privacy Policy", content: "# Privacy Policy\n\nWe value your privacy. This policy explains how we collect and use your data..." },
          { id: "shipping", title: "Shipping Policy", content: "# Shipping Information\n\nWe ship worldwide. Standard delivery times are 3-5 business days..." },
          { id: "payment-methods", title: "Payment Methods", content: "# Payment Methods\n\nWe accept Credit Cards, PayPal, and Bank Transfers..." },
          { id: "returns", title: "Returns & Refunds", content: "# Returns & Refunds\n\nYou can return any product within 14 days of purchase..." }
        ];
        for (const p of defaultPolicies) {
          await pool.query(
            'INSERT INTO policies (id, title, content) VALUES ($1, $2, $3)',
            [p.id, p.title, p.content]
          );
        }
        console.log("Default policies seeded.");
      }
    } catch (error) {
      console.error("Error seeding policies:", error);
    }
  };

    // Initialize database
    try {
      const sql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
      await pool.query(sql);

      // Patch existing tables that may have been created by Data Connect with missing columns
      const patchPath = path.join(__dirname, 'patch-schema.sql');
      if (fs.existsSync(patchPath)) {
        const patchSql = fs.readFileSync(patchPath, 'utf8');
        await pool.query(patchSql);
      }
      // eslint-disable-next-line no-console
      console.log('Database schema initialized');

      // Auto-migrate if products table is empty
      const prodCheck = await pool.query('SELECT COUNT(*) FROM products');
      if (parseInt(prodCheck.rows[0].count) === 0) {
        console.log('🌱 Products table is empty. Triggering auto-migration...');
        await runInternalMigration();
      }

      await seedAdmin();
      await seedPolicies();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    }
  }

  async function runInternalMigration() {
    const results: string[] = [];
    try {
      // 1. Migrate Categories
      const categoriesPath = path.join(dataDir, 'categories.json');
      if (fs.existsSync(categoriesPath)) {
        const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
        for (const cat of categories) {
          await pool.query(
            `INSERT INTO categories (id, name, name_hr, slug, image_url) 
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, name_hr = $3, slug = $4, image_url = $5`,
            [cat.id, cat.name, cat.nameHr, cat.slug, cat.image]
          );
        }
      }

      // 2. Migrate Products
      const productsPath = path.join(dataDir, 'products.json');
      if (fs.existsSync(productsPath)) {
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        const catIdsResult = await pool.query('SELECT id FROM categories');
        const validCatIds = new Set(catIdsResult.rows.map(r => r.id));

        for (const p of products) {
          const categoryId = validCatIds.has(p.category) ? p.category : null;
          await pool.query(
            `INSERT INTO products (id, uid, sku, barcode, slug, name, description, type, category_id, subcategory, brand, model, price, stock, image_url, model_3d_url, has_3d) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) ON CONFLICT (id) DO NOTHING`,
            [p.id, p.uid, p.sku, p.barcode, p.slug, p.name, p.description, p.type, categoryId, p.subcategory, p.brand, p.model, p.price, p.stock, p.image, p.model3D, p.has3D]
          );
        }
      }
      console.log('✅ Auto-migration completed successfully.');
      return true;
    } catch (err) {
      console.error('❌ Auto-migration failed:', err);
      return false;
    }
  }

  // Diagnostic DB Test Route
  app.get("/api/diag/db-test", async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()');
      res.json({ success: true, time: result.rows[0].now });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
  });

  // Seed Test Data Endpoint
  app.get("/api/admin/seed-test-data", async (req, res) => {
    console.log('🌱 Seeding test data to Cloud SQL...');
    const results: string[] = [];
    
    try {
      // 1. Clear existing data
      results.push('🧹 Clearing products and categories...');
      await pool.query('TRUNCATE products, categories CASCADE');

      // 2. Load and Insert Categories
      const categoriesPath = path.join(dataDir, 'categories.json');
      if (fs.existsSync(categoriesPath)) {
        const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
        results.push(`📦 Seeding ${categories.length} categories...`);
        
        // First pass: Insert categories without parent_id
        for (const cat of categories) {
          await pool.query(
            `INSERT INTO categories (id, name, name_hr, slug, image_url, filters) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [cat.id, cat.name, cat.nameHr || cat.name, cat.slug, cat.image, JSON.stringify(cat.filters || [])]
          );
        }
        
        // Second pass: Update parent_id
        for (const cat of categories) {
          if (cat.parent) {
            await pool.query(
              `UPDATE categories SET parent_id = $1 WHERE id = $2`,
              [cat.parent, cat.id]
            );
          }
        }
        
        // 3. Insert one test product for each category
        results.push('🔫 Seeding test products...');
        for (const cat of categories) {
          const productId = `test-${cat.id}`;
          const productUid = `uid-${cat.id}-${Date.now()}`;
          const slug = `test-product-${cat.id}`;
          
          await pool.query(
            `INSERT INTO products (id, uid, sku, barcode, slug, name, description, type, category_id, price, stock, image_url, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              productId, 
              productUid, 
              `SKU-${cat.id.toUpperCase()}`, 
              `BC-${cat.id.toUpperCase()}`, 
              slug, 
              `Test ${cat.name} Product`, 
              `This is a test product for the ${cat.name} category.`, 
              'weapon', // Default type
              cat.id, 
              99.99, 
              10, 
              cat.image || 'https://picsum.photos/seed/airsoft/800/600',
              'active'
            ]
          );
        }
      } else {
        throw new Error('categories.json not found');
      }

      res.json({ success: true, logs: results });
    } catch (err: any) {
      console.error('❌ Seeding failed:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Diagnostic IP Route
  app.get("/api/diag/ip", async (req, res) => {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      res.json({ outgoing_ip: response.data.ip });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Allow: /shop
Allow: /product
Allow: /blog
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
`);
  });

  // Sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const productsResult = await pool.query('SELECT id, slug, name FROM products WHERE status = $1', ['active']);
      const postsResult = await pool.query('SELECT slug FROM blog_posts');
      const categoriesResult = await pool.query('SELECT id FROM categories');
      
      const products = productsResult.rows;
      const posts = postsResult.rows;
      const categories = categoriesResult.rows;
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>
  <url><loc>${baseUrl}/shop</loc><priority>0.8</priority></url>
  <url><loc>${baseUrl}/blog</loc><priority>0.8</priority></url>
  <url><loc>${baseUrl}/contact</loc><priority>0.5</priority></url>`;

      products.forEach((p: any) => {
        const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        sitemap += `\n  <url><loc>${baseUrl}/product/${p.id}/${slug}</loc><priority>0.7</priority></url>`;
      });

      posts.forEach((p: any) => {
        sitemap += `\n  <url><loc>${baseUrl}/blog/${p.slug}</loc><priority>0.6</priority></url>`;
      });

      categories.forEach((c: any) => {
        sitemap += `\n  <url><loc>${baseUrl}/shop?category=${c.id}</loc><priority>0.6</priority></url>`;
      });

      sitemap += '\n</urlset>';
      res.type("application/xml");
      res.send(sitemap);
    } catch (error) {
      res.status(500).send('Error generating sitemap');
    }
  });

  // Auth Middleware
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      // Try local JWT first
      try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        return next();
      } catch (jwtErr) {
        // Fallback to Firebase
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Fetch user from DB to get role
        const userResult = await pool.query('SELECT role, username FROM users WHERE id = $1', [decodedToken.uid]);
        const dbUser = userResult.rows[0];
        
        req.user = {
          id: decodedToken.uid,
          email: decodedToken.email,
          role: dbUser?.role || (decodedToken.email === 'guardsowh@gmail.com' ? 'admin' : 'user'),
          username: dbUser?.username || decodedToken.name || decodedToken.email?.split('@')[0] || 'User'
        };
        next();
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      return res.status(403).json({ error: "Forbidden" });
    }
  };

  const authenticateAdmin = async (req: any, res: any, next: any) => {
    await authenticateToken(req, res, () => {
      if (req.user && req.user.role === "admin") {
        next();
      } else {
        res.status(403).json({ error: "Admin access required" });
      }
    });
  };

  // Public API Routes
  app.get("/api/products", async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { category, type } = req.query;
    
    try {
      const result = await pool.query('SELECT * FROM products WHERE status = $1', ['active']);
      const products = result.rows;
      const catResult = await pool.query('SELECT * FROM categories');
      const categories = catResult.rows;
    
    let filteredProducts = products;
    
    if (category) {
      const catId = (category as string).toLowerCase();
      filteredProducts = products.filter((p: any) => 
        (p.category_id && p.category_id.toLowerCase() === catId) || 
        (p.subcategory && p.subcategory.toLowerCase() === catId) ||
        // Also check if the product's category has this as a parent
        categories.some((c: any) => c.id === p.category_id && c.parent_id === catId) ||
        categories.some((c: any) => c.id === p.subcategory && c.parent_id === catId) ||
        // If searching for weapons, also include anything with type 'weapon'
        (catId === 'weapons' && p.type && p.type.toLowerCase() === 'weapon')
      );
    }
    
    if (type) {
      const typeStr = (type as string).toLowerCase();
      filteredProducts = filteredProducts.filter((p: any) => 
        p.type && p.type.toLowerCase() === typeStr
      );
    }

    const productsWithCategoryData = filteredProducts.map((p: any) => {
      const categoryData = categories.find((c: any) => c.id === p.category_id || c.id === p.subcategory);
      const product = {
        ...p,
        category: p.category_id, // Map for frontend
        price: parseFloat(p.price),
        landing_cost: p.landing_cost ? parseFloat(p.landing_cost) : null,
        msrp: p.msrp ? parseFloat(p.msrp) : null,
        stock: parseInt(p.stock),
        discount: p.discount ? parseInt(p.discount) : 0,
        has3D: p.has_3d === true || p.has_3d === 'true'
      };

      if (categoryData) {
        return {
          ...product,
          slots: p.slots || categoryData.slots || [],
          compatibleModuleCategories: p.compatibleModuleCategories || categoryData.compatibleModuleCategories || [],
          discount: p.discount !== undefined ? parseInt(p.discount) : (categoryData.discount ? parseInt(categoryData.discount) : 0)
        };
      }
      return product;
    });
    
    res.json(productsWithCategoryData);
    } catch (error) {
      console.error('Error fetching products from SQL:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM categories');
      const categories = result.rows.map(c => ({
        ...c,
        image: c.image_url,
        parent: c.parent_id
      }));
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories from SQL:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/categories", authenticateAdmin, async (req, res) => {
    try {
      const { id, name, description, parent, icon, image, slots, compatibleModuleCategories, discount, filters } = req.body;
      await pool.query(
        `INSERT INTO categories (id, name, description, parent_id, icon, image_url, slots, compatible_module_categories, discount, filters) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, name, description, parent, icon, image, JSON.stringify(slots || []), JSON.stringify(compatibleModuleCategories || []), discount || 0, JSON.stringify(filters || [])]
      );
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Category creation error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/categories/:id", authenticateAdmin, async (req, res) => {
    try {
      const { name, description, parent, icon, image, slots, compatibleModuleCategories, discount, filters } = req.body;
      await pool.query(
        `UPDATE categories SET name = $1, description = $2, parent_id = $3, icon = $4, image_url = $5, 
         slots = $6, compatible_module_categories = $7, discount = $8, filters = $9 WHERE id = $10`,
        [name, description, parent, icon, image, JSON.stringify(slots || []), JSON.stringify(compatibleModuleCategories || []), discount || 0, JSON.stringify(filters || []), req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete("/api/categories/:id", authenticateAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (req.params.id === 'find-by-code') {
      const { code } = req.query;
      try {
        const result = await pool.query('SELECT * FROM products WHERE sku = $1 OR barcode = $1', [code]);
        if (result.rows.length > 0) return res.json(result.rows[0]);
        return res.status(404).json({ error: 'Product not found' });
      } catch (error) {
        return res.status(500).json({ error: 'Database error' });
      }
    }
    try {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
      const product = result.rows[0];
      
      if (product) {
        const catResult = await pool.query('SELECT * FROM categories WHERE id = $1 OR id = $2', [product.category_id, product.subcategory]);
        const category = catResult.rows[0];
        
        const mappedProduct = {
          ...product,
          price: parseFloat(product.price),
          stock: parseInt(product.stock),
          discount: product.discount ? parseInt(product.discount) : 0,
          category: product.category_id,
          image: product.image_url,
          model3D: product.model_3d_url,
          has3D: product.has_3d === true || product.has_3d === 'true'
        };

        if (category) {
          return res.json({
            ...mappedProduct,
            slots: category.slots || product.slots || [],
            compatibleModuleCategories: category.compatibleModuleCategories || product.compatibleModuleCategories || [],
            discount: product.discount !== undefined ? parseInt(product.discount) : (category.discount ? parseInt(category.discount) : 0)
          });
        }
        res.json(mappedProduct);
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/products", authenticateAdmin, async (req, res) => {
    try {
      const p = req.body;
      const id = p.id || `prod-${Date.now()}`;
      
      await pool.query(
        `INSERT INTO products (
          id, uid, sku, barcode, slug, name, description, type, 
          category_id, subcategory, brand, model, price, stock, 
          image_url, model_3d_url, has_3d, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          id, p.uid || id, p.sku, p.barcode, p.slug || id, p.name, p.description, p.type,
          p.category, p.subcategory, p.brand, p.model, p.price, p.stock,
          p.image, p.model3D, p.has3D, 'active'
        ]
      );
      
      res.status(201).json({ success: true, id });
    } catch (error) {
      console.error('Product creation error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/products/:id", authenticateAdmin, async (req, res) => {
    try {
      const productId = req.params.id;
      const p = req.body;
      
      // Map frontend fields to SQL columns
      const mapping: Record<string, string> = {
        category: 'category_id',
        image: 'image_url',
        model3D: 'model_3d_url',
        has3D: 'has_3d'
      };

      const updates: Record<string, any> = {};
      Object.keys(p).forEach(key => {
        if (key === 'id') return;
        const sqlKey = mapping[key] || key;
        // Only include keys that exist in our table (simplified check)
        const allowedKeys = [
          'sku', 'barcode', 'slug', 'name', 'description', 'type', 
          'category_id', 'subcategory', 'brand', 'model', 'price', 
          'stock', 'image_url', 'model_3d_url', 'has_3d', 'status', 'uid'
        ];
        if (allowedKeys.includes(sqlKey)) {
          updates[sqlKey] = p[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.json({ success: true, message: 'No fields to update' });
      }

      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      
      await pool.query(
        `UPDATE products SET ${setClause} WHERE id = $${keys.length + 1}`,
        [...values, productId]
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Product update error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/products/slug/:slug", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM products WHERE slug = $1', [req.params.slug]);
      const product = result.rows[0];
      
      if (product) {
        const catResult = await pool.query('SELECT * FROM categories WHERE id = $1 OR id = $2', [product.category_id, product.subcategory]);
        const category = catResult.rows[0];
        
        const mappedProduct = {
          ...product,
          price: parseFloat(product.price),
          stock: parseInt(product.stock),
          discount: product.discount ? parseInt(product.discount) : 0,
          category: product.category_id,
          image: product.image_url,
          model3D: product.model_3d_url,
          has3D: product.has_3d === true || product.has_3d === 'true'
        };

        if (category) {
          return res.json({
            ...mappedProduct,
            slots: category.slots || product.slots || [],
            compatibleModuleCategories: category.compatibleModuleCategories || product.compatibleModuleCategories || [],
            discount: product.discount !== undefined ? parseInt(product.discount) : (category.discount ? parseInt(category.discount) : 0)
          });
        }
        res.json(mappedProduct);
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Blog API Routes
  app.get("/api/blog", async (req, res) => {
    const { category, search, page = 1, limit = 6 } = req.query;
    
    try {
      let queryStr = 'SELECT * FROM blog_posts';
      const params: any[] = [];
      let whereClauses: string[] = [];
      
      if (category) {
        params.push(category);
        whereClauses.push(`category = $${params.length}`);
      }
      
      if (search) {
        params.push(`%${search}%`);
        whereClauses.push(`(title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`);
      }
      
      if (whereClauses.length > 0) {
        queryStr += ' WHERE ' + whereClauses.join(' AND ');
      }
      
      queryStr += ' ORDER BY date DESC';
      
      const result = await pool.query(queryStr, params);
      const total = result.rows.length;
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedPosts = result.rows.slice(startIndex, startIndex + Number(limit)).map(p => ({
        ...p,
        image: p.image_url
      }));
      
      res.json({
        posts: paginatedPosts,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Blog fetch error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/blog", authenticateAdmin, async (req, res) => {
    try {
      const { id, title, excerpt, content, author, date, image, category, tags, slug, readTime } = req.body;
      const postId = id || `post-${Date.now()}`;
      await pool.query(
        `INSERT INTO blog_posts (id, title, excerpt, content, author, date, image_url, category, tags, slug, read_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [postId, title, excerpt, content, author, date, image, category, JSON.stringify(tags || []), slug, readTime]
      );
      res.status(201).json({ success: true, id: postId });
    } catch (error) {
      console.error('Blog creation error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/blog/:id", authenticateAdmin, async (req, res) => {
    try {
      const { title, excerpt, content, author, date, image, category, tags, slug, readTime } = req.body;
      await pool.query(
        `UPDATE blog_posts SET title = $1, excerpt = $2, content = $3, author = $4, date = $5, 
         image_url = $6, category = $7, tags = $8, slug = $9, read_time = $10 WHERE id = $11`,
        [title, excerpt, content, author, date, image, category, JSON.stringify(tags || []), slug, readTime, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete("/api/blog/:id", authenticateAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM blog_posts WHERE slug = $1', [req.params.slug]);
      if (result.rows.length > 0) {
        const post = result.rows[0];
        res.json({
          ...post,
          image: post.image_url
        });
      } else {
        res.status(404).json({ error: "Post not found" });
      }
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Policy API Routes
  app.get("/api/policies", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM policies');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/policies", authenticateAdmin, async (req, res) => {
    try {
      const { id, title, content, type } = req.body;
      const policyId = id || `policy-${Date.now()}`;
      await pool.query(
        'INSERT INTO policies (id, title, content, type) VALUES ($1, $2, $3, $4)',
        [policyId, title, content, type]
      );
      res.status(201).json({ success: true, id: policyId });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/policies/:id", authenticateAdmin, async (req, res) => {
    try {
      const { title, content, type } = req.body;
      await pool.query(
        'UPDATE policies SET title = $1, content = $2, type = $3, last_updated = CURRENT_TIMESTAMP WHERE id = $4',
        [title, content, type, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete("/api/policies/:id", authenticateAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM policies WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/policies/:id", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM policies WHERE id = $1', [req.params.id]);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: "Policy not found" });
      }
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/admin/policies", authenticateAdmin, async (req, res) => {
    const { id, title, content, title_hr, content_hr } = req.body;
    const finalId = id || `policy-${Date.now()}`;
    try {
      await pool.query(
        'INSERT INTO policies (id, title, content, title_hr, content_hr) VALUES ($1, $2, $3, $4, $5)',
        [finalId, title, content, title_hr, content_hr]
      );
      res.status(201).json({ id: finalId, title, content, title_hr, content_hr });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete("/api/admin/policies/:id", authenticateAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM policies WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Contact API Route
  app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const id = `msg-${Date.now()}`;
      await pool.query(
        'INSERT INTO contact_messages (id, name, email, subject, message) VALUES ($1, $2, $3, $4, $5)',
        [id, name, email, subject, message]
      );
      res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/site-settings", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM site_settings LIMIT 1');
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.json({});
      }
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/site-settings", authenticateAdmin, async (req, res) => {
    const s = req.body;
    try {
      // Check if exists
      const check = await pool.query('SELECT id FROM site_settings LIMIT 1');
      if (check.rows.length > 0) {
        const id = check.rows[0].id;
        const keys = Object.keys(s).filter(k => k !== 'id' && k !== 'updated_at');
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        await pool.query(
          `UPDATE site_settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1}`,
          [...keys.map(k => s[k]), id]
        );
      } else {
        const id = 'default';
        const keys = Object.keys(s).filter(k => k !== 'id' && k !== 'updated_at');
        const columns = ['id', ...keys].join(', ');
        const placeholders = ['$1', ...keys.map((_, i) => `$${i + 2}`)].join(', ');
        await pool.query(
          `INSERT INTO site_settings (${columns}) VALUES (${placeholders})`,
          [id, ...keys.map(k => s[k])]
        );
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Site settings update failed:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/currency-rates", async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM currency_rates');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/currency-rates", authenticateAdmin, async (req, res) => {
    const { code, rate, symbol } = req.body;
    try {
      await pool.query(
        'INSERT INTO currency_rates (code, rate, symbol) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET rate = $2, symbol = $3, updated_at = CURRENT_TIMESTAMP',
        [code, rate, symbol]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/admin/messages", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM contact_messages ORDER BY date DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete("/api/admin/messages/:id", authenticateAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Auth API Routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
      const checkResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const id = `user-${Date.now()}`;
      
      await pool.query(
        'INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)',
        [id, username, email, hashedPassword, 'user']
      );

      const token = jwt.sign({ id, email, role: 'user', username }, JWT_SECRET, { expiresIn: "24h" });
      res.status(201).json({ token, user: { id, username, email, role: 'user' } });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // Admin API Routes
  app.get("/api/admin/categories", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM categories');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/admin/categories", authenticateAdmin, async (req, res) => {
    const { name, name_hr, slug, image_url, parent_id } = req.body;
    const id = req.body.id || `cat-${Date.now()}`;
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    try {
      await pool.query(
        'INSERT INTO categories (id, name, name_hr, slug, image_url, parent_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, name, name_hr, finalSlug, image_url, parent_id]
      );
      res.status(201).json({ id, name, name_hr, slug: finalSlug, image_url, parent_id });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/admin/categories/:id", authenticateAdmin, async (req, res) => {
    const { name, name_hr, slug, image_url, parent_id } = req.body;
    const id = req.params.id;
    
    try {
      await pool.query(
        'UPDATE categories SET name = $1, name_hr = $2, slug = $3, image_url = $4, parent_id = $5 WHERE id = $6',
        [name, name_hr, slug, image_url, parent_id, id]
      );
      res.json({ id, name, name_hr, slug, image_url, parent_id });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete("/api/admin/categories/:id", authenticateAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1 AND role = $2', [username, 'admin']);
      const user = result.rows[0];

      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
        res.json({ token });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/admin/products", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM products');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/admin/products", authenticateAdmin, uploadMemory.fields([
    { name: "modelFile", maxCount: 1 },
    { name: "imageFile", maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const newProduct = JSON.parse(req.body.product);
      
      if (req.files) {
        if (req.files.modelFile) {
          const url = await uploadToFirebase(req.files.modelFile[0], "models");
          newProduct.model_3d_url = url;
          newProduct.has_3d = true;
        }
        if (req.files.imageFile) {
          const url = await uploadToFirebase(req.files.imageFile[0], "images");
          newProduct.image_url = url;
        }
      }

      const id = newProduct.id || `prod-${Date.now()}`;
      const uid = newProduct.uid || id;
      const finalSlug = newProduct.slug || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      await pool.query(
        `INSERT INTO products (id, uid, sku, barcode, slug, name, description, type, category_id, subcategory, brand, model, price, stock, image_url, model_3d_url, has_3d) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [id, uid, newProduct.sku, newProduct.barcode, finalSlug, newProduct.name, newProduct.description, newProduct.type, newProduct.category, newProduct.subcategory, newProduct.brand, newProduct.model, newProduct.price, newProduct.stock, newProduct.image_url, newProduct.model_3d_url, newProduct.has_3d || false]
      );

      res.status(201).json({ ...newProduct, id, uid, slug: finalSlug });
    } catch (error) {
      console.error('Product creation error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/admin/products/:id", authenticateAdmin, uploadMemory.fields([
    { name: "modelFile", maxCount: 1 },
    { name: "imageFile", maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const productId = req.params.id;
      const updatedProduct = JSON.parse(req.body.product);
      
      if (req.files) {
        if (req.files.modelFile) {
          const url = await uploadToFirebase(req.files.modelFile[0], "models");
          updatedProduct.model_3d_url = url;
          updatedProduct.has_3d = true;
        }
        if (req.files.imageFile) {
          const url = await uploadToFirebase(req.files.imageFile[0], "images");
          updatedProduct.image_url = url;
        }
      }

      await pool.query(
        `UPDATE products SET 
          sku = $1, barcode = $2, slug = $3, name = $4, description = $5, 
          type = $6, category_id = $7, subcategory = $8, brand = $9, model = $10, 
          price = $11, stock = $12, image_url = $13, model_3d_url = $14, has_3d = $15 
         WHERE id = $16`,
        [updatedProduct.sku, updatedProduct.barcode, updatedProduct.slug, updatedProduct.name, updatedProduct.description, updatedProduct.type, updatedProduct.category, updatedProduct.subcategory, updatedProduct.brand, updatedProduct.model, updatedProduct.price, updatedProduct.stock, updatedProduct.image_url, updatedProduct.model_3d_url, updatedProduct.has_3d, productId]
      );

      res.json({ ...updatedProduct, id: productId });
    } catch (error) {
      console.error('Product update error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete("/api/admin/products/:id", authenticateAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (error) {
      console.error('Product deletion error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // File upload for parts
  app.post("/api/admin/upload-part", authenticateAdmin, uploadMemory.single("modelFile"), async (req: any, res) => {
    if (req.file) {
      const url = await uploadToFirebase(req.file, "models");
      res.json({ filename: url, url });
    } else {
      res.status(400).json({ error: "No file uploaded" });
    }
  });

  // Attach Points API
  app.post("/api/admin/attach-points/:productId", authenticateAdmin, async (req, res) => {
    const productId = req.params.productId;
    const { attachPoints, socketPoint } = req.body;

    try {
      await pool.query(
        'UPDATE products SET attach_points = $1, socket_point = $2 WHERE id = $3',
        [JSON.stringify(attachPoints), JSON.stringify(socketPoint), productId]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Admin Blog API Routes
  app.get("/api/admin/blog", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM blog_posts ORDER BY date DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/admin/blog", authenticateAdmin, uploadMemory.single("imageFile"), async (req: any, res) => {
    try {
      const newPost = JSON.parse(req.body.post);
      
      if (req.file) {
        const url = await uploadToFirebase(req.file, "blog");
        newPost.image_url = url;
      }

      const id = newPost.id || `post-${Date.now()}`;
      const date = newPost.date || new Date().toISOString().split('T')[0];
      const finalSlug = newPost.slug || newPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      await pool.query(
        `INSERT INTO blog_posts (id, title, slug, content, excerpt, image_url, date, author, category, tags) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, newPost.title, finalSlug, newPost.content, newPost.excerpt, newPost.image_url, date, newPost.author, newPost.category, newPost.tags || []]
      );

      res.status(201).json({ ...newPost, id, date, slug: finalSlug });
    } catch (error) {
      console.error('Blog creation error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/admin/blog/:id", authenticateAdmin, uploadMemory.single("imageFile"), async (req: any, res) => {
    try {
      const postId = req.params.id;
      const updatedPost = JSON.parse(req.body.post);
      
      if (req.file) {
        const url = await uploadToFirebase(req.file, "blog");
        updatedPost.image_url = url;
      }

      await pool.query(
        `UPDATE blog_posts SET 
          title = $1, slug = $2, content = $3, excerpt = $4, image_url = $5, 
          date = $6, author = $7, category = $8, tags = $9 
         WHERE id = $10`,
        [updatedPost.title, updatedPost.slug, updatedPost.content, updatedPost.excerpt, updatedPost.image_url, updatedPost.date, updatedPost.author, updatedPost.category, updatedPost.tags, postId]
      );

      res.json({ ...updatedPost, id: postId });
    } catch (error) {
      console.error('Blog update error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete("/api/admin/blog/:id", authenticateAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/users", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT id, email, username, display_name, callsign, team_name, role, points, rank, discount_level, avatar_url, created_at FROM users');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/users/:id", authenticateToken, async (req: any, res) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const result = await pool.query('SELECT id, email, username, display_name, callsign, team_name, role, points, rank, discount_level, avatar_url, created_at FROM users WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req: any, res) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updates = req.body;
    const { email, username } = updates;
    
    // For upsert, we need some basics if it's a new user
    const id = req.params.id;
    
    try {
      // Use ON CONFLICT to upsert
      // We'll update fields if they exist in req.body
      const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'password');
      if (keys.length === 0) {
        // Just ensure user exists
        await pool.query(
          'INSERT INTO users (id, email, username, role) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
          [id, email || '', username || 'User', 'user']
        );
        return res.json({ success: true });
      }

      const values = keys.map(k => updates[k]);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO users (id, email, username, role, ${keys.join(', ')})
        VALUES ($${keys.length + 1}, $${keys.length + 2}, $${keys.length + 3}, 'user', ${keys.map((_, i) => `$${i + 1}`).join(', ')})
        ON CONFLICT (id) DO UPDATE SET 
          ${setClause}, 
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const result = await pool.query(query, [...values, id, email || '', username || 'User']);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('User upsert failed:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Service Requests API
  app.post("/api/service-requests", authenticateToken, async (req: any, res) => {
    const { weapon_name, description } = req.body;
    const id = `sr-${Date.now()}`;
    try {
      await pool.query(
        'INSERT INTO service_requests (id, user_id, weapon_name, description) VALUES ($1, $2, $3, $4)',
        [id, req.user.id, weapon_name, description]
      );
      res.status(201).json({ id, weapon_name, description, status: 'Pending' });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/service-requests", authenticateToken, async (req: any, res) => {
    try {
      const result = await pool.query('SELECT * FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/admin/service-requests", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT sr.*, u.email as user_email FROM service_requests sr LEFT JOIN users u ON sr.user_id = u.id ORDER BY sr.created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put("/api/admin/service-requests/:id", authenticateAdmin, async (req, res) => {
    const { status } = req.body;
    try {
      await pool.query(
        'UPDATE service_requests SET status = $1 WHERE id = $2',
        [status, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Migration API
  app.get("/api/migration/export", authenticateAdmin, async (req, res) => {
    try {
      const products = await pool.query('SELECT * FROM products');
      const categories = await pool.query('SELECT * FROM categories');
      const blog_posts = await pool.query('SELECT * FROM blog_posts');
      const contact_messages = await pool.query('SELECT * FROM contact_messages');
      const policies = await pool.query('SELECT * FROM policies');
      const users = await pool.query('SELECT * FROM users');

      res.json({
        products: products.rows,
        categories: categories.rows,
        blog_posts: blog_posts.rows,
        contact_messages: contact_messages.rows,
        policies: policies.rows,
        users: users.rows
      });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Orders API
  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    const orderData = req.body;
    const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `order-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Fetch user profile
      const userResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      const userProfile = userResult.rows[0];

      // 2. Fetch products and calculate authoritative subtotal, total, and profit
      let authoritativeSubtotal = 0;
      let authoritativeProfit = 0;
      const orderItems = [];

      for (const item of orderData.items) {
        const productResult = await client.query('SELECT * FROM products WHERE id = $1', [item.product_id || item.productId]);
        if (productResult.rows.length === 0) throw new Error(`Product ${item.name} not found`);
        const product = productResult.rows[0];

        if (parseInt(product.stock) < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }

        // Fetch category for category-level discounts
        const categoryResult = await client.query('SELECT discount FROM categories WHERE id = $1', [product.category_id]);
        const categoryDiscount = categoryResult.rows[0]?.discount || 0;
        
        const productDiscount = parseInt(product.discount) || 0;
        const userDiscount = userProfile?.discount_level || 0;
        
        // Authoritative Price Calculation (highest discount)
        const bestDiscount = Math.max(productDiscount, categoryDiscount, userDiscount);
        const discountedPrice = parseFloat(product.price) * (1 - bestDiscount / 100);
        const landingCost = parseFloat(product.landing_cost) || (parseFloat(product.price) * 0.6);
        
        authoritativeSubtotal += discountedPrice * item.quantity;
        authoritativeProfit += (discountedPrice - landingCost) * item.quantity;

        orderItems.push({
          ...item,
          product_id: product.id,
          price: discountedPrice,
          landing_cost: landingCost,
          sku: product.sku || ''
        });

        // Update stock
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, product.id]
        );

        // Inventory log
        await client.query(
          `INSERT INTO inventory_logs (product_id, user_id, change_amount, previous_balance, new_balance, reason, reference_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [product.id, req.user.id, -item.quantity, parseInt(product.stock), parseInt(product.stock) - item.quantity, `Order ${orderNumber}`, orderId]
        );
      }

      const shippingCost = parseFloat(orderData.shipping_cost || orderData.shipping?.cost || 0);
      const authoritativeTotal = authoritativeSubtotal + shippingCost;
      const tax = authoritativeTotal * 0.25; // Example tax rate

      // 3. Update User Rank & Points
      const pointsEarned = Math.floor(authoritativeTotal * 0.1);
      const newPoints = (parseInt(userProfile.points) || 0) + pointsEarned;
      
      const RANK_THRESHOLDS = [
        { rank: 'Recruit', threshold: 0, discount: 0 },
        { rank: 'Private', threshold: 500, discount: 3 },
        { rank: 'Sergeant', threshold: 1500, discount: 5 },
        { rank: 'Special Forces', threshold: 3000, discount: 10 },
        { rank: 'Operator', threshold: 5000, discount: 15 },
        { rank: 'Commander', threshold: 10000, discount: 20 }
      ];

      let newRank = userProfile.rank || 'Recruit';
      let newDiscountLevel = userProfile.discount_level || 0;
      for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
        if (newPoints >= RANK_THRESHOLDS[i].threshold) {
          newRank = RANK_THRESHOLDS[i].rank;
          newDiscountLevel = RANK_THRESHOLDS[i].discount;
          break;
        }
      }

      await client.query(
        'UPDATE users SET points = $1, rank = $2, discount_level = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [newPoints, newRank, newDiscountLevel, req.user.id]
      );

      // 4. Create Order
      await client.query(
        `INSERT INTO orders (
          id, order_number, user_id, subtotal, tax, shipping_cost, total, profit, status, 
          payment_method, shipping_address, shipping_method
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          orderId, orderNumber, req.user.id, authoritativeSubtotal, tax, shippingCost, 
          authoritativeTotal, authoritativeProfit, 'pending', 
          orderData.payment_method || orderData.payment?.method, 
          JSON.stringify(orderData.shipping_address || orderData.shipping),
          orderData.shipping?.method || 'Standard'
        ]
      );

      // 5. Create Order Items
      for (const item of orderItems) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.product_id, item.name, item.price, item.quantity]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ id: orderId, orderNumber, status: 'pending' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Order creation error:', error);
      res.status(500).json({ error: error.message || 'Database error' });
    } finally {
      client.release();
    }
  });

  app.put("/api/admin/orders/:id/status", authenticateAdmin, async (req, res) => {
    const { status, tracking_number } = req.body;
    try {
      await pool.query(
        'UPDATE orders SET status = $1, shipping_method = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [status, tracking_number, req.params.id]
      );
      
      if (status === 'cancelled') {
        // Release stock logic
        const orderResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
        for (const item of orderResult.rows) {
          await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
      if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
      
      const order = orderResult.rows[0];
      if (order.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const itemsResult = await pool.query('SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1', [req.params.id]);
      order.items = itemsResult.rows;
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/admin/orders", authenticateAdmin, async (req, res) => {
    try {
      const ordersResult = await pool.query('SELECT o.*, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC');
      const orders = ordersResult.rows;
      
      // Fetch items for all orders in one go if possible, or just add them.
      // For simplicity in this dashboard, we'll fetch items for each order or use a join.
      // Better to use a JSON aggregation in Postgres if available.
      const result = await pool.query(`
        SELECT 
          o.*, 
          u.email as user_email,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'name', oi.name,
              'price', oi.price,
              'quantity', oi.quantity,
              'image', p.image_url
            ))
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = o.id
            ), '[]'::json
          ) as items
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Admin orders fetch error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/admin/analytics", authenticateAdmin, async (req, res) => {
    try {
      const ordersResult = await pool.query("SELECT total, profit, status, created_at FROM orders WHERE status != 'cancelled'");
      const orders = ordersResult.rows;
      
      const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
      const profit = orders.reduce((sum, o) => sum + parseFloat(o.profit), 0);
      
      const lowStockResult = await pool.query("SELECT id, name, sku, stock, min_stock_level FROM products WHERE stock <= min_stock_level OR stock <= 5");
      
      // Top sellers
      const topSellersResult = await pool.query(`
        SELECT p.name, SUM(oi.quantity) as quantity, SUM(oi.quantity * oi.price) as revenue 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled'
        GROUP BY p.name 
        ORDER BY quantity DESC 
        LIMIT 5
      `);

      res.json({
        revenue,
        profit,
        conversionRate: 3.2,
        avgOrderValue: orders.length ? revenue / orders.length : 0,
        topSellers: topSellersResult.rows.map(r => ({ ...r, sales: parseInt(r.quantity) })),
        lowStockAlerts: lowStockResult.rows.map(p => ({
          ...p,
          velocity: 0,
          minLevel: p.min_stock_level || 5
        }))
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Loadouts API
  app.get("/api/loadouts", authenticateToken, async (req: any, res) => {
    try {
      const result = await pool.query('SELECT * FROM loadouts WHERE user_id = $1', [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/loadouts", authenticateToken, async (req: any, res) => {
    const loadout = req.body;
    const id = loadout.id || `loadout-${Date.now()}`;
    try {
      await pool.query(
        'INSERT INTO loadouts (id, user_id, name, items, total_weight, is_primary) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = $3, items = $4, total_weight = $5, is_primary = $6',
        [id, req.user.id, loadout.name, JSON.stringify(loadout.items), loadout.total_weight, loadout.is_primary || false]
      );
      res.json({ id, ...loadout });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete("/api/loadouts/:id", authenticateToken, async (req: any, res) => {
    try {
      await pool.query('DELETE FROM loadouts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Saved Builds API
  app.get("/api/saved-builds", authenticateToken, async (req: any, res) => {
    try {
      const result = await pool.query('SELECT * FROM saved_builds WHERE user_id = $1', [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/saved-builds", authenticateToken, async (req: any, res) => {
    const build = req.body;
    const id = build.id || `build-${Date.now()}`;
    try {
      await pool.query(
        'INSERT INTO saved_builds (id, user_id, product_id, name, configuration) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $4, configuration = $5',
        [id, req.user.id, build.product_id, build.name, JSON.stringify(build.configuration)]
      );
      res.json({ id, ...build });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Inventory Management API
  app.get("/api/admin/warehouses", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM warehouses');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/admin/warehouses", authenticateAdmin, async (req, res) => {
    const w = req.body;
    const id = w.id || `wh-${Date.now()}`;
    try {
      await pool.query(
        'INSERT INTO warehouses (id, name, location, capacity, type) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, location = $3, capacity = $4, type = $5',
        [id, w.name, w.location, w.capacity, w.type]
      );
      res.json({ id, ...w });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/admin/suppliers", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM suppliers');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/admin/suppliers", authenticateAdmin, async (req, res) => {
    const s = req.body;
    const id = s.id || `sup-${Date.now()}`;
    try {
      await pool.query(
        'INSERT INTO suppliers (id, name, contact_person, email, phone, address, categories) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = $2, contact_person = $3, email = $4, phone = $5, address = $6, categories = $7',
        [id, s.name, s.contact_person, s.email, s.phone, s.address, JSON.stringify(s.categories)]
      );
      res.json({ id, ...s });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/admin/stock", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT s.*, p.name as product_name, w.name as warehouse_name FROM stock s JOIN products p ON s.product_id = p.id JOIN warehouses w ON s.warehouse_id = w.id');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/admin/stock", authenticateAdmin, async (req, res) => {
    const s = req.body;
    const id = s.id || `stock-${Date.now()}`;
    try {
      await pool.query(
        'INSERT INTO stock (id, product_id, warehouse_id, quantity, min_stock_level, location_in_warehouse) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET quantity = $4, min_stock_level = $5, location_in_warehouse = $6',
        [id, s.product_id, s.warehouse_id, s.quantity, s.min_stock_level, s.location_in_warehouse]
      );
      res.json({ id, ...s });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/admin/inventory-logs", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT l.*, p.name as product_name, u.username FROM inventory_logs l LEFT JOIN products p ON l.product_id = p.id LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get("/api/admin/purchase-orders", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM purchase_orders ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post("/api/admin/purchase-orders", authenticateAdmin, async (req, res) => {
    const po = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const id = po.id || `PO-${Date.now()}`;
      await client.query(
        'INSERT INTO purchase_orders (id, supplier_id, warehouse_id, total_cost, status, currency, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [id, po.supplierId, po.warehouseId, po.totalCost || 0, po.status || 'pending', po.currency || 'EUR', po.notes || '', po.createdAt || new Date().toISOString()]
      );

      if (po.items && Array.isArray(po.items)) {
        for (const item of po.items) {
          await client.query(
            'INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost) VALUES ($1, $2, $3, $4)',
            [id, item.productId, item.quantity, item.unitCost]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ id, ...po });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('PO creation error:', error);
      res.status(500).json({ error: 'Database error' });
    } finally {
      client.release();
    }
  });

  app.post("/api/admin/purchase-orders/:id/receive", authenticateAdmin, async (req, res) => {
    const poId = req.params.id;
    const { warehouseId } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const poItems = await client.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [poId]);
      await client.query('UPDATE purchase_orders SET status = $1 WHERE id = $2', ['received', poId]);

      for (const item of poItems.rows) {
        const stockCheck = await client.query('SELECT id, quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2', [item.product_id, warehouseId]);
        
        let newBalance = item.quantity;
        if (stockCheck.rows.length > 0) {
          newBalance = stockCheck.rows[0].quantity + item.quantity;
          await client.query('UPDATE stock SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newBalance, stockCheck.rows[0].id]);
        } else {
          const stockId = `stk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await client.query('INSERT INTO stock (id, product_id, warehouse_id, quantity) VALUES ($1, $2, $3, $4)', [stockId, item.product_id, warehouseId, item.quantity]);
        }

        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);

        await client.query(
          'INSERT INTO inventory_logs (product_id, warehouse_id, user_id, change_amount, new_balance, reason, reference_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [item.product_id, warehouseId, (req as any).user?.id, item.quantity, newBalance, 'PO Received', poId]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Database error' });
    } finally {
      client.release();
    }
  });

  app.post("/api/admin/stock/update-by-code", authenticateAdmin, async (req, res) => {
    const { code, quantity, warehouseId, reason } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const prodResult = await client.query('SELECT id, name FROM products WHERE sku = $1 OR barcode = $1', [code]);
      if (prodResult.rows.length === 0) {
        throw new Error('Product not found with this code');
      }
      const product = prodResult.rows[0];

      const stockCheck = await client.query('SELECT id, quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2', [product.id, warehouseId]);
      
      let newBalance = quantity;
      if (stockCheck.rows.length > 0) {
        newBalance = stockCheck.rows[0].quantity + quantity;
        await client.query('UPDATE stock SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newBalance, stockCheck.rows[0].id]);
      } else {
        const stockId = `stk-${Date.now()}`;
        await client.query('INSERT INTO stock (id, product_id, warehouse_id, quantity) VALUES ($1, $2, $3, $4)', [stockId, product.id, warehouseId, quantity]);
      }

      await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, product.id]);

      await client.query(
        'INSERT INTO inventory_logs (product_id, warehouse_id, user_id, change_amount, new_balance, reason) VALUES ($1, $2, $3, $4, $5, $6)',
        [product.id, warehouseId, (req as any).user?.id, quantity, newBalance, reason]
      );

      await client.query('COMMIT');
      res.json({ success: true, productName: product.name, newBalance });
    } catch (error: any) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: error.message });
    } finally {
      client.release();
    }
  });

  // Migration Endpoint (Temporary)
  app.get("/api/admin/migrate-db", async (req, res) => {
    console.log('🚀 Starting internal migration to Cloud SQL...');
  const results: string[] = [];
  
  try {
    // 1. Migrate Categories
    const categoriesPath = path.join(dataDir, 'categories.json');
    if (fs.existsSync(categoriesPath)) {
      const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
      results.push(`📦 Migrating ${categories.length} categories...`);
      
      // First pass: Insert categories without parent_id to avoid FK issues
      for (const cat of categories) {
        await pool.query(
          `INSERT INTO categories (id, name, name_hr, slug, image_url) 
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, name_hr = $3, slug = $4, image_url = $5`,
          [cat.id, cat.name, cat.nameHr, cat.slug, cat.image]
        );
      }
      
      // Second pass: Update parent_id
      for (const cat of categories) {
        if (cat.parent) {
          await pool.query(
            `UPDATE categories SET parent_id = $1 WHERE id = $2`,
            [cat.parent, cat.id]
          );
        }
      }
    }

    // 2. Migrate Products
    const productsPath = path.join(dataDir, 'products.json');
    if (fs.existsSync(productsPath)) {
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      results.push(`🔫 Migrating ${products.length} products...`);
      
      // Get valid category IDs
      const catIdsResult = await pool.query('SELECT id FROM categories');
      const validCatIds = new Set(catIdsResult.rows.map(r => r.id));

      for (const p of products) {
        // Ensure category_id exists in categories table, otherwise set to NULL
        const categoryId = validCatIds.has(p.category) ? p.category : null;
        
        await pool.query(
          `INSERT INTO products (id, uid, sku, barcode, slug, name, description, type, category_id, subcategory, brand, model, price, stock, image_url, model_3d_url, has_3d) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) ON CONFLICT (id) DO NOTHING`,
          [p.id, p.uid, p.sku, p.barcode, p.slug, p.name, p.description, p.type, categoryId, p.subcategory, p.brand, p.model, p.price, p.stock, p.image, p.model3D, p.has3D]
        );
      }
    }

    // 3. Migrate Blog Posts
    const blogPath = path.join(dataDir, 'blog_posts.json');
    if (fs.existsSync(blogPath)) {
      const posts = JSON.parse(fs.readFileSync(blogPath, 'utf8'));
      results.push(`📝 Migrating ${posts.length} blog posts...`);
      for (const post of posts) {
        await pool.query(
          `INSERT INTO blog_posts (id, title, slug, content, excerpt, image_url, date, author, category, tags) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
          [post.id, post.title, post.slug, post.content, post.excerpt, post.image, post.date, post.author, post.category, JSON.stringify(post.tags || [])]
        );
      }
    }

    // 4. Migrate Users
    const usersPath = path.join(dataDir, 'users.json');
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      results.push(`👥 Migrating ${users.length} users...`);
      for (const u of users) {
        await pool.query(
          `INSERT INTO users (id, email, username, display_name, callsign, team_name, password, role, points, rank, discount_level, avatar_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO NOTHING`,
          [u.id, u.email, u.username, u.displayName, u.callsign, u.teamName, u.password, u.role, u.points, u.rank, u.discountLevel, u.avatar]
        );
      }
    }

    // 5. Migrate Policies
    const policiesPath = path.join(dataDir, 'policies.json');
    if (fs.existsSync(policiesPath)) {
      const policies = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));
      results.push(`📜 Migrating ${policies.length} policies...`);
      for (const p of policies) {
        await pool.query(
          `INSERT INTO policies (id, title, content, title_hr, content_hr, last_updated) 
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [p.id, p.title, p.content, p.title_hr, p.content_hr, p.lastUpdated]
        );
      }
    }

    res.json({ success: true, logs: results });
  } catch (err: any) {
    console.error('❌ Internal migration failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stripe Payment Intent
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "eur" } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // amount in cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Stripe Error:", error.message);
    res.status(400).send({ error: error.message });
  }
});

app.delete("/api/admin/warehouses/:id", authenticateAdmin, async (req, res) => {
  try {
    await db.collection("warehouses").doc(req.params.id).delete();
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/suppliers/:id", authenticateAdmin, async (req, res) => {
  try {
    await db.collection("suppliers").doc(req.params.id).delete();
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/saved-builds/:id", authenticateToken, async (req: any, res) => {
  try {
    await db.collection("saved_builds").doc(req.params.id).delete();
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/stock/seed", authenticateAdmin, async (req, res) => {
  try {
    // Dummy seed logic for demo
    res.json({ message: "Stock seeded successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "build")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "build", "index.html"));
    });
  }
}

startServer();
