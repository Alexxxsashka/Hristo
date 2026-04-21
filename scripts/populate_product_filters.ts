import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('🚀 Starting intelligent product filter population...');

  // 1. Fetch all products and categories
  const productsRes = await pool.query('SELECT * FROM products');
  const categoriesRes = await pool.query('SELECT * FROM categories');
  
  const products = productsRes.rows;
  const categories = categoriesRes.rows;
  
  console.log(`Found ${products.length} products and ${categories.length} categories.`);

  let updatedCount = 0;

  for (const product of products) {
    const filters: Record<string, any> = {};
    const name = (product.name || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();
    const catId = product.category_id;
    const subcatId = product.subcategory;

    // --- WEAPONS ---
    if (catId === 'weapons' || catId === 'aeg_rifles' || catId === 'gbb_rifles' || catId === 'pistols' || catId === 'snipers' || catId === 'shotguns') {
      // Body Material
      if (name.includes('metal') || desc.includes('full metal') || name.includes('edge') || name.includes('vfc')) {
        filters.material = 'Full Metal';
      } else if (name.includes('polymer') || name.includes('nylon')) {
        filters.material = 'Polymer';
      }

      // Power Source
      if (catId === 'aeg_rifles' || name.includes('aeg') || name.includes('electric')) {
        filters.power_source = 'AEG (Electric)';
      } else if (name.includes('gbb') || name.includes('gas blowback')) {
        filters.power_source = 'GBB (Gas)';
      } else if (name.includes('co2')) {
        filters.power_source = 'CO2';
      } else if (catId === 'snipers' || name.includes('spring')) {
        filters.power_source = 'Spring';
      }

      // Fire Mode
      if (catId === 'snipers' || name.includes('sniper')) {
        filters.fire_mode = 'Single/Bolt';
      } else if (catId === 'pistols') {
        filters.fire_mode = 'Semi';
      } else {
        filters.fire_mode = 'Full Auto';
      }

      // AEG specific
      if (catId === 'aeg_rifles') {
        filters.gearbox = name.includes('ak') ? 'V3' : 'V2';
        filters.battery_type = 'LiPo 7.4V';
        filters.connector = 'Mini Tamiya';
      }
    }

    // --- BBs ---
    if (catId === 'bbs') {
      if (name.includes('0.20')) filters.weight = '0.20g';
      else if (name.includes('0.25')) filters.weight = '0.25g';
      else if (name.includes('0.28')) filters.weight = '0.28g';
      else if (name.includes('0.30')) filters.weight = '0.30g';
      else if (name.includes('0.32')) filters.weight = '0.32g';
      
      filters.type = name.includes('bio') ? 'BIO-Degradable' : 'Standard Polymer';
      filters.tracer_type = name.includes('tracer') ? (name.includes('red') ? 'Tracer Red' : 'Tracer Green') : 'Non-Tracer';
    }

    // --- Clothing ---
    if (catId === 'clothing' || catId === 'pants' || catId === 'uniforms' || catId === 'gloves') {
      filters.size = 'L'; // Default
      if (name.includes('multicam') || desc.includes('multicam')) filters.camo = 'Multicam';
      else if (name.includes('woodland')) filters.camo = 'Woodland';
      else if (name.includes('black')) filters.camo = 'Black';
    }

    // --- Optics ---
    if (catId === 'optics') {
      if (name.includes('red dot') || name.includes('t1') || name.includes('eotech')) filters.type = 'Red Dot';
      else if (name.includes('scope') || name.includes('lpvo')) filters.type = 'LPVO';
    }

    // --- Magazines ---
    if (catId === 'magazines') {
      if (name.includes('mid-cap') || name.includes('midcap')) filters.mag_type = 'Mid-Cap';
      else if (name.includes('hi-cap') || name.includes('hicap')) filters.mag_type = 'Hi-Cap';
      else filters.mag_type = 'Mid-Cap';
    }

    // Only update if we found some filters
    if (Object.keys(filters).length > 0) {
      await pool.query(
        'UPDATE products SET category_filters = $1 WHERE id = $2',
        [JSON.stringify(filters), product.id]
      );
      updatedCount++;
    }
  }

  console.log(`✅ Successfully updated ${updatedCount} products with initial filter values.`);
  await pool.end();
}

main().catch(console.error);
