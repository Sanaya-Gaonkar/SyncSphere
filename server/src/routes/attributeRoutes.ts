import { Router } from 'express';
import { AttributeController } from '../controllers/attributeController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, AttributeController.listAttributes);
router.post('/', authenticateToken, requireRole(['ADMIN', 'EDITOR']), AttributeController.createAttribute);
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'EDITOR']), AttributeController.updateAttribute);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), AttributeController.deleteAttribute);

export default router;
