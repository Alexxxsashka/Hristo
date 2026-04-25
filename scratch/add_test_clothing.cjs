const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
});

async function addTestProducts() {
  const products = [
    {
      id: 'test-pants-mc',
      uid: 'test-pants-mc',
      sku: 'EM-G3-PANTS-MC',
      slug: 'emerson-g3-pants-multicam',
      name: 'Emerson G3 Combat Pants - Multicam',
      description: 'High-quality combat pants with built-in knee pads.',
      type: 'gear',
      category_id: 'clothing',
      brand: 'EmersonGear',
      model: 'G3',
      price: 120.00,
      stock: 30,
      image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
      images: JSON.stringify(['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800']),
      characteristics: JSON.stringify([
        { emoji: '🛡️', label: 'durability', value: 'high' },
        { emoji: '💨', label: 'breathability', value: 'medium' }
      ]),
      variant_attributes: JSON.stringify([{ name: 'Size', options: ['S', 'M', 'L', 'XL'] }]),
      variants: JSON.stringify([
        { id: 'v1', name: 'S', attributes: { Size: 'S' }, stock: 10, price: 120.00 },
        { id: 'v2', name: 'M', attributes: { Size: 'M' }, stock: 10, price: 120.00 },
        { id: 'v3', name: 'L', attributes: { Size: 'L' }, stock: 5, price: 120.00 },
        { id: 'v4', name: 'XL', attributes: { Size: 'XL' }, stock: 5, price: 125.00 }
      ]),
      category_filters: JSON.stringify({ camo_type: 'Multicam', clothing_type: 'Pants' }),
      variants_group_id: 'emerson-g3-pants',
      status: 'active'
    },
    {
      id: 'test-pants-blk',
      uid: 'test-pants-blk',
      sku: 'EM-G3-PANTS-BLK',
      slug: 'emerson-g3-pants-black',
      name: 'Emerson G3 Combat Pants - Black',
      description: 'High-quality combat pants with built-in knee pads in stealth black.',
      type: 'gear',
      category_id: 'clothing',
      brand: 'EmersonGear',
      model: 'G3',
      price: 115.00,
      stock: 15,
      image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800',
      images: JSON.stringify(['https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800']),
      characteristics: JSON.stringify([
        { emoji: '🛡️', label: 'durability', value: 'high' },
        { emoji: '💨', label: 'breathability', value: 'medium' }
      ]),
      variant_attributes: JSON.stringify([{ name: 'Size', options: ['M', 'L'] }]),
      variants: JSON.stringify([
        { id: 'v1', name: 'M', attributes: { Size: 'M' }, stock: 8, price: 115.00 },
        { id: 'v2', name: 'L', attributes: { Size: 'L' }, stock: 7, price: 115.00 }
      ]),
      category_filters: JSON.stringify({ camo_type: 'Black', clothing_type: 'Pants' }),
      variants_group_id: 'emerson-g3-pants',
      status: 'active'
    },
    {
      id: 'test-jpc-mc',
      uid: 'test-jpc-mc',
      sku: 'CP-JPC2-MC',
      slug: 'crye-precision-jpc2-multicam',
      name: 'Crye Precision JPC 2.0 - Multicam',
      description: 'The Jumpable Plate Carrier (JPC) 2.0™ is a lightweight and minimal armor chassis.',
      type: 'gear',
      category_id: 'clothing',
      brand: 'Crye Precision',
      model: 'JPC 2.0',
      price: 340.00,
      stock: 5,
      image_url: 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&q=80&w=800',
      images: JSON.stringify(['https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&q=80&w=800']),
      characteristics: JSON.stringify([
        { emoji: '⚖️', label: 'weight', value: 'ultralight' },
        { emoji: '🛡️', label: 'protection', value: 'modular' }
      ]),
      variant_attributes: JSON.stringify([{ name: 'Size', options: ['Medium', 'Large'] }]),
      variants: JSON.stringify([
        { id: 'v1', name: 'Medium', attributes: { Size: 'Medium' }, stock: 3, price: 340.00 },
        { id: 'v2', name: 'Large', attributes: { Size: 'Large' }, stock: 2, price: 350.00 }
      ]),
      category_filters: JSON.stringify({ camo_type: 'Multicam', gear_type: 'Plate Carrier' }),
      variants_group_id: 'crye-jpc-2',
      status: 'active'
    },
    {
      id: 'test-jpc-rg',
      uid: 'test-jpc-rg',
      sku: 'CP-JPC2-RG',
      slug: 'crye-precision-jpc2-ranger-green',
      name: 'Crye Precision JPC 2.0 - Ranger Green',
      description: 'The Jumpable Plate Carrier (JPC) 2.0™ in classic Ranger Green.',
      type: 'gear',
      category_id: 'clothing',
      brand: 'Crye Precision',
      model: 'JPC 2.0',
      price: 330.00,
      stock: 2,
      image_url: 'https://images.unsplash.com/photo-1595152230535-0955d439a3fd?auto=format&fit=crop&q=80&w=800',
      images: JSON.stringify(['https://images.unsplash.com/photo-1595152230535-0955d439a3fd?auto=format&fit=crop&q=80&w=800']),
      characteristics: JSON.stringify([
        { emoji: '⚖️', label: 'weight', value: 'ultralight' },
        { emoji: '🛡️', label: 'protection', value: 'modular' }
      ]),
      variant_attributes: JSON.stringify([{ name: 'Size', options: ['Medium', 'Large'] }]),
      variants: JSON.stringify([
        { id: 'v1', name: 'Medium', attributes: { Size: 'Medium' }, stock: 1, price: 330.00 },
        { id: 'v2', name: 'Large', attributes: { Size: 'Large' }, stock: 1, price: 340.00 }
      ]),
      category_filters: JSON.stringify({ camo_type: 'Ranger Green', gear_type: 'Plate Carrier' }),
      variants_group_id: 'crye-jpc-2',
      status: 'active'
    }
  ];

  try {
    for (const p of products) {
      console.log(`Inserting/Updating product: ${p.name}`);
      await pool.query(`
        INSERT INTO products (
          id, uid, sku, slug, name, description, type, category_id, brand, model, 
          price, stock, image_url, images, characteristics, 
          variant_attributes, variants, category_filters, variants_group_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          sku = EXCLUDED.sku,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock,
          variants = EXCLUDED.variants,
          variant_attributes = EXCLUDED.variant_attributes,
          category_filters = EXCLUDED.category_filters,
          variants_group_id = EXCLUDED.variants_group_id
      `, [
        p.id, p.uid, p.sku, p.slug, p.name, p.description, p.type, p.category_id, p.brand, p.model,
        p.price, p.stock, p.image_url, p.images, p.characteristics,
        p.variant_attributes, p.variants, p.category_filters, p.variants_group_id, p.status
      ]);
    }
    console.log('✅ Test products added successfully!');
  } catch (err) {
    console.error('❌ Error adding test products:', err);
  } finally {
    await pool.end();
  }
}

addTestProducts();
