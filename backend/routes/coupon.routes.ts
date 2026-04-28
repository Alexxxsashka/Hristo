import { Router } from 'express';
import * as couponController from '../controllers/coupon.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/validate', couponController.validateCoupon);

// Admin routes
router.get('/admin', authenticateAdmin, couponController.getCoupons);
router.post('/admin', authenticateAdmin, couponController.createCoupon);
router.put('/admin/:id', authenticateAdmin, couponController.updateCoupon);
router.delete('/admin/:id', authenticateAdmin, couponController.deleteCoupon);

export default router;
