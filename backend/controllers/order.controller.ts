import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { recalculateUserPointsAndRank } from '../services/loyalty.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  const orderData = req.body;
  const orderNumber = `HRA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const orderId = orderData.id || `order-${Date.now()}`;
  
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Fetch user profile
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const userProfile = userResult.rows[0];

    // 2. Fetch products and calculate authoritative subtotal, total, and profit
    let authoritativeSubtotal = 0;
    let authoritativeProfit = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const pid = item.product_id || item.productId || item.id;
      const productResult = await client.query('SELECT * FROM products WHERE id = $1', [pid]);
      if (productResult.rows.length === 0) throw new Error(`Product ${item.name || pid} not found`);
      const product = productResult.rows[0];

      if (parseInt(product.stock) < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      // Fetch category for category-level discounts
      const categoryResult = await client.query('SELECT discount, name FROM categories WHERE id = $1', [product.category_id]);
      const categoryDiscount = categoryResult.rows[0]?.discount || 0;
      const categoryName = categoryResult.rows[0]?.name || '';
      
      const productDiscount = parseInt(product.discount) || 0;
      const userDiscount = userProfile?.discount_level || 0;
      
      const bestDiscount = Math.max(productDiscount, categoryDiscount, userDiscount);
      const discountedPrice = parseFloat(product.price) * (1 - bestDiscount / 100);
      const landingCost = parseFloat(product.landing_cost) || (parseFloat(product.price) * 0.6);
      
      const itemSubtotal = discountedPrice * item.quantity;
      authoritativeSubtotal += itemSubtotal;
      authoritativeProfit += (discountedPrice - landingCost) * item.quantity;

      const processedItem = {
        order_id: orderId,
        product_id: product.id,
        name: product.name,
        price: discountedPrice,
        quantity: item.quantity,
        image: product.image_url,
        sku: product.sku || '',
        category: categoryName || product.category_id,
        variant_info: item.configuration ? JSON.stringify(item.configuration) : (item.selectedVariant ? JSON.stringify(item.selectedVariant) : null)
      };
      orderItems.push(processedItem);

      // Update stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, product.id]
      );

      // Inventory log
      await client.query(
        `INSERT INTO inventory_logs (product_id, user_id, change_amount, previous_balance, new_balance, reason, reference_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [product.id, req.user.id, -item.quantity, parseInt(product.stock), parseInt(product.stock) - item.quantity, `Order ${orderNumber}`, orderId]
      );
    }

    const shippingCost = parseFloat(orderData.shipping_cost || orderData.shipping?.cost || 0);
    const discountAmount = parseFloat(orderData.discountAmount || 0);
    const authoritativeTotal = authoritativeSubtotal + shippingCost - discountAmount;
    const tax = authoritativeTotal * 0.25;

    // 3. Save the actual order
    const shipping = orderData.shipping || {};
    const payment = orderData.payment || {};
    
    await client.query(
      `INSERT INTO orders (
        id, order_number, user_id, total, subtotal, tax, discount_amount, shipping_cost, 
        status, payment_method, payment_status, shipping_address, 
        first_name, last_name, email, shipping_city, shipping_phone, shipping_postal_code,
        notes, profit, points_earned
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        orderId, orderNumber, req.user.id, authoritativeTotal, authoritativeSubtotal, tax, discountAmount, shippingCost,
        'pending', payment.method || 'unknown', payment.status || 'pending', JSON.stringify(shipping),
        shipping.firstName || '', shipping.lastName || '', shipping.email || '', shipping.city || '', shipping.phone || '', shipping.postalCode || '',
        orderData.notes || '', authoritativeProfit, orderData.pointsEarned || 0
      ]
    );

    // 4. Save order items
    for (const oi of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, quantity, price, image, sku, variant_info, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [oi.order_id, oi.product_id, oi.name, oi.quantity, oi.price, oi.image, oi.sku, oi.variant_info, oi.category]
      );
    }

    // 5. Trigger loyalty recalculation
    await recalculateUserPointsAndRank(req.user.id);

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { id: orderId, orderNumber, status: 'pending' } });
  } catch (error: any) {
    if (client) await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Database error' });
  } finally {
    if (client) client.release();
  }
};

export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
};
