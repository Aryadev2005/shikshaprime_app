import { Op } from 'sequelize';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

export interface FormattedMessage {
  id: number;
  message_id?: string;
  conversation_id: number;
  sender_id: number;
  sender_type: string;
  content: string;
  message_type?: string;
  file_url?: string;
  sent_at?: Date;
  read_by: { user_id: number; user_type: string; read_at: Date }[];
}

function formatMessage(msg: any): FormattedMessage {
  const raw = msg.toJSON ? msg.toJSON() : msg;
  return {
    id: raw.id,
    message_id: raw.message_id,
    conversation_id: raw.conversation_id,
    sender_id: raw.sender_id,
    sender_type: raw.sender_type,
    content: raw.content,
    message_type: raw.message_type,
    file_url: raw.file_url,
    sent_at: raw.sent_at,
    read_by: (raw.readStatuses || []).map((r: any) => ({
      user_id: r.user_id, user_type: r.user_type, read_at: r.read_at,
    })),
  };
}

export async function persistAndFormatMessage(
  conversationId: number,
  senderId: number,
  senderType: string,
  content: string,
  messageType: string = 'text',
  tenant: string,
): Promise<FormattedMessage> {
  const { Message, MessageReadStatus } = getTenantModels(tenant) as any;
  const msg = await Message.create({
    conversation_id: conversationId,
    sender_id: senderId,
    sender_type: senderType,
    content,
    message_type: messageType,
    sent_at: new Date(),
  } as any);

  // Mark as read by sender immediately
  await MessageReadStatus.create({ message_id: msg.id, user_id: senderId, user_type: senderType, read_at: new Date() } as any);

  const full = await Message.findByPk(msg.id, { include: [{ model: MessageReadStatus, as: 'readStatuses' }] });
  return formatMessage(full);
}

export class MessageService {
  static async getMessages(conversationId: number, userId: number, userType: string, tenant: string, cursor?: number) {
    const { Message, MessageReadStatus } = getTenantModels(tenant) as any;
    const where: Record<string, any> = { conversation_id: conversationId, is_deleted: 0 };
    if (cursor) where.id = { [Op.lt]: cursor };

    const messages = await Message.findAll({
      where,
      order: [['id', 'DESC']],
      limit: 30,
      include: [{ model: MessageReadStatus, as: 'readStatuses' }],
    });

    // Mark all as read by this user
    await Promise.all(
      messages
        .filter((m: any) => !(m.readStatuses || []).some((r: any) => r.user_id === userId && r.user_type === userType))
        .map((m: any) => MessageReadStatus.upsert({ message_id: m.id, user_id: userId, user_type: userType, read_at: new Date() })),
    );

    return messages.reverse().map(formatMessage);
  }

  static async sendMessage(conversationId: number, senderId: number, senderType: string, content: string, messageType: string, tenant: string) {
    return persistAndFormatMessage(conversationId, senderId, senderType, content, messageType, tenant);
  }

  static async markAsRead(conversationId: number, userId: number, userType: string, tenant: string) {
    const { Message, MessageReadStatus, ConversationParticipant } = getTenantModels(tenant) as any;
    const messages = await Message.findAll({ where: { conversation_id: conversationId, is_deleted: 0 }, attributes: ['id'] });

    await Promise.all(
      messages.map((m: any) =>
        MessageReadStatus.upsert({ message_id: m.id, user_id: userId, user_type: userType, read_at: new Date() }),
      ),
    );

    await ConversationParticipant.update(
      { last_read_at: new Date() },
      { where: { conversation_id: conversationId, user_id: userId, user_type: userType } },
    );

    return { marked: messages.length };
  }
}

export class ConversationService {
  static async getConversations(userId: number, userType: string, tenant: string) {
    const { Conversation, ConversationParticipant, Message } = getTenantModels(tenant) as any;
    const participations = await ConversationParticipant.findAll({
      where: { user_id: userId, user_type: userType, is_active: 1 },
      include: [{
        model: Conversation,
        as: 'conversation',
        include: [{
          model: Message, as: 'messages',
          order: [['id', 'DESC']],
          limit: 1,
          required: false,
        }],
      }],
      order: [[{ model: Conversation, as: 'conversation' }, 'updated_at', 'DESC']],
    });

    return participations.map((p: any) => ({
      ...p.conversation.toJSON(),
      last_message: p.conversation.messages?.[0] || null,
      last_read_at: p.last_read_at,
    }));
  }

  static async createDirectConversation(userId: number, userType: string, targetId: number, targetType: string, tenant: string) {
    const { Conversation, ConversationParticipant } = getTenantModels(tenant) as any;

    // Check if direct conversation already exists between these two users
    const existing = await ConversationParticipant.findOne({
      where: { user_id: userId, user_type: userType, is_active: 1 },
      include: [{
        model: Conversation, as: 'conversation',
        where: { type: 'direct', is_active: 1 },
        include: [{
          model: ConversationParticipant, as: 'participants',
          where: { user_id: targetId, user_type: targetType, is_active: 1 },
        }],
      }],
    });

    if (existing) return existing.conversation;

    const conversation = await Conversation.create({
      type: 'direct',
      created_by_user_id: userId,
      created_by_user_type: userType,
      is_active: 1,
    } as any);

    await ConversationParticipant.bulkCreate([
      { conversation_id: conversation.id, user_id: userId, user_type: userType },
      { conversation_id: conversation.id, user_id: targetId, user_type: targetType },
    ] as any);

    return conversation;
  }

  static async createGroupConversation(userId: number, userType: string, title: string, participants: { user_id: number; user_type: string }[], tenant: string) {
    const { Conversation, ConversationParticipant } = getTenantModels(tenant) as any;

    const conversation = await Conversation.create({
      title,
      type: 'group',
      created_by_user_id: userId,
      created_by_user_type: userType,
      is_active: 1,
    } as any);

    const allParticipants = [{ user_id: userId, user_type: userType }, ...participants];
    await ConversationParticipant.bulkCreate(
      allParticipants.map((p) => ({ conversation_id: conversation.id, ...p })),
    );

    return conversation;
  }
}
