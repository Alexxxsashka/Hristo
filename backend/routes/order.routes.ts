import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOrderSchema } from '../validation/order.schema.js';

const router = Router();

router.post('/', authenticateToken, validate(createOrderSchema), orderController.createOrder);
router.get('/', authenticateToken, orderController.getOrders);
router.put('/:id/status', authenticateToken, orderController.updateOrderStatus);

export default router;
