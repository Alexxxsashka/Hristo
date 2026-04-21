import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function populateFilters() {
  const categoryFilters = [
    {
      slug: 'airsoft-weapons',
      filters: [
        { id: 'fire_mode', label: 'Fire Mode', options: ['Semi', 'Full Auto', '3-Round Burst', 'Single/Bolt'] },
        { id: 'material', label: 'Body Material', options: ['Full Metal', 'Polymer', 'Nylon Fiber', 'Steel', 'Real Wood'] },
        { id: 'power_source', label: 'Power Source', options: ['AEG (Electric)', 'GBB (Gas)', 'CO2', 'Spring', 'HPA'] }
      ]
    },
    {
      slug: 'aeg-rifles',
      filters: [
        { id: 'gearbox', label: 'Gearbox Version', options: ['V2', 'V3', 'V6', 'V7'] },
        { id: 'battery_type', label: 'Optimal Battery', options: ['LiPo 7.4V', 'LiPo 11.1V', 'NiMH 9.6V'] },
        { id: 'connector', label: 'Connector Type', options: ['Mini Tamiya', 'Deans (T-Plug)'] },
        { id: 'mosfet', label: 'MOSFET/ETU', options: ['Built-in MOSFET', 'Electronic Trigger Unit', 'No MOSFET'] }
      ]
    },
    {
      slug: 'gbb-rifles',
      filters: [
        { id: 'gas_type', label: 'Gas Compatibility', options: ['Green Gas', 'CO2', 'Black Gas (High Pressure)'] },
        { id: 'platform', label: 'Platform', options: ['M4/AR-15', 'AK', 'MCX', 'G36'] }
      ]
    },
    {
      slug: 'sniper-rifles',
      filters: [
        { id: 'action', label: 'Action', options: ['Bolt Action', 'Semi-Auto (DMR)', 'Gas Operated'] },
        { id: 'spring_rating', label: 'Spring Tension', options: ['M130', 'M150', 'M170', 'M190'] }
      ]
    },
    {
      slug: 'pistols',
      filters: [
        { id: 'action', label: 'Action', options: ['Blowback (GBB)', 'Non-Blowback (NBB)', 'CO2 Driven'] },
        { id: 'optics_ready', label: 'Optics Ready', options: ['Yes (RMR Cut)', 'No'] }
      ]
    },
    {
      slug: 'bbs',
      filters: [
        { id: 'weight', label: 'BB Weight', options: ['0.20g', '0.23g', '0.25g', '0.28g', '0.30g', '0.32g', '0.36g', '0.40g', '0.45g+'] },
        { id: 'type', label: 'Material Type', options: ['BIO-Degradable', 'Standard Polymer'] },
        { id: 'tracer_type', label: 'Tracer Type', options: ['Non-Tracer', 'Tracer Green', 'Tracer Red'] }
      ]
    },
    {
      slug: 'batteries-chargers',
      filters: [
        { id: 'chemistry', label: 'Chemistry', options: ['LiPo', 'Li-Ion', 'NiMH'] },
        { id: 'cells', label: 'Voltage', options: ['7.4V', '11.1V', '9.6V'] }
      ]
    },
    {
      slug: 'clothing-apparel',
      filters: [
        { id: 'size', label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
        { id: 'camo', label: 'Camo/Color', options: ['Multicam', 'Woodland', 'Flecktarn', 'Black', 'Tan', 'Grey'] }
      ]
    },
    {
      slug: 'uniforms',
      filters: [
        { id: 'size', label: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
        { id: 'camo', label: 'Camouflage', options: ['Multicam', 'Woodland', 'Digital Desert', 'Olive Drab'] }
      ]
    },
    {
      slug: 'tactical-pants',
      filters: [
        { id: 'waist', label: 'Waist Size', options: ['28', '30', '32', '34', '36', '38', '40'] },
        { id: 'length', label: 'Length', options: ['Regular', 'Long', 'Short'] }
      ]
    },
    {
      slug: 'weapon-accessories',
      filters: [
        { id: 'rail', label: 'Mount Type', options: ['Picatinny', 'M-LOK', 'KeyMod'] }
      ]
    },
    {
      slug: 'optics-sights',
      filters: [
        { id: 'type', label: 'Optic Type', options: ['Red Dot', 'LPVO', 'Sniper Scope', 'Holographic'] }
      ]
    },
    {
      slug: 'magazines',
      filters: [
        { id: 'mag_type', label: 'Magazine Type', options: ['Low-Cap', 'Mid-Cap', 'Hi-Cap', 'Drum'] },
        { id: 'capacity', label: 'Capacity (Rounds)', options: ['15-30', '100-140', '300-500', '1000+'] }
      ]
    },
    {
      slug: 'internal-parts',
      filters: [
        { id: 'part_category', label: 'Part Group', options: ['Hop-Up/Bucking', 'Inner Barrel', 'Gearset', 'Piston/Head', 'Motor'] }
      ]
    },
    {
      slug: 'suppressors-tracers',
      filters: [
        { id: 'threading', label: 'Threading', options: ['14mm CCW (Standard)', '14mm CW', '24mm CW'] },
        { id: 'tracer_module', label: 'Tracer Module', options: ['Built-in', 'Housing Only (Dummy)', 'Simulated Muzzle Flash'] }
      ]
    },
    {
      slug: 'tents-sleeping-bags',
      filters: [
        { id: 'season', label: 'Season Rating', options: ['1 Season (Summer)', '3 Season', '4 Season (Winter)'] },
        { id: 'capacity', label: 'Capacity (Persons)', options: ['1 Person', '2 Persons', '3-4 Persons'] }
      ]
    },
    {
      slug: 'gloves',
      filters: [
        { id: 'size', label: 'Size', options: ['S', 'M', 'L', 'XL'] },
        { id: 'protection', label: 'Knuckle Protection', options: ['Hard Shell', 'Soft Padding', 'No Padding'] }
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
