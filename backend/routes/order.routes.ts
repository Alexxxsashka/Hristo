import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticateToken, orderController.createOrder);
router.get('/', authenticateToken, orderController.getOrders);

export default router;
