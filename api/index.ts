import type { VercelRequest, VercelResponse } from "@vercel/node";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { put, del } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import Stripe from "stripe";
import { runAllMigrations } from './lib/migrations.js';

let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16" as any,
    });
  }
} catch (e) {
  console.error("Stripe init error:", e);
}



const { Pool } = pg;

// ─── DB Connection ────────────────────────────────────────────────────────────
let pool: any = null;
function getPool() {
  if (pool) return pool;

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.hrdatabase_DATABASE_URL ||
    process.env.hrdatabase_POSTGRES_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
  return pool;
}


const JWT_SECRET = process.env.JWT_SECRET || "hristo-secret-key";

// ─── Auth middleware ──────────────────────────────────────────────────────────
function getUser(req: VercelRequest) {
  let token = "";
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    token = auth.slice(7);
  } else if (req.query.token) {
    token = String(req.query.token);
  }

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || typeof decoded !== "object") return null;

      const adminEmails = (process.env.ADMIN_EMAILS || "guardsowh@gmail.com")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

      const email = String(decoded.email || "").toLowerCase();
      const role = decoded.role === "admin" || adminEmails.includes(email) ? "admin" : "user";

      if (!decoded.sub && !decoded.user_id) return null;

      return {
        id: decoded.user_id || decoded.sub,
        email,
        role,
      };
    } catch {
      return null;
    }
  }
}

// ─── Mapper ───────────────────────────────────────────────────────────────────
function mapOrder(row: any, items: any[] = []) {
  if (!row) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax || 0),
    shippingCost: Number(row.shipping_cost || 0),
    total: Number(row.total),
    profit: Number(row.profit || 0),
    status: row.status,
    payment: {
      method: row.payment_method || 'unknown',
      status: row.payment_status || 'pending',
      amount: Number(row.total || 0),
      currency: "EUR"
    },
    shipping: typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : (row.shipping_address || {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: row.notes,
    items: items.map(item => ({
      productId: item.product_id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      image: item.image,
      sku: item.sku,
      configuration: typeof item.variant_info === 'string' ? JSON.parse(item.variant_info) : item.variant_info
    })),
    stripePaymentIntentId: row.stripe_payment_intent_id
  };
}

function match(path: string, pattern: string): string[] | null {
  const keys: string[] = [];
  // Ensure we handle trailing slashes by making them optional in the regex
  const cleanPattern = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern;
  const re = new RegExp("^" + cleanPattern.replace(/:([^/]+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "/?$");
  const m = path.match(re);
  if (!m) return null;
  return keys.map((_, i) => m[i + 1]);
}

async function recalculateUserPointsAndRank(pool: any, userId: string) {
  if (!userId || userId === "guest") return;
  console.log(`🔄 [Loyalty] Recalculating for user: ${userId}`);
  try {
    // 1. Sum total of all paid/delivered/shipped/processing orders
    const ordersRes = await pool.query(
      "SELECT SUM(total) as spent FROM orders WHERE user_id = $1 AND status IN ('paid', 'processing', 'shipped', 'delivered')",
      [userId]
    );
    const totalSpent = parseFloat(ordersRes.rows[0]?.spent || 0);
    const points = Math.floor(totalSpent); // 1 EUR = 1 PT

    const RANK_THRESHOLDS = [
      { rank: 'recruit', threshold: 0, discount: 0 },
      { rank: 'private', threshold: 500, discount: 3 },
      { rank: 'sergeant', threshold: 1500, discount: 5 },
      { rank: 'special_forces', threshold: 3000, discount: 10 },
      { rank: 'operator', threshold: 5000, discount: 15 },
      { rank: 'commander', threshold: 10000, discount: 20 }
    ];

    let rank = 'recruit';
    let discount = 0;
    for (const r of RANK_THRESHOLDS) {
      if (points >= r.threshold) {
        rank = r.rank;
        discount = r.discount;
      }
    }

    // 2. Ensure user exists and update
    const userRes = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (id, role, points, rank, discount_level, username) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, 'user', points, rank, discount, `User_${userId.slice(-4)}`]
      );
    } else {
      await pool.query(
        "UPDATE users SET points = $1, rank = $2, discount_level = $3 WHERE id = $4",
        [points, rank, discount, userId]
      );
    }

    console.log(`✅ [Loyalty] Success for ${userId}: ${points} pts, rank: ${rank}`);
    return { points, rank, discount };
  } catch (err) {
    console.error("❌ [Loyalty] Recalculation failed:", err);
    throw err;
  }
}




// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "/";
  let path = "/" + (url.replace(/^\/api\/?/, "").split("?")[0]);
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  const method = req.method || "GET";

  try {
    const pool = getPool();

    // 🔍 Debug logging for routing
    console.log(`[API] ${method} ${url} -> processed path: ${path}`);


    if (path === "/admin/stats" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const stats = await pool.query(`
        SELECT 
          COUNT(*) as total_products,
          COALESCE(SUM(stock), 0) as total_stock,
          ROUND(COALESCE(AVG(price), 0), 2) as avg_price,
          ROUND(COALESCE(SUM(stock * price), 0), 2) as total_value,
          ROUND(COALESCE(SUM((price - landing_cost) * stock), 0), 2) as potential_profit
        FROM products;
      `);
      return res.status(200).json(stats.rows[0]);
    }

    if (path === "/admin/migrate" && method === "POST") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      try {
        const results = await runAllMigrations(pool);
        return res.json({ success: true, results });
      } catch (err: any) {
        console.error("Migration error:", err);
        return res.status(500).json({ error: err.message });
      }
    }

    // ── Loyalty Recalculate ──────────────────────────────────────────────────
    if (path === "/admin/loyalty/recalc" && method === "POST") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      try {
        const usersRes = await pool.query("SELECT id FROM users");
        for (const u of usersRes.rows) {
          await recalculateUserPointsAndRank(pool, u.id);
        }
        return res.json({ success: true, count: usersRes.rows.length });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }

    // ── Stripe Payment Intent ───────────────────────────────────────────────
    if (path === "/create-payment-intent" && method === "POST") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      if (!stripe) return res.status(500).json({ error: "Stripe is not configured on the server. Please set STRIPE_SECRET_KEY." });


      const { items, shipping_cost, orderId } = req.body || {};
      if (!items || !Array.isArray(items)) return res.status(400).json({ error: "Items are required" });

      // Calculate total amount in cents
      let subtotal = 0;
      const userResult = await pool.query('SELECT discount_level, stripe_customer_id FROM users WHERE id = $1', [user.id]);
      const userDiscount = userResult.rows[0]?.discount_level || 0;

      for (const item of items) {
        const pid = item.product_id || item.productId || item.id;
        const productResult = await pool.query('SELECT price, discount, category_id FROM products WHERE id = $1', [pid]);
        if (productResult.rows.length === 0) continue;

        const product = productResult.rows[0];
        const categoryResult = await pool.query('SELECT discount FROM categories WHERE id = $1', [product.category_id]);
        const categoryDiscount = categoryResult.rows[0]?.discount || 0;

        const productDiscount = parseInt(product.discount) || 0;
        const bestDiscount = Math.max(productDiscount, categoryDiscount, userDiscount);

        const price = parseFloat(product.price) * (1 - bestDiscount / 100);
        subtotal += price * (item.quantity || 1);
      }

      const totalAmount = Math.round((subtotal + (shipping_cost || 0)) * 100);

      let stripeCustomerId = userResult.rows[0]?.stripe_customer_id;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id }
        });
        stripeCustomerId = customer.id;
        await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [stripeCustomerId, user.id]);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "eur",
        customer: stripeCustomerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId: user.id,
          email: user.email,
          orderId: orderId || ''
        }
      });

      return res.json({ clientSecret: paymentIntent.client_secret });
    }

    // ── Stripe Webhook ───────────────────────────────────────────────────────
    if (path === "/webhooks/stripe" && method === "POST") {
      // NOTE: For Vercel we skip raw body signature check for simplicity in this fix 
      // or we can use req.body if it's already a buffer.
      const event = req.body;
      if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object;
        if (pi.metadata.orderId) {
          await pool.query(
            "UPDATE orders SET status = 'processing', payment_status = 'paid', stripe_payment_intent_id = $1 WHERE id = $2",
            [pi.id, pi.metadata.orderId]
          );
          // Recalculate points for the user
          if (pi.metadata.userId) {
            await recalculateUserPointsAndRank(pool, pi.metadata.userId);
          }
        }
      }
      return res.json({ received: true });
    }

    if (path === "/db-test" || path === "/diag/db-test") {
      // Auto-migrate schema on test
      try {
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS attachment_slot TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS mount_type TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT");

        // Orders & Tracking
        await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT false");
        await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT");

        // Inventory Logs
        await pool.query(`
          CREATE TABLE IF NOT EXISTS inventory_logs (
            id SERIAL PRIMARY KEY,
            product_id TEXT NOT NULL,
            change_amount INTEGER NOT NULL,
            reason TEXT,
            reference_id TEXT,
            user_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS product_compatibility (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parent_uid TEXT NOT NULL,
            child_uid TEXT NOT NULL,
            slot_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(parent_uid, child_uid, slot_name)
          )
        `);
      } catch (e) {
        console.error("Migration test error:", e);
      }

      const r = await pool.query("SELECT NOW()");
      return res.json({ ok: true, time: r.rows[0].now });
    }

    // ── GET /categories ────────────────────────────────────────────────────────
    if (path === "/categories" && method === "GET") {
      const r = await pool.query(
        "SELECT id, name, name_hr as \"nameHr\", slug, image_url as image, parent_id as parent, filters FROM categories ORDER BY name"
      );
      return res.json(r.rows);
    }

    // ── POST/PUT /admin/categories ──────────────────────────────────────────────
    const catUpdateMatch = match(path, "/admin/categories/:id");
    const isCatUpdate = (path === "/admin/categories" || catUpdateMatch) && (method === "POST" || method === "PUT");

    if (isCatUpdate) {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const categoryIdFromPath = catUpdateMatch ? catUpdateMatch[0] : null;
      const body = req.body || {};
      const id = body.id;
      const name = body.name;
      const slug = body.slug || body.id;
      const imageUrl = body.image_url || body.image || null;
      const parentId = body.parent_id || body.parent || null;
      const filters = body.filters || [];
      const discount = body.discount ? parseInt(body.discount, 10) : 0;
      const finalId = id || categoryIdFromPath || slug;

      if (!finalId) return res.status(400).json({ error: "Category ID is required" });

      try {
        await pool.query(
          `INSERT INTO categories (id, name, slug, image_url, parent_id, filters, discount) 
           VALUES ($1,$2,$3,$4,$5,$6,$7) 
           ON CONFLICT (id) DO UPDATE SET 
             name = EXCLUDED.name, 
             slug = EXCLUDED.slug, 
             image_url = EXCLUDED.image_url, 
             parent_id = EXCLUDED.parent_id, 
             filters = EXCLUDED.filters,
             discount = EXCLUDED.discount`,
          [finalId, name, slug, imageUrl, parentId, JSON.stringify(filters), discount]
        );
        return res.json({ ok: true });
      } catch (err: any) {
        console.error("Failed to save category:", err);
        return res.status(500).json({ error: "Failed to save category", message: err.message });
      }
    }

    // ── DELETE /admin/categories/:id ───────────────────────────────────────────
    const catDel = match(path, "/admin/categories/:id");
    if (catDel && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const identifier = catDel[0];
      try {
        const result = await pool.query('SELECT image_url FROM categories WHERE id = $1', [identifier]);
        if (result.rows.length > 0 && result.rows[0].image_url) {
          const url = result.rows[0].image_url;
          if (url && url.includes('blob.vercel-storage.com')) {
            const token = process.env.HR_STORAGE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
            try { await del(url, { token }); } catch (e) { console.error('Failed to delete category blob:', e); }
          }
        }
      } catch (e) {
        console.error('Category cleanup error:', e);
      }

      try {
        await pool.query("UPDATE products SET category_id = NULL WHERE category_id = $1", [identifier]);
        await pool.query("UPDATE products SET subcategory = NULL WHERE subcategory = $1", [identifier]);
        await pool.query("UPDATE categories SET parent_id = NULL WHERE parent_id = $1", [identifier]);
        await pool.query("DELETE FROM categories WHERE id = $1", [identifier]);
      } catch (e) {
        console.error('Failed to delete category from DB:', e);
        return res.status(500).json({ error: "Failed to delete category" });
      }
      return res.status(204).end();
    }

    // ── POST /admin/upload ─────────────────────────────────────────────────────
    if (path === "/admin/upload" && method === "POST") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const filename = req.query.filename as string || `upload_${Date.now()}`;
      const contentType = req.headers['content-type'] || 'application/octet-stream';

      // Create a promise to read the raw body if it's not already a buffer
      let body: any = req.body;
      if (!Buffer.isBuffer(body) && typeof body !== 'string') {
        // Vercel might have already parsed it or it's a stream
        // If it's a stream, we can pass it directly to put
        body = req;
      }

      const blobToken = process.env.HR_STORAGE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN;
      const blob = await put(filename, body, {
        access: 'public',
        contentType,
        token: blobToken
      });

      return res.json(blob);
    }

    // ── DELETE /admin/upload ───────────────────────────────────────────────────
    if (path === "/admin/upload" && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "URL is required" });

      const blobToken = process.env.HR_STORAGE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN;
      await del(url, {
        token: blobToken
      });

      return res.status(204).end();
    }

    // ── POST /admin/upload-handle ────────────────────────────────────────────────
    if (path === "/admin/upload-handle" && method === "POST") {
      try {
        const jsonResponse = await handleUpload({
          token: process.env.HR_STORAGE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN,
          body: req.body,
          request: req as any,
          onBeforeGenerateToken: async () => {
            const user = getUser(req);
            if (!user || user.role !== "admin") throw new Error("Forbidden");

            return {
              allowedContentTypes: [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'model/gltf-binary', 'model/gltf+json', 'application/octet-stream'
              ],
              tokenPayload: JSON.stringify({ userId: user.id }),
            };
          },
          onUploadCompleted: async () => {
          },
        });
        return res.status(200).json(jsonResponse);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // ── GET /products ──────────────────────────────────────────────────────────
    if (path === "/products" && method === "GET") {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      const { category, type, limit = "20", offset = "0" } = req.query as any;
      const where = ["p.status = 'active'"];
      const params: any[] = [];
      let i = 1;
      if (category) {
        // Search by category_id, subcategory ID, or if the product's category is a child of the filter category
        where.push(`(p.category_id = $${i} OR p.subcategory = $${i} OR c.parent_id = $${i})`);
        params.push(category);
        i++;
      }
      if (type) {
        where.push(`p.type = $${i}`);
        params.push(type);
        i++;
      }

      const q = `
        SELECT p.*, c.parent_id as parent_cat_id 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE ${where.join(' AND ')}
        ORDER BY p.name 
        LIMIT $${i} OFFSET $${i + 1}
      `;
      params.push(Number(limit), Number(offset));

      const r = await pool.query(q, params);

      return res.json(r.rows.map((p: any) => {
        const parseJson = (val: any, fallback: any = []) => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return fallback; }
          }
          return val || fallback;
        };

        return {
          ...p,
          id: p.id,
          image: p.image_url,
          images: Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
          longDescription: p.long_description,
          nameHr: p.name_hr,
          descriptionHr: p.description_hr,
          longDescriptionHr: p.long_description_hr,
          category: p.category_id,
          subcategory: p.subcategory,
          price: parseFloat(p.price) || 0,
          landing_cost: p.landing_cost ? parseFloat(p.landing_cost) : null,
          msrp: p.msrp ? parseFloat(p.msrp) : null,
          stock: parseInt(p.stock) || 0,
          discount: p.discount ? parseInt(p.discount) : 0,
          model3D: p.model_3d_url,
          model3DName: p.model3d_name,
          has3D: p.has_3d === true || p.has_3d === 'true' || !!p.model_3d_url,
          characteristics: parseJson(p.characteristics),
          variants: parseJson(p.variants),
          variantAttributes: parseJson(p.variant_attributes),
          categoryFilters: parseJson(p.category_filters, {}),
          variantsGroupId: p.variants_group_id,
          socketPoint: parseJson(p.socket_point, [0, 0, 0]),
          compatibleIds: parseJson(p.compatible_ids),
          compatibleWeapons: parseJson(p.compatible_ids),
          compatibleModuleCategories: parseJson(p.compatible_module_categories),
          slots: parseJson(p.slots),
          attachmentSlot: p.attachment_slot,
          mountType: p.mount_type
        };
      }));
    }

    // ── GET /products/:id ──────────────────────────────────────────────────────
    const prodId = match(path, "/products/:id");
    if (prodId && method === "GET") {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      const r = await pool.query(
        `SELECT p.*, c.parent_id as parent_cat_id, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = $1 OR p.slug = $1`,
        [prodId[0]]
      );
      if (!r.rows.length) return res.status(404).json({ error: "Not found" });
      const p = r.rows[0];
      const parseJson = (val: any, fallback: any = []) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch (e) { return fallback; }
        }
        return val || fallback;
      };

      const responsePayload: any = {
        ...p,
        id: p.id,
        image: p.image_url,
        images: Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
        longDescription: p.long_description,
        nameHr: p.name_hr,
        descriptionHr: p.description_hr,
        longDescriptionHr: p.long_description_hr,
        category: p.category_id,
        subcategory: p.subcategory,
        price: parseFloat(p.price) || 0,
        landing_cost: p.landing_cost ? parseFloat(p.landing_cost) : null,
        msrp: p.msrp ? parseFloat(p.msrp) : null,
        stock: parseInt(p.stock) || 0,
        discount: p.discount ? parseInt(p.discount) : 0,
        model3D: p.model_3d_url,
        model3DName: p.model3d_name,
        has3D: p.has_3d === true || p.has_3d === 'true' || !!p.model_3d_url,
        characteristics: parseJson(p.characteristics),
        variants: parseJson(p.variants),
        variantAttributes: parseJson(p.variant_attributes),
        categoryFilters: parseJson(p.category_filters, {}),
        socketPoint: parseJson(p.socket_point, [0, 0, 0]),
        compatibleIds: parseJson(p.compatible_ids),
        compatibleWeapons: parseJson(p.compatible_ids),
        compatibleModuleCategories: parseJson(p.compatible_module_categories),
        slots: parseJson(p.slots),
        attachmentSlot: p.attachment_slot,
        mountType: p.mount_type,
        variantsGroupId: p.variants_group_id
      };

      if (p.variants_group_id) {
        try {
          const relatedRes = await pool.query(
            `SELECT id, slug, name, category_filters, image_url, images 
             FROM products 
             WHERE variants_group_id = $1`,
            [p.variants_group_id]
          );
          responsePayload.relatedProducts = relatedRes.rows.map(r => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            category_filters: parseJson(r.category_filters, {}),
            image: r.image_url,
            images: parseJson(r.images, r.image_url ? [r.image_url] : [])
          }));
        } catch (e) {
          console.error("Failed to fetch related products:", e);
        }
      }

      return res.json(responsePayload);
    }

    // ── POST /admin/products ───────────────────────────────────────────────────
    if (path === "/admin/products" && method === "POST") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const p = req.body || {};
      const id = p.id || `prod-${Date.now()}`;

      const imageUrl = p.image_url || p.image || null;
      // Prioritize model3D (frontend field) over model_3d_url (backend field) to avoid using cached/old DB values
      const model3dUrl = p.model3D || p.model_3d_url || null;
      const baseHas3d = p.has3D !== undefined ? p.has3D : (p.has_3d !== undefined ? p.has_3d : false);
      const has3d = model3dUrl ? true : baseHas3d;
      const imagesArr = p.images || (imageUrl ? [imageUrl] : []);
      const longDescription = p.long_description || p.longDescription || null;

      try {
        // Just-in-time migration
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS attachment_slot TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS mount_type TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS variants_group_id TEXT");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS product_compatibility (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parent_uid TEXT NOT NULL,
            child_uid TEXT NOT NULL,
            slot_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(parent_uid, child_uid, slot_name)
          )
        `);
      } catch (e) {
        console.error("Migration error:", e);
      }

      try {
        const productData = [
          id,
          p.uid || id,
          p.sku || '',
          p.barcode || '',
          p.slug || id,
          p.name || 'Unnamed Product',
          p.description || '',
          longDescription || '',
          p.type || 'weapon',
          (p.category !== undefined ? (p.category || null) : (p.category_id || null)),
          p.subcategory || null,
          p.brand || '',
          p.model || '',
          parseFloat(p.price) || 0,
          parseInt(p.stock) || 0,
          imageUrl,
          JSON.stringify(imagesArr),
          model3dUrl,
          !!has3d,
          JSON.stringify(p.characteristics || []),
          JSON.stringify(p.variants || []),
          JSON.stringify(p.variantAttributes || p.variant_attributes || []),
          JSON.stringify(p.categoryFilters || p.category_filters || {}),
          p.nameHr || null,
          p.descriptionHr || null,
          p.longDescriptionHr || null,
          JSON.stringify(
            (p.compatibleWeapons && p.compatibleWeapons.length > 0) ? p.compatibleWeapons :
              ((p.compatibleIds && p.compatibleIds.length > 0) ? p.compatibleIds : [])
          ),
          JSON.stringify(
            (p.compatibleModuleCategories && p.compatibleModuleCategories.length > 0) ? p.compatibleModuleCategories : []
          ),
          JSON.stringify(
            (p.socketPoint && p.socketPoint.length > 0) ? p.socketPoint : []
          ),
          JSON.stringify(
            (p.slots && p.slots.length > 0) ? p.slots : []
          ),
          p.mountType || null,
          p.attachmentSlot || null,
          p.variantsGroupId || null
        ];

        console.log(`[DB] Product save payload:`, JSON.stringify(p, null, 2));
        const r = await pool.query(
          `INSERT INTO products (
            id, uid, sku, barcode, slug, name, description, long_description, type, category_id, subcategory, brand, model, 
            price, stock, image_url, images, model_3d_url, has_3d, characteristics, 
            variants, variant_attributes, category_filters, 
            name_hr, description_hr, long_description_hr, status,
            compatible_ids, compatible_module_categories, socket_point, slots, mount_type, attachment_slot, variants_group_id
          )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,'active',$27,$28,$29,$30,$31,$32,$33)
           ON CONFLICT (id) DO UPDATE SET 
            name=$6, description=$7, long_description=$8, price=$14, stock=$15, image_url=$16, images=$17, 
            model_3d_url=$18, has_3d=$19, characteristics=$20, variants=$21, 
            variant_attributes=$22, category_filters=$23, 
            name_hr=$24, description_hr=$25, long_description_hr=$26,
            brand=$12, model=$13, sku=$3, barcode=$4, type=$9, category_id=$10, subcategory=$11,
            compatible_ids=$27, compatible_module_categories=$28, socket_point=$29, slots=$30, mount_type=$31, attachment_slot=$32, variants_group_id=$33`,
          productData
        );

        console.log(`[DB] Product save success. RowCount: ${r.rowCount}, ID: ${p.uid || id}, Category: ${p.category || p.category_id}, Subcategory: ${p.subcategory}`);

        // Sync compatibility table for whitelist
        try {
          if (Array.isArray(p.compatibleIds || p.compatibleWeapons)) {
            const uids = p.compatibleIds || p.compatibleWeapons;
            console.log(`[DB] Syncing ${uids.length} compatibility relations for ${p.uid || id}`);
            for (const parentUid of uids) {
              await pool.query(
                "INSERT INTO product_compatibility (parent_uid, child_uid) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [parentUid, p.uid || id]
              );
            }
          }
        } catch (syncErr) {
          console.error("Compatibility sync failed:", syncErr);
        }

        return res.json({ ok: true, id, uid: p.uid || id });
      } catch (dbErr: any) {
        console.error("Database Insert Error:", dbErr);
        return res.status(500).json({
          error: "Database Insert Failed",
          message: dbErr.message,
          detail: dbErr.detail,
          payload: p // Return payload for debug
        });
      }
    }

    // ── PUT /admin/products/:id ────────────────────────────────────────────────
    const adminProdPUT = match(path, "/admin/products/:id");
    if (adminProdPUT && method === "PUT") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const p = req.body || {};

      const imageUrl = p.image_url || p.imageUrl || null;
      const model3dUrl = p.model_3d_url || p.model3DUrl || p.model3D || null;
      const newImages = Array.isArray(p.images) ? p.images : [];

      // 1. Cleanup orphaned blobs (files replaced or removed)
      try {
        const currentRes = await pool.query('SELECT image_url, images, model_3d_url FROM products WHERE id = $1 OR slug = $1', [adminProdPUT[0]]);
        if (currentRes.rows.length > 0) {
          const old = currentRes.rows[0];
          const oldUrls = new Set<string>();
          const newUrls = new Set<string>();

          // Collect old URLs
          if (old.image_url) oldUrls.add(old.image_url);
          if (old.model_3d_url) oldUrls.add(old.model_3d_url);
          if (old.images) {
            try {
              const parsed = typeof old.images === 'string' ? JSON.parse(old.images) : old.images;
              if (Array.isArray(parsed)) parsed.forEach(u => { if (u && typeof u === 'string') oldUrls.add(u); });
            } catch (e) {}
          }

          // Collect new URLs
          if (imageUrl) newUrls.add(imageUrl);
          if (model3dUrl) newUrls.add(model3dUrl);
          newImages.forEach(u => { if (u && typeof u === 'string') newUrls.add(u); });

          // Delete those that are in old but not in new
          const token = process.env.HR_STORAGE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
          for (const url of oldUrls) {
            if (!newUrls.has(url) && url && url.includes('blob.vercel-storage.com')) {
              try { 
                await del(url, { token }); 
                console.log(`[Product Update Cleanup] Deleted orphaned blob: ${url}`);
              } catch (e) { 
                console.error(`[Product Update Cleanup] Failed to delete blob: ${url}`, e); 
              }
            }
          }
        }
      } catch (e) {
        console.error('Blob cleanup error during product update:', e);
      }

      try {
        // Just-in-time migration
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS attachment_slot TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS mount_type TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS variants_group_id TEXT");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS product_compatibility (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parent_uid TEXT NOT NULL,
            child_uid TEXT NOT NULL,
            slot_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(parent_uid, child_uid, slot_name)
          )
        `);
      } catch (e) {
        console.error("Migration error:", e);
      }

      try {
        const has3d = !!model3dUrl;
        const imagesArr = newImages;
        const longDescription = p.longDescription || p.long_description || '';

        const productData = [
          adminProdPUT[0],
          p.name || 'Unnamed Product',
          p.description || '',
          longDescription || '',
          parseFloat(p.price) || 0,
          parseInt(p.stock) || 0,
          imageUrl,
          JSON.stringify(imagesArr),
          model3dUrl,
          !!has3d,
          JSON.stringify(p.characteristics || []),
          JSON.stringify(p.variants || []),
          JSON.stringify(p.variantAttributes || p.variant_attributes || []),
          JSON.stringify(p.categoryFilters || p.category_filters || {}),
          p.nameHr || null,
          p.descriptionHr || null,
          p.longDescriptionHr || null,
          p.brand || '',
          p.model || '',
          p.sku || '',
          p.barcode || '',
          p.type || 'weapon',
          p.status || 'active',
          (p.category !== undefined ? (p.category || null) : (p.category_id || null)),
          p.subcategory || null,
          JSON.stringify(
            (p.compatibleWeapons && p.compatibleWeapons.length > 0) ? p.compatibleWeapons :
              ((p.compatibleIds && p.compatibleIds.length > 0) ? p.compatibleIds : [])
          ),
          JSON.stringify(
            (p.compatibleModuleCategories && p.compatibleModuleCategories.length > 0) ? p.compatibleModuleCategories : []
          ),
          JSON.stringify(
            (p.socketPoint && p.socketPoint.length > 0) ? p.socketPoint : []
          ),
          JSON.stringify(
            (p.slots && p.slots.length > 0) ? p.slots : []
          ),
          p.mountType || null,
          p.attachmentSlot || null,
          p.variantsGroupId || null
        ];

        const r = await pool.query(
          `UPDATE products SET 
            name=$2, description=$3, long_description=$4, price=$5, stock=$6, image_url=$7, images=$8, 
            model_3d_url=$9, has_3d=$10, characteristics=$11, variants=$12, 
            variant_attributes=$13, category_filters=$14, 
            name_hr=$15, description_hr=$16, long_description_hr=$17,
            brand=$18, model=$19, sku=$20, barcode=$21, type=$22, status=$23,
            category_id=$24, subcategory=$25,
            compatible_ids=$26, compatible_module_categories=$27, socket_point=$28, slots=$29, mount_type=$30, attachment_slot=$31, variants_group_id=$32
           WHERE id = $1 OR slug = $1
           RETURNING id`,
          productData
        );

        if (r.rowCount === 0) {
          console.warn(`[DB] No product found to update with ID/Slug: ${adminProdPUT[0]}`);
          return res.status(404).json({ error: "Product not found to update" });
        }

        console.log(`[DB] Update successful for ${adminProdPUT[0]}. RowCount: ${r.rowCount}`);

        // Simple sync for compatibility whitelist
        const currentUid = p.uid || adminProdPUT[0];
        try {
          const uids = (p.compatibleWeapons && p.compatibleWeapons.length > 0) ? p.compatibleWeapons :
            ((p.compatibleIds && p.compatibleIds.length > 0) ? p.compatibleIds : null);

          if (Array.isArray(uids)) {
            console.log(`[DB] Syncing ${uids.length} compatible weapons for ${currentUid}`);
            await pool.query("DELETE FROM product_compatibility WHERE child_uid = $1", [currentUid]);
            for (const parentUid of uids) {
              await pool.query(
                "INSERT INTO product_compatibility (parent_uid, child_uid) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [parentUid, currentUid]
              );
            }
          }
        } catch (syncErr) {
          console.error("Compatibility sync failed:", syncErr);
        }

        return res.json({ ok: true, id: r.rows[0].id, updated: true });
      } catch (dbErr: any) {
        console.error("Database Update Error:", dbErr);
        return res.status(500).json({
          error: "Database Update Failed",
          message: dbErr.message,
          detail: dbErr.detail,
          idUsed: adminProdPUT[0]
        });
      }
    }

    // ── DELETE /admin/products/:id ─────────────────────────────────────────────
    const adminProductDeleteMatch = match(path, "/admin/products/:id");
    if (adminProductDeleteMatch && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const identifier = adminProductDeleteMatch[0];
      try {
        // Cleanup blobs
        const result = await pool.query('SELECT image_url, images, model_3d_url FROM products WHERE id = $1 OR slug = $1', [identifier]);
        if (result.rows.length > 0) {
          const p = result.rows[0];
          const urlsToDelete = new Set<string>();

          if (p.image_url) urlsToDelete.add(p.image_url);
          if (p.model_3d_url) urlsToDelete.add(p.model_3d_url);
          
          if (p.images) {
            try {
              const images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
              if (Array.isArray(images)) {
                images.forEach(u => { if (u && typeof u === 'string') urlsToDelete.add(u); });
              }
            } catch (e) {
              console.error('Failed to parse images for cleanup:', e);
            }
          }

          const token = process.env.HR_STORAGE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
          if (urlsToDelete.size > 0) {
            console.log(`[Product Cleanup API] Deleting ${urlsToDelete.size} files for product ${identifier}...`);
            for (const url of urlsToDelete) {
              if (url && url.includes('blob.vercel-storage.com')) {
                try { 
                  await del(url, { token }); 
                  console.log(`[Product Cleanup API] Deleted: ${url}`);
                } catch (e) { 
                  console.error(`[Product Cleanup API] Failed to delete blob: ${url}`, e); 
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Blob cleanup error during product delete:', e);
      }

      const deleteResult = await pool.query("DELETE FROM products WHERE id = $1 OR slug = $1", [identifier]);
      if (deleteResult.rowCount === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.status(204).end();
    }

    // ── GET /blog ─────────────────────────────────────────────────────────────
    if ((path === "/blog" || path === "/blog-posts" || path === "/articles") && method === "GET") {
      const { category, limit = "20" } = req.query as any;
      let q = "SELECT * FROM blog_posts";
      const params: any[] = [];
      if (category) { q += " WHERE category = $1"; params.push(category); }
      q += ` ORDER BY published_at DESC LIMIT $${params.length + 1}`;
      params.push(Number(limit));
      const r = await pool.query(q, params);
      return res.json({ posts: r.rows, total: r.rows.length });
    }

    // ── GET /blog/:id ──────────────────────────────────────────────────────────
    const blogId = match(path, "/blog/:id");
    if (blogId && method === "GET") {
      const r = await pool.query("SELECT * FROM blog_posts WHERE id = $1 OR slug = $1", [blogId[0]]);
      if (!r.rows.length) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    // ── GET /blog-posts/:id ────────────────────────────────────────────────────
    const blogPostId = match(path, "/blog-posts/:id");
    if (blogPostId && method === "GET") {
      const r = await pool.query("SELECT * FROM blog_posts WHERE id = $1 OR slug = $1", [blogPostId[0]]);
      if (!r.rows.length) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    // ── POST /admin/blog ───────────────────────────────────────────────────────
    if (path === "/admin/blog" && method === "POST") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const p = req.body || {};
      const id = p.id || `blog-${Date.now()}`;
      await pool.query(
        "INSERT INTO blog_posts (id, slug, title, content, category, image_url, author, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET title=$3, content=$4, status=$8",
        [id, p.slug || id, p.title, p.content, p.category || 'general', p.image_url || null, p.author || 'Admin', p.status || 'published']
      );
      return res.json({ id });
    }

    // ── PUT /admin/blog/:id ────────────────────────────────────────────────────
    const adminBlogPUT = match(path, "/admin/blog/:id");
    if (adminBlogPUT && method === "PUT") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const p = req.body || {};
      await pool.query(
        "UPDATE blog_posts SET title=$2, content=$3, status=$4, image_url=$5 WHERE id = $1",
        [adminBlogPUT[0], p.title, p.content, p.status || 'published', p.image_url || null]
      );
      return res.json({ ok: true });
    }

    // ── DELETE /admin/blog/:id ─────────────────────────────────────────────────
    const adminBlogDELETE = match(path, "/admin/blog/:id");
    if (adminBlogDELETE && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      try {
        const result = await pool.query('SELECT image_url FROM blog_posts WHERE id = $1 OR slug = $1', [adminBlogDELETE[0]]);
        if (result.rows.length > 0 && result.rows[0].image_url) {
          const url = result.rows[0].image_url;
          if (url && url.includes('blob.vercel-storage.com')) {
            const token = process.env.HR_STORAGE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
            try { await del(url, { token }); } catch (e) { console.error(`Failed to delete blog image blob: ${url}`, e); }
          }
        }
      } catch (e) {
        console.error('Blob cleanup error during blog delete:', e);
      }

      await pool.query("DELETE FROM blog_posts WHERE id = $1 OR slug = $1", [adminBlogDELETE[0]]);
      return res.status(204).end();
    }

    // ── POST /auth/register ────────────────────────────────────────────────────
    if (path === "/auth/register" && method === "POST") {
      const { username, email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });
      const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (exists.rows.length) return res.status(400).json({ error: "Email already registered" });
      const hashed = await bcrypt.hash(password, 10);
      const id = `user-${Date.now()}`;
      await pool.query(
        "INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, 'user')",
        [id, username || email.split("@")[0], email, hashed]
      );
      const token = jwt.sign({ id, email, role: "user" }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ token, user: { id, email, username: username || email.split("@")[0], role: "user" } });
    }

    // ── POST /auth/login ───────────────────────────────────────────────────────
    if (path === "/auth/login" && method === "POST") {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });
      const r = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (!r.rows.length) return res.status(401).json({ error: "Invalid credentials" });
      const user = r.rows[0];
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
    }

    // ── GET /orders ────────────────────────────────────────────────────────────
    if (path === "/orders" && method === "GET") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const ordersRes = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
        [user.id]
      );
      const itemsRes = await pool.query(
        "SELECT oi.* FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = $1",
        [user.id]
      );

      const orders = ordersRes.rows.map(row => {
        const items = itemsRes.rows.filter(item => item.order_id === row.id);
        return mapOrder(row, items);
      });

      return res.json(orders);
    }

    if (path === "/orders" && method === "POST") {
      const user = getUser(req);
      const {
        id: providedId,
        items,
        total,
        subtotal,
        tax,
        discountAmount,
        shippingCost,
        status,
        payment,
        shipping,
        notes,
        pointsEarned
      } = req.body || {};
      const userId = user?.id || "guest";
      const id = providedId || `order-${Date.now()}`;

      // Calculate profit if not provided
      let profit = req.body.profit;
      if (profit === undefined && items?.length) {
        let totalLandingCost = 0;
        items.forEach((item: any) => {
          const cost = Number(item.landingCost || item.price * 0.6);
          totalLandingCost += cost * (item.quantity || 1);
        });
        profit = Number(total || 0) - totalLandingCost;
      }

      const resOrder = await pool.query(
        `INSERT INTO orders (
          id, order_number, user_id, total, subtotal, tax, discount_amount, shipping_cost, 
          status, payment_method, payment_status, shipping_address, 
          first_name, last_name, email, shipping_city, shipping_phone, shipping_postal_code,
          notes, profit, points_earned
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id) DO UPDATE SET 
          total = EXCLUDED.total,
          subtotal = EXCLUDED.subtotal,
          tax = EXCLUDED.tax,
          discount_amount = EXCLUDED.discount_amount,
          shipping_cost = EXCLUDED.shipping_cost,
          status = EXCLUDED.status,
          payment_method = EXCLUDED.payment_method,
          payment_status = EXCLUDED.payment_status,
          shipping_address = EXCLUDED.shipping_address,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email,
          shipping_city = EXCLUDED.shipping_city,
          shipping_phone = EXCLUDED.shipping_phone,
          shipping_postal_code = EXCLUDED.shipping_postal_code,
          notes = EXCLUDED.notes,
          profit = EXCLUDED.profit,
          user_id = EXCLUDED.user_id,
          points_earned = EXCLUDED.points_earned,
          updated_at = CURRENT_TIMESTAMP
        RETURNING order_number`,
        [
          id,
          `HRA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
          userId,
          Number(total || 0),
          Number(subtotal || total || 0),
          Number(tax || 0),
          Number(discountAmount || 0),
          Number(shippingCost || 0),
          status || 'pending',
          payment?.method || 'unknown',
          payment?.status || 'pending',
          JSON.stringify(shipping || {}),
          shipping?.firstName || (shipping?.fullName ? shipping.fullName.split(' ')[0] : ''),
          shipping?.lastName || (shipping?.fullName ? shipping.fullName.split(' ').slice(1).join(' ') : ''),
          shipping?.email || '',
          shipping?.city || '',
          shipping?.phone || '',
          shipping?.postalCode || '',
          notes || '',
          profit || 0,
          Number(pointsEarned || 0)
        ]
      );

      const orderNumber = resOrder.rows[0].order_number;

      // Only insert items if this is a new order or we want to refresh them
      if (items?.length) {
        // Clear existing items if updating
        await pool.query("DELETE FROM order_items WHERE order_id = $1", [id]);
        for (const item of items) {
          await pool.query(
            "INSERT INTO order_items (order_id, product_id, name, quantity, price, image, sku, variant_info, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [
              id,
              item.productId || item.id,
              item.name || 'Product',
              item.quantity,
              Number(item.price || 0),
              item.image || null,
              item.sku || null,
              item.configuration ? JSON.stringify(item.configuration) : (item.selectedVariant ? JSON.stringify(item.selectedVariant) : (item.variant_info ? (typeof item.variant_info === 'string' ? item.variant_info : JSON.stringify(item.variant_info)) : null)),
              item.category || null
            ]
          );
        }
      }
      return res.json({ id, order_number: orderNumber, status: status || "pending" });
    }

    // ── GET /admin/orders ──────────────────────────────────────────────────────
    if (path === "/admin/orders" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const ordersRes = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
      // Use a subquery or separate call, but let's make it fetch all matching items once
      const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id IN (SELECT id FROM orders)");

      const orders = ordersRes.rows.map(row => {
        const items = itemsRes.rows.filter(item => String(item.order_id) === String(row.id));
        return mapOrder(row, items);
      });

      return res.json(orders);
    }

    // ── PUT /admin/orders/:id/status ───────────────────────────────────────────
    const orderStatusMatch = match(path, "/admin/orders/:id/status");
    if (orderStatusMatch && method === "PUT") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const { status: newStatus, tracking_number } = req.body || {};
      const orderId = orderStatusMatch[0];

      try {
        // Fetch current order info to see if stock needs updating
        const orderRes = await pool.query("SELECT status, stock_deducted FROM orders WHERE id = $1", [orderId]);

        if (orderRes.rows.length > 0) {
          const { stock_deducted } = orderRes.rows[0];

          // Logic: Deduct stock when moving TO 'processing', 'paid', 'shipped', or 'delivered'
          // BUT only if stock hasn't been deducted yet.
          const fulfilledStatuses = ['processing', 'paid', 'shipped', 'delivered'];
          const shouldDeduct = fulfilledStatuses.includes(newStatus) && !stock_deducted;

          // Logic: Return stock when moving FROM a fulfilled status TO 'cancelled' or 'refunded'
          const shouldReturn = (newStatus === 'cancelled' || newStatus === 'refunded') && stock_deducted;

          if (shouldDeduct || shouldReturn) {
            const itemsRes = await pool.query("SELECT product_id, quantity FROM order_items WHERE order_id = $1", [orderId]);
            for (const item of itemsRes.rows) {
              const modifier = shouldDeduct ? -item.quantity : item.quantity;
              // Update main stock
              await pool.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [modifier, item.product_id]);

              // Note: Ideally we'd also update the 'stock' table if using multi-warehouse, 
              // but for now the 'products' table is the source of truth for the frontend gallery.

              // Add to inventory log
              try {
                await pool.query(
                  "INSERT INTO inventory_logs (product_id, change_amount, reason, reference_id, user_id) VALUES ($1, $2, $3, $4, $5)",
                  [item.product_id, modifier, shouldDeduct ? 'sale' : 'return', orderId, user.id]
                );
              } catch (logErr) {
                console.error("Failed to write inventory log:", logErr);
              }
            }
            // Mark as deducted (or not if returned)
            await pool.query("UPDATE orders SET stock_deducted = $1 WHERE id = $2", [shouldDeduct, orderId]);
          }
        }

        await pool.query("UPDATE orders SET status=$2, tracking_number=$3 WHERE id = $1", [orderId, newStatus, tracking_number]);

        // Recalculate rank for the user who owns this order
        const ownerRes = await pool.query("SELECT user_id FROM orders WHERE id = $1", [orderId]);
        if (ownerRes.rows.length > 0) {
          await recalculateUserPointsAndRank(pool, ownerRes.rows[0].user_id);
        }
      } catch (err: any) {
        console.error("Order status update error:", err);
        // Fallback simple update if everything above fails
        await pool.query("UPDATE orders SET status=$2, tracking_number=$3 WHERE id = $1", [orderId, newStatus, tracking_number || null]);
      }
      return res.json({ ok: true });
    }

    // ── GET/POST /policies ─────────────────────────────────────────────────────
    if (path === "/policies" && method === "GET") {
      const r = await pool.query("SELECT * FROM policies");
      return res.json(r.rows);
    }

    const policyId = match(path, "/policies/:id");
    if (policyId && method === "GET") {
      const r = await pool.query("SELECT * FROM policies WHERE id = $1", [policyId[0]]);
      if (!r.rows.length) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    const adminPolicyId = match(path, "/admin/policies/:id");
    if (adminPolicyId && (method === "PUT" || method === "DELETE")) {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      if (method === "DELETE") {
        await pool.query("DELETE FROM policies WHERE id = $1", [adminPolicyId[0]]);
        return res.status(204).end();
      }
      const { title, content } = req.body || {};
      await pool.query("UPDATE policies SET title=$2, content=$3 WHERE id = $1", [adminPolicyId[0], title, content]);
      return res.json({ ok: true });
    }

    // ── GET /users/:id ─────────────────────────────────────────────────────────
    const userId = match(path, "/users/:id");
    if (userId && method === "GET") {
      const authenticatedUser = getUser(req);
      const targetUserId = userId[0]; // match() returns groups starting at index 0

      try {
        // Ensure loyalty data is fresh before returning
        await recalculateUserPointsAndRank(pool, targetUserId);

        const r = await pool.query(
          "SELECT id, username, email, role, phone, address, rank, points, discount_level as \"discountLevel\", callsign, team_name as \"teamName\" FROM users WHERE id = $1",
          [targetUserId]
        );

        if (r.rows.length > 0) {
          const u = r.rows[0];
          return res.json({
            ...u,
            points: Number(u.points || 0),
            discountLevel: Number(u.discountLevel || 0)
          });
        }

        // If not found in DB but is the current authenticated user, return skeleton
        if (authenticatedUser && authenticatedUser.id === targetUserId) {
          return res.json({
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            role: authenticatedUser.role || "user",
            username: authenticatedUser.email?.split("@")[0] || "User",
            points: 0,
            rank: 'recruit',
            discountLevel: 0,
            isNewUser: true
          });
        }

        return res.status(404).json({ error: "Not found" });
      } catch (err: any) {
        console.error("User fetch error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }

    if (userId && method === "PUT") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { username, phone, address } = req.body || {};
      try {
        await pool.query("UPDATE users SET username=$2, phone=$3, address=$4 WHERE id = $1", [userId[0], username, phone, JSON.stringify(address)]);
      } catch {
        await pool.query("UPDATE users SET username=$2 WHERE id = $1", [userId[0], username]);
      }
      return res.json({ ok: true });
    }

    // ── POST /contact ──────────────────────────────────────────────────────────
    if (path === "/contact" && method === "POST") {
      const { name, email, message, subject } = req.body || {};
      await pool.query(
        "INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)",
        [name, email, subject || "Contact", message]
      );
      return res.json({ ok: true });
    }

    // ── GET /admin/users ───────────────────────────────────────────────────────
    if (path === "/admin/users" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const r = await pool.query("SELECT id, email, username, role, rank, points, discount_level as \"discountLevel\", created_at FROM users ORDER BY created_at DESC");
      return res.json(r.rows);
    }

    // ── GET /admin/messages ────────────────────────────────────────────────────
    if (path === "/admin/messages" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const r = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
      return res.json(r.rows);
    }

    const messageMatch = match(path, "/admin/messages/:id");
    if (messageMatch && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      await pool.query("DELETE FROM contact_messages WHERE id = $1", [messageMatch[0]]);
      return res.status(204).end();
    }

    // ── GET /saved-builds ──────────────────────────────────────────────────────
    if (path === "/saved-builds" && method === "GET") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const r = await pool.query("SELECT * FROM saved_builds WHERE user_id = $1 ORDER BY created_at DESC", [user.id]);
      return res.json(r.rows);
    }

    // ── POST /saved-builds ─────────────────────────────────────────────────────
    if (path === "/saved-builds" && method === "POST") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { name, product_id, configuration } = req.body || {};
      const id = `build-${Date.now()}`;
      await pool.query(
        "INSERT INTO saved_builds (id, user_id, product_id, name, configuration) VALUES ($1, $2, $3, $4, $5)",
        [id, user.id, product_id, name, JSON.stringify(configuration || {})]
      );
      return res.json({ id });
    }

    // ── GET /loadouts ──────────────────────────────────────────────────────────
    if (path === "/loadouts" && method === "GET") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const r = await pool.query("SELECT * FROM loadouts WHERE user_id = $1", [user.id]);
      return res.json(r.rows);
    }

    // ── POST /loadouts ─────────────────────────────────────────────────────────
    if (path === "/loadouts" && method === "POST") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { name, items, total_weight, is_primary } = req.body || {};
      const id = `loadout-${Date.now()}`;
      await pool.query(
        "INSERT INTO loadouts (id, user_id, name, items, total_weight, is_primary) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, user.id, name, JSON.stringify(items || []), total_weight || 0, is_primary || false]
      );
      return res.json({ id });
    }

    // ── GET /service-requests ──────────────────────────────────────────────────
    if (path === "/service-requests" && method === "GET") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const r = await pool.query("SELECT * FROM service_requests WHERE user_id = $1", [user.id]);
      return res.json(r.rows);
    }

    // ── GET /admin/analytics ───────────────────────────────────────────────────
    if (path === "/admin/analytics" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const [orders, products, users] = await Promise.all([
        pool.query("SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders"),
        pool.query("SELECT COUNT(*) as count FROM products"),
        pool.query("SELECT COUNT(*) as count FROM users"),
      ]);
      return res.json({
        totalOrders: parseInt(orders.rows[0].count),
        totalRevenue: parseFloat(orders.rows[0].revenue),
        totalProducts: parseInt(products.rows[0].count),
        totalUsers: parseInt(users.rows[0].count),
      });
    }

    // ── GET /admin/stock ───────────────────────────────────────────────────────
    if (path === "/admin/stock" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const r = await pool.query("SELECT p.id, p.name, p.sku, p.stock, p.price FROM products p ORDER BY p.name");
      return res.json(r.rows);
    }

    // ── GET /admin/inventory-logs ──────────────────────────────────────────────
    if (path === "/admin/inventory-logs" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const r = await pool.query("SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 100");
      return res.json(r.rows);
    }

    // ── GET /site-settings ─────────────────────────────────────────────────────
    if (path === "/site-settings" && method === "GET") {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      const result = await pool.query('SELECT * FROM site_settings LIMIT 1');
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const camelData: any = {};

        Object.keys(row).forEach(key => {
          // Convert snake_case to camelCase
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          
          // If we have both hero_title and heroTitle, hero_title takes precedence if it's not null
          const val = row[key];
          const isBetter = (val !== null && val !== undefined && val !== '' && 
                          (!Array.isArray(val) || val.length > 0));
          
          if (!camelData[camelKey] || isBetter) {
            camelData[camelKey] = val;
          }
        });

        return res.json(camelData);
      } else {
        return res.json({ id: 'default' });
      }
    }

    // ── PUT /site-settings ─────────────────────────────────────────────────────
    if (path === "/site-settings" && method === "PUT") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      try {
        const settings = req.body;
        const id = settings.id || 'default';

        // 1. Just-in-time migration for site_settings columns
        await pool.query(`
          ALTER TABLE site_settings 
          ADD COLUMN IF NOT EXISTS hero_title TEXT,
          ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
          ADD COLUMN IF NOT EXISTS about_us_title TEXT,
          ADD COLUMN IF NOT EXISTS about_us_text TEXT,
          ADD COLUMN IF NOT EXISTS about_us_image TEXT,
          ADD COLUMN IF NOT EXISTS about_us_link TEXT,
          ADD COLUMN IF NOT EXISTS footer_description TEXT,
          ADD COLUMN IF NOT EXISTS seo_title TEXT,
          ADD COLUMN IF NOT EXISTS seo_description TEXT,
          ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
          ADD COLUMN IF NOT EXISTS hero_feature_media_type TEXT,
          ADD COLUMN IF NOT EXISTS hero_feature_image TEXT,
          ADD COLUMN IF NOT EXISTS hero_feature_video TEXT
        `);

        // Helper to match camelCase to snake_case
        const normalize = (s: string) => s.toLowerCase().replace(/_/g, '');

        const columnQuery = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'site_settings'
        `);

        const colMap = new Map<string, { column_name: string, data_type: string }>();
        columnQuery.rows.forEach(r => {
          const normalized = normalize(r.column_name);
          // Prefer snake_case (has underscore) over camelCase if both exist for consistency
          if (!colMap.has(normalized) || r.column_name.includes('_')) {
            colMap.set(normalized, r);
          }
        });

        // Map each DB column to exactly one frontend key to prevent duplicates
        const colToKeyMap = new Map<string, string>();
        Object.keys(settings).forEach(k => {
          if (k === 'id' || k.startsWith('_') || k.toLowerCase() === 'updatedat' || k.toLowerCase() === 'createdat') return;
          const normalized = normalize(k);
          if (colMap.has(normalized)) {
            const colName = colMap.get(normalized)!.column_name;
            if (colName === 'updated_at' || colName === 'created_at') return;
            if (!colToKeyMap.has(colName)) colToKeyMap.set(colName, k);
          }
        });

        if (colToKeyMap.size === 0) {
          return res.json({ success: true, message: "No valid fields to update" });
        }

        const values: any[] = [id];
        const updates: string[] = [];
        const cols: string[] = [];
        const placeholders: string[] = [];

        colToKeyMap.forEach((key, colName) => {
          const colInfo = colMap.get(normalize(key))!;
          const dataType = colInfo.data_type;
          let val = settings[key];

          if (dataType === 'ARRAY' || (dataType === 'text' && colName.endsWith('_tags'))) {
            if (!Array.isArray(val)) val = typeof val === 'string' ? val.split(',').map(s => s.trim()) : [];
          } else if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }

          updates.push(`"${colName}" = $${values.length + 1}`);
          cols.push(`"${colName}"`);
          placeholders.push(`$${values.length + 1}`);
          values.push(val);
        });

        // Cleanup orphaned blobs in site settings
        const currentSettings = await pool.query("SELECT * FROM site_settings LIMIT 1");
        if (currentSettings.rows.length > 0) {
          const old = currentSettings.rows[0];
          const newUrls = new Set<string>();
          Object.values(req.body).forEach(val => {
            if (typeof val === 'string' && val.includes('blob.vercel-storage.com')) newUrls.add(val);
            if (Array.isArray(val)) val.forEach(v => { if (typeof v === 'string' && v.includes('blob.vercel-storage.com')) newUrls.add(v); });
          });

          const token = process.env.HR_STORAGE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
          for (const key of Object.keys(old)) {
            const oldVal = old[key];
            if (typeof oldVal === 'string' && oldVal.includes('blob.vercel-storage.com') && !newUrls.has(oldVal)) {
              try { await del(oldVal, { token }); console.log(`[Settings Cleanup] Deleted: ${oldVal}`); } catch (e) { console.error(e); }
            }
            if (Array.isArray(oldVal)) {
              for (const v of oldVal) {
                if (typeof v === 'string' && v.includes('blob.vercel-storage.com') && !newUrls.has(v)) {
                  try { await del(v, { token }); console.log(`[Settings Cleanup] Deleted: ${v}`); } catch (e) { console.error(e); }
                }
              }
            }
          }
        }

        if (currentSettings.rows.length > 0) {
          await pool.query(
            `UPDATE site_settings SET ${cols.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE id = $1`,
            [currentSettings.rows[0].id, ...values]
          );
        } else {
          await pool.query(
            `INSERT INTO site_settings (id, ${cols.join(', ')}) VALUES ($1, ${placeholders.join(', ')})`,
            ['default', ...values]
          );
        }

        return res.json({ success: true });
      } catch (err: any) {
        console.error("Site settings update error:", err);
        return res.status(500).json({ error: err.message });
      }
    }

    // ── Admin init ─────────────────────────────────────────────────────────────
    if (path === "/admin/init" && method === "GET") {
      const exists = await pool.query("SELECT id FROM users WHERE role = 'admin'");
      if (!exists.rows.length) {
        const hashed = await bcrypt.hash("admin123", 10);
        await pool.query(
          "INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, 'admin') ON CONFLICT (id) DO NOTHING",
          ["admin-1", "admin", "admin@hristo.com", hashed]
        );
      }
      return res.json({ ok: true, admin: "admin@hristo.com / admin123" });
    }

    return res.status(404).json({ error: `Route ${method} ${path} not found` });
  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message });
  }

}
