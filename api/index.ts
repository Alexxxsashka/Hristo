import type { VercelRequest, VercelResponse } from "@vercel/node";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { Pool } = pg;

// ─── DB Connection ────────────────────────────────────────────────────────────
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.hrdatabase_DATABASE_URL ||
  process.env.hrdatabase_POSTGRES_URL;

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
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET) as any;
  } catch {
    return null;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "/";
  const path = url.replace(/^\/api/, "").split("?")[0];

  try {
    // ── GET /api/db-test ──────────────────────────────────────────────────────
    if (path === "/db-test" || path === "/diag/db-test") {
      const r = await pool.query("SELECT NOW()");
      return res.json({ ok: true, time: r.rows[0].now, conn: connectionString?.slice(0, 40) });
    }

    // ── GET /api/categories ────────────────────────────────────────────────────
    if (path === "/categories" && req.method === "GET") {
      const r = await pool.query(
        "SELECT id, name, slug, image_url, parent_id, filters FROM categories ORDER BY name"
      );
      return res.json(r.rows);
    }

    // ── GET /api/products ──────────────────────────────────────────────────────
    if (path === "/products" && req.method === "GET") {
      const { category, search, minPrice, maxPrice, limit = "100", offset = "0" } = req.query as any;
      let q = `SELECT p.*, c.name as category_name, c.slug as category_slug
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.id
               WHERE p.status = 'active'`;
      const params: any[] = [];
      let i = 1;
      if (category) { q += ` AND (c.id = $${i} OR c.slug = $${i})`; params.push(category); i++; }
      if (search) { q += ` AND (p.name ILIKE $${i} OR p.description ILIKE $${i})`; params.push(`%${search}%`); i++; }
      if (minPrice) { q += ` AND p.price >= $${i}`; params.push(Number(minPrice)); i++; }
      if (maxPrice) { q += ` AND p.price <= $${i}`; params.push(Number(maxPrice)); i++; }
      q += ` ORDER BY p.name LIMIT $${i} OFFSET $${i + 1}`;
      params.push(Number(limit), Number(offset));
      const r = await pool.query(q, params);
      return res.json(r.rows);
    }

    // ── GET /api/products/:id ──────────────────────────────────────────────────
    if (path.startsWith("/products/") && req.method === "GET") {
      const id = path.split("/")[2];
      const r = await pool.query(
        `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1 OR p.slug = $1`,
        [id]
      );
      if (!r.rows.length) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    // ── GET /api/blog-posts ────────────────────────────────────────────────────
    if (path === "/blog-posts" && req.method === "GET") {
      const r = await pool.query(
        "SELECT * FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC"
      );
      return res.json(r.rows);
    }

    // ── GET /api/blog-posts/:id ────────────────────────────────────────────────
    if (path.startsWith("/blog-posts/") && req.method === "GET") {
      const id = path.split("/")[2];
      const r = await pool.query(
        "SELECT * FROM blog_posts WHERE id = $1 OR slug = $1",
        [id]
      );
      if (!r.rows.length) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    // ── POST /api/auth/register ────────────────────────────────────────────────
    if (path === "/auth/register" && req.method === "POST") {
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

    // ── POST /api/auth/login ───────────────────────────────────────────────────
    if (path === "/auth/login" && req.method === "POST") {
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

    // ── GET /api/orders ────────────────────────────────────────────────────────
    if (path === "/orders" && req.method === "GET") {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const r = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
        [user.id]
      );
      return res.json(r.rows);
    }

    // ── POST /api/orders ────────────────────────────────────────────────────────
    if (path === "/orders" && req.method === "POST") {
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
            [id, item.productId, item.quantity, item.price]
          );
        }
      }
      return res.json({ id, status: "pending" });
    }

    // ── GET /api/policies/:id ──────────────────────────────────────────────────
    if (path.startsWith("/policies/") && req.method === "GET") {
      const id = path.split("/")[2];
      const r = await pool.query("SELECT * FROM policies WHERE id = $1", [id]);
      if (!r.rows.length) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }

    // ── GET /api/policies ──────────────────────────────────────────────────────
    if (path === "/policies" && req.method === "GET") {
      const r = await pool.query("SELECT * FROM policies");
      return res.json(r.rows);
    }

    // ── POST /api/contact ──────────────────────────────────────────────────────
    if (path === "/contact" && req.method === "POST") {
      const { name, email, message, subject } = req.body || {};
      await pool.query(
        "INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)",
        [name, email, subject || "Contact", message]
      );
      return res.json({ ok: true });
    }

    // ── Seed admin ─────────────────────────────────────────────────────────────
    if (path === "/admin/init" && req.method === "GET") {
      const exists = await pool.query("SELECT id FROM users WHERE role = 'admin'");
      if (!exists.rows.length) {
        const hashed = await bcrypt.hash("admin123", 10);
        await pool.query(
          "INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, 'admin')",
          ["admin-1", "admin", "admin@hristo.com", hashed, "admin"]
        );
      }
      return res.json({ ok: true, admin: "admin@hristo.com / admin123" });
    }

    return res.status(404).json({ error: `Route ${req.method} ${path} not found` });
  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message, conn: connectionString ? "set" : "MISSING" });
  }
}
