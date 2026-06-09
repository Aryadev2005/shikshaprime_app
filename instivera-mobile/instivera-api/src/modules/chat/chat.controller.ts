import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/appError';
import { verifyToken } from '../../utils/jwt';
import { ConversationService, MessageService } from './message.service';

function resolveUser(req: Request): { userId: number; userType: string } {
  const payload = req.user!;
  return { userId: payload.user_id, userType: payload.role };
}

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType } = resolveUser(req);
  const result = await ConversationService.getConversations(userId, userType, req.tenant!);
  sendSuccess(res, result);
});

export const createDirectConversation = asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType } = resolveUser(req);
  const { target_user_id, target_user_type } = req.body;
  if (!target_user_id || !target_user_type) throw AppError.badRequest('target_user_id and target_user_type are required');
  const result = await ConversationService.createDirectConversation(userId, userType, Number(target_user_id), target_user_type, req.tenant!);
  sendSuccess(res, result, 'Conversation created', 201);
});

export const createGroupConversation = asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType } = resolveUser(req);
  const { title, participants } = req.body;
  if (!title || !participants?.length) throw AppError.badRequest('title and participants are required');
  const result = await ConversationService.createGroupConversation(userId, userType, title, participants, req.tenant!);
  sendSuccess(res, result, 'Group conversation created', 201);
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType } = resolveUser(req);
  const conversationId = Number(req.params.id);
  const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
  const result = await MessageService.getMessages(conversationId, userId, userType, req.tenant!, cursor);
  sendSuccess(res, result);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType } = resolveUser(req);
  const { content, message_type } = req.body;
  if (!content) throw AppError.badRequest('content is required');
  const result = await MessageService.sendMessage(Number(req.params.id), userId, userType, content, message_type || 'text', req.tenant!);
  sendSuccess(res, result, 'Message sent', 201);
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType } = resolveUser(req);
  const result = await MessageService.markAsRead(Number(req.params.id), userId, userType, req.tenant!);
  sendSuccess(res, result);
});
