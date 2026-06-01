import { pool } from './db.service.js';
import bcrypt from 'bcryptjs';

const generateId = () => `id_${Math.random().toString(36).substr(2, 9)}`;

const categories = [
  { 
    id: "weapons", name: "Airsoft Weapons", name_hr: "Airsoft Oružje", slug: "airsoft-weapons", parent_id: null,
    filters: [
      { id: 'fire_mode', label: 'Fire Mode', type: 'select', options: ['Semi', 'Full Auto', '3-Round Burst', 'Single/Bolt'] },
      { id: 'material', label: 'Body Material', type: 'select', options: ['Full Metal', 'Polymer', 'Nylon Fiber', 'Steel', 'Real Wood'] },
      { id: 'power_source', label: 'Power Source', type: 'select', options: ['AEG (Electric)', 'GBB (Gas)', 'CO2', 'Spring', 'HPA'] },
      { id: 'blowback', label: 'Blowback', type: 'boolean' },
      { id: 'fps', label: 'FPS', type: 'select', options: ['< 300', '300 - 350', '350 - 400', '400 - 450', '> 450'] }
    ],
    slots: ["optic", "muzzle", "underbarrel", "side_rail"],
    compatible_module_categories: ["optics", "muzzles", "grips", "lights"]
  },
  { 
    id: "aeg_rifles", name: "AEG Rifles", name_hr: "AEG Puške", slug: "aeg-rifles", parent_id: "weapons",
    filters: [
      { id: 'gearbox', label: 'Gearbox Version', type: 'select', options: ['V2', 'V3', 'V6', 'V7', 'AEP'] },
      { id: 'battery_type', label: 'Optimal Battery', type: 'select', options: ['LiPo 7.4V', 'LiPo 11.1V', 'NiMH 9.6V', 'Li-Ion 7.4V'] },
      { id: 'connector', label: 'Connector Type', type: 'select', options: ['Mini Tamiya', 'Deans (T-Plug)', 'Large Tamiya'] },
      { id: 'mosfet', label: 'MOSFET/ETU', type: 'select', options: ['Built-in MOSFET', 'Electronic Trigger Unit', 'No MOSFET'] },
      { id: 'quick_spring', label: 'Quick Spring Change', type: 'boolean' }
    ]
  },
  { 
    id: "pistols", name: "Pistols", name_hr: "Pištolji", slug: "pistols", parent_id: "weapons",
    filters: [
      { id: 'action', label: 'Action', type: 'select', options: ['Blowback (GBB)', 'Non-Blowback (NBB)', 'CO2 Driven', 'AEP (Electric)'] },
      { id: 'optics_ready', label: 'Optics Ready', type: 'boolean' },
      { id: 'rail', label: 'Accessory Rail', type: 'boolean' }
    ]
  },
  { 
    id: "optics", name: "Optics & Sights", name_hr: "Optika i nišani", slug: "optics-sights", parent_id: null,
    filters: [
      { id: 'type', label: 'Optic Type', type: 'select', options: ['Red Dot', 'Scope', 'LPVO', 'Holographic', 'Magnifier'] },
      { id: 'magnification', label: 'Magnification', type: 'select', options: ['1x', '1-4x', '1-6x', '3-9x', '4x Fixed'] }
    ],
    slots: ["mount"],
    compatible_module_categories: ["mounts"]
  },
  { 
    id: "clothing", name: "Clothing & Apparel", name_hr: "Odjeća i obuća", slug: "clothing-apparel", parent_id: null,
    filters: [
      { id: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'] },
      { id: 'camo', label: 'Camo/Color', type: 'select', options: ['Multicam', 'Woodland', 'Flecktarn', 'Black', 'Tan', 'Grey', 'OD Green', 'AOR1', 'AOR2'] }
    ]
  }
];

const products = [
  { 
    name: "Specna Arms SA-E04 EDGE", name_hr: "Specna Arms SA-E04 EDGE", slug: "sa-e04-edge", 
    brand: "Specna Arms", price: 249, type: "weapon", category_id: "aeg_rifles", 
    image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80", 
    description: "Full metal AEG with MOSFET X-ASR.", 
    description_hr: "Potpuno metalni AEG s MOSFET-om X-ASR.", 
    stock: 12,
    category_filters: { fire_mode: "Full Auto", material: "Full Metal", power_source: "AEG (Electric)", fps: "350 - 400" }
  },
  { 
    name: "Tokyo Marui Hi-Capa 5.1 GBB", name_hr: "Tokyo Marui Hi-Capa 5.1 GBB", slug: "tm-hi-capa-51", 
    brand: "Tokyo Marui", price: 185, type: "weapon", category_id: "pistols", 
    image: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?auto=format&fit=crop&q=80", 
    description: "The most popular airsoft pistol in the world.", 
    description_hr: "Najpopularniji airsoft pištolj na svijetu.", 
    stock: 20,
    category_filters: { action: "Blowback (GBB)", optics_ready: false }
  },
  {
    name: "Vector Optics Maverick 1x22 GenII", name_hr: "Vector Optics Maverick 1x22 GenII", slug: "vo-maverick-gen2",
    brand: "Vector Optics", price: 65, type: "module", category_id: "optics",
    image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80",
    description: "Compact red dot sight with QD mount.",
    description_hr: "Kompaktni crveni nišan s QD nosačem.",
    stock: 45,
    category_filters: { type: "Red Dot", magnification: "1x" }
  }
];

export const seedDatabase = async () => {
  try {
    const prodCheck = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(prodCheck.rows[0].count) > 0) {
      console.log('✅ Database already has data. Skipping seed.');
      return;
    }

    console.log('🌱 Database is empty. Starting seed...');

    // Categories
    for (const cat of categories) {
      await pool.query(
        `INSERT INTO categories (id, name, name_hr, slug, filters, slots, compatible_module_categories) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO NOTHING`,
        [
          cat.id, cat.name, cat.name_hr, cat.slug, 
          JSON.stringify(cat.filters || []), 
          JSON.stringify(cat.slots || []), 
          JSON.stringify(cat.compatible_module_categories || [])
        ]
      );
    }

    for (const cat of categories) {
      if (cat.parent_id) {
        await pool.query("UPDATE categories SET parent_id = $1 WHERE id = $2", [cat.parent_id, cat.id]);
      }
    }

    // Products
    for (const prod of products) {
      const pid = generateId();
      const sku = `SKU-${prod.brand.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
      await pool.query(
        `INSERT INTO products (
          id, uid, sku, slug, name, name_hr, description, description_hr, type, 
          category_id, brand, price, stock, status, image_url, category_filters, compatible_ids
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', $14, $15, $16)`,
        [
          pid, 
          prod.slug, 
          sku, 
          prod.slug, 
          prod.name, 
          prod.name_hr, 
          prod.description, 
          prod.description_hr, 
          prod.type, 
          prod.category_id, 
          prod.brand, 
          prod.price, 
          prod.stock, 
          prod.image, 
          JSON.stringify(prod.category_filters),
          JSON.stringify((prod as any).compatible_ids || ((prod.slug === 'vo-maverick-gen2') ? ['sa-e04-edge'] : []))
        ]
      );
    }

    // Admin User
    const hash = bcrypt.hashSync("admin123", 10);
    await pool.query(
      "INSERT INTO users (id, email, username, password, role) VALUES ($1, $2, $3, $4, 'admin') ON CONFLICT (email) DO NOTHING",
      ["admin-1", "admin@hristo.hr", "admin", hash]
    );

    console.log('✨ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
};

