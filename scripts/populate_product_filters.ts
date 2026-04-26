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
      if (name.includes('metal') || desc.includes('full metal') || name.includes('edge') || name.includes('vfc') || name.includes('steel')) {
        filters.material = 'Full Metal';
      } else if (name.includes('polymer') || name.includes('nylon') || name.includes('plastic')) {
        filters.material = 'Polymer';
      } else if (name.includes('real wood') || desc.includes('real wood')) {
        filters.material = 'Real Wood';
      }

      // Power Source
      if (catId === 'aeg_rifles' || name.includes('aeg') || name.includes('electric') || desc.includes('battery')) {
        filters.power_source = 'AEG (Electric)';
      } else if (catId === 'gbb_rifles' || name.includes('gbb') || name.includes('gas blowback')) {
        filters.power_source = 'GBB (Gas)';
      } else if (name.includes('co2')) {
        filters.power_source = 'CO2';
      } else if (catId === 'snipers' || name.includes('spring') || name.includes('bolt action')) {
        filters.power_source = 'Spring';
      } else if (name.includes('hpa')) {
        filters.power_source = 'HPA';
      }

      // Fire Mode
      if (catId === 'snipers' || name.includes('sniper') || name.includes('bolt')) {
        filters.fire_mode = 'Single/Bolt';
      } else if (catId === 'pistols') {
        filters.fire_mode = 'Semi';
      } else {
        filters.fire_mode = 'Full Auto';
      }

      // Blowback
      if (name.includes('gbb') || name.includes('blowback') || desc.includes('blowback')) {
        filters.blowback = true;
      } else {
        filters.blowback = false;
      }

      // FPS (rough guess)
      if (name.includes('sniper') || name.includes('450fps')) filters.fps = '> 450';
      else if (name.includes('400fps')) filters.fps = '400 - 450';
      else if (name.includes('350fps')) filters.fps = '350 - 400';
      else if (catId === 'pistols') filters.fps = '< 300';
      else filters.fps = '350 - 400';

      // AEG specific
      if (catId === 'aeg_rifles' || filters.power_source === 'AEG (Electric)') {
        filters.gearbox = (name.includes('ak') || name.includes('v3')) ? 'V3' : 'V2';
        filters.battery_type = name.includes('11.1') ? 'LiPo 11.1V' : 'LiPo 7.4V';
        filters.connector = name.includes('deans') ? 'Deans (T-Plug)' : 'Mini Tamiya';
        filters.mosfet = (name.includes('mosfet') || name.includes('etu') || name.includes('edge')) ? 'Built-in MOSFET' : 'No MOSFET';
        filters.quick_spring = (name.includes('edge') || name.includes('quick spring') || name.includes('esa')) ? true : false;
      }
    }

    // --- BBs ---
    if (catId === 'bbs') {
      if (name.includes('0.20')) filters.weight = '0.20g';
      else if (name.includes('0.23')) filters.weight = '0.23g';
      else if (name.includes('0.25')) filters.weight = '0.25g';
      else if (name.includes('0.28')) filters.weight = '0.28g';
      else if (name.includes('0.30')) filters.weight = '0.30g';
      else if (name.includes('0.32')) filters.weight = '0.32g';
      else if (name.includes('0.36')) filters.weight = '0.36g';
      else if (name.includes('0.40')) filters.weight = '0.40g';
      else if (name.includes('0.43') || name.includes('0.45')) filters.weight = '0.45g';
      
      filters.type = (name.includes('bio') || desc.includes('biodegradable')) ? 'BIO-Degradable' : 'Standard Polymer';
      filters.tracer_type = name.includes('tracer') ? (name.includes('red') ? 'Tracer Red' : 'Tracer Green') : 'Non-Tracer';
    }

    // --- Clothing ---
    if (catId === 'clothing' || catId === 'pants' || catId === 'uniforms' || catId === 'gloves' || catId === 'jackets' || catId === 'boots') {
      filters.size = 'L'; // Default
      if (name.includes('multicam') || desc.includes('multicam')) filters.camo = 'Multicam';
      else if (name.includes('woodland')) filters.camo = 'Woodland';
      else if (name.includes('black')) filters.camo = 'Black';
      else if (name.includes('tan') || name.includes('coyote')) filters.camo = 'Tan';
      else if (name.includes('grey')) filters.camo = 'Grey';
      else if (name.includes('green') || name.includes('od')) filters.camo = 'OD Green';

      if (name.includes('ripstop') || desc.includes('ripstop')) filters.material = 'Rip-stop';
      else if (name.includes('softshell')) filters.material = 'Softshell';
      else if (name.includes('fleece')) filters.material = 'Fleece';
    }

    // --- Optics ---
    if (catId === 'optics' || catId === 'optics-sights') {
      if (name.includes('red dot') || name.includes('t1') || name.includes('eotech') || name.includes('holographic')) filters.type = 'Red Dot';
      else if (name.includes('scope') || name.includes('lpvo')) filters.type = 'LPVO';
      else if (name.includes('magnifier')) filters.type = 'Magnifier';
      
      if (name.includes('1x')) filters.magnification = '1x';
      else if (name.includes('3x')) filters.magnification = '3x';
      else if (name.includes('4x')) filters.magnification = '4x';
      else if (name.includes('1-4x')) filters.magnification = '1-4x';
      else if (name.includes('1-6x')) filters.magnification = '1-6x';
    }

    // --- Magazines ---
    if (catId === 'magazines') {
      if (name.includes('mid-cap') || name.includes('midcap')) filters.mag_type = 'Mid-Cap';
      else if (name.includes('hi-cap') || name.includes('hicap')) filters.mag_type = 'Hi-Cap';
      else if (name.includes('low-cap') || name.includes('lowcap')) filters.mag_type = 'Low-Cap';
      else filters.mag_type = 'Mid-Cap';

      if (name.includes('m4') || name.includes('ar15') || name.includes('nato')) filters.caliber = '5.56 / NATO';
      else if (name.includes('ak')) filters.caliber = '7.62 / AK';
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
