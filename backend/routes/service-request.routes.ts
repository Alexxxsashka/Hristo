import { Router } from 'express';
import * as serviceRequestController from '../controllers/service-request.controller.js';
import { authenticateToken, authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, serviceRequestController.getServiceRequests);
router.post('/', authenticateToken, serviceRequestController.createServiceRequest);
router.put('/:id', authenticateAdmin, serviceRequestController.updateServiceRequest);
router.delete('/:id', authenticateAdmin, serviceRequestController.deleteServiceRequest);

export default router;
