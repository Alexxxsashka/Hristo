import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import blogRoutes from './routes/blog.routes.js';
import policyRoutes from './routes/policy.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import contactRoutes from './routes/contact.routes.js';
import buildRoutes from './routes/build.routes.js';
import stripeRoutes from './routes/stripe.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, 
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// 3. Stricter Rate Limiting for Sensitive Routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, 
  message: { success: false, error: 'Too many authentication/contact attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/contact', authLimiter);

// Middleware
app.use(cors());

// Special handling for Stripe Webhook (needs raw body)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/saved-builds', buildRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
