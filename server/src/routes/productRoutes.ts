import { Router } from 'express';
import { ProductController } from '../controllers/productController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticateToken, ProductController.getStats);
router.get('/', authenticateToken, ProductController.listProducts);
router.get('/:id', authenticateToken, ProductController.getProduct);

router.post('/', authenticateToken, requireRole(['ADMIN', 'EDITOR']), ProductController.createProduct);
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'EDITOR']), ProductController.updateProduct);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), ProductController.deleteProduct);
router.post('/:id/duplicate', authenticateToken, requireRole(['ADMIN', 'EDITOR']), ProductController.duplicateProduct);

export default router;
