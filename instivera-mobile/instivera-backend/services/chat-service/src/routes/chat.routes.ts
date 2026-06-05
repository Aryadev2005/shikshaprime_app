import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

// Conversation management
router.get('/conversations', requireAuth, chatController.getConversations);
router.post('/conversations/direct', requireAuth, chatController.createDirectConversation);
router.post('/conversations/group', requireAuth, chatController.createGroupConversation);

// Messages — /messages routes nested under conversation id
router.get('/conversations/:id/messages', requireAuth, chatController.getMessages);
router.post('/conversations/:id/messages', requireAuth, chatController.sendMessage);
router.put('/conversations/:id/read', requireAuth, chatController.markAsRead);

export default router;
