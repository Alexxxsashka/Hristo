import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';
import { uploadMemory } from '../services/storage.service.js';

const router = Router();

router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);

router.post('/', authenticateAdmin, uploadMemory.fields([
  { name: "modelFile", maxCount: 1 },
  { name: "imageFile", maxCount: 1 }
]), productController.createProduct);

router.delete('/:id', authenticateAdmin, productController.deleteProduct);

export default router;
