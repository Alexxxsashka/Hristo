import { Router } from 'express';
import * as contactController from '../controllers/contact.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { contactSchema } from '../validation/contact.schema.js';

const router = Router();

router.post('/', validate(contactSchema), contactController.sendMessage);
router.get('/admin', authenticateAdmin, contactController.getMessages);
router.delete('/admin/:id', authenticateAdmin, contactController.deleteMessage);

export default router;
