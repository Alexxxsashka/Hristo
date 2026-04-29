import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticateToken, authenticateAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOrderSchema } from '../validation/order.schema.js';

const router = Router();

router.post('/', authenticateToken, validate(createOrderSchema), orderController.createOrder);
router.get('/', authenticateToken, orderController.getOrders);
router.patch('/:id', authenticateAdmin, orderController.updateOrderStatus);
router.put('/:id/status', authenticateAdmin, orderController.updateOrderStatus);

export default router;
