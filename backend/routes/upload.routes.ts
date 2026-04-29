import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// /api/admin/upload-handle
router.post('/upload-handle', authenticateAdmin, uploadController.handleVercelBlobUpload);

// /api/admin/upload (DELETE)
router.delete('/upload', authenticateAdmin, uploadController.deleteVercelBlob);

export default router;
