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
  { 
    id: "weapons", name: "Airsoft Weapons", name_hr: "Airsoft Oružje", slug: "airsoft-weapons", parent_id: null,
    filters: [
      { id: 'fire_mode', label: 'Fire Mode', type: 'select', options: ['Semi', 'Full Auto', '3-Round Burst', 'Single/Bolt'] },
      { id: 'material', label: 'Body Material', type: 'select', options: ['Full Metal', 'Polymer', 'Nylon Fiber', 'Steel', 'Real Wood'] },
      { id: 'power_source', label: 'Power Source', type: 'select', options: ['AEG (Electric)', 'GBB (Gas)', 'CO2', 'Spring', 'HPA'] },
      { id: 'blowback', label: 'Blowback', type: 'boolean' },
      { id: 'fps', label: 'FPS', type: 'select', options: ['< 300', '300 - 350', '350 - 400', '400 - 450', '> 450'] }
    ]
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
    id: "gbb_rifles", name: "GBB Rifles", name_hr: "GBB Puške", slug: "gbb-rifles", parent_id: "weapons",
    filters: [
      { id: 'gas_type', label: 'Gas Compatibility', type: 'select', options: ['Green Gas', 'CO2', 'Black Gas (High Pressure)'] },
      { id: 'platform', label: 'Platform', type: 'select', options: ['M4/AR-15', 'AK', 'MCX', 'G36', 'SCAR', 'MP5'] }
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
    id: "snipers", name: "Sniper Rifles", name_hr: "Snajperske Puške", slug: "sniper-rifles", parent_id: "weapons",
    filters: [
      { id: 'action', label: 'Action', type: 'select', options: ['Bolt Action', 'Semi-Auto (DMR)', 'Gas Operated'] },
      { id: 'spring_rating', label: 'Spring Tension', type: 'select', options: ['M130', 'M150', 'M170', 'M190'] },
      { id: 'hopup_type', label: 'Hop-Up Type', type: 'select', options: ['Standard', 'TDC Mod', 'Rotary'] }
    ]
  },
  { id: "shotguns", name: "Shotguns", name_hr: "Sačmarice", slug: "shotguns", parent_id: "weapons" },

  // 2. Clothing
  { 
    id: "clothing", name: "Clothing & Apparel", name_hr: "Odjeća i obuća", slug: "clothing-apparel", parent_id: null,
    filters: [
      { id: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'] },
      { id: 'camo', label: 'Camo/Color', type: 'select', options: ['Multicam', 'Woodland', 'Flecktarn', 'Black', 'Tan', 'Grey', 'OD Green', 'AOR1', 'AOR2'] },
      { id: 'material', label: 'Material', type: 'select', options: ['Rip-stop', 'NyCo', 'Cotton', 'Softshell', 'Fleece'] }
    ]
  },
  { 
    id: "uniforms", name: "Uniforms", name_hr: "Uniforme", slug: "uniforms", parent_id: "clothing",
    filters: [
      { id: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { id: 'camo', label: 'Camouflage', type: 'select', options: ['Multicam', 'Woodland', 'Digital Desert', 'Olive Drab', 'Black'] },
      { id: 'generation', label: 'Generation', type: 'select', options: ['G2', 'G3', 'G4'] }
    ]
  },
  { id: "jackets", name: "Jackets", name_hr: "Jakne", slug: "jackets", parent_id: "clothing" },
  { 
    id: "pants", name: "Tactical Pants", name_hr: "Taktičke hlače", slug: "tactical-pants", parent_id: "clothing",
    filters: [
      { id: 'waist', label: 'Waist Size', type: 'select', options: ['28', '30', '32', '34', '36', '38', '40'] },
      { id: 'length', label: 'Length', type: 'select', options: ['Regular', 'Long', 'Short'] },
      { id: 'kneepads', label: 'Integrated Knee Pads', type: 'boolean' }
    ]
  },
  { id: "boots", name: "Boots", name_hr: "Čizme", slug: "boots", parent_id: "clothing" },
  { 
    id: "gloves", name: "Gloves", name_hr: "Rukavice", slug: "gloves", parent_id: "clothing",
    filters: [
      { id: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { id: 'protection', label: 'Knuckle Protection', type: 'select', options: ['Hard Shell', 'Soft Padding', 'No Padding', 'Carbon Fiber'] },
      { id: 'touchscreen', label: 'Touchscreen Compatible', type: 'boolean' }
    ]
  },
  { id: "headwear", name: "Headwear", name_hr: "Kape i kacige", slug: "headwear", parent_id: "clothing" },

  // 3. Weapon Accessories
  { id: "accessories", name: "Weapon Accessories", name_hr: "Dodaci za Oružje", slug: "weapon-accessories", parent_id: null },
  { 
    id: "optics", name: "Optics & Red Dots", name_hr: "Optika i Ciljnici", slug: "optics-sights", parent_id: "accessories",
    filters: [
      { id: 'type', label: 'Optic Type', type: 'select', options: ['Red Dot', 'LPVO', 'Sniper Scope', 'Holographic', 'Iron Sights', 'Magnifier'] },
      { id: 'magnification', label: 'Magnification', type: 'select', options: ['1x', '3x', '4x', '1-4x', '1-6x', '3-9x', '4-12x'] }
    ]
  },
  { 
    id: "suppressors", name: "Suppressors & Tracers", name_hr: "Prigušivači i Traceri", slug: "suppressors-tracers", parent_id: "accessories",
    filters: [
      { id: 'threading', label: 'Threading', type: 'select', options: ['14mm CCW (Standard)', '14mm CW', '24mm CW', 'LCT 24mm', 'Special'] },
      { id: 'tracer_module', label: 'Tracer Module', type: 'select', options: ['Built-in', 'Housing Only (Dummy)', 'Simulated Muzzle Flash', 'Both (Tracer + Flash)'] }
    ]
  },
  { id: "grips", name: "Grips & Handguards", name_hr: "Ručke i Rukohvati", slug: "grips-handguards", parent_id: "accessories" },
  { 
    id: "magazines", name: "Magazines", name_hr: "Spremnici", slug: "magazines", parent_id: "accessories",
    filters: [
      { id: 'mag_type', label: 'Magazine Type', type: 'select', options: ['Low-Cap', 'Mid-Cap', 'Hi-Cap', 'Drum', 'Real-Cap'] },
      { id: 'capacity', label: 'Capacity (Rounds)', type: 'select', options: ['15-30', '30-80', '80-150', '150-500', '1000+'] },
      { id: 'caliber', label: 'Caliber', type: 'select', options: ['5.56 / NATO', '7.62 / AK', '9mm', '.45 ACP', '7.62 NATO / .308'] }
    ]
  },
  { 
    id: "parts", name: "Internal Parts", name_hr: "Unutarnji dijelovi", slug: "internal-parts", parent_id: "accessories",
    filters: [
      { id: 'part_category', label: 'Part Group', type: 'select', options: ['Hop-Up/Bucking', 'Inner Barrel', 'Gearset', 'Piston/Head', 'Motor', 'Trigger/MOSFET', 'Spring'] }
    ]
  },

  // 4. Consumables
  { id: "consumables", name: "BBs, Gas & Batteries", name_hr: "Kuglice, plin i baterije", slug: "consumables", parent_id: null },
  { 
    id: "bbs", name: "BBs", name_hr: "Kuglice", slug: "bbs", parent_id: "consumables",
    filters: [
      { id: 'weight', label: 'BB Weight', type: 'select', options: ['0.20g', '0.23g', '0.25g', '0.28g', '0.30g', '0.32g', '0.36g', '0.40g', '0.45g', '0.48g', '0.50g'] },
      { id: 'type', label: 'Material Type', type: 'select', options: ['BIO-Degradable', 'Standard Polymer'] },
      { id: 'tracer_type', label: 'Tracer Type', type: 'select', options: ['Non-Tracer', 'Tracer Green', 'Tracer Red'] }
    ]
  },
  { id: "gas", name: "Green Gas & CO2", name_hr: "Zeleni plin i CO2", slug: "gas-co2", parent_id: "consumables" },
  { 
    id: "batteries", name: "Batteries & Chargers", name_hr: "Baterije i punjači", slug: "batteries-chargers", parent_id: "consumables",
    filters: [
      { id: 'chemistry', label: 'Chemistry', type: 'select', options: ['LiPo', 'Li-Ion', 'NiMH', 'LiFe'] },
      { id: 'cells', label: 'Voltage', type: 'select', options: ['7.4V', '11.1V', '9.6V', '8.4V', '14.8V'] },
      { id: 'capacity', label: 'Capacity (mAh)', type: 'select', options: ['< 1000', '1000-1500', '1500-2000', '> 2000'] }
    ]
  },
  { id: "maintenance", name: "Maintenance & Tools", name_hr: "Održavanje i alati", slug: "maintenance", parent_id: "consumables" },

  // 5. Camping & Outdoor
  { id: "camping", name: "Camping & Outdoor", name_hr: "Kampiranje i Outdoor", slug: "camping-outdoor", parent_id: null },
  { 
    id: "tents", name: "Tents & Sleeping Bags", name_hr: "Šatori i vreće za spavanje", slug: "tents-sleeping-bags", parent_id: "camping",
    filters: [
      { id: 'season', label: 'Season Rating', type: 'select', options: ['1 Season (Summer)', '2 Season', '3 Season', '4 Season (Winter)'] },
      { id: 'capacity', label: 'Capacity (Persons)', type: 'select', options: ['1 Person', '2 Persons', '3-4 Persons', '5+ Persons'] }
    ]
  },
  { id: "navigation", name: "Navigation & Electronics", name_hr: "Navigacija i elektronika", slug: "navigation", parent_id: "camping" },
  { id: "hydration", name: "Hydration & Food", name_hr: "Hidratacija i hrana", slug: "hydration", parent_id: "camping" },
];

// ─── Products ────────────────────────────────────────────────────────────
const products = [
  // Weapons
  { 
    name: "Specna Arms SA-E04 EDGE", slug: "sa-e04-edge", brand: "Specna Arms", price: 249, type: "weapon", category_id: "aeg_rifles", 
    image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80", 
    description: "Full metal AEG with MOSFET X-ASR. High quality performance for any field.", stock: 12,
    category_filters: {
      fire_mode: "Full Auto",
      material: "Full Metal",
      power_source: "AEG (Electric)",
      blowback: false,
      fps: "350 - 400",
      gearbox: "V2",
      battery_type: "LiPo 7.4V",
      connector: "Mini Tamiya",
      mosfet: "Built-in MOSFET"
    },
    characteristics: [
      { emoji: "🔫", label: "Type", value: "AEG" },
      { emoji: "⚖️", label: "Weight", value: "2.5kg" }
    ]
  },
  { 
    name: "Tokyo Marui Hi-Capa 5.1 GBB", slug: "tm-hi-capa-51", brand: "Tokyo Marui", price: 185, type: "weapon", category_id: "pistols", 
    image: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?auto=format&fit=crop&q=80", 
    description: "The most popular airsoft pistol in the world. Exceptional accuracy and recoil.", stock: 20,
    category_filters: {
      fire_mode: "Semi",
      material: "Polymer",
      power_source: "GBB (Gas)",
      blowback: true,
      fps: "< 300",
      action: "Blowback (GBB)",
      optics_ready: false
    },
    characteristics: [
      { emoji: "💨", label: "System", value: "Gas Blowback" },
      { emoji: "🎯", label: "Accuracy", value: "Legendary" }
    ]
  },
  {
    name: "Glock 17 Gen5 GBB – Umarex",
    slug: "umarex-glock17-gen5-gbb",
    brand: "Umarex",
    price: 145.00,
    type: "weapon",
    category_id: "pistols",
    image: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?auto=format&fit=crop&q=80",
    description: "Officially licensed Glock 17 Gen5 replica with realistic blowback. Compatible with all standard Glock accessories.",
    stock: 15,
    category_filters: {
      fire_mode: "Semi",
      material: "Full Metal",
      power_source: "GBB (Gas)",
      blowback: true,
      fps: "< 300",
      action: "Blowback (GBB)",
      optics_ready: true
    },
    characteristics: [
      { emoji: "🛡️", label: "License", value: "Official Glock" },
      { emoji: "🔥", label: "Blowback", value: "Strong" }
    ]
  },
  { 
    name: "CYMA CM.701B VSR-10", slug: "cyma-cm701b", brand: "CYMA", price: 110, type: "weapon", category_id: "snipers", 
    image: "https://images.unsplash.com/photo-1633354931941-c5e67c07febb?auto=format&fit=crop&q=80", 
    description: "Classic bolt action sniper rifle. Highly upgradeable VSR-10 platform.", stock: 5,
    category_filters: {
      fire_mode: "Single/Bolt",
      material: "Polymer",
      power_source: "Spring",
      blowback: false,
      fps: "> 450",
      action: "Bolt Action",
      spring_rating: "M150"
    }
  },

  // Clothing with Variants (Sizes & Colors)
  { 
    name: "Emerson G3 Combat Pants", 
    slug: "emerson-g3-pants", 
    brand: "Emerson", 
    price: 89, 
    type: "gear", 
    category_id: "pants", 
    image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80", 
    description: "Combat pants with built-in knee pads. Durable and comfortable for long games.", 
    stock: 15,
    category_filters: {
      size: "M",
      camo: "Multicam",
      material: "Rip-stop",
      kneepads: true,
      waist: "32",
      length: "Regular"
    },
    variant_attributes: [
      { name: "Size", options: ["S", "M", "L", "XL"] },
      { name: "Color", options: ["Multicam", "Black", "Ranger Green"] }
    ],
    variants: [
      { id: "emerson-g3-pants-mc-s", name: "Multicam / S", attributes: { Color: "Multicam", Size: "S" }, stock: 5 },
      { id: "emerson-g3-pants-mc-m", name: "Multicam / M", attributes: { Color: "Multicam", Size: "M" }, stock: 5 },
      { id: "emerson-g3-pants-blk-l", name: "Black / L", attributes: { Color: "Black", Size: "L" }, stock: 3 },
      { id: "emerson-g3-pants-rg-xl", name: "Ranger Green / XL", attributes: { Color: "Ranger Green", Size: "XL" }, stock: 2 },
    ],
    characteristics: [
      { emoji: "🛡️", label: "Material", value: "Rip-Stop" },
      { emoji: "🦵", label: "Protection", value: "Built-in Knee Pads" }
    ]
  },
  { 
    name: "Helikon-Tex Patriot Jacket", 
    slug: "helikon-patriot-jacket", 
    brand: "Helikon-Tex", 
    price: 75, 
    type: "gear", 
    category_id: "jackets", 
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80", 
    description: "Heavy fleece jacket designed for tactical use in cold weather.", 
    stock: 12,
    category_filters: {
      size: "L",
      camo: "Tan",
      material: "Fleece"
    },
    variant_attributes: [
      { name: "Size", options: ["M", "L", "XL"] },
      { name: "Color", options: ["Coyote", "Foliage Green", "Shadow Grey"] }
    ],
    variants: [
      { id: "helikon-patriot-coy-m", name: "Coyote / M", attributes: { Color: "Coyote", Size: "M" }, stock: 4 },
      { id: "helikon-patriot-fg-l", name: "Foliage Green / L", attributes: { Color: "Foliage Green", Size: "L" }, stock: 4 },
      { id: "helikon-patriot-sg-xl", name: "Shadow Grey / XL", attributes: { Color: "Shadow Grey", Size: "XL" }, stock: 4 },
    ],
    characteristics: [
      { emoji: "❄️", label: "Season", value: "Winter" },
      { emoji: "🧶", label: "Fabric", value: "390g/m2 Double Fleece" }
    ]
  },
  { 
    name: "Oakley SI Assault Gloves", 
    slug: "oakley-si-gloves", 
    brand: "Oakley", 
    price: 45, 
    type: "gear", 
    category_id: "gloves", 
    image: "https://images.unsplash.com/photo-1590492459113-b31c396fafba?auto=format&fit=crop&q=80", 
    description: "Premium tactical gloves with carbon fiber knuckle protection.", 
    stock: 25,
    variant_attributes: [
      { name: "Size", options: ["M", "L", "XL"] },
      { name: "Color", options: ["Black", "Tan"] }
    ],
    variants: [
      { id: "oakley-si-blk-l", name: "Black / L", attributes: { Color: "Black", Size: "L" }, stock: 10 },
      { id: "oakley-si-tan-l", name: "Tan / L", attributes: { Color: "Tan", Size: "L" }, stock: 10 },
      { id: "oakley-si-blk-xl", name: "Black / XL", attributes: { Color: "Black", Size: "XL" }, stock: 5 },
    ]
  },
  { 
    name: "Lowa Zephyr GTX Mid", 
    slug: "lowa-zephyr-mid", 
    brand: "Lowa", 
    price: 195, 
    type: "gear", 
    category_id: "boots", 
    image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80", 
    description: "Military grade boots with Gore-Tex. The standard for tactical footwear.", 
    stock: 8,
    variant_attributes: [
      { name: "Size", options: ["41", "42", "43", "44", "45"] },
      { name: "Color", options: ["Coyote", "Sage"] }
    ],
    variants: [
      { id: "lowa-zephyr-coy-42", name: "Coyote / 42", attributes: { Color: "Coyote", Size: "42" }, stock: 2 },
      { id: "lowa-zephyr-coy-43", name: "Coyote / 43", attributes: { Color: "Coyote", Size: "43" }, stock: 2 },
      { id: "lowa-zephyr-sage-44", name: "Sage / 44", attributes: { Color: "Sage", Size: "44" }, stock: 2 },
    ]
  },

  // Accessories
  { 
    name: "Sound Suppressor 14mm+ Replica", 
    slug: "suppressor-14mm-ccw", 
    brand: "Madbull", 
    price: 28.00, 
    type: "module", 
    category_id: "suppressors", 
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80", 
    description: "Full aluminum suppressor replica. 14mm- thread. Compatible with most M4/M16 AEG barrels.", 
    stock: 30,
    characteristics: [
      { emoji: "🤫", label: "Thread", value: "14mm CCW" },
      { emoji: "🧱", label: "Material", value: "T6 Aluminum" }
    ]
  },
  { name: "EOTech 558 Replica Red Dot", slug: "eotech-558-replica", brand: "Vector Optics", price: 65, type: "module", category_id: "optics", image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80", description: "Bright and clear holographic sight replica. Fits any standard picatinny rail.", stock: 10 },
  { name: "Magpul P-MAG 120rd Mid-Cap", slug: "magpul-pmag-120", brand: "Magpul", price: 22, type: "module", category_id: "magazines", image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80", description: "Reliable feeding mid-cap magazine for M4/AR15 series.", stock: 50 },

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
        "INSERT INTO categories (id, name, name_hr, slug, filters) VALUES ($1, $2, $3, $4, $5)",
        [cat.id, cat.name, cat.name_hr, cat.slug, JSON.stringify((cat as any).filters || [])]
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
        `INSERT INTO products (
          id, uid, sku, barcode, slug, name, description, type, 
          category_id, brand, price, stock, status, image_url,
          variants, variant_attributes, characteristics, images, category_filters
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, $14, $15, $16, $17, $18)`,
        [
          pid, 
          pid, 
          sku, 
          `BC${Math.floor(Math.random()*1000000)}`, 
          prod.slug, 
          prod.name, 
          prod.description, 
          prod.type, 
          prod.category_id, 
          prod.brand, 
          prod.price, 
          prod.stock, 
          prod.image,
          JSON.stringify((prod as any).variants || []),
          JSON.stringify((prod as any).variant_attributes || []),
          JSON.stringify((prod as any).characteristics || []),
          JSON.stringify([prod.image]),
          JSON.stringify((prod as any).category_filters || {})
        ]
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
