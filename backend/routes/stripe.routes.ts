import express, { Router } from 'express';
import * as stripeController from '../controllers/stripe.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/create-payment-intent', optionalAuthenticateToken, stripeController.createPaymentIntent);

// Webhook needs raw body, so we use express.raw() here specifically if needed,
// but app.ts already handles skipping express.json() for this path.
router.post('/webhook', (req, res, next) => {
  // If sig exists, it's likely a real webhook call
  next();
}, stripeController.handleWebhook);

export default router;
