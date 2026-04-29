import { Router } from 'express';
import * as couponController from '../controllers/coupon.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/validate', couponController.validateCoupon);

// Admin routes
router.get('/', authenticateAdmin, couponController.getCoupons);
router.post('/', authenticateAdmin, couponController.createCoupon);
router.put('/:id', authenticateAdmin, couponController.updateCoupon);
router.delete('/:id', authenticateAdmin, couponController.deleteCoupon);

export default router;
