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

// ─── Categories (HR / EN) ──────────────────────────────────────────────────────
const categories = [
  { id: "weapons",      name: "Airsoft Weapons",         name_hr: "Airsoft Oružje",          slug: "weapons",          parent_id: null },
  { id: "ar_series",   name: "AR Series (M4 / AR-15)",   name_hr: "AR Serija (M4 / AR-15)",   slug: "ar-series",        parent_id: "weapons" },
  { id: "ak_series",   name: "AK Series",                name_hr: "AK Serija",                slug: "ak-series",        parent_id: "weapons" },
  { id: "pistols",     name: "Pistols",                  name_hr: "Pištolji",                 slug: "pistols",          parent_id: "weapons" },
  { id: "snipers",     name: "Sniper Rifles",            name_hr: "Snajperske puške",         slug: "sniper-rifles",    parent_id: "weapons" },
  { id: "smg",         name: "SMG / CQB",                name_hr: "SMG / CQB",                slug: "smg-cqb",          parent_id: "weapons" },
  { id: "gear",        name: "Tactical Gear",            name_hr: "Taktička Oprema",          slug: "tactical-gear",    parent_id: null },
  { id: "vests",       name: "Vests & Plate Carriers",   name_hr: "Prsluci i Nosači ploča",   slug: "vests-carriers",   parent_id: "gear" },
  { id: "helmets",     name: "Helmets & Head Protection",name_hr: "Kacige i Zaštita glave",   slug: "helmets",          parent_id: "gear" },
  { id: "uniforms",    name: "Uniforms & Clothing",      name_hr: "Uniforme i Odjeća",        slug: "uniforms",         parent_id: "gear" },
  { id: "gloves",      name: "Gloves",                   name_hr: "Rukavice",                 slug: "gloves",           parent_id: "gear" },
  { id: "boots",       name: "Boots & Footwear",         name_hr: "Čizme i Obuća",            slug: "boots",            parent_id: "gear" },
  { id: "optics",      name: "Optics & Sights",          name_hr: "Optika i Nišani",          slug: "optics",           parent_id: null },
  { id: "scopes",      name: "Rifle Scopes",             name_hr: "Optički nišani",           slug: "rifle-scopes",     parent_id: "optics" },
  { id: "red_dots",    name: "Red Dots & Holographics",  name_hr: "Red Dots i Holografski",   slug: "red-dots",         parent_id: "optics" },
  { id: "lasers",      name: "Lasers & Flashlights",     name_hr: "Laseri i Svjetiljke",      slug: "lasers",           parent_id: "optics" },
  { id: "accessories", name: "Accessories & Upgrades",   name_hr: "Dodaci i Nadogradnje",     slug: "accessories",      parent_id: null },
  { id: "magazines",   name: "Magazines",                name_hr: "Magazini",                 slug: "magazines",        parent_id: "accessories" },
  { id: "suppressors", name: "Suppressors & Muzzles",    name_hr: "Prigušivači i Ustima",     slug: "suppressors",      parent_id: "accessories" },
  { id: "grips",       name: "Grips & Stocks",           name_hr: "Ručke i Kundaci",          slug: "grips-stocks",     parent_id: "accessories" },
  { id: "consumables", name: "BBs & Gas",                name_hr: "Kuglice i Plin",           slug: "bbs-gas",          parent_id: null },
  { id: "bbs",         name: "Airsoft BBs",              name_hr: "Airsoft Kuglice",          slug: "airsoft-bbs",      parent_id: "consumables" },
  { id: "gas",         name: "Gas & Propellant",         name_hr: "Plin i Pogonsko gorivo",   slug: "gas",              parent_id: "consumables" },
  { id: "batteries",   name: "Batteries & Chargers",     name_hr: "Baterije i Punjači",       slug: "batteries",        parent_id: "consumables" },
];

// ─── Products (HR / EN) ────────────────────────────────────────────────────────
const products = [
  // ── AR Series ──────────────────────────────────────────────────────────────
  {
    name: "Specna Arms SA-E04 EDGE AEG",
    name_hr: "Specna Arms SA-E04 EDGE AEG",
    slug: "specna-arms-sa-e04-edge",
    brand: "Specna Arms",
    price: 249.00,
    type: "weapon",
    category_id: "ar_series",
    image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80",
    description: "Full metal M4 carbine with integrated MOSFET X-ASR system. Excellent accuracy and reliability for both beginners and experienced players.",
    description_hr: "Full metal M4 karabin s integriranim MOSFET X-ASR sustavom. Izvrsna preciznost i pouzdanost za početnike i iskusne igrače.",
    stock: 12,
    sku: "SA-E04-BLK",
  },
  {
    name: "G&G CM16 Raider 2.0 AEG",
    name_hr: "G&G CM16 Raider 2.0 AEG",
    slug: "gg-cm16-raider-2",
    brand: "G&G Armament",
    price: 189.00,
    type: "weapon",
    category_id: "ar_series",
    image: "https://images.unsplash.com/photo-1583889052957-610ebefbfec5?auto=format&fit=crop&q=80",
    description: "Lightweight M4 platform with programmable MOSFET ETU. Perfect for CQB environments and beginners.",
    description_hr: "Lagana M4 platforma s programabilnim MOSFET ETU sustavom. Savršena za CQB okruženja i početnike.",
    stock: 8,
    sku: "GG-CM16-R2",
  },
  {
    name: "Daniel Defense MK18 GBBR – WE-Tech",
    name_hr: "Daniel Defense MK18 GBBR – WE-Tech",
    slug: "we-tech-dd-mk18-gbbr",
    brand: "WE-Tech",
    price: 399.00,
    type: "weapon",
    category_id: "ar_series",
    image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80",
    description: "Gas blowback M4 GBBR with realistic bolt carrier recoil. Exceptional realism with the licensed Daniel Defense MK18 handguard.",
    description_hr: "Gas blowback M4 GBBR s realističnim povratom nosača zatvarača. Iznimni realizam s licenciranim Daniel Defense MK18 ručkama.",
    stock: 4,
    sku: "WE-DD-MK18",
  },
  // ── AK Series ──────────────────────────────────────────────────────────────
  {
    name: "CYMA CM.048M AKM AEG (Wood)",
    name_hr: "CYMA CM.048M AKM AEG (Drvo)",
    slug: "cyma-cm048m-akm-wood",
    brand: "CYMA",
    price: 189.00,
    type: "weapon",
    category_id: "ak_series",
    image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80",
    description: "Classic AKM with real wood and steel construction. High durability and iconic look for any loadout.",
    description_hr: "Klasični AKM s pravim drvetom i čeličnom konstrukcijom. Visoka izdržljivost i ikonički izgled za svaki loadout.",
    stock: 5,
    sku: "CY-CM048M",
  },
  {
    name: "LCT LCK-15 AEG",
    name_hr: "LCT LCK-15 AEG",
    slug: "lct-lck15-aeg",
    brand: "LCT",
    price: 320.00,
    type: "weapon",
    category_id: "ak_series",
    image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&q=80",
    description: "Full steel AK replica with exceptional build quality. Laser-engraved markings and crisp trigger response.",
    description_hr: "Full čelična AK replika s iznimnom kvalitetom izrade. Laserski ugravirana obilježja i precizna reakcija okidača.",
    stock: 6,
    sku: "LCT-LCK15",
  },
  // ── Pistols ────────────────────────────────────────────────────────────────
  {
    name: "Tokyo Marui Hi-Capa 5.1 GBB",
    name_hr: "Tokyo Marui Hi-Capa 5.1 GBB",
    slug: "tokyo-marui-hi-capa-51",
    brand: "Tokyo Marui",
    price: 185.00,
    type: "weapon",
    category_id: "pistols",
    image: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?auto=format&fit=crop&q=80",
    description: "The benchmark gas blowback pistol. Unmatched accuracy, reliability and upgrade potential. A legend in airsoft.",
    description_hr: "Referentni gas blowback pištolj. Nenadmašna preciznost, pouzdanost i potencijal za nadogradnju. Legenda u airsoft sceni.",
    stock: 20,
    sku: "TM-HICAPA51",
  },
  {
    name: "Glock 17 Gen5 GBB – Umarex",
    name_hr: "Glock 17 Gen5 GBB – Umarex",
    slug: "umarex-glock17-gen5-gbb",
    brand: "Umarex",
    price: 145.00,
    type: "weapon",
    category_id: "pistols",
    image: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?auto=format&fit=crop&q=80",
    description: "Officially licensed Glock 17 Gen5 replica with realistic blowback. Compatible with all standard Glock accessories.",
    description_hr: "Službeno licencirana replika Glock 17 Gen5 s realističnim povratom. Kompatibilna sa svim standardnim Glock dodacima.",
    stock: 15,
    sku: "UM-G17GEN5",
  },
  {
    name: "SIG Sauer P226 GBB – KJW",
    name_hr: "SIG Sauer P226 GBB – KJW",
    slug: "kjw-sig-p226-gbb",
    brand: "KJW",
    price: 120.00,
    type: "weapon",
    category_id: "pistols",
    image: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?auto=format&fit=crop&q=80",
    description: "Reliable and accurate P226 replica. Full metal slide, great feel in hand and consistent performance.",
    description_hr: "Pouzdana i precizna P226 replika. Full metal klizač, odličan osjećaj u ruci i konzistentne performanse.",
    stock: 10,
    sku: "KJ-P226",
  },
  // ── Snipers ────────────────────────────────────────────────────────────────
  {
    name: "WELL MB4410 Bolt-Action Sniper",
    name_hr: "WELL MB4410 Bolt-Action Snajper",
    slug: "well-mb4410-sniper",
    brand: "WELL",
    price: 220.00,
    type: "weapon",
    category_id: "snipers",
    image: "https://images.unsplash.com/photo-1633354931941-c5e67c07febb?auto=format&fit=crop&q=80",
    description: "Bolt-action sniper rifle with bi-pod, scope and adjustable hop-up. Ready for field use straight out of the box.",
    description_hr: "Bolt-action snajperska puška s bipodim, optikom i podesivim hop-up sustavom. Spreman za upotrebu odmah iz kutije.",
    stock: 7,
    sku: "WL-MB4410",
  },
  {
    name: "Action Army AAC T10 Sniper",
    name_hr: "Action Army AAC T10 Snajper",
    slug: "action-army-aac-t10",
    brand: "Action Army",
    price: 380.00,
    type: "weapon",
    category_id: "snipers",
    image: "https://images.unsplash.com/photo-1633354931941-c5e67c07febb?auto=format&fit=crop&q=80",
    description: "High-end bolt-action with zero trigger creep and fully adjustable stock. A top-tier choice for dedicated snipers.",
    description_hr: "Vrhunski bolt-action s nultim pukovanjem okidača i potpuno podesivim kundakom. Prvoklasan izbor za predane snajperiste.",
    stock: 3,
    sku: "AA-T10",
  },
  // ── SMG ────────────────────────────────────────────────────────────────────
  {
    name: "Kriss Vector AEG – Krytac",
    name_hr: "Kriss Vector AEG – Krytac",
    slug: "krytac-kriss-vector-aeg",
    brand: "Krytac",
    price: 420.00,
    type: "weapon",
    category_id: "smg",
    image: "https://images.unsplash.com/photo-1583889052957-610ebefbfec5?auto=format&fit=crop&q=80",
    description: "Iconic CQB SMG with a compact profile and built-in MOSFET. Excellent ROF and reliability in tight spaces.",
    description_hr: "Ikonični CQB SMG s kompaktnim profilom i ugrađenim MOSFET sustavom. Odličan ROF i pouzdanost u skučenim prostorima.",
    stock: 5,
    sku: "KT-KV",
  },
  // ── Vests ──────────────────────────────────────────────────────────────────
  {
    name: "Templars Gear CPC ROC Plate Carrier",
    name_hr: "Templars Gear CPC ROC Nosač ploča",
    slug: "templars-gear-cpc-roc-multicam",
    brand: "Templars Gear",
    price: 195.00,
    type: "gear",
    category_id: "vests",
    image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80",
    description: "Lightweight plate carrier with ROC quick-release system. Laser-cut MOLLE, Cordura 500D-IR material. Made in Europe.",
    description_hr: "Lagani nosač ploča s ROC sustavom brzog skidanja. Laserski izrezani MOLLE, materijal Cordura 500D-IR. Proizvedeno u Europi.",
    stock: 3,
    sku: "TG-CPCR",
  },
  {
    name: "Warrior Assault Systems DCS Plate Carrier",
    name_hr: "Warrior Assault Systems DCS Nosač ploča",
    slug: "was-dcs-plate-carrier",
    brand: "Warrior Assault Systems",
    price: 280.00,
    type: "gear",
    category_id: "vests",
    image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80",
    description: "Professional-grade plate carrier used by military and law enforcement. Full 500D Cordura construction with hydration compatibility.",
    description_hr: "Profesionalni nosač ploča koji koristi vojska i policija. Izvedba od punog 500D Cordura materijala s kompatibilnošću za hidrataciju.",
    stock: 4,
    sku: "WAS-DCS",
  },
  // ── Optics ─────────────────────────────────────────────────────────────────
  {
    name: "EOTech 516 Holographic Sight (Replica)",
    name_hr: "EOTech 516 Holografski nišan (Replika)",
    slug: "eotech-516-replica",
    brand: "EOTech",
    price: 89.00,
    type: "accessory",
    category_id: "red_dots",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80",
    description: "High-quality replica of the iconic EOTech 516. 68 MOA ring with 1 MOA dot, compatible with standard 20mm rail.",
    description_hr: "Visokokvalitetna replika ikoničnog EOTech 516. 68 MOA prsten s 1 MOA točkom, kompatibilan sa standardnom 20mm trakom.",
    stock: 15,
    sku: "ET-516",
  },
  {
    name: "3-9x40 AO Rifle Scope",
    name_hr: "3-9x40 AO Optički nišan",
    slug: "3-9x40-ao-scope",
    brand: "UTG",
    price: 65.00,
    type: "accessory",
    category_id: "scopes",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80",
    description: "Variable magnification scope with illuminated reticle. Ideal for mid to long range engagements.",
    description_hr: "Optički nišan s promjenjivim povećanjem i osvijetljenim retiklom. Idealan za srednji i dugi domet.",
    stock: 12,
    sku: "UTG-3940AO",
  },
  // ── Accessories ────────────────────────────────────────────────────────────
  {
    name: "SureFire M600 Scout Light (Replica)",
    name_hr: "SureFire M600 Scout Light (Replika)",
    slug: "surefire-m600-replica",
    brand: "SureFire",
    price: 45.00,
    type: "accessory",
    category_id: "lasers",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80",
    description: "Compact 500-lumen Scout flashlight replica. M-LOK and Picatinny compatible. Pressure pad included.",
    description_hr: "Kompaktna replika Scout svjetiljke od 500 lumena. Kompatibilna s M-LOK i Picatinny sustavom. Priložena pritisna podloga.",
    stock: 20,
    sku: "SF-M600",
  },
  {
    name: "PEQ-15 Laser Designator (Replica)",
    name_hr: "PEQ-15 Laserski označivač (Replika)",
    slug: "peq-15-replica",
    brand: "Big Dragon",
    price: 35.00,
    type: "accessory",
    category_id: "lasers",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80",
    description: "Realistic PEQ-15 battery case replica with red and IR laser and white LED illuminator.",
    description_hr: "Realistična replika PEQ-15 kućišta za baterije s crvenim i IR laserom te bijelim LED osvjetljenjem.",
    stock: 18,
    sku: "BD-PEQ15",
  },
  {
    name: "M4 Hi-Cap 300rnd Magazine",
    name_hr: "M4 Hi-Cap Magazin 300 kuglica",
    slug: "m4-hicap-300rnd",
    brand: "Tokyo Marui",
    price: 18.00,
    type: "accessory",
    category_id: "magazines",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80",
    description: "High-capacity magazine for M4/M16 compatible AEGs. Wind-up mechanism, polymer body.",
    description_hr: "Visokokapacitetni magazin za M4/M16 kompatibilne AEG-ove. Wind-up mehanizam, polimersko tijelo.",
    stock: 50,
    sku: "TM-M4HC300",
  },
  {
    name: "Sound Suppressor 14mm+ Replica",
    name_hr: "Zvučni prigušivač 14mm+ Replika",
    slug: "suppressor-14mm-ccw",
    brand: "Madbull",
    price: 28.00,
    type: "accessory",
    category_id: "suppressors",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80",
    description: "Full aluminum suppressor replica. 14mm- thread. Compatible with most M4/M16 AEG barrels.",
    description_hr: "Full aluminijska replika prigušivača. 14mm- navoj. Kompatibilan s većinom M4/M16 AEG cijevi.",
    stock: 30,
    sku: "MB-SUPP14",
  },
  // ── Consumables ────────────────────────────────────────────────────────────
  {
    name: "BLS 0.20g BBs – 5000 pcs (White)",
    name_hr: "BLS 0.20g Kuglice – 5000 kom (Bijele)",
    slug: "bls-020g-5000-white",
    brand: "BLS",
    price: 11.00,
    type: "consumable",
    category_id: "bbs",
    image: "https://images.unsplash.com/photo-1590492459113-b31c396fafba?auto=format&fit=crop&q=80",
    description: "Precision polished 0.20g BBs. Excellent roundness and polishing for consistent shot groupings.",
    description_hr: "Precizno polirane 0.20g kuglice. Izvrsna okruglost i poliranje za konzistentno grupiranje pogodaka.",
    stock: 200,
    sku: "BLS-020W5K",
  },
  {
    name: "BLS 0.28g BBs – 1kg (3570 pcs)",
    name_hr: "BLS 0.28g Kuglice – 1kg (3570 kom)",
    slug: "bls-028-1kg",
    brand: "BLS",
    price: 13.50,
    type: "consumable",
    category_id: "bbs",
    image: "https://images.unsplash.com/photo-1590492459113-b31c396fafba?auto=format&fit=crop&q=80",
    description: "Heavier 0.28g BBs for improved accuracy at range, especially with upgraded hop-up systems.",
    description_hr: "Teže 0.28g kuglice za poboljšanu preciznost na daljini, posebno s nadograđenim hop-up sustavima.",
    stock: 150,
    sku: "BLS-028-1KG",
  },
  {
    name: "Nuprol 2.0 Green Gas – 500ml",
    name_hr: "Nuprol 2.0 Zeleni Plin – 500ml",
    slug: "nuprol-20-green-gas-500ml",
    brand: "Nuprol",
    price: 12.00,
    type: "consumable",
    category_id: "gas",
    image: "https://images.unsplash.com/photo-1590492459113-b31c396fafba?auto=format&fit=crop&q=80",
    description: "Standard pressure green gas with built-in lubricant. Ideal for most GBB pistols and rifles in temperate climates.",
    description_hr: "Zeleni plin standardnog tlaka s ugrađenim mazivom. Idealan za većinu GBB pištolja i pušaka u umjerenoj klimi.",
    stock: 80,
    sku: "NP-GG20-500",
  },
  {
    name: "Nuprol 4.0 Ultra Gas – 500ml",
    name_hr: "Nuprol 4.0 Ultra Plin – 500ml",
    slug: "nuprol-40-ultra-gas-500ml",
    brand: "Nuprol",
    price: 15.00,
    type: "consumable",
    category_id: "gas",
    image: "https://images.unsplash.com/photo-1590492459113-b31c396fafba?auto=format&fit=crop&q=80",
    description: "High-pressure gas for use in cold weather conditions. Excellent for GBBRs and performance-tuned pistols.",
    description_hr: "Visokotlačni plin za hladno vrijeme. Odličan za GBBR-ove i na performanse uglađene pištolje.",
    stock: 60,
    sku: "NP-UG40-500",
  },
  {
    name: "7.4V 1200mAh LiPo Battery (Mini Tamiya)",
    name_hr: "7.4V 1200mAh LiPo Baterija (Mini Tamiya)",
    slug: "74v-1200mah-lipo-mini-tamiya",
    brand: "Nuprol",
    price: 18.00,
    type: "consumable",
    category_id: "batteries",
    image: "https://images.unsplash.com/photo-1590492459113-b31c396fafba?auto=format&fit=crop&q=80",
    description: "Compact 7.4V LiPo battery. Ideal for stock-tube M4s and compact CQB rifles. Requires LiPo-compatible charger.",
    description_hr: "Kompaktna 7.4V LiPo baterija. Idealna za M4 puške s kvadratnom cijevi i kompaktne CQB puške. Zahtijeva punjač kompatibilan s LiPo.",
    stock: 45,
    sku: "NP-74-1200",
  },
  {
    name: "11.1V 1400mAh LiPo Stick Battery",
    name_hr: "11.1V 1400mAh LiPo Stick Baterija",
    slug: "111v-1400mah-lipo-stick",
    brand: "Crane",
    price: 24.00,
    type: "consumable",
    category_id: "batteries",
    image: "https://images.unsplash.com/photo-1590492459113-b31c396fafba?auto=format&fit=crop&q=80",
    description: "High-performance 11.1V LiPo for full-length rifles. Increases ROF and trigger response significantly.",
    description_hr: "Visokoučinkovita 11.1V LiPo baterija za punoduljinske puške. Značajno povećava ROF i reakciju okidača.",
    stock: 30,
    sku: "CR-111-1400",
  },
  // ── Helmets ────────────────────────────────────────────────────────────────
  {
    name: "MICH 2001 ABS Helmet",
    name_hr: "MICH 2001 ABS Kaciga",
    slug: "mich-2001-abs-helmet",
    brand: "ACM",
    price: 45.00,
    type: "gear",
    category_id: "helmets",
    image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80",
    description: "Lightweight ABS combat helmet with NVG mount. Rail system for accessories. One-size adjustable.",
    description_hr: "Lagana ABS borbena kaciga s NVG montažom. Sustav tračnica za dodatke. Jedna veličina, podesiva.",
    stock: 10,
    sku: "ACM-MICH01",
  },
  {
    name: "Fast Helmet BJ with NVG Mount",
    name_hr: "Fast Helmet BJ s NVG montažom",
    slug: "fast-helmet-bj-nvg",
    brand: "Emerson",
    price: 72.00,
    type: "gear",
    category_id: "helmets",
    image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80",
    description: "Airsoft FAST helmet replica with Velcro space, V-STR rail and NVG shroud. Includes 4-point retention system.",
    description_hr: "Airsoft FAST replika kacige s Velcro prostorom, V-STR trakom i NVG shroud-om. Uključuje sustav zadržavanja s 4 točke.",
    stock: 7,
    sku: "EM-FASTBJ",
  },
  // ── Uniforms ───────────────────────────────────────────────────────────────
  {
    name: "Combat Shirt & Pants Set – Multicam",
    name_hr: "Borbena Košulja i Hlače – Multicam",
    slug: "combat-shirt-pants-multicam",
    brand: "Emerson",
    price: 89.00,
    type: "gear",
    category_id: "uniforms",
    image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80",
    description: "Durable Multicam ripstop uniform set. Reinforced elbows and knees. Multiple pockets for field equipment.",
    description_hr: "Izdržljivi Multicam ripstop set uniforme. Ojačani laktovi i koljena. Višestruki džepovi za terenska sredstva.",
    stock: 14,
    sku: "EM-CSMM",
  },
  {
    name: "Tactical Combat Boots – Coyote",
    name_hr: "Taktičke Borbene Čizme – Coyote",
    slug: "tactical-boots-coyote",
    brand: "Mil-Tec",
    price: 75.00,
    type: "gear",
    category_id: "boots",
    image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80",
    description: "Water-resistant combat boots with speed-lace system and rubber outsole. Ideal for all terrain types.",
    description_hr: "Vojne čizme otporne na vodu s brzim pertlama i gumenim potplatom. Idealne za sve terene.",
    stock: 16,
    sku: "MT-BOOT-COY",
  },
  {
    name: "Tactical Shooting Gloves – Black",
    name_hr: "Taktičke Rukavice za Pucanje – Crne",
    slug: "tactical-shooting-gloves-black",
    brand: "Mechanix",
    price: 32.00,
    type: "gear",
    category_id: "gloves",
    image: "https://images.unsplash.com/photo-1619641782842-83f2246fdc21?auto=format&fit=crop&q=80",
    description: "Original Mechanix Wear gloves with TrekDry material for breathability and TPR knuckle protection.",
    description_hr: "Originalne Mechanix Wear rukavice s TrekDry materijalom za prozračnost i TPR zaštitom zglobova.",
    stock: 25,
    sku: "MX-GLV-BLK",
  },
];

// ─── Blog Posts (HR / EN) ─────────────────────────────────────────────────────
const blogs = [
  {
    id: "blog-001",
    title: "Top 5 Airsoft Rifles for Beginners in 2025",
    title_hr: "Top 5 Airsoft Pušaka za Početnike u 2025.",
    slug: "top-5-airsoft-rifles-beginners-2025",
    content: `# Top 5 Airsoft Rifles for Beginners in 2025

Starting in airsoft can feel overwhelming with hundreds of rifles to choose from. We've tested and reviewed the most popular options to help you make the right choice.

## 1. G&G CM16 Raider 2.0
The best entry-level AEG on the market. Programmable MOSFET, great out-of-box accuracy and lightweight polymer body.

## 2. Specna Arms SA-E04 EDGE
Full metal construction with an integrated X-ASR MOSFET. Exceptional value for money with upgrade potential.

## 3. CYMA CM048M AKM
A classic choice for AK lovers. Wood and steel construction gives it an authentic feel and durability.

## 4. Krytac Trident MK2 CRB
Premium electronics and tight groupings make this rifle outstanding for players ready to invest more.

## 5. ASG Scorpion EVO 3 A1
The best SMG for CQB environments. Compact, reliable, and with a massive upgrade aftermarket.

---
*Always wear your eye protection and follow field rules.*`,
    content_hr: `# Top 5 Airsoft Pušaka za Početnike u 2025.

Početak u airsoft sportu može biti preplavujuć s stotinama pušaka za odabir. Testirali i pregledali smo najpopularnije opcije kako bismo vam pomogli donijeti pravu odluku.

## 1. G&G CM16 Raider 2.0
Najbolji ulazni AEG na tržištu. Programabilni MOSFET, odlična preciznost iz kutije i lagano polimersko tijelo.

## 2. Specna Arms SA-E04 EDGE
Full metal konstrukcija s integriranim X-ASR MOSFET-om. Iznimna vrijednost za novac i potencijal za nadogradnju.

## 3. CYMA CM048M AKM
Klasičan izbor za ljubitelje AK-ova. Drvena i čelična konstrukcija daje autentičan osjećaj i izdržljivost.

## 4. Krytac Trident MK2 CRB
Premium elektronika i tijesno grupiranje čine ovu pušku izvrsnom za igrače koji su spremni uložiti više.

## 5. ASG Scorpion EVO 3 A1
Najbolji SMG za CQB okruženja. Kompaktan, pouzdan i s ogromnim aftermarketom za nadogradnju.`,
    author: "Hristo Team",
    category: "guides",
  },
  {
    id: "blog-002",
    title: "GBB vs AEG – Which is Better for CQB?",
    title_hr: "GBB vs AEG – Koji je Bolji za CQB?",
    slug: "gbb-vs-aeg-cqb-guide",
    content: `# GBB vs AEG – Which is Better for CQB?

CQB (Close Quarters Battle) fields demand fast, compact, and reliable setups. Let's break down the key differences.

## AEG (Automatic Electric Gun)
- Consistent performance regardless of temperature
- Higher capacity magazines
- Lower maintenance requirements
- Great for beginners

## GBB (Gas Blowback)
- Realistic recoil and bolt movement
- Trigger feel closer to real firearms
- More immersive experience
- Better for experienced players

## Our Verdict
For pure performance and reliability in CQB, the **AEG wins**. But if you're after realism and the "right feel," a **GBB pistol as a secondary** is a great addition.`,
    content_hr: `# GBB vs AEG – Koji je Bolji za CQB?

CQB (Close Quarters Battle) tereni zahtijevaju brze, kompaktne i pouzdane setupe. Razložimo ključne razlike.

## AEG (Automatska električna puška)
- Konzistentne performanse bez obzira na temperaturu
- Magazini veće kapacitete
- Niži zahtjevi održavanja
- Odličan za početnike

## GBB (Gas Blowback)
- Realistični trzaj i pokret zatvarača
- Osjećaj okidača bliži pravim vatrenim oružjima
- Imerzivnije iskustvo
- Bolji za iskusne igrače

## Naš Zaključak
Za čistu izvedbu i pouzdanost u CQB-u, **AEG pobjeđuje**. Ali ako tražite realizam i "pravi osjećaj", **GBB pištolj kao sekundarno oružje** je odličan dodatak.`,
    author: "Marko P.",
    category: "guides",
  },
  {
    id: "blog-003",
    title: "How to Choose the Right BB Weight",
    title_hr: "Kako Odabrati Pravi Gramataž Kuglice",
    slug: "how-to-choose-bb-weight",
    content: `# How to Choose the Right BB Weight

BB weight is one of the most important factors affecting your accuracy and range. Here's a quick guide.

| Weight | Best Use Case |
|--------|---------------|
| 0.12g | Not recommended – too light, very inaccurate |
| 0.20g | CQB and indoor fields, beginner rifles |
| 0.25g | General outdoor play, great balance |
| 0.28g | Upgraded rifles and DMR builds |
| 0.30g+ | High-powered snipers and heavy hitters |

## Tips
- Always use seamless, polished BBs
- Never reuse BBs – they deform on impact
- Match BB weight to your hop-up setting`,
    content_hr: `# Kako Odabrati Pravi Gramataž Kuglice

Gramataž kuglice jedan je od najvažnijih čimbenika koji utječe na vašu preciznost i domet. Evo kratkog vodiča.

| Gramataža | Preporučena upotreba |
|-----------|----------------------|
| 0.12g | Nije preporučeno – prelako, jako neprecizno |
| 0.20g | CQB i unutarnji tereni, početničke puške |
| 0.25g | Opća igra na otvorenom, odlična ravnoteža |
| 0.28g | Nadograđene puške i DMR postavke |
| 0.30g+ | Visokosnažni snajperi i teški igrači |

## Savjeti
- Uvijek koristite glatke, polirane kuglice
- Nikada ne koristite kuglice ponovo – deformiraju se pri udaru
- Uskladite gramataž kuglice s vašim hop-up postavkama`,
    author: "Ana K.",
    category: "guides",
  },
  {
    id: "blog-004",
    title: "Field Report: Spring Open – Zagreb 2025",
    title_hr: "Izvještaj s Terena: Spring Open – Zagreb 2025.",
    slug: "field-report-spring-open-zagreb-2025",
    content: `# Field Report: Spring Open – Zagreb 2025

Over 200 players gathered for the Spring Open event held at the Woodland Arena outside Zagreb. Here's our recap!

## Event Highlights
- 4 distinct zones with varying terrain
- Sniper tower and urban combat area
- Night game with glow-stick marking system

## Community
The airsoft community continues to grow. We saw many new faces alongside seasoned veterans.

## Gear of the Day
The Krytac Kriss Vector dominated CQB zones, while the Action Army T10 was unstoppable in the open field.

---
*Follow us on Instagram for more field photos!*`,
    content_hr: `# Izvještaj s Terena: Spring Open – Zagreb 2025.

Više od 200 igrača okupilo se na Spring Open događaju u Woodland Areni izvan Zagreba. Evo našeg pregleda!

## Istaknuti Trenuci
- 4 različite zone s različitim terenom
- Snajperski toranj i zona urbanog sučeljavanja
- Noćna igra sa sustavom obilježavanja svjećicama

## Zajednica
Airsoft zajednica nastavlja rasti. Vidjeli smo mnoga nova lica uz iskusne veterane.

## Oprema Dana
Krytac Kriss Vector dominirao je CQB zonama, dok je Action Army T10 bio nezaustavljiv na otvorenom polju.`,
    author: "Hristo Team",
    category: "events",
  },
  {
    id: "blog-005",
    title: "Spring Sale – Up to 30% Off Selected Items",
    title_hr: "Proljetna Rasprodaja – Do 30% Popusta na Odabrane Artikle",
    slug: "spring-sale-2025",
    content: `# Spring Sale – Up to 30% Off!

It's that time of year again. Our Spring Sale is live with massive discounts across the entire store.

## Featured Deals
- **All Specna Arms rifles** – 15% off
- **BLS BBs** – Buy 3, get 1 free
- **Nuprol Gas** – 20% off all sizes
- **Emerson uniforms** – up to 30% off

## How to Shop
Simply add items to your cart and the discount will apply automatically at checkout.

*Offer valid while stocks last.*`,
    content_hr: `# Proljetna Rasprodaja – Do 30% Popusta!

Opet je to doba godine. Naša proljetna rasprodaja je uživo s velikim popustima u cijeloj trgovini.

## Istaknute Ponude
- **Sve Specna Arms puške** – 15% popusta
- **BLS kuglice** – Kupi 3, dobij 1 gratis
- **Nuprol plin** – 20% popusta na sve veličine
- **Emerson uniforme** – do 30% popusta

## Kako Kupovati
Jednostavno dodajte artikle u košaricu i popust će se automatski primijeniti na blagajni.

*Ponuda vrijedi dok traju zalihe.*`,
    author: "Hristo Team",
    category: "promotions",
  },
];

const seedRealData = async () => {
  try {
    console.log("Connecting to database...");
    await pool.query("SELECT 1");
    console.log("✅ Connected!");

    console.log("Initializing schema from init-db.sql...");
    const initSql = fs.readFileSync("init-db.sql", "utf8");
    await pool.query(initSql);

    console.log("Patching schema if needed...");
    await pool.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'`);
    await pool.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'`);
    await pool.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_url TEXT`);

    console.log("Cleaning old data...");
    await pool.query("TRUNCATE categories, products, blog_posts CASCADE");

    // ── Seed Categories ─────────────────────────────────────────────────────
    console.log(`📦 Seeding ${categories.length} categories...`);
    // First pass – no parent_id
    for (const cat of categories) {
      await pool.query(
        "INSERT INTO categories (id, name, name_hr, slug) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
        [cat.id, cat.name, cat.name_hr, cat.slug]
      );
    }
    // Second pass – set parent_id
    for (const cat of categories) {
      if (cat.parent_id) {
        await pool.query("UPDATE categories SET parent_id = $1 WHERE id = $2", [cat.parent_id, cat.id]);
      }
    }

    // ── Seed Products ───────────────────────────────────────────────────────
    console.log(`🔫 Seeding ${products.length} products...`);
    for (const prod of products) {
      const pid = generateId();
      const sku = (prod as any).sku || `SKU-${prod.brand.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
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
        `INSERT INTO blog_posts (id, title, slug, content, author, status, category)
         VALUES ($1, $2, $3, $4, $5, 'published', $6)
         ON CONFLICT (id) DO UPDATE SET title=$2, content=$4`,
        [blog.id, blog.title, blog.slug, blog.content, blog.author, blog.category]
      );
    }

    // ── Seed Admin ──────────────────────────────────────────────────────────
    console.log("👤 Seeding admin user...");
    const hash = await bcrypt.hash("admin123", 10);
    await pool.query(
      "INSERT INTO users (id, email, username, password, role) VALUES ($1, $2, $3, $4, 'admin') ON CONFLICT (id) DO NOTHING",
      ["admin-1", "admin@hristo.hr", "admin", hash]
    );

    console.log("✨ Database seeded successfully with HR/EN content!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedRealData();
