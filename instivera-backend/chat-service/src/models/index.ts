import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";
import { defineChatSettings } from "./ChatSettings";
import { defineClassBroadcastRecipient } from "./ClassBroadcastRecipient";
import { defineConversation } from "./Conversation";
import { defineConversationParticipant } from "./ConversationParticipant";
import { defineMessage } from "./Message";
import { defineMessageReadStatus } from "./MessageReadStatus";

// Global (shared) Sequelize instance – for system tables, tenant registry, etc.
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: Number(config.db.port),
  dialect: "mysql",
});

// Test the global connection
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

// Define associations
// const setupAssociations = () => {
//   // Conversation associations
//   Conversation.hasMany(ConversationParticipant, {
//     foreignKey: 'conversation_id',
//     as: 'participants',
//   });
//   ConversationParticipant.belongsTo(Conversation, {
//     foreignKey: 'conversation_id',
//     as: 'conversation',
//   });

//   Conversation.hasMany(Message, {
//     foreignKey: 'conversation_id',
//     as: 'messages',
//   });
//   Message.belongsTo(Conversation, {
//     foreignKey: 'conversation_id',
//     as: 'conversation',
//   });

//   Conversation.hasMany(ClassBroadcastRecipient, {
//     foreignKey: 'conversation_id',
//     as: 'broadcast_recipients',
//   });
//   ClassBroadcastRecipient.belongsTo(Conversation, {
//     foreignKey: 'conversation_id',
//     as: 'conversation',
//   });

//   // Message associations
//   Message.hasMany(MessageReadStatus, {
//     foreignKey: 'message_id',
//     as: 'read_status',
//   });
//   MessageReadStatus.belongsTo(Message, {
//     foreignKey: 'message_id',
//     as: 'message',
//   });

//   // Self-referential association for message replies
//   Message.hasMany(Message, {
//     foreignKey: 'parent_message_id',
//     as: 'replies',
//   });
//   Message.belongsTo(Message, {
//     foreignKey: 'parent_message_id',
//     as: 'parent_message',
//   });
// };
// Tenant‑aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  const ChatSettings = defineChatSettings(sequelize);
  const ClassBroadcastRecipient = defineClassBroadcastRecipient(sequelize);
  const Conversation = defineConversation(sequelize);
  const ConversationParticipant = defineConversationParticipant(sequelize);
  const Message = defineMessage(sequelize);
  const MessageReadStatus = defineMessageReadStatus(sequelize);

  Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversation_id', as: 'participants' });
  ConversationParticipant.belongsTo(Conversation, {
     foreignKey: 'conversation_id',
     as: 'conversation',
  });
  Conversation.hasMany(Message, {
     foreignKey: 'conversation_id',
     as: 'messages',
  });
  Message.belongsTo(Conversation, {
     foreignKey: 'conversation_id',
     as: 'conversation',
  });

  Conversation.hasMany(ClassBroadcastRecipient, {
     foreignKey: 'conversation_id',
     as: 'broadcast_recipients',
  });
  ClassBroadcastRecipient.belongsTo(Conversation, {
     foreignKey: 'conversation_id',
     as: 'conversation',
  });

  Message.hasMany(MessageReadStatus, {
     foreignKey: 'message_id',
     as: 'read_status',
  });
  MessageReadStatus.belongsTo(Message, {
     foreignKey: 'message_id',
     as: 'message',
  });

  Message.hasMany(Message, {
     foreignKey: 'parent_message_id',
     as: 'replies',
  });
  Message.belongsTo(Message, {
    foreignKey: 'parent_message_id',
    as: 'parent_message',
  });
  return { ChatSettings, ClassBroadcastRecipient, Conversation, ConversationParticipant, Message, MessageReadStatus };
}