import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', productController.getCategories);
router.post('/', authenticateAdmin, productController.saveCategory); // Assuming I need to add this to controller
router.put('/:id', authenticateAdmin, productController.saveCategory);
router.delete('/:id', authenticateAdmin, productController.deleteCategory); // Assuming this too

export default router;
