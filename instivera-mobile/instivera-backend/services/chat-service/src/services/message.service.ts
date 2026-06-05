import { Op } from 'sequelize';
import { getTenantModels } from '../models';

/** Used by both REST and Socket.io paths — returns the formatted message object. */
export async function persistAndFormatMessage(payload: {
  conversationId: number;
  senderId: number;
  senderType: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  messageType?: string;
  tenant: string;
}) {
  const { Message } = getTenantModels(payload.tenant);

  const msg: any = await (Message as any).create({
    conversation_id: payload.conversationId,
    sender_id: payload.senderId,
    sender_type: payload.senderType,
    content: payload.content,
    message_type: (payload.messageType as any) || 'text',
    file_url: payload.fileUrl || null,
    file_name: payload.fileName || null,
    is_deleted: 0,
  });

  return formatMessage(msg);
}

export class MessageService {
  /**
   * Return paginated messages for a conversation, newest first.
   * Also marks all messages as read for this user.
   */
  async getMessages(
    conversationId: number,
    userId: number,
    userType: string,
    tenant: string,
    page = 1,
    limit = 30
  ) {
    const { Message, ConversationParticipant } = getTenantModels(tenant);

    // Verify user is a participant
    const participant: any = await (ConversationParticipant as any).findOne({
      where: { conversation_id: conversationId, user_id: userId, user_type: userType, is_active: 1 },
    });
    if (!participant) {
      const err: any = new Error('Not a participant in this conversation');
      err.status = 403;
      throw err;
    }

    const offset = (page - 1) * limit;

    const { rows, count }: { rows: any[]; count: number } = await (Message as any).findAndCountAll({
      where: { conversation_id: conversationId, is_deleted: 0 },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Mark as read: update last_read_at on the participant row
    await participant.update({ last_read_at: new Date() });

    // Also upsert MessageReadStatus for each unread message
    await this.markAsRead(conversationId, userId, userType, tenant);

    return {
      messages: rows.map(formatMessage).reverse(), // return oldest-first within the page
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Create and persist a message (REST fallback path).
   * Socket.io path calls persistAndFormatMessage directly.
   */
  async sendMessage(
    conversationId: number,
    senderId: number,
    senderType: string,
    content: string,
    fileUrl: string | undefined,
    tenant: string
  ) {
    const { ConversationParticipant } = getTenantModels(tenant);

    // Verify sender is a participant
    const participant: any = await (ConversationParticipant as any).findOne({
      where: { conversation_id: conversationId, user_id: senderId, user_type: senderType, is_active: 1 },
    });
    if (!participant) {
      const err: any = new Error('Not a participant in this conversation');
      err.status = 403;
      throw err;
    }

    return persistAndFormatMessage({
      conversationId,
      senderId,
      senderType,
      content,
      fileUrl,
      tenant,
    });
  }

  /**
   * Upsert MessageReadStatus for all unread messages in a conversation for this user.
   */
  async markAsRead(
    conversationId: number,
    userId: number,
    userType: string,
    tenant: string
  ) {
    const { Message, MessageReadStatus, ConversationParticipant } = getTenantModels(tenant);

    // Update participant last_read_at
    await (ConversationParticipant as any).update(
      { last_read_at: new Date() },
      { where: { conversation_id: conversationId, user_id: userId, user_type: userType } }
    );

    // Find all unread messages not sent by this user
    const unread: any[] = await (Message as any).findAll({
      where: {
        conversation_id: conversationId,
        is_deleted: 0,
        [Op.not]: [{ sender_user_id: userId, sender_user_type: userType }],
      },
      attributes: ['id'],
      raw: true,
    });

    if (!unread.length) return;

    const alreadyRead: any[] = await (MessageReadStatus as any).findAll({
      where: { user_id: userId, user_type: userType, message_id: { [Op.in]: unread.map((m: any) => m.id) } },
      attributes: ['message_id'],
      raw: true,
    });

    const readSet = new Set(alreadyRead.map((r: any) => r.message_id));
    const toInsert = unread
      .filter((m: any) => !readSet.has(m.id))
      .map((m: any) => ({
        message_id: m.id,
        user_id: userId,
        user_type: userType,
        read_at: new Date(),
      }));

    if (toInsert.length) {
      await (MessageReadStatus as any).bulkCreate(toInsert, { ignoreDuplicates: true });
    }
  }
}

export default new MessageService();

// ── Internal formatter ──────────────────────────────────────────────────────

function formatMessage(msg: any) {
  return {
    id: msg.id,
    message_id: msg.message_id || String(msg.id),
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id ?? msg.sender_user_id,
    sender_type: msg.sender_type ?? msg.sender_user_type,
    content: msg.content ?? msg.message_text,
    message_type: msg.message_type || 'text',
    file_url: msg.file_url || null,
    file_name: msg.file_name || null,
    is_deleted: Boolean(msg.is_deleted),
    sent_at: msg.sent_at ?? msg.created_at,
  };
}
