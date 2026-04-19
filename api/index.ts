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
  let path = "/" + (url.replace(/^\/api\/?/, "").split("?")[0]);
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  const method = req.method || "GET";

  try {
    if (!hasDatabaseConfig) {
      return res.status(500).json({
        error: "Database is not configured. Set DATABASE_URL (Neon) in Vercel project environment variables.",
      });
    }

    // ── DB Migration ─────────────────────────────────────────────────────────
    if (path === "/admin/migrate" && method === "POST") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      
      const results = [];
      try {
        // Add attachment_slot if missing
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS attachment_slot TEXT");
        results.push("Added attachment_slot column");
        
        // Add mount_type if missing
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS mount_type TEXT");
        results.push("Added mount_type column");

        // Create product_compatibility table
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
        results.push("Created product_compatibility table");

        return res.json({ success: true, results });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }

    // ── DB Test ───────────────────────────────────────────────────────────────
    if (path === "/db-test" || path === "/diag/db-test") {
      // Auto-migrate schema on test
      try {
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS attachment_slot TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS mount_type TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT");
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
        token: process.env.HR_STORAGE_TOKEN
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
        token: process.env.HR_STORAGE_TOKEN
      });

      return res.status(204).end();
    }

    // ── POST /admin/upload-handle ────────────────────────────────────────────────
    if (path === "/admin/upload-handle" && method === "POST") {
      try {
        const jsonResponse = await handleUpload({
          token: process.env.HR_STORAGE_TOKEN,
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
        where.push(`(p.category_id = $${i} OR c.parent_id = $${i})`);
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

      return res.json(r.rows.map((p: any) => ({
        ...p,
        id: p.id,
        image: p.image_url,
        images: Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
        longDescription: p.long_description,
        nameHr: p.name_hr,
        descriptionHr: p.description_hr,
        longDescriptionHr: p.long_description_hr,
        category: p.parent_cat_id || p.category_id,
        subcategory: p.parent_cat_id ? p.category_id : null,
        price: parseFloat(p.price) || 0,
        landing_cost: p.landing_cost ? parseFloat(p.landing_cost) : null,
        msrp: p.msrp ? parseFloat(p.msrp) : null,
        stock: parseInt(p.stock) || 0,
        discount: p.discount ? parseInt(p.discount) : 0,
        model3D: p.model_3d_url,
        model3DName: p.model3d_name, // Optional: if added to DB
        has3D: p.has_3d === true || p.has_3d === 'true' || !!p.model_3d_url,
        socketPoint: Array.isArray(p.socket_point) ? p.socket_point : [],
        compatibleIds: Array.isArray(p.compatible_ids) ? p.compatible_ids : [],
        compatibleWeapons: Array.isArray(p.compatible_ids) ? p.compatible_ids : [], // Backwards compatibility
        compatibleModuleCategories: Array.isArray(p.compatible_module_categories) ? p.compatible_module_categories : [],
        slots: Array.isArray(p.slots) ? p.slots : [],
        attachmentSlot: p.attachment_slot,
        mountType: p.mount_type
      })));
    }

    // ── GET /products/:id ──────────────────────────────────────────────────────
    const prodId = match(path, "/products/:id");
    if (prodId && method === "GET") {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
        id: p.id,
        image: p.image_url,
        images: Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
        longDescription: p.long_description,
        nameHr: p.name_hr,
        descriptionHr: p.description_hr,
        longDescriptionHr: p.long_description_hr,
        category: p.parent_cat_id || p.category_id,
        subcategory: p.parent_cat_id ? p.category_id : null,
        price: parseFloat(p.price) || 0,
        landing_cost: p.landing_cost ? parseFloat(p.landing_cost) : null,
        msrp: p.msrp ? parseFloat(p.msrp) : null,
        stock: parseInt(p.stock) || 0,
        discount: p.discount ? parseInt(p.discount) : 0,
        model3D: p.model_3d_url,
        model3DName: p.model3d_name, 
        has3D: p.has_3d === true || p.has_3d === 'true' || !!p.model_3d_url,
        socketPoint: Array.isArray(p.socket_point) ? p.socket_point : [],
        compatibleIds: Array.isArray(p.compatible_ids) ? p.compatible_ids : [],
        compatibleWeapons: Array.isArray(p.compatible_ids) ? p.compatible_ids : [], 
        compatibleModuleCategories: Array.isArray(p.compatible_module_categories) ? p.compatible_module_categories : [],
        slots: Array.isArray(p.slots) ? p.slots : [],
        attachmentSlot: p.attachment_slot,
        mountType: p.mount_type
      });
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
          p.category_id || p.category || null, 
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
          JSON.stringify(p.variant_attributes || []), 
          JSON.stringify(p.category_filters || {}),
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
          p.attachmentSlot || null
        ];

        const r = await pool.query(
          `INSERT INTO products (
            id, uid, sku, barcode, slug, name, description, long_description, type, category_id, subcategory, brand, model, 
            price, stock, image_url, images, model_3d_url, has_3d, characteristics, 
            variants, variant_attributes, category_filters, 
            name_hr, description_hr, long_description_hr, status,
            compatible_ids, compatible_module_categories, socket_point, slots, mount_type, attachment_slot
          )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,'active',$27,$28,$29,$30,$31,$32)
           ON CONFLICT (id) DO UPDATE SET 
            name=$6, description=$7, long_description=$8, price=$14, stock=$15, image_url=$16, images=$17, 
            model_3d_url=$18, has_3d=$19, characteristics=$20, variants=$21, 
            variant_attributes=$22, category_filters=$23, 
            name_hr=$24, description_hr=$25, long_description_hr=$26,
            brand=$12, model=$13, sku=$3, barcode=$4, type=$9, category_id=$10, subcategory=$11,
            compatible_ids=$27, compatible_module_categories=$28, socket_point=$29, slots=$30, mount_type=$31, attachment_slot=$32`,
          productData
        );

        console.log(`[DB] Product save success. RowCount: ${r.rowCount}, ID: ${p.uid || id}`);
        
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
    const adminProd = match(path, "/admin/products/:id");
    if (adminProd && method === "PUT") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const p = req.body || {};
      
      const imageUrl = p.image !== undefined ? p.image : (p.image_url !== undefined ? p.image_url : null);
      // Prioritize model3D (frontend field) over model_3d_url (backend field) to avoid using cached/old DB values
      const model3dUrl = p.model3D !== undefined ? p.model3D : (p.model_3d_url !== undefined ? p.model_3d_url : null);
      const baseHas3d = p.has3D !== undefined ? p.has3D : (p.has_3d !== undefined ? p.has_3d : false);
      const has3d = model3dUrl ? true : baseHas3d;
      const imagesArr = Array.isArray(p.images) ? p.images : (imageUrl ? [imageUrl] : []);
      const longDescription = p.long_description !== undefined ? p.long_description : (p.longDescription !== undefined ? p.longDescription : null);

      try {
        // Just-in-time migration
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS attachment_slot TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS mount_type TEXT");
        await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT");
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
          adminProd[0], 
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
          JSON.stringify(p.variant_attributes || []), 
          JSON.stringify(p.category_filters || {}),
          p.nameHr || null, 
          p.descriptionHr || null, 
          p.longDescriptionHr || null,
          p.brand || '', 
          p.model || '', 
          p.sku || '', 
          p.barcode || '',
          p.type || 'weapon', 
          p.status || 'active',
          p.category_id || p.category || null,
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
          p.attachmentSlot || null
        ];

        const r = await pool.query(
          `UPDATE products SET 
            name=$2, description=$3, long_description=$4, price=$5, stock=$6, image_url=$7, images=$8, 
            model_3d_url=$9, has_3d=$10, characteristics=$11, variants=$12, 
            variant_attributes=$13, category_filters=$14, 
            name_hr=$15, description_hr=$16, long_description_hr=$17,
            brand=$18, model=$19, sku=$20, barcode=$21, type=$22, status=$23,
            category_id=$24, subcategory=$25,
            compatible_ids=$26, compatible_module_categories=$27, socket_point=$28, slots=$29, mount_type=$30, attachment_slot=$31
           WHERE id = $1 OR slug = $1
           RETURNING id`,
          productData
        );

        if (r.rowCount === 0) {
          console.warn(`[DB] No product found to update with ID/Slug: ${adminProd[0]}`);
          return res.status(404).json({ error: "Product not found to update" });
        }

        console.log(`[DB] Update successful for ${adminProd[0]}. RowCount: ${r.rowCount}`);

        // Simple sync for compatibility whitelist
        const currentUid = p.uid || adminProd[0];
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
          idUsed: adminProd[0]
        });
      }
    }

    // ── DELETE /admin/products/:id ─────────────────────────────────────────────
    if (adminProd && method === "DELETE") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      
      try {
        // Cleanup blobs
        const result = await pool.query('SELECT image_url, images, model_3d_url FROM products WHERE id = $1 OR slug = $1', [adminProd[0]]);
        if (result.rows.length > 0) {
          const p = result.rows[0];
          const urlsToDelete: string[] = [];
          
          if (p.image_url) urlsToDelete.push(p.image_url);
          if (p.model_3d_url) urlsToDelete.push(p.model_3d_url);
          if (Array.isArray(p.images)) {
            p.images.forEach((u: any) => { if (typeof u === 'string') urlsToDelete.push(u); });
          } else if (typeof p.images === 'string') {
            try {
              const parsed = JSON.parse(p.images);
              if (Array.isArray(parsed)) parsed.forEach((u: any) => { if (typeof u === 'string') urlsToDelete.push(u); });
            } catch (e) {}
          }

          const token = process.env.HR_STORAGE_TOKEN || process.env.hrstorage_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
          for (const url of urlsToDelete) {
            if (url && url.includes('blob.vercel-storage.com')) {
              try { await del(url, { token }); } catch (e) { console.error(`Failed to delete blob: ${url}`, e); }
            }
          }
        }
      } catch (e) {
        console.error('Blob cleanup error during product delete:', e);
      }

      await pool.query("DELETE FROM products WHERE id = $1 OR slug = $1", [adminProd[0]]);
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
      
      try {
        const result = await pool.query('SELECT image_url FROM blog_posts WHERE id = $1 OR slug = $1', [adminBlog[0]]);
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

      await pool.query("DELETE FROM blog_posts WHERE id = $1 OR slug = $1", [adminBlog[0]]);
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
      const orderNumber = `HRA-${Date.now().toString().slice(-6)}-${Math.floor(100+Math.random()*900)}`;
      
      await pool.query(
        "INSERT INTO orders (id, order_number, user_id, total, subtotal, status, payment_status, notes) VALUES ($1, $2, $3, $4, $4, 'pending', 'pending', $5)",
        [id, orderNumber, userId, total, JSON.stringify({ address, payment_method })]
      );
      if (items?.length) {
        for (const item of items) {
          await pool.query(
            "INSERT INTO order_items (order_id, product_id, name, quantity, price) VALUES ($1, $2, $3, $4, $5)",
            [id, item.productId || item.id, item.name || 'Product', item.quantity, item.price]
          );
        }
      }
      return res.json({ id, order_number: orderNumber, status: "pending" });
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
      const authenticatedUser = getUser(req);
      
      try {
        const r = await pool.query("SELECT id, username, email, role, phone, address FROM users WHERE id = $1", [userId[0]]);
        
        if (r.rows.length > 0) {
          return res.json(r.rows[0]);
        }
        
        // If not found in DB but is the current authenticated user, return skeleton
        if (authenticatedUser && authenticatedUser.id === userId[0]) {
          return res.json({
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            role: authenticatedUser.role || "user",
            username: authenticatedUser.email?.split("@")[0] || "User",
            isNewUser: true
          });
        }

        return res.status(404).json({ error: "Not found" });
      } catch {
        // Fallback for older schemas
        const r = await pool.query("SELECT id, username, email, role FROM users WHERE id = $1", [userId[0]]);
        if (r.rows.length > 0) return res.json(r.rows[0]);
        
        if (authenticatedUser && authenticatedUser.id === userId[0]) {
          return res.json({
            id: authenticatedUser.id,
            email: authenticatedUser.email,
            role: authenticatedUser.role || "user",
            username: authenticatedUser.email?.split("@")[0] || "User",
            isNewUser: true
          });
        }
        
        return res.status(404).json({ error: "Not found" });
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

    // ── GET /admin/messages ────────────────────────────────────────────────────
    if (path === "/admin/messages" && method === "GET") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const r = await pool.query("SELECT * FROM contact_messages ORDER BY date DESC");
      return res.json(r.rows);
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
      const result = await pool.query('SELECT * FROM site_settings LIMIT 1');
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      } else {
        return res.json({ id: 'default' });
      }
    }

    // ── PUT /site-settings ─────────────────────────────────────────────────────
    if (path === "/site-settings" && method === "PUT") {
      const user = getUser(req);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

      const settings = req.body;
      const id = settings.id || 'default';
      
      const exists = await pool.query('SELECT id FROM site_settings WHERE id = $1', [id]);
      
      if (exists.rows.length > 0) {
        const keys = Object.keys(settings).filter(k => k !== 'id' && !k.startsWith('_'));
        if (keys.length === 0) return res.json({ success: true });
        
        const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
        const values = keys.map(k => settings[k]);
        
        await pool.query(
          `UPDATE site_settings SET ${setClause} WHERE id = $1`,
          [id, ...values]
        );
      } else {
        const keys = Object.keys(settings);
        const columns = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = keys.map(k => settings[k]);
        
        await pool.query(
          `INSERT INTO site_settings (${columns}) VALUES (${placeholders})`,
          values
        );
      }
      return res.json({ success: true });
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
