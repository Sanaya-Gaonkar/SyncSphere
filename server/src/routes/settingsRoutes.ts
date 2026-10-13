import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, SettingsController.getSettings);
router.put('/', authenticateToken, requireRole(['ADMIN']), SettingsController.updateSettings);
router.post('/test', authenticateToken, SettingsController.testConnection);

export default router;
