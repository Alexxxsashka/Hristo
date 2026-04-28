import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2023-10-16" as any,
});
