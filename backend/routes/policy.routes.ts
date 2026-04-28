import { Router } from 'express';
import * as policyController from '../controllers/policy.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', policyController.getPolicies);
router.get('/:id', policyController.getPolicyById);

router.post('/', authenticateAdmin, policyController.createPolicy);
router.put('/:id', authenticateAdmin, policyController.updatePolicy);
router.delete('/:id', authenticateAdmin, policyController.deletePolicy);

export default router;
