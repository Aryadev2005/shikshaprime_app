import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface ConversationParticipantAttributes {
  id: number;
  conversation_id: number;
  user_id: number;
  user_type: 'teacher' | 'student' | 'admin' | 'staff';
  joined_at?: Date;
  last_read_at?: Date;
  is_muted: boolean;
  is_active: boolean;
}

interface ConversationParticipantCreationAttributes extends Optional<ConversationParticipantAttributes, 'id'> {}

class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes> implements ConversationParticipantAttributes {
  public id!: number;
  public conversation_id!: number;
  public user_id!: number;
  public user_type!: 'teacher' | 'student' | 'admin' | 'staff';
  public joined_at!: Date;
  public last_read_at?: Date;
  public is_muted!: boolean;
  public is_active!: boolean;

  // Virtual properties for user info (populated via joins)
  public user_name?: string;
  public user_email?: string;
}
export function defineConversationParticipant(sequelize: Sequelize) {
  ConversationParticipant.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      conversation_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'User ID from users or students table',
      },
      user_type: {
        type: DataTypes.ENUM('teacher', 'student', 'admin', 'staff'),
        allowNull: false,
      },
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      last_read_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last time user read messages in this conversation',
      },
      is_muted: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        comment: 'Whether user has muted this conversation',
      },
      is_active: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: 'Whether user is still part of conversation',
      },
    },
    {
      sequelize,
      tableName: 'conversation_participants',
      timestamps: false,
      indexes: [
        {
          name: 'unique_participant',
          unique: true,
          fields: ['conversation_id', 'user_id', 'user_type'],
        },
        {
          name: 'idx_user',
          fields: ['user_id', 'user_type'],
        },
        {
          name: 'idx_conversation',
          fields: ['conversation_id'],
        },
        {
          name: 'idx_last_read',
          fields: ['last_read_at'],
        },
        {
          name: 'idx_user_conversations',
          fields: ['user_id', 'user_type', 'is_active', 'joined_at'],
        },
      ],
    }
  );
  return ConversationParticipant;
}