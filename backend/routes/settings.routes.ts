import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Primary routes: GET|PUT / — handles /api/site-settings (called directly by frontend)
router.get('/', settingsController.getSiteSettings);
router.put('/', authenticateAdmin, settingsController.updateSiteSettings);

// Sub-path aliases (for /api/settings/site compatibility)
router.get('/site', settingsController.getSiteSettings);
router.put('/site', authenticateAdmin, settingsController.updateSiteSettings);

router.get('/currency', settingsController.getCurrencyRates);
router.put('/currency', authenticateAdmin, settingsController.updateCurrencyRate);

export default router;
