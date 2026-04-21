import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function populateFilters() {
  const categoryFilters = [
    {
      slug: 'airsoft-weapons',
      filters: [
        { id: 'fire_mode', name: 'Fire Mode', options: ['Semi', 'Full Auto', '3-Round Burst', 'Single/Bolt'] },
        { id: 'material', name: 'Body Material', options: ['Full Metal', 'Polymer', 'Nylon Fiber', 'Steel', 'Real Wood'] },
        { id: 'power_source', name: 'Power Source', options: ['AEG (Electric)', 'GBB (Gas)', 'CO2', 'Spring', 'HPA'] }
      ]
    },
    {
      slug: 'aeg-rifles',
      filters: [
        { id: 'gearbox', name: 'Gearbox Version', options: ['V2', 'V3', 'V6', 'V7'] },
        { id: 'battery_type', name: 'Optimal Battery', options: ['LiPo 7.4V', 'LiPo 11.1V', 'NiMH 9.6V'] },
        { id: 'connector', name: 'Connector Type', options: ['Mini Tamiya', 'Deans (T-Plug)'] },
        { id: 'mosfet', name: 'MOSFET/ETU', options: ['Built-in MOSFET', 'Electronic Trigger Unit', 'No MOSFET'] }
      ]
    },
    {
      slug: 'gbb-rifles',
      filters: [
        { id: 'gas_type', name: 'Gas Compatibility', options: ['Green Gas', 'CO2', 'Black Gas (High Pressure)'] },
        { id: 'platform', name: 'Platform', options: ['M4/AR-15', 'AK', 'MCX', 'G36'] }
      ]
    },
    {
      slug: 'sniper-rifles',
      filters: [
        { id: 'action', name: 'Action', options: ['Bolt Action', 'Semi-Auto (DMR)', 'Gas Operated'] },
        { id: 'spring_rating', name: 'Spring Tension', options: ['M130', 'M150', 'M170', 'M190'] }
      ]
    },
    {
      slug: 'pistols',
      filters: [
        { id: 'action', name: 'Action', options: ['Blowback (GBB)', 'Non-Blowback (NBB)', 'CO2 Driven'] },
        { id: 'optics_ready', name: 'Optics Ready', options: ['Yes (RMR Cut)', 'No'] }
      ]
    },
    {
      slug: 'bbs',
      filters: [
        { id: 'weight', name: 'BB Weight', options: ['0.20g', '0.23g', '0.25g', '0.28g', '0.30g', '0.32g', '0.36g', '0.40g', '0.45g+'] },
        { id: 'type', name: 'Material Type', options: ['BIO-Degradable', 'Standard Polymer'] },
        { id: 'tracer_type', name: 'Tracer Type', options: ['Non-Tracer', 'Tracer Green', 'Tracer Red'] }
      ]
    },
    {
      slug: 'batteries-chargers',
      filters: [
        { id: 'chemistry', name: 'Chemistry', options: ['LiPo', 'Li-Ion', 'NiMH'] },
        { id: 'cells', name: 'Voltage', options: ['7.4V', '11.1V', '9.6V'] }
      ]
    },
    {
      slug: 'clothing-apparel',
      filters: [
        { id: 'size', name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
        { id: 'camo', name: 'Camo/Color', options: ['Multicam', 'Woodland', 'Flecktarn', 'Black', 'Tan', 'Grey'] }
      ]
    },
    {
      slug: 'uniforms',
      filters: [
        { id: 'size', name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
        { id: 'camo', name: 'Camouflage', options: ['Multicam', 'Woodland', 'Digital Desert', 'Olive Drab'] }
      ]
    },
    {
      slug: 'tactical-pants',
      filters: [
        { id: 'waist', name: 'Waist Size', options: ['28', '30', '32', '34', '36', '38', '40'] },
        { id: 'length', name: 'Length', options: ['Regular', 'Long', 'Short'] }
      ]
    },
    {
      slug: 'weapon-accessories',
      filters: [
        { id: 'rail', name: 'Mount Type', options: ['Picatinny', 'M-LOK', 'KeyMod'] }
      ]
    },
    {
      slug: 'optics-sights',
      filters: [
        { id: 'type', name: 'Optic Type', options: ['Red Dot', 'LPVO', 'Sniper Scope', 'Holographic'] }
      ]
    },
    {
      slug: 'magazines',
      filters: [
        { id: 'mag_type', name: 'Magazine Type', options: ['Low-Cap', 'Mid-Cap', 'Hi-Cap', 'Drum'] },
        { id: 'capacity', name: 'Capacity (Rounds)', options: ['15-30', '100-140', '300-500', '1000+'] }
      ]
    },
    {
      slug: 'internal-parts',
      filters: [
        { id: 'part_category', name: 'Part Group', options: ['Hop-Up/Bucking', 'Inner Barrel', 'Gearset', 'Piston/Head', 'Motor'] }
      ]
    },
    {
      slug: 'suppressors-tracers',
      filters: [
        { id: 'threading', name: 'Threading', options: ['14mm CCW (Standard)', '14mm CW', '24mm CW'] },
        { id: 'tracer_module', name: 'Tracer Module', options: ['Built-in', 'Housing Only (Dummy)', 'Simulated Muzzle Flash'] }
      ]
    },
    {
      slug: 'tents-sleeping-bags',
      filters: [
        { id: 'season', name: 'Season Rating', options: ['1 Season (Summer)', '3 Season', '4 Season (Winter)'] },
        { id: 'capacity', name: 'Capacity (Persons)', options: ['1 Person', '2 Persons', '3-4 Persons'] }
      ]
    },
    {
      slug: 'gloves',
      filters: [
        { id: 'size', name: 'Size', options: ['S', 'M', 'L', 'XL'] },
        { id: 'protection', name: 'Knuckle Protection', options: ['Hard Shell', 'Soft Padding', 'No Padding'] }
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
    console.log('✅ Final comprehensive filter update complete!');
  } catch (err) {
    console.error('❌ Error updating filters:', err);
  } finally {
    await pool.end();
  }
}

populateFilters();
