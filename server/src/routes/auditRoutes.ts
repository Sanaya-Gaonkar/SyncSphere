import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, requireRole(['ADMIN']), AuditController.listLogs);

export default router;
