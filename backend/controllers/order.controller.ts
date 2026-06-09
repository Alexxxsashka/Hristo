import { Response } from 'express';
import { pool } from '../services/db.service.js';
import { recalculateUserPointsAndRank } from '../services/loyalty.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { logAudit, AuditSeverity } from '../services/audit.service.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  const orderData = req.body;
  const orderNumber = `HRA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const orderId = orderData.id || `order-${Date.now()}`;
  
  // Guest checkout is allowed
  const userId = req.user?.id || null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if order already exists
    const existingResult = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const isExisting = existingResult.rows.length > 0;

    // 1. Fetch user profile if exists
    let userProfile = null;
    if (userId) {
      const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      userProfile = userResult.rows[0];
    }

    // 2. Fetch products and calculate authoritative subtotal, total, and profit
    let authoritativeSubtotal = 0;
    let authoritativeProfit = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const pid = item.product_id || item.productId || item.id;
      const productResult = await client.query('SELECT * FROM products WHERE id = $1', [pid]);
      if (productResult.rows.length === 0) throw new Error(`Product ${item.name || pid} not found`);
      const product = productResult.rows[0];

      const stockVal = Number(product.stock) || 0;
      if (!isExisting && stockVal < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${stockVal}`);
      }

      // Fetch category for category-level discounts
      const categoryResult = await client.query('SELECT discount, name FROM categories WHERE id = $1', [product.category_id]);
      const categoryDiscount = categoryResult.rows[0]?.discount || 0;
      const categoryName = categoryResult.rows[0]?.name || '';
      
      const productDiscount = Number(product.discount) || 0;
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

      if (!isExisting) {
        // Update stock
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, product.id]
        );

        // Inventory log
        await client.query(
          `INSERT INTO inventory_logs (product_id, user_id, change_amount, previous_balance, new_balance, reason, reference_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [product.id, userId, -item.quantity, stockVal, stockVal - item.quantity, `Order ${orderNumber}`, orderId]
        );
      }
    }

    const shippingCost = parseFloat(orderData.shipping_cost || orderData.shipping?.cost || 0);
    const discountAmount = parseFloat(orderData.discountAmount || 0);
    const authoritativeTotal = authoritativeSubtotal + shippingCost - discountAmount;
    const tax = authoritativeTotal * 0.25;

    // 3. Save the actual order
    const shipping = orderData.shipping || {};
    const payment = orderData.payment || {};
    
    if (isExisting) {
      await client.query(
        `UPDATE orders SET 
          total = $1, subtotal = $2, tax = $3, discount_amount = $4, shipping_cost = $5,
          status = $6, payment_method = $7, payment_status = $8, shipping_address = $9,
          first_name = $10, last_name = $11, email = $12, shipping_city = $13, 
          shipping_phone = $14, shipping_postal_code = $15, notes = $16, profit = $17, 
          points_earned = $18, updated_at = CURRENT_TIMESTAMP
         WHERE id = $19`,
        [
          authoritativeTotal, authoritativeSubtotal, tax, discountAmount, shippingCost,
          orderData.status || 'pending', payment.method || 'unknown', payment.status || 'pending', JSON.stringify(shipping),
          shipping.firstName || '', shipping.lastName || '', shipping.email || '', shipping.city || '', 
          shipping.phone || '', shipping.postalCode || '', orderData.notes || '', authoritativeProfit, 
          orderData.pointsEarned || 0, orderId
        ]
      );
      
      // Delete old order items so we can refresh them
      await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
    } else {
      await client.query(
        `INSERT INTO orders (
          id, order_number, user_id, total, subtotal, tax, discount_amount, shipping_cost, 
          status, payment_method, payment_status, shipping_address, 
          first_name, last_name, email, shipping_city, shipping_phone, shipping_postal_code,
          notes, profit, points_earned
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          orderId, orderNumber, userId, authoritativeTotal, authoritativeSubtotal, tax, discountAmount, shippingCost,
          orderData.status || 'pending', payment.method || 'unknown', payment.status || 'pending', JSON.stringify(shipping),
          shipping.firstName || '', shipping.lastName || '', shipping.email || '', shipping.city || '', shipping.phone || '', shipping.postalCode || '',
          orderData.notes || '', authoritativeProfit, orderData.pointsEarned || 0
        ]
      );
    }

    // 4. Save order items (for both new and existing)
    for (const oi of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, quantity, price, image, sku, variant_info, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [oi.order_id, oi.product_id, oi.name, oi.quantity, oi.price, oi.image || null, oi.sku || '', oi.variant_info, oi.category || null]
      );
    }

    // 5. Trigger loyalty recalculation (only for registered users)
    if (userId) {
      await recalculateUserPointsAndRank(userId);
    }

    // 6. Audit Log
    await logAudit(
      'PLACE_ORDER',
      'ORDER',
      orderId,
      `Order placed: ${orderNumber}`,
      AuditSeverity.INFO,
      {
        userId: userId || 'guest',
        userName: req.user?.username || req.user?.email || 'Guest User',
        userEmail: req.user?.email || shipping.email || 'guest@example.com',
        ipAddress: req.ip
      }
    );

    await client.query('COMMIT');

    // Send order confirmation email in Croatian (non-blocking)
    const fullOrderData = {
      order_number: orderNumber,
      total: authoritativeTotal,
      subtotal: authoritativeSubtotal,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      first_name: shipping.firstName || '',
      last_name: shipping.lastName || '',
      email: shipping.email || req.user?.email || '',
      shipping_address: shipping
    };
    sendOrderConfirmationEmail(fullOrderData, orderItems).catch(err => {
      console.error('Error sending order confirmation email:', err);
    });

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
    const role = req.user?.role;
    
    let query = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
    let params = [userId];
    
    if (role === 'admin') {
      query = 'SELECT * FROM orders ORDER BY created_at DESC';
      params = [];
    }
    
    const result = await pool.query(query, params);
    
    // Fetch items for each order
    const ordersWithItems = await Promise.all(result.rows.map(async (o) => {
      const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
      
      let shippingAddress = {};
      try {
        shippingAddress = typeof o.shipping_address === 'string' 
          ? JSON.parse(o.shipping_address) 
          : (o.shipping_address || {});
      } catch (e) {
        console.warn(`Failed to parse shipping_address for order ${o.id}:`, e);
      }

      return {
        ...o,
        // Ensure numbers are numbers (pg returns DECIMAL as string)
        total: parseFloat(o.total as any) || 0,
        subtotal: parseFloat(o.subtotal as any) || 0,
        tax: parseFloat(o.tax as any) || 0,
        discountAmount: parseFloat(o.discount_amount as any) || 0,
        shippingCost: parseFloat(o.shipping_cost as any) || 0,
        profit: parseFloat(o.profit as any) || 0,
        
        orderNumber: o.order_number,
        userId: o.user_id,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        
        payment: {
          method: o.payment_method,
          status: o.payment_status,
          amount: parseFloat(o.total as any) || 0,
          currency: 'EUR'
        },
        shipping: {
          ...shippingAddress,
          cost: parseFloat(o.shipping_cost as any) || 0
        },
        items: itemsResult.rows.map(i => {
          let variantInfo = i.variant_info;
          try {
            if (typeof i.variant_info === 'string' && i.variant_info.trim().startsWith('{')) {
              variantInfo = JSON.parse(i.variant_info);
            }
          } catch (e) {
            console.warn(`Failed to parse variant_info for item ${i.id}:`, e);
          }
            
          return {
            ...i,
            price: parseFloat(i.price as any) || 0,
            productId: i.product_id,
            selectedVariant: variantInfo || undefined
          };
        })
      };
    }));

    res.json({ success: true, data: ordersWithItems });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: error.message || 'Database error' });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;
    
    await pool.query(
      'UPDATE orders SET status = $1, tracking_number = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [status, tracking_number, id]
    );

    if (req.user) {
      await logAudit(
        'UPDATE_STATUS',
        'ORDER',
        id,
        `Order ${id} status updated to: ${status}`,
        AuditSeverity.INFO,
        {
          userId: req.user.id,
          userName: req.user.displayName || req.user.email,
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
