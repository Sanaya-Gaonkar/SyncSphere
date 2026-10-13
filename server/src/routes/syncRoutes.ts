import { Router } from 'express';
import { SyncController } from '../controllers/syncController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/jobs', authenticateToken, SyncController.listJobs);
router.get('/jobs/:id', authenticateToken, SyncController.getJob);
router.post('/jobs/:id/retry', authenticateToken, requireRole(['ADMIN', 'EDITOR']), SyncController.retryJob);

router.post('/push/:id', authenticateToken, requireRole(['ADMIN', 'EDITOR']), SyncController.pushProduct);
router.post('/bulk', authenticateToken, requireRole(['ADMIN', 'EDITOR']), SyncController.pushBulk);
router.post('/import', authenticateToken, requireRole(['ADMIN', 'EDITOR']), SyncController.pullProducts);

router.get('/conflicts', authenticateToken, SyncController.listConflicts);
router.post('/conflicts/:id/resolve', authenticateToken, requireRole(['ADMIN', 'EDITOR']), SyncController.resolveConflict);

export default router;
