import { Router } from 'express';
import * as noticeController from '../controllers/notice.controller';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

router.get('/', requireAuth, noticeController.getNotices);
router.get('/:id', requireAuth, noticeController.getNoticeById);

export default router;
