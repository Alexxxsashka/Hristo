import { Router } from 'express';
import * as contactController from '../controllers/contact.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { contactSchema } from '../validation/contact.schema.js';

const router = Router();

router.post('/', validate(contactSchema), contactController.sendMessage);
router.get('/', authenticateAdmin, contactController.getMessages);
router.delete('/:id', authenticateAdmin, contactController.deleteMessage);

export default router;
