import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { uploadToVercelBlob, deleteFromVercelBlob } from '../services/storage.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    const mapped = result.rows.map(p => ({
      ...p,
      category: p.category_id,
      image: p.image_url,
      model3D: p.model_3d_url,
      has3D: !!p.model_3d_url
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const p = req.body.product ? JSON.parse(req.body.product) : req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (files) {
      if (files.modelFile) {
        const url = await uploadToVercelBlob(files.modelFile[0], "models");
        p.model_3d_url = url;
        p.has_3d = true;
      }
      if (files.imageFile) {
        const url = await uploadToVercelBlob(files.imageFile[0], "images");
        p.image_url = url;
      }
    }

    const id = p.id || `prod-${Date.now()}`;
    const uid = p.uid || id;
    const finalSlug = p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : id);

    await pool.query(
      `INSERT INTO products (
        id, uid, sku, barcode, slug, name, description, type, category_id, subcategory, 
        brand, model, price, stock, image_url, images, model_3d_url, has_3d, 
        characteristics, variant_attributes, variants, category_filters, slots, 
        compatible_module_categories, socket_point, compatible_ids, mount_type, attachment_slot
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)`,
      [
        id, uid, p.sku||id, p.barcode||'', finalSlug, p.name, p.description, p.type||'weapon', p.category_id, p.subcategory, 
        p.brand, p.model, p.price||0, p.stock||0, p.image_url, JSON.stringify(p.images || []), p.model_3d_url, p.has_3d,
        JSON.stringify(p.characteristics || []), JSON.stringify(p.variant_attributes || []), JSON.stringify(p.variants || []), 
        JSON.stringify(p.category_filters || {}), JSON.stringify(p.slots || []), 
        JSON.stringify(p.compatible_module_categories || []), JSON.stringify(p.socket_point || [0,0,0]),
        JSON.stringify(p.compatibleIds || []), p.mount_type, p.attachment_slot
      ]
    );

    res.status(201).json({ success: true, data: { ...p, id, uid, slug: finalSlug } });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const result = await pool.query('SELECT image_url, model_3d_url FROM products WHERE id = $1', [id]);
    
    if (result.rows.length > 0) {
      const { image_url, model_3d_url } = result.rows[0];
      await deleteFromVercelBlob(image_url);
      await deleteFromVercelBlob(model_3d_url);
    }

    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const getCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};
