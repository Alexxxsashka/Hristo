import { Response, Request } from 'express';
import { stripe } from '../services/stripe.service.js';
import { pool } from '../services/db.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const createPaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, subtotal, shipping_cost } = req.body;
    
    const totalAmount = Math.round((Number(subtotal || 0) + Number(shipping_cost || 0)) * 100);

    let stripeCustomerId = undefined;
    if (req.user) {
      const userResult = await pool.query('SELECT discount_level, stripe_customer_id FROM users WHERE id = $1', [req.user.id]);
      stripeCustomerId = userResult.rows[0]?.stripe_customer_id;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          metadata: { userId: req.user.id }
        });
        stripeCustomerId = customer.id;
        await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [stripeCustomerId, req.user.id]);
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "eur",
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: { userId: req.user?.id || 'guest' }
    });

    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody || req.body, 
      sig!, 
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('💰 PaymentIntent was successful!');
      // Update order status in DB
      await pool.query(
        'UPDATE orders SET payment_status = $1, status = $2 WHERE stripe_payment_intent_id = $3',
        ['paid', 'processing', paymentIntent.id]
      );
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
