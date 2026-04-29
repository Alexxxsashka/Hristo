import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { uploadToVercelBlob, deleteFromVercelBlob } from '../services/storage.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { logAudit, AuditSeverity } from '../services/audit.service.js';

export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    const mapped = result.rows.map(p => ({
      ...p,
      category: p.category_id,
      image: p.image_url,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []),
      model3D: p.model_3d_url,
      has3D: !!p.model_3d_url,
      categoryFilters: typeof p.category_filters === 'string' ? JSON.parse(p.category_filters) : (p.category_filters || {}),
      variantAttributes: typeof p.variant_attributes === 'string' ? JSON.parse(p.variant_attributes) : (p.variant_attributes || []),
      variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants || []),
      characteristics: typeof p.characteristics === 'string' ? JSON.parse(p.characteristics) : (p.characteristics || []),
      socketPoint: typeof p.socket_point === 'string' ? JSON.parse(p.socket_point) : (p.socket_point || [0,0,0]),
      compatibleIds: typeof p.compatible_ids === 'string' ? JSON.parse(p.compatible_ids) : (p.compatible_ids || []),
      slots: typeof p.slots === 'string' ? JSON.parse(p.slots) : (p.slots || []),
      compatibleModuleCategories: typeof p.compatible_module_categories === 'string' ? JSON.parse(p.compatible_module_categories) : (p.compatible_module_categories || []),
      nameHr: p.name_hr,
      descriptionHr: p.description_hr,
      longDescription: p.long_description,
      longDescriptionHr: p.long_description_hr,
      model3DName: p.model3d_name,
      landingCost: p.landing_cost,
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const getProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const p = result.rows[0];
    const mapped = {
      ...p,
      category: p.category_id,
      image: p.image_url,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []),
      model3D: p.model_3d_url,
      has3D: !!p.model_3d_url,
      categoryFilters: typeof p.category_filters === 'string' ? JSON.parse(p.category_filters) : (p.category_filters || {}),
      variantAttributes: typeof p.variant_attributes === 'string' ? JSON.parse(p.variant_attributes) : (p.variant_attributes || []),
      variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants || []),
      characteristics: typeof p.characteristics === 'string' ? JSON.parse(p.characteristics) : (p.characteristics || []),
      socketPoint: typeof p.socket_point === 'string' ? JSON.parse(p.socket_point) : (p.socket_point || [0,0,0]),
      compatibleIds: typeof p.compatible_ids === 'string' ? JSON.parse(p.compatible_ids) : (p.compatible_ids || []),
      slots: typeof p.slots === 'string' ? JSON.parse(p.slots) : (p.slots || []),
      compatibleModuleCategories: typeof p.compatible_module_categories === 'string' ? JSON.parse(p.compatible_module_categories) : (p.compatible_module_categories || []),
      nameHr: p.name_hr,
      descriptionHr: p.description_hr,
      longDescription: p.long_description,
      longDescriptionHr: p.long_description_hr,
      model3DName: p.model3d_name,
      landingCost: p.landing_cost,
    };
    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('getProduct error:', error);
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

    const id = req.params.id || p.id || `prod-${Date.now()}`;
    const uid = p.uid || id;
    const finalSlug = p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : id);

    await pool.query(
      `INSERT INTO products (
        id, uid, sku, barcode, slug, name, name_hr, description, description_hr, type, 
        category_id, subcategory, brand, model, price, stock, discount, image_url, images, 
        model_3d_url, has_3d, characteristics, variant_attributes, variants, 
        category_filters, slots, compatible_module_categories, socket_point, 
        compatible_ids, mount_type, attachment_slot, long_description, long_description_hr
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
       ON CONFLICT (id) DO UPDATE SET
        uid = EXCLUDED.uid, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode, slug = EXCLUDED.slug,
        name = EXCLUDED.name, name_hr = EXCLUDED.name_hr, description = EXCLUDED.description, 
        description_hr = EXCLUDED.description_hr, type = EXCLUDED.type, category_id = EXCLUDED.category_id,
        subcategory = EXCLUDED.subcategory, brand = EXCLUDED.brand, model = EXCLUDED.model,
        price = EXCLUDED.price, stock = EXCLUDED.stock, discount = EXCLUDED.discount,
        image_url = EXCLUDED.image_url, images = EXCLUDED.images, model_3d_url = EXCLUDED.model_3d_url,
        has_3d = EXCLUDED.has_3d, characteristics = EXCLUDED.characteristics, 
        variant_attributes = EXCLUDED.variant_attributes, variants = EXCLUDED.variants,
        category_filters = EXCLUDED.category_filters, slots = EXCLUDED.slots,
        compatible_module_categories = EXCLUDED.compatible_module_categories,
        socket_point = EXCLUDED.socket_point, compatible_ids = EXCLUDED.compatible_ids,
        mount_type = EXCLUDED.mount_type, attachment_slot = EXCLUDED.attachment_slot,
        long_description = EXCLUDED.long_description, long_description_hr = EXCLUDED.long_description_hr`,
      [
        id, uid, p.sku||id, p.barcode||'', finalSlug, p.name, p.nameHr||p.name, p.description, p.descriptionHr||p.description, p.type||'weapon', 
        p.category_id||p.category, p.subcategory, p.brand, p.model, p.price||0, p.stock||0, p.discount||0, p.image_url||p.image, 
        JSON.stringify(p.images || []), p.model_3d_url||p.model3D, p.has_3d||p.has3D,
        JSON.stringify(p.characteristics || []), JSON.stringify(p.variant_attributes || []), JSON.stringify(p.variants || []), 
        JSON.stringify(p.categoryFilters || {}), JSON.stringify(p.slots || []), 
        JSON.stringify(p.compatibleModuleCategories || []), JSON.stringify(p.socketPoint || [0,0,0]),
        JSON.stringify(p.compatibleIds || []), p.mountType, p.attachment_slot, p.longDescription, p.longDescriptionHr
      ]
    );
    if (req.user) {

      await logAudit(
        'CREATE/UPDATE',
        'PRODUCT',
        id,
        `Created or updated product: ${p.name}`,
        AuditSeverity.INFO,
        {
          userId: req.user.id,
          userName: req.user.username || req.user.email,
          userEmail: req.user.email,
          ipAddress: req.ip
        }
      );
    }

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
      if (image_url) await deleteFromVercelBlob(image_url);
      if (model_3d_url) await deleteFromVercelBlob(model_3d_url);
    }

    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    
    if (req.user) {
      await logAudit(
        'DELETE',
        'PRODUCT',
        id,
        `Deleted product: ${id}`,
        AuditSeverity.WARNING,
        {
          userId: req.user.id,
          userName: req.user.username || req.user.email,
          userEmail: req.user.email,
          ipAddress: req.ip
        }
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const getCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    const mapped = result.rows.map(c => ({
      ...c,
      image: c.image_url,
      parent: c.parent_id,
      nameHr: c.name_hr,
      filters: typeof c.filters === 'string' ? JSON.parse(c.filters) : (c.filters || []),
      slots: typeof c.slots === 'string' ? JSON.parse(c.slots) : (c.slots || []),
      compatibleModuleCategories: typeof c.compatible_module_categories === 'string' ? JSON.parse(c.compatible_module_categories) : (c.compatible_module_categories || []),
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const saveCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cat = req.body;
    const id = req.params.id || cat.id || `cat-${Date.now()}`;
    const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const query = `
      INSERT INTO categories (id, name, name_hr, slug, image_url, parent_id, filters, discount, slots, compatible_module_categories)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        name_hr = EXCLUDED.name_hr,
        slug = EXCLUDED.slug,
        image_url = EXCLUDED.image_url,
        parent_id = EXCLUDED.parent_id,
        filters = EXCLUDED.filters,
        discount = EXCLUDED.discount,
        slots = EXCLUDED.slots,
        compatible_module_categories = EXCLUDED.compatible_module_categories
    `;
    
    const params = [
      id, 
      cat.name, 
      cat.nameHr || cat.name,
      slug,
      cat.image || cat.image_url,
      cat.parent || cat.parent_id || null,
      JSON.stringify(cat.filters || []),
      cat.discount || 0,
      JSON.stringify(cat.slots || []),
      JSON.stringify(cat.compatibleModuleCategories || cat.compatible_module_categories || [])
    ];

    await pool.query(query, params);
    
    if (req.user) {
      await logAudit(
        'SAVE',
        'CATEGORY',
        id,
        `Saved category: ${cat.name}`,
        AuditSeverity.INFO,
        {
          userId: req.user.id,
          userName: req.user.username || req.user.email,
          userEmail: req.user.email,
          ipAddress: req.ip
        }
      );
    }
    res.json({ success: true, data: { ...cat, id, slug } });
  } catch (error) {
    console.error('saveCategory error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    
    if (req.user) {
      await logAudit(
        'DELETE',
        'CATEGORY',
        id,
        `Deleted category: ${id}`,
        AuditSeverity.WARNING,
        {
          userId: req.user.id,
          userName: req.user.username || req.user.email,
          userEmail: req.user.email,
          ipAddress: req.ip
        }
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

