import { Router } from 'express';
import multer from 'multer';
import { CSVController } from '../controllers/csvController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.post('/preview', authenticateToken, upload.single('file'), CSVController.preview);
router.post('/import', authenticateToken, requireRole(['ADMIN', 'EDITOR']), CSVController.import);
router.get('/export', authenticateToken, CSVController.export);
router.get('/template', authenticateToken, CSVController.downloadTemplate);

export default router;
