import { Request, Response } from 'express';
import { ConversationService } from '../services/conversation.service';
import { MessageService } from '../services/message.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';

const conversationService = new ConversationService();
const messageService = new MessageService();

/** Resolve numeric user ID + type from the JWT payload. */
function resolveUser(user: any): { userId: number; userType: string } | null {
  const userId = Number(user?.id || user?.user_id || user?.sub);
  const userType: string = user?.role || user?.user_type || user?.type || '';
  if (!userId || !userType) return null;
  return { userId, userType };
}

// GET /chat/conversations
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const resolved = resolveUser(req.user);
  if (!resolved) return sendError(res, 400, 'Could not resolve user identity from token');

  const conversations = await conversationService.getMyConversations(
    resolved.userId,
    resolved.userType,
    tenant
  );
  sendSuccess(res, conversations, 'Conversations retrieved successfully');
});

// POST /chat/conversations/direct
export const createDirectConversation = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const resolved = resolveUser(req.user);
  if (!resolved) return sendError(res, 400, 'Could not resolve user identity from token');

  const { targetUserId, targetUserType } = req.body;
  if (!targetUserId || !targetUserType) {
    return sendError(res, 400, 'targetUserId and targetUserType are required');
  }

  const result = await conversationService.getOrCreateDirectConversation(
    resolved.userId,
    resolved.userType,
    Number(targetUserId),
    targetUserType,
    tenant
  );
  sendSuccess(
    res,
    result.conversation,
    result.created ? 'Direct conversation created' : 'Existing conversation found'
  );
});

// POST /chat/conversations/group
export const createGroupConversation = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const resolved = resolveUser(req.user);
  if (!resolved) return sendError(res, 400, 'Could not resolve user identity from token');

  const { title, classId, participantIds } = req.body;
  if (!title) return sendError(res, 400, 'title is required');
  if (!participantIds || !Array.isArray(participantIds)) {
    return sendError(res, 400, 'participantIds must be an array of { userId, userType }');
  }

  const conversation = await conversationService.createGroupConversation(
    title,
    classId,
    resolved.userId,
    resolved.userType,
    participantIds,
    tenant
  );
  sendSuccess(res, conversation, 'Group conversation created');
});

// GET /chat/conversations/:id/messages
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const resolved = resolveUser(req.user);
  if (!resolved) return sendError(res, 400, 'Could not resolve user identity from token');

  const conversationId = Number(req.params.id);
  if (!conversationId) return sendError(res, 400, 'Invalid conversation id');

  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '30', 10);

  const result = await messageService.getMessages(
    conversationId,
    resolved.userId,
    resolved.userType,
    tenant,
    page,
    limit
  );
  sendSuccess(res, result, 'Messages retrieved successfully');
});

// POST /chat/conversations/:id/messages
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const resolved = resolveUser(req.user);
  if (!resolved) return sendError(res, 400, 'Could not resolve user identity from token');

  const conversationId = Number(req.params.id);
  if (!conversationId) return sendError(res, 400, 'Invalid conversation id');

  const { content, file_url } = req.body;
  if (!content && !file_url) return sendError(res, 400, 'content or file_url is required');

  const message = await messageService.sendMessage(
    conversationId,
    resolved.userId,
    resolved.userType,
    content || '',
    file_url,
    tenant
  );
  sendSuccess(res, message, 'Message sent successfully');
});

// PUT /chat/conversations/:id/read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const resolved = resolveUser(req.user);
  if (!resolved) return sendError(res, 400, 'Could not resolve user identity from token');

  const conversationId = Number(req.params.id);
  if (!conversationId) return sendError(res, 400, 'Invalid conversation id');

  await messageService.markAsRead(conversationId, resolved.userId, resolved.userType, tenant);
  sendSuccess(res, null, 'Marked as read');
});
