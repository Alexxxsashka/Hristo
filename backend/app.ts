import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

// Middleware
app.use(cors());

// Special handling for Stripe Webhook (needs raw body)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
