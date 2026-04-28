import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/site', settingsController.getSiteSettings);
router.put('/site', authenticateAdmin, settingsController.updateSiteSettings);

router.get('/currency', settingsController.getCurrencyRates);
router.put('/currency', authenticateAdmin, settingsController.updateCurrencyRate);

export default router;
