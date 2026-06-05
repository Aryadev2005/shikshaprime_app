import { getTenantSequelize } from '../server';
import { defineConversation } from './conversation';
import { defineConversationParticipant } from './conversationParticipant';
import { defineMessage } from './message';
import { defineMessageReadStatus } from './messageReadStatus';

export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);

  const Conversation = defineConversation(sequelize);
  const ConversationParticipant = defineConversationParticipant(sequelize);
  const Message = defineMessage(sequelize);
  const MessageReadStatus = defineMessageReadStatus(sequelize);

  // Associations
  Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversation_id', as: 'participants' });
  ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

  Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
  Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

  Message.hasMany(MessageReadStatus, { foreignKey: 'message_id', as: 'readStatuses' });
  MessageReadStatus.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });

  return { Conversation, ConversationParticipant, Message, MessageReadStatus };
}
