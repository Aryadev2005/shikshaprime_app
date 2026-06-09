import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { getCategories, getFilesByCategory, getFileById, downloadFile } from './repository.controller';

const router = Router();
router.use(tenantMiddleware, requireAuth);

router.get('/categories', getCategories);
router.get('/categories/:categoryId/files', getFilesByCategory);
router.get('/files/:fileId', getFileById);
router.get('/files/:fileId/download', downloadFile);

export default router;
