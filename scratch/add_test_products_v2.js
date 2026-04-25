import pg from 'pg';
const { Pool } = pg;

async function addTestProductsV2() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  const products = [
    {
      id: 'id_crye_g3_shirt',
      name: 'Crye Precision G3 Combat Shirt',
      type: 'gear',
      category_id: 'clothing',
      brand: 'Crye Precision',
      price: 189.99,
      stock: 20,
      image_url: 'https://images.clothes.com/crye-g3-shirt.jpg',
      variant_attributes: [
        { name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
        { name: 'Color', options: ['Multicam', 'Ranger Green', 'Black', 'Coyote'] }
      ],
      variants: [
        { id: 'crye-g3-s-mc', name: 'S / Multicam', stock: 5, attributes: { Size: 'S', Color: 'Multicam' } },
        { id: 'crye-g3-m-mc', name: 'M / Multicam', stock: 5, attributes: { Size: 'M', Color: 'Multicam' } },
        { id: 'crye-g3-l-rg', name: 'L / Ranger Green', stock: 3, attributes: { Size: 'L', Color: 'Ranger Green' } },
        { id: 'crye-g3-xl-blk', name: 'XL / Black', stock: 2, attributes: { Size: 'XL', Color: 'Black' } }
      ]
    },
    {
      id: 'id_mechanix_mpact',
      name: 'Mechanix Wear M-Pact Gloves',
      type: 'gear',
      category_id: 'gloves',
      brand: 'Mechanix Wear',
      price: 34.99,
      stock: 50,
      image_url: 'https://images.gear.com/mechanix-mpact.jpg',
      variant_attributes: [
        { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
        { name: 'Color', options: ['Coyote', 'Black', 'Wolf Grey'] }
      ],
      variants: [
        { id: 'mech-mpact-m-coy', name: 'M / Coyote', stock: 15, attributes: { Size: 'M', Color: 'Coyote' } },
        { id: 'mech-mpact-l-blk', name: 'L / Black', stock: 10, attributes: { Size: 'L', Color: 'Black' } }
      ]
    }
  ];

  try {
    for (const p of products) {
      await pool.query(`
        INSERT INTO products (
          id, uid, slug, name, type, category_id, brand, price, stock, image_url, 
          variant_attributes, variants, status, currency, discount
        ) VALUES ($1, $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', 'EUR', 0)
        ON CONFLICT (id) DO UPDATE SET
          variant_attributes = EXCLUDED.variant_attributes,
          variants = EXCLUDED.variants,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock
      `, [
        p.id, p.name, p.type, p.category_id, p.brand, p.price, p.stock, p.image_url,
        JSON.stringify(p.variant_attributes), JSON.stringify(p.variants)
      ]);
      console.log(`Added/Updated: ${p.name}`);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

addTestProductsV2();
