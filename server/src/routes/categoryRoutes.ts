import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, CategoryController.listCategories);
router.post('/', authenticateToken, requireRole(['ADMIN', 'EDITOR']), CategoryController.createCategory);
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'EDITOR']), CategoryController.updateCategory);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), CategoryController.deleteCategory);

export default router;
