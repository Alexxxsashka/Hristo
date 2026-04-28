import { Router } from 'express';
import * as blogController from '../controllers/blog.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', blogController.getPosts);
router.get('/:slug', blogController.getPostBySlug);

router.post('/', authenticateAdmin, blogController.createPost);
router.put('/:id', authenticateAdmin, blogController.updatePost);
router.delete('/:id', authenticateAdmin, blogController.deletePost);

export default router;
