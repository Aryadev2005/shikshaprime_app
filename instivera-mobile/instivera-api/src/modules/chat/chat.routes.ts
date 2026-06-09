import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  getConversations, createDirectConversation, createGroupConversation,
  getMessages, sendMessage, markAsRead,
} from './chat.controller';

const router = Router();
router.use(tenantMiddleware, requireAuth);

router.get('/conversations', getConversations);
router.post('/conversations/direct', createDirectConversation);
router.post('/conversations/group', createGroupConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.put('/conversations/:id/read', markAsRead);

export default router;
