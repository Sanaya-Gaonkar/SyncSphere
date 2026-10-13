import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', AuthController.login);
router.post('/demo-login', AuthController.demoLogin);
router.get('/me', authenticateToken, AuthController.getCurrentUser);

export default router;
