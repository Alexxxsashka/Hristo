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
        { id: 'power_source', label: 'Power Source', type: 'select', options: ['AEG (Electric)', 'GBB (Gas)', 'CO2', 'Spring', 'HPA'] }
      ]
    },
    {
      slug: 'aeg-rifles',
      filters: [
        { id: 'gearbox', label: 'Gearbox Version', type: 'select', options: ['V2', 'V3', 'V6', 'V7'] },
        { id: 'battery_type', label: 'Optimal Battery', type: 'select', options: ['LiPo 7.4V', 'LiPo 11.1V', 'NiMH 9.6V'] },
        { id: 'connector', label: 'Connector Type', type: 'select', options: ['Mini Tamiya', 'Deans (T-Plug)'] },
        { id: 'mosfet', label: 'MOSFET/ETU', type: 'select', options: ['Built-in MOSFET', 'Electronic Trigger Unit', 'No MOSFET'] }
      ]
    },
    {
      slug: 'gbb-rifles',
      filters: [
        { id: 'gas_type', label: 'Gas Compatibility', type: 'select', options: ['Green Gas', 'CO2', 'Black Gas (High Pressure)'] },
        { id: 'platform', label: 'Platform', type: 'select', options: ['M4/AR-15', 'AK', 'MCX', 'G36'] }
      ]
    },
    {
      slug: 'sniper-rifles',
      filters: [
        { id: 'action', label: 'Action', type: 'select', options: ['Bolt Action', 'Semi-Auto (DMR)', 'Gas Operated'] },
        { id: 'spring_rating', label: 'Spring Tension', type: 'select', options: ['M130', 'M150', 'M170', 'M190'] }
      ]
    },
    {
      slug: 'pistols',
      filters: [
        { id: 'action', label: 'Action', type: 'select', options: ['Blowback (GBB)', 'Non-Blowback (NBB)', 'CO2 Driven'] },
        { id: 'optics_ready', label: 'Optics Ready', type: 'select', options: ['Yes (RMR Cut)', 'No'] }
      ]
    },
    {
      slug: 'bbs',
      filters: [
        { id: 'weight', label: 'BB Weight', type: 'select', options: ['0.20g', '0.23g', '0.25g', '0.28g', '0.30g', '0.32g', '0.36g', '0.40g', '0.45g+'] },
        { id: 'type', label: 'Material Type', type: 'select', options: ['BIO-Degradable', 'Standard Polymer'] },
        { id: 'tracer_type', label: 'Tracer Type', type: 'select', options: ['Non-Tracer', 'Tracer Green', 'Tracer Red'] }
      ]
    },
    {
      slug: 'batteries-chargers',
      filters: [
        { id: 'chemistry', label: 'Chemistry', type: 'select', options: ['LiPo', 'Li-Ion', 'NiMH'] },
        { id: 'cells', label: 'Voltage', type: 'select', options: ['7.4V', '11.1V', '9.6V'] }
      ]
    },
    {
      slug: 'clothing-apparel',
      filters: [
        { id: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
        { id: 'camo', label: 'Camo/Color', type: 'select', options: ['Multicam', 'Woodland', 'Flecktarn', 'Black', 'Tan', 'Grey'] }
      ]
    },
    {
      slug: 'uniforms',
      filters: [
        { id: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'] },
        { id: 'camo', label: 'Camouflage', type: 'select', options: ['Multicam', 'Woodland', 'Digital Desert', 'Olive Drab'] }
      ]
    },
    {
      slug: 'tactical-pants',
      filters: [
        { id: 'waist', label: 'Waist Size', type: 'select', options: ['28', '30', '32', '34', '36', '38', '40'] },
        { id: 'length', label: 'Length', type: 'select', options: ['Regular', 'Long', 'Short'] }
      ]
    },
    {
      slug: 'weapon-accessories',
      filters: [
        { id: 'rail', label: 'Mount Type', type: 'select', options: ['Picatinny', 'M-LOK', 'KeyMod'] }
      ]
    },
    {
      slug: 'optics-sights',
      filters: [
        { id: 'type', label: 'Optic Type', type: 'select', options: ['Red Dot', 'LPVO', 'Sniper Scope', 'Holographic'] }
      ]
    },
    {
      slug: 'magazines',
      filters: [
        { id: 'mag_type', label: 'Magazine Type', type: 'select', options: ['Low-Cap', 'Mid-Cap', 'Hi-Cap', 'Drum'] },
        { id: 'capacity', label: 'Capacity (Rounds)', type: 'select', options: ['15-30', '100-140', '300-500', '1000+'] }
      ]
    },
    {
      slug: 'internal-parts',
      filters: [
        { id: 'part_category', label: 'Part Group', type: 'select', options: ['Hop-Up/Bucking', 'Inner Barrel', 'Gearset', 'Piston/Head', 'Motor'] }
      ]
    },
    {
      slug: 'suppressors-tracers',
      filters: [
        { id: 'threading', label: 'Threading', type: 'select', options: ['14mm CCW (Standard)', '14mm CW', '24mm CW'] },
        { id: 'tracer_module', label: 'Tracer Module', type: 'select', options: ['Built-in', 'Housing Only (Dummy)', 'Simulated Muzzle Flash'] }
      ]
    },
    {
      slug: 'tents-sleeping-bags',
      filters: [
        { id: 'season', label: 'Season Rating', type: 'select', options: ['1 Season (Summer)', '3 Season', '4 Season (Winter)'] },
        { id: 'capacity', label: 'Capacity (Persons)', type: 'select', options: ['1 Person', '2 Persons', '3-4 Persons'] }
      ]
    },
    {
      slug: 'gloves',
      filters: [
        { id: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L', 'XL'] },
        { id: 'protection', label: 'Knuckle Protection', type: 'select', options: ['Hard Shell', 'Soft Padding', 'No Padding'] }
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
