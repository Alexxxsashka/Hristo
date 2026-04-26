import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function populateFilters() {
  const categoryFilters = [
    {
      slug: 'airsoft-weapons',
      filters: [
        { id: 'fire_mode', label: 'Fire Mode', type: 'select', options: ['Semi', 'Full Auto', '3-Round Burst', 'Single/Bolt'] },
        { id: 'material', label: 'Body Material', type: 'select', options: ['Full Metal', 'Polymer', 'Nylon Fiber', 'Steel', 'Real Wood'] },
        { id: 'power_source', label: 'Power Source', type: 'select', options: ['AEG (Electric)', 'GBB (Gas)', 'CO2', 'Spring', 'HPA'] },
        { id: 'blowback', label: 'Blowback', type: 'boolean' },
        { id: 'fps', label: 'FPS', type: 'select', options: ['< 300', '300 - 350', '350 - 400', '400 - 450', '> 450'] }
      ]
    },
    {
      slug: 'aeg-rifles',
      filters: [
        { id: 'gearbox', label: 'Gearbox Version', type: 'select', options: ['V2', 'V3', 'V6', 'V7', 'AEP'] },
        { id: 'battery_type', label: 'Optimal Battery', type: 'select', options: ['LiPo 7.4V', 'LiPo 11.1V', 'NiMH 9.6V', 'Li-Ion 7.4V'] },
        { id: 'connector', label: 'Connector Type', type: 'select', options: ['Mini Tamiya', 'Deans (T-Plug)', 'Large Tamiya'] },
        { id: 'mosfet', label: 'MOSFET/ETU', type: 'select', options: ['Built-in MOSFET', 'Electronic Trigger Unit', 'No MOSFET'] },
        { id: 'quick_spring', label: 'Quick Spring Change', type: 'boolean' }
      ]
    },
    {
      slug: 'gbb-rifles',
      filters: [
        { id: 'gas_type', label: 'Gas Compatibility', type: 'select', options: ['Green Gas', 'CO2', 'Black Gas (High Pressure)'] },
        { id: 'platform', label: 'Platform', type: 'select', options: ['M4/AR-15', 'AK', 'MCX', 'G36', 'SCAR', 'MP5'] }
      ]
    },
    {
      slug: 'sniper-rifles',
      filters: [
        { id: 'action', label: 'Action', type: 'select', options: ['Bolt Action', 'Semi-Auto (DMR)', 'Gas Operated'] },
        { id: 'spring_rating', label: 'Spring Tension', type: 'select', options: ['M130', 'M150', 'M170', 'M190'] },
        { id: 'hopup_type', label: 'Hop-Up Type', type: 'select', options: ['Standard', 'TDC Mod', 'Rotary'] }
      ]
    },
    {
      slug: 'pistols',
      filters: [
        { id: 'action', label: 'Action', type: 'select', options: ['Blowback (GBB)', 'Non-Blowback (NBB)', 'CO2 Driven', 'AEP (Electric)'] },
        { id: 'optics_ready', label: 'Optics Ready', type: 'boolean' },
        { id: 'rail', label: 'Accessory Rail', type: 'boolean' }
      ]
    },
    {
      slug: 'bbs',
      filters: [
        { id: 'weight', label: 'BB Weight', type: 'select', options: ['0.20g', '0.23g', '0.25g', '0.28g', '0.30g', '0.32g', '0.36g', '0.40g', '0.45g', '0.48g', '0.50g'] },
        { id: 'type', label: 'Material Type', type: 'select', options: ['BIO-Degradable', 'Standard Polymer'] },
        { id: 'tracer_type', label: 'Tracer Type', type: 'select', options: ['Non-Tracer', 'Tracer Green', 'Tracer Red'] }
      ]
    },
    {
      slug: 'batteries-chargers',
      filters: [
        { id: 'chemistry', label: 'Chemistry', type: 'select', options: ['LiPo', 'Li-Ion', 'NiMH', 'LiFe'] },
        { id: 'cells', label: 'Voltage', type: 'select', options: ['7.4V', '11.1V', '9.6V', '8.4V', '14.8V'] },
        { id: 'capacity', label: 'Capacity (mAh)', type: 'select', options: ['< 1000', '1000-1500', '1500-2000', '> 2000'] }
      ]
    },
    {
      slug: 'clothing-apparel',
      filters: [
        { id: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'] },
        { id: 'camo', label: 'Camo/Color', type: 'select', options: ['Multicam', 'Woodland', 'Flecktarn', 'Black', 'Tan', 'Grey', 'OD Green', 'AOR1', 'AOR2'] },
        { id: 'material', label: 'Material', type: 'select', options: ['Rip-stop', 'NyCo', 'Cotton', 'Softshell', 'Fleece'] }
      ]
    },
    {
      slug: 'uniforms',
      filters: [
        { id: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'] },
        { id: 'camo', label: 'Camouflage', type: 'select', options: ['Multicam', 'Woodland', 'Digital Desert', 'Olive Drab', 'Black'] },
        { id: 'generation', label: 'Generation', type: 'select', options: ['G2', 'G3', 'G4'] }
      ]
    },
    {
      slug: 'tactical-pants',
      filters: [
        { id: 'waist', label: 'Waist Size', type: 'select', options: ['28', '30', '32', '34', '36', '38', '40'] },
        { id: 'length', label: 'Length', type: 'select', options: ['Regular', 'Long', 'Short'] },
        { id: 'kneepads', label: 'Integrated Knee Pads', type: 'boolean' }
      ]
    },
    {
      slug: 'weapon-accessories',
      filters: [
        { id: 'rail', label: 'Mount Type', type: 'select', options: ['Picatinny', 'M-LOK', 'KeyMod', 'Dovetail'] }
      ]
    },
    {
      slug: 'optics-sights',
      filters: [
        { id: 'type', label: 'Optic Type', type: 'select', options: ['Red Dot', 'LPVO', 'Sniper Scope', 'Holographic', 'Iron Sights', 'Magnifier'] },
        { id: 'magnification', label: 'Magnification', type: 'select', options: ['1x', '3x', '4x', '1-4x', '1-6x', '3-9x', '4-12x'] }
      ]
    },
    {
      slug: 'magazines',
      filters: [
        { id: 'mag_type', label: 'Magazine Type', type: 'select', options: ['Low-Cap', 'Mid-Cap', 'Hi-Cap', 'Drum', 'Real-Cap'] },
        { id: 'capacity', label: 'Capacity (Rounds)', type: 'select', options: ['15-30', '30-80', '80-150', '150-500', '1000+'] },
        { id: 'caliber', label: 'Caliber', type: 'select', options: ['5.56 / NATO', '7.62 / AK', '9mm', '.45 ACP', '7.62 NATO / .308'] }
      ]
    },
    {
      slug: 'internal-parts',
      filters: [
        { id: 'part_category', label: 'Part Group', type: 'select', options: ['Hop-Up/Bucking', 'Inner Barrel', 'Gearset', 'Piston/Head', 'Motor', 'Trigger/MOSFET', 'Spring'] }
      ]
    },
    {
      slug: 'suppressors-tracers',
      filters: [
        { id: 'threading', label: 'Threading', type: 'select', options: ['14mm CCW (Standard)', '14mm CW', '24mm CW', 'LCT 24mm', 'Special'] },
        { id: 'tracer_module', label: 'Tracer Module', type: 'select', options: ['Built-in', 'Housing Only (Dummy)', 'Simulated Muzzle Flash', 'Both (Tracer + Flash)'] }
      ]
    },
    {
      slug: 'tents-sleeping-bags',
      filters: [
        { id: 'season', label: 'Season Rating', type: 'select', options: ['1 Season (Summer)', '2 Season', '3 Season', '4 Season (Winter)'] },
        { id: 'capacity', label: 'Capacity (Persons)', type: 'select', options: ['1 Person', '2 Persons', '3-4 Persons', '5+ Persons'] }
      ]
    },
    {
      slug: 'gloves',
      filters: [
        { id: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'] },
        { id: 'protection', label: 'Knuckle Protection', type: 'select', options: ['Hard Shell', 'Soft Padding', 'No Padding', 'Carbon Fiber'] },
        { id: 'touchscreen', label: 'Touchscreen Compatible', type: 'boolean' }
      ]
    }
  ];

  try {
    for (const item of categoryFilters) {
      await pool.query(
        'UPDATE categories SET filters = $1 WHERE slug = $2',
        [JSON.stringify(item.filters), item.slug]
      );
    }
    console.log('✅ Corrected and populated all category filters with EXPLICIT types.');
  } catch (err) {
    console.error('❌ Error updating filters:', err);
  } finally {
    await pool.end();
  }
}

populateFilters();
