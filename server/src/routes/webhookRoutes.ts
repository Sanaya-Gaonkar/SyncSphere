import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public webhook receiver from WooCommerce
router.post('/woocommerce', WebhookController.handleWebhook);

// Protected endpoints for dashboard event viewer & simulator
router.get('/events', authenticateToken, WebhookController.listEvents);
router.post('/simulate', authenticateToken, WebhookController.simulateEvent);

export default router;
