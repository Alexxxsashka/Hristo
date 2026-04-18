import { Pool } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import fs from "fs";

dotenv.config();

const pool: any = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    "postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

const generateId = () => `id_${Math.random().toString(36).substr(2, 9)}`;

// ─── Categories ──────────────────────────────────────────────────────────
const categories = [
  // 1. Airsoft Weapons
  { id: "weapons", name: "Airsoft Weapons", name_hr: "Airsoft Oružje", slug: "airsoft-weapons", parent_id: null },
  { id: "aeg_rifles", name: "AEG Rifles", name_hr: "AEG Puške", slug: "aeg-rifles", parent_id: "weapons" },
  { id: "gbb_rifles", name: "GBB Rifles", name_hr: "GBB Puške", slug: "gbb-rifles", parent_id: "weapons" },
  { id: "pistols", name: "Pistols", name_hr: "Pištolji", slug: "pistols", parent_id: "weapons" },
  { id: "snipers", name: "Sniper Rifles", name_hr: "Snajperske Puške", slug: "sniper-rifles", parent_id: "weapons" },
  { id: "shotguns", name: "Shotguns", name_hr: "Sačmarice", slug: "shotguns", parent_id: "weapons" },

  // 2. Clothing
  { id: "clothing", name: "Clothing & Apparel", name_hr: "Odjeća i obuća", slug: "clothing-apparel", parent_id: null },
  { id: "uniforms", name: "Uniforms", name_hr: "Uniforme", slug: "uniforms", parent_id: "clothing" },
  { id: "jackets", name: "Jackets", name_hr: "Jakne", slug: "jackets", parent_id: "clothing" },
  { id: "pants", name: "Tactical Pants", name_hr: "Taktičke hlače", slug: "tactical-pants", parent_id: "clothing" },
  { id: "boots", name: "Boots", name_hr: "Čizme", slug: "boots", parent_id: "clothing" },
  { id: "gloves", name: "Gloves", name_hr: "Rukavice", slug: "gloves", parent_id: "clothing" },
  { id: "headwear", name: "Headwear", name_hr: "Kape i kacige", slug: "headwear", parent_id: "clothing" },

  // 3. Weapon Accessories
  { id: "accessories", name: "Weapon Accessories", name_hr: "Dodaci za Oružje", slug: "weapon-accessories", parent_id: null },
  { id: "optics", name: "Optics & Red Dots", name_hr: "Optika i Ciljnici", slug: "optics-sights", parent_id: "accessories" },
  { id: "suppressors", name: "Suppressors & Tracers", name_hr: "Prigušivači i Traceri", slug: "suppressors-tracers", parent_id: "accessories" },
  { id: "grips", name: "Grips & Handguards", name_hr: "Ručke i Rukohvati", slug: "grips-handguards", parent_id: "accessories" },
  { id: "magazines", name: "Magazines", name_hr: "Spremnici", slug: "magazines", parent_id: "accessories" },
  { id: "parts", name: "Internal Parts", name_hr: "Unutarnji dijelovi", slug: "internal-parts", parent_id: "accessories" },

  // 4. Consumables
  { id: "consumables", name: "BBs, Gas & Batteries", name_hr: "Kuglice, plin i baterije", slug: "consumables", parent_id: null },
  { id: "bbs", name: "BBs", name_hr: "Kuglice", slug: "bbs", parent_id: "consumables" },
  { id: "gas", name: "Green Gas & CO2", name_hr: "Zeleni plin i CO2", slug: "gas-co2", parent_id: "consumables" },
  { id: "batteries", name: "Batteries & Chargers", name_hr: "Baterije i punjači", slug: "batteries-chargers", parent_id: "consumables" },
  { id: "maintenance", name: "Maintenance & Tools", name_hr: "Održavanje i alati", slug: "maintenance", parent_id: "consumables" },

  // 5. Camping & Outdoor
  { id: "camping", name: "Camping & Outdoor", name_hr: "Kampiranje i Outdoor", slug: "camping-outdoor", parent_id: null },
  { id: "tents", name: "Tents & Sleeping Bags", name_hr: "Šatori i vreće za spavanje", slug: "tents-sleeping-bags", parent_id: "camping" },
  { id: "navigation", name: "Navigation & Electronics", name_hr: "Navigacija i elektronika", slug: "navigation", parent_id: "camping" },
  { id: "hydration", name: "Hydration & Food", name_hr: "Hidratacija i hrana", slug: "hydration", parent_id: "camping" },
];

// ─── Products ────────────────────────────────────────────────────────────
const products = [
  // Weapons
  { name: "Specna Arms SA-E04 EDGE", slug: "sa-e04-edge", brand: "Specna Arms", price: 249, type: "weapon", category_id: "aeg_rifles", image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80", description: "Full metal AEG with MOSFET X-ASR. High quality performance for any field.", stock: 12 },
  { name: "Tokyo Marui Hi-Capa 5.1 GBB", slug: "tm-hi-capa-51", brand: "Tokyo Marui", price: 185, type: "weapon", category_id: "pistols", image: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?auto=format&fit=crop&q=80", description: "The most popular airsoft pistol in the world. Exceptional accuracy and recoil.", stock: 20 },
  { name: "CYMA CM.701B VSR-10", slug: "cyma-cm701b", brand: "CYMA", price: 110, type: "weapon", category_id: "snipers", image: "https://images.unsplash.com/photo-1633354931941-c5e67c07febb?auto=format&fit=crop&q=80", description: "Classic bolt action sniper rifle. Highly upgradeable VSR-10 platform.", stock: 5 },

  // Clothing
  { name: "Emerson G3 Combat Pants", slug: "emerson-g3-pants", brand: "Emerson", price: 89, type: "gear", category_id: "pants", image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80", description: "Combat pants with built-in knee pads. Durable and comfortable for long games.", stock: 15 },
  { name: "Lowa Zephyr GTX Mid", slug: "lowa-zephyr-mid", brand: "Lowa", price: 195, type: "gear", category_id: "boots", image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80", description: "Military grade boots with Gore-Tex. The standard for tactical footwear.", stock: 8 },

  // Accessories
  { name: "EOTech 558 Replica Red Dot", slug: "eotech-558-replica", brand: "Vector Optics", price: 65, type: "accessory", category_id: "optics", image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80", description: "Bright and clear holographic sight replica. Fits any standard picatinny rail.", stock: 10 },
  { name: "Magpul P-MAG 120rd Mid-Cap", slug: "magpul-pmag-120", brand: "Magpul", price: 22, type: "accessory", category_id: "magazines", image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80", description: "Reliable feeding mid-cap magazine for M4/AR15 series.", stock: 50 },

  // Consumables
  { name: "BLS 0.25g BBs 4000rd", slug: "bls-025g-4000", brand: "BLS", price: 12, type: "consumable", category_id: "bbs", image: "https://images.unsplash.com/photo-1590492459113-b31c396fafba?auto=format&fit=crop&q=80", description: "High precision polished BBs. Best balance for outdoor guns.", stock: 100 },
  { name: "Nuprol 2.0 Green Gas 500ml", slug: "nuprol-20-gas", brand: "Nuprol", price: 14, type: "consumable", category_id: "gas", image: "https://images.unsplash.com/photo-1590492459113-b31c396fafba?auto=format&fit=crop&q=80", description: "High performance green gas with silicone oil for valve maintenance.", stock: 60 },

  // Camping
  { name: "Mil-Tec Recon 2-Man Tent", slug: "mil-tec-recon-tent", brand: "Mil-Tec", price: 85, type: "gear", category_id: "tents", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80", description: "Lightweight tactical tent for outdoor survival and overnight events.", stock: 4 },
];

const blogs = [
  {
    id: "blog-1",
    title: "Choosing Your First Airsoft Gun",
    slug: "choosing-first-airsoft-gun",
    content: "When starting airsoft, the most important thing is reliability. We recommend looking at AEG rifles from brands like Specna Arms or G&G...",
    author: "Admin",
    category: "Guides"
  }
];

const seedRealData = async () => {
  try {
    console.log("Connecting to database...");
    await pool.query("SELECT 1");
    console.log("✅ Connected!");

    console.log("Cleaning old data...");
    await pool.query("TRUNCATE categories, products, blog_posts CASCADE");

    // ── Seed Categories ──────────────────────────────────────────────────────
    console.log(`📦 Seeding ${categories.length} categories...`);
    
    // First pass: insert without parent_id to avoid FK issues
    for (const cat of categories) {
      await pool.query(
        "INSERT INTO categories (id, name, name_hr, slug) VALUES ($1, $2, $3, $4)",
        [cat.id, cat.name, cat.name_hr, cat.slug]
      );
    }

    // Second pass: update parent_id
    for (const cat of categories) {
      if (cat.parent_id) {
        await pool.query("UPDATE categories SET parent_id = $1 WHERE id = $2", [cat.parent_id, cat.id]);
      }
    }

    // ── Seed Products ────────────────────────────────────────────────────────
    console.log(`🔫 Seeding ${products.length} products...`);
    for (const prod of products) {
      const pid = generateId();
      const sku = `SKU-${prod.brand.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
      await pool.query(
        `INSERT INTO products (id, uid, sku, barcode, slug, name, description, type, category_id, brand, price, stock, status, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13)`,
        [pid, pid, sku, `BC${Math.floor(Math.random()*1000000)}`, prod.slug, prod.name, prod.description, prod.type, prod.category_id, prod.brand, prod.price, prod.stock, prod.image]
      );
    }

    // ── Seed Blog ───────────────────────────────────────────────────────────
    console.log(`📝 Seeding ${blogs.length} blog posts...`);
    for (const blog of blogs) {
      await pool.query(
        `INSERT INTO blog_posts (id, title, slug, content, author, category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [blog.id, blog.title, blog.slug, blog.content, blog.author, blog.category]
      );
    }

    // ── Admin User ──────────────────────────────────────────────────────────
    const hash = await bcrypt.hash("admin123", 10);
    await pool.query(
      "INSERT INTO users (id, email, username, password, role) VALUES ($1, $2, $3, $4, 'admin') ON CONFLICT (id) DO NOTHING",
      ["admin-1", "admin@hristo.hr", "admin", hash]
    );

    console.log("✨ Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedRealData();
