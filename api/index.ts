import type { VercelRequest, VercelResponse } from "@vercel/node";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { put, del } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";

const { Pool } = pg;

// ─── DB Connection ────────────────────────────────────────────────────────────
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.hrdatabase_DATABASE_URL ||
  process.env.hrdatabase_POSTGRES_URL;
const hasDatabaseConfig = Boolean(connectionString);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

const JWT_SECRET = process.env.JWT_SECRET || "hristo-secret-key";

// ─── Auth middleware ──────────────────────────────────────────────────────────
function getUser(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
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

// ─── Helper ───────────────────────────────────────────────────────────────────
function match(path: string, pattern: string): string[] | null {
  const keys: string[] = [];
  const re = new RegExp("^" + pattern.replace(/:([^/]+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "$");
  const m = path.match(re);
  if (!m) return null;
  return keys.map((_, i) => m[i + 1]);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "/";
  const path = "/" + (url.replace(/^\/api\/?/, "").split("?")[0]);
  const method = req.method || "GET";

  try {
    if (!hasDatabaseConfig) {
      return res.status(500).json({
        error: "Database is not configured. Set DATABASE_URL (Neon) in Vercel project environment variables.",
      });
    }

    // ── DB Test ───────────────────────────────────────────────────────────────
    if (path === "/db-test" || path === "/diag/db-test") {
      const r = await pool.query("SELECT NOW()");
      return res.json({ ok: true, time: r.rows[0].now, conn: connectionString?.slice(0, 40) });
    }

    // ── GET /categories ────────────────────────────────────────────────────────
    if (path === "/categories" && method === "GET") {
      const r = await pool.query(
        "SELECT id, name, name_hr as \"nameHr\", slug, image_url as image, parent_id as parent, filters FROM categories ORDER BY name"
      );
      return res.json(r.rows);
    }

    // ── POST /admin/categories ─────────────────────────────────────────────────
    if (path === "/admin/categories" && method === "POST") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const { id, name, slug, image_url, parent_id, filters } = req.body || {};
      await pool.query(
        "INSERT INTO categories (id, name, slug, image_url, parent_id, filters) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO UPDATE SET name=$2, slug=$3, image_url=$4, parent_id=$5, filters=$6",
        [id || slug, name, slug, image_url, parent_id || null, JSON.stringify(filters || [])]
      );
      return res.json({ ok: true });
    }

    // ── DELETE /admin/categories/:id ───────────────────────────────────────────
    const catDel = match(path, "/admin/categories/:id");
    if (catDel && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      await pool.query("DELETE FROM categories WHERE id = $1", [catDel[0]]);
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

      const blob = await put(filename, body, { 
        access: 'public',
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN
      });

      return res.json(blob);
    }

    // ── DELETE /admin/upload ───────────────────────────────────────────────────
    if (path === "/admin/upload" && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: "URL is required" });

      await del(url, {
        token: process.env.BLOB_READ_WRITE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN
      });

      return res.status(204).end();
    }

    // ── POST /admin/upload-handle ────────────────────────────────────────────────
    if (path === "/admin/upload-handle" && method === "POST") {
      try {
        const jsonResponse = await handleUpload({
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
            // Optional metadata logic
          },
        });
        return res.status(200).json(jsonResponse);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }

    // ── GET /products ──────────────────────────────────────────────────────────
    if (path === "/products" && method === "GET") {
      const { category, search, minPrice, maxPrice, limit = "100", offset = "0" } = req.query as any;
      
      let where = ["p.status = 'active'"];
      const params: any[] = [];
      let i = 1;
      
      if (category) {
        where.push(`(c.id = $${i} OR c.slug = $${i} OR c.parent_id = $${i})`);
        params.push(category);
        i++;
      }
      if (search) {
        where.push(`(p.name ILIKE $${i} OR p.description ILIKE $${i})`);
        params.push(`%${search}%`);
        i++;
      }
      if (minPrice) {
        where.push(`p.price >= $${i}`);
        params.push(Number(minPrice));
        i++;
      }
      if (maxPrice) {
        where.push(`p.price <= $${i}`);
        params.push(Number(maxPrice));
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

      return res.json(r.rows.map((p: any) => ({
        ...p,
        image: p.image_url,
        category: p.parent_cat_id || p.category_id,
        subcategory: p.parent_cat_id ? p.category_id : null,
        nameHr: p.name_hr,
        descriptionHr: p.description_hr,
        longDescriptionHr: p.long_description_hr,
        model3D: p.model_3d_url,
        has3D: p.has_3d
      })));
    }

    // ── GET /products/:id ──────────────────────────────────────────────────────
    const prodId = match(path, "/products/:id");
    if (prodId && method === "GET") {
      const r = await pool.query(
        `SELECT p.*, c.parent_id as parent_cat_id 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = $1 OR p.slug = $1`,
        [prodId[0]]
      );
      if (!r.rows.length) return res.status(404).json({ error: "Not found" });
      const p = r.rows[0];
      return res.json({
        ...p,
        image: p.image_url,
        category: p.parent_cat_id || p.category_id,
        subcategory: p.parent_cat_id ? p.category_id : null,
        nameHr: p.name_hr,
        descriptionHr: p.description_hr,
        longDescriptionHr: p.long_description_hr,
        model3D: p.model_3d_url,
        has3D: p.has_3d
      });
    }

    // ── POST /admin/products ───────────────────────────────────────────────────
    if (path === "/admin/products" && method === "POST") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const p = req.body || {};
      const id = p.id || `prod-${Date.now()}`;
      await pool.query(
        `INSERT INTO products (id, uid, sku, slug, name, description, type, category_id, brand, model, price, stock, image_url, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'active')
         ON CONFLICT (id) DO UPDATE SET name=$5, price=$11, stock=$12`,
        [id, p.uid||id, p.sku||id, p.slug||id, p.name, p.description, p.type||'weapon', p.category_id||p.category||null, p.brand||'', p.model||'', p.price||0, p.stock||0, p.image_url||null]
      );
      return res.json({ id });
    }

    // ── PUT /admin/products/:id ────────────────────────────────────────────────
    const adminProd = match(path, "/admin/products/:id");
    if (adminProd && method === "PUT") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const p = req.body || {};
      await pool.query(
        "UPDATE products SET name=$2, price=$3, stock=$4, description=$5, image_url=$6, status=$7 WHERE id = $1",
        [adminProd[0], p.name, p.price, p.stock, p.description, p.image_url, p.status||'active']
      );
      return res.json({ ok: true });
    }

    // ── DELETE /admin/products/:id ─────────────────────────────────────────────
    if (adminProd && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      await pool.query("DELETE FROM products WHERE id = $1", [adminProd[0]]);
      return res.status(204).end();
    }

    // ── GET /blog  (фронтенд использует /api/blog) ─────────────────────────────
    if ((path === "/blog" || path === "/blog-posts") && method === "GET") {
      const { category, limit = "20" } = req.query as any;
      let q = "SELECT * FROM blog_posts WHERE status = 'published'";
      const params: any[] = [];
      if (category) { q += " AND category = $1"; params.push(category); }
      q += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(Number(limit));
      const r = await pool.query(q, params);
      // Поддерживаем оба формата: { posts: [] } и просто []
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
        [id, p.slug||id, p.title, p.content, p.category||'general', p.image_url||null, p.author||'Admin', p.status||'published']
      );
      return res.json({ id });
    }

    // ── PUT /admin/blog/:id ────────────────────────────────────────────────────
    const adminBlog = match(path, "/admin/blog/:id");
    if (adminBlog && method === "PUT") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const p = req.body || {};
      await pool.query(
        "UPDATE blog_posts SET title=$2, content=$3, status=$4, image_url=$5 WHERE id = $1",
        [adminBlog[0], p.title, p.content, p.status||'published', p.image_url||null]
      );
      return res.json({ ok: true });
    }

    // ── DELETE /admin/blog/:id ─────────────────────────────────────────────────
    if (adminBlog && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      await pool.query("DELETE FROM blog_posts WHERE id = $1", [adminBlog[0]]);
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
      const r = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
        [user.id]
      );
      return res.json(r.rows);
    }

    // ── POST /orders ───────────────────────────────────────────────────────────
    if (path === "/orders" && method === "POST") {
      const user = getUser(req);
      const { items, total, address, payment_method } = req.body || {};
      const userId = user?.id || "guest";
      const id = `order-${Date.now()}`;
      await pool.query(
        "INSERT INTO orders (id, user_id, total, status, payment_status, notes) VALUES ($1, $2, $3, 'pending', 'pending', $4)",
        [id, userId, total, JSON.stringify({ address, payment_method })]
      );
      if (items?.length) {
        for (const item of items) {
          await pool.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
            [id, item.productId || item.id, item.quantity, item.price]
          );
        }
      }
      return res.json({ id, status: "pending" });
    }

    // ── GET /admin/orders ──────────────────────────────────────────────────────
    if (path === "/admin/orders" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const r = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
      return res.json(r.rows);
    }

    // ── PUT /admin/orders/:id/status ───────────────────────────────────────────
    const orderStatus = match(path, "/admin/orders/:id/status");
    if (orderStatus && method === "PUT") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const { status, tracking_number } = req.body || {};
      await pool.query("UPDATE orders SET status=$2, tracking_number=$3 WHERE id = $1", [orderStatus[0], status, tracking_number]);
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
      const r = await pool.query("SELECT id, username, email, role, phone, address FROM users WHERE id = $1", [userId[0]]);
      if (!r.rows.length) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    if (userId && method === "PUT") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { username, phone, address } = req.body || {};
      await pool.query("UPDATE users SET username=$2, phone=$3, address=$4 WHERE id = $1", [userId[0], username, phone, JSON.stringify(address)]);
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

    // ── GET /admin/messages ────────────────────────────────────────────────────
    if (path === "/admin/messages" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const r = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
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
    if (path === "/site-settings") {
      return res.json({ id: "default", name: "Hristo Airsoft", currency: "EUR" });
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
    return res.status(500).json({ error: err.message, conn: connectionString ? "set" : "MISSING!" });
  }
}
