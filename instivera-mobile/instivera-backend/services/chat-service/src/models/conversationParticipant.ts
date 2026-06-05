import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ConversationParticipantAttributes {
  id: number;
  conversation_id: number;
  user_id: number;
  user_type: 'teacher' | 'student' | 'admin';
  joined_at?: Date;
  last_read_at?: Date;
  is_muted?: number;
  is_active?: number;
}

export interface ConversationParticipantCreationAttributes
  extends Optional<ConversationParticipantAttributes, 'id'> {}

export class ConversationParticipant
  extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes>
  implements ConversationParticipantAttributes {
  public id!: number;
  public conversation_id!: number;
  public user_id!: number;
  public user_type!: 'teacher' | 'student' | 'admin';
  public joined_at?: Date;
  public last_read_at?: Date;
  public is_muted?: number;
  public is_active?: number;
}

export function defineConversationParticipant(sequelize: Sequelize) {
  ConversationParticipant.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      conversation_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'conversations', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_type: {
        type: DataTypes.ENUM('teacher', 'student', 'admin'),
        allowNull: false,
      },
      joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      last_read_at: { type: DataTypes.DATE, allowNull: true },
      is_muted: { type: DataTypes.TINYINT, defaultValue: 0 },
      is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    },
    {
      sequelize,
      tableName: 'conversation_participants',
      timestamps: false,
      indexes: [
        { name: 'unique_participant', unique: true, fields: ['conversation_id', 'user_id', 'user_type'] },
      ],
    }
  );
  return ConversationParticipant;
}
