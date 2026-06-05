import { Op } from 'sequelize';
import { getTenantModels } from '../models';

export class ConversationService {
  /**
   * Return all conversations a user participates in, with last-message preview + unread count.
   */
  async getMyConversations(userId: number, userType: string, tenant: string) {
    const { Conversation, ConversationParticipant, Message } = getTenantModels(tenant);

    // Find all conversation IDs this user belongs to
    const participations: any[] = await (ConversationParticipant as any).findAll({
      where: { user_id: userId, user_type: userType, is_active: 1 },
      attributes: ['conversation_id', 'last_read_at', 'is_muted'],
    });

    if (!participations.length) return [];

    const convIds = participations.map((p: any) => p.conversation_id);
    const lastReadMap = new Map<number, Date | null>();
    for (const p of participations) {
      lastReadMap.set(p.conversation_id, p.last_read_at || null);
    }

    const conversations: any[] = await (Conversation as any).findAll({
      where: { id: { [Op.in]: convIds }, is_active: 1 },
      order: [['updated_at', 'DESC']],
    });

    const results = await Promise.all(
      conversations.map(async (conv: any) => {
        // Last message
        const lastMsg: any = await (Message as any).findOne({
          where: { conversation_id: conv.id, is_deleted: 0 },
          order: [['created_at', 'DESC']],
          attributes: ['id', 'message_text', 'sender_user_id', 'sender_user_type', 'created_at', 'message_type'],
        });

        // Unread count: messages newer than last_read_at not sent by this user
        const lastRead = lastReadMap.get(conv.id);
        const unreadWhere: any = {
          conversation_id: conv.id,
          is_deleted: 0,
          // Don't count own messages as unread
          [Op.not]: [{ sender_user_id: userId, sender_user_type: userType }],
        };
        if (lastRead) {
          unreadWhere.created_at = { [Op.gt]: lastRead };
        }
        const unreadCount: number = await (Message as any).count({ where: unreadWhere });

        // Participant count
        const participantCount: number = await (ConversationParticipant as any).count({
          where: { conversation_id: conv.id, is_active: 1 },
        });

        return {
          id: conv.id,
          conversation_id: conv.conversation_id || String(conv.id),
          title: conv.title || conv.subject || null,
          type: conv.type,
          class_id: conv.class_id || null,
          created_by: { id: conv.created_by_user_id, type: conv.created_by_user_type },
          participant_count: participantCount,
          last_message: lastMsg
            ? {
                id: lastMsg.id,
                content: lastMsg.message_text,
                sender_id: lastMsg.sender_user_id,
                sender_type: lastMsg.sender_user_type,
                message_type: lastMsg.message_type,
                sent_at: lastMsg.created_at,
              }
            : null,
          unread_count: unreadCount,
          is_muted: Boolean(participations.find((p: any) => p.conversation_id === conv.id)?.is_muted),
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        };
      })
    );

    return results;
  }

  /**
   * Find or create a DIRECT conversation between two users.
   */
  async getOrCreateDirectConversation(
    userAId: number,
    userAType: string,
    userBId: number,
    userBType: string,
    tenant: string
  ) {
    const { Conversation, ConversationParticipant } = getTenantModels(tenant);

    // Find conversations where BOTH participants appear
    const participantsA: any[] = await (ConversationParticipant as any).findAll({
      where: { user_id: userAId, user_type: userAType, is_active: 1 },
      attributes: ['conversation_id'],
      raw: true,
    });

    if (participantsA.length) {
      const convIdsA = participantsA.map((p: any) => p.conversation_id);
      const matchingB: any = await (ConversationParticipant as any).findOne({
        where: {
          conversation_id: { [Op.in]: convIdsA },
          user_id: userBId,
          user_type: userBType,
          is_active: 1,
        },
        raw: true,
      });

      if (matchingB) {
        // Verify it's a direct conversation
        const existing: any = await (Conversation as any).findOne({
          where: { id: matchingB.conversation_id, type: 'direct', is_active: 1 },
        });
        if (existing) {
          return { conversation: this.formatConversation(existing), created: false };
        }
      }
    }

    // Create new direct conversation
    const conv: any = await (Conversation as any).create({
      type: 'direct',
      created_by_user_id: userAId,
      created_by_user_type: userAType,
      is_active: 1,
    });

    await (ConversationParticipant as any).bulkCreate([
      { conversation_id: conv.id, user_id: userAId, user_type: userAType },
      { conversation_id: conv.id, user_id: userBId, user_type: userBType },
    ]);

    return { conversation: this.formatConversation(conv), created: true };
  }

  /**
   * Create a GROUP or class-broadcast conversation.
   */
  async createGroupConversation(
    title: string,
    classId: string | undefined,
    creatorId: number,
    creatorType: string,
    participantIds: Array<{ userId: number; userType: string }>,
    tenant: string
  ) {
    const { Conversation, ConversationParticipant } = getTenantModels(tenant);

    const conv: any = await (Conversation as any).create({
      type: classId ? 'class_broadcast' : 'group',
      class_id: classId || null,
      created_by_user_id: creatorId,
      created_by_user_type: creatorType,
      is_active: 1,
      // title is stored as 'subject' in DB
    });

    // Update subject separately using raw update to avoid field alias issues
    if (title) {
      await (Conversation as any).update({ title }, { where: { id: conv.id } });
    }

    // Add creator + all participants
    const allParticipants = [
      { conversation_id: conv.id, user_id: creatorId, user_type: creatorType },
      ...participantIds.map((p) => ({
        conversation_id: conv.id,
        user_id: p.userId,
        user_type: p.userType,
      })),
    ];

    // De-duplicate (creator might be in participantIds too)
    const seen = new Set<string>();
    const unique = allParticipants.filter((p) => {
      const key = `${p.user_id}-${p.user_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    await (ConversationParticipant as any).bulkCreate(unique, {
      ignoreDuplicates: true,
    });

    return this.formatConversation(conv);
  }

  private formatConversation(conv: any) {
    return {
      id: conv.id,
      conversation_id: conv.conversation_id || String(conv.id),
      title: conv.title || conv.subject || null,
      type: conv.type,
      class_id: conv.class_id || null,
      created_by: { id: conv.created_by_user_id, type: conv.created_by_user_type },
      created_at: conv.created_at,
    };
  }
}

export default new ConversationService();
