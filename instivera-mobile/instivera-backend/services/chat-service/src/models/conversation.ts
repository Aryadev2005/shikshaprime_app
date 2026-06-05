import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { randomUUID } from 'crypto';

export type ConversationType = 'direct' | 'class_broadcast' | 'group';

export interface ConversationAttributes {
  id: number;
  conversation_id?: string;            // UUID surrogate key for API exposure
  title?: string;                       // null for direct (1-on-1) chats
  type: ConversationType;
  class_id?: string;
  program_id?: string;
  department_id?: string;
  academic_year_id?: string;
  created_by_user_id: number;
  created_by_user_type: 'teacher' | 'student' | 'admin';
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id'> {}

export class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes {
  public id!: number;
  public conversation_id?: string;
  public title?: string;
  public type!: ConversationType;
  public class_id?: string;
  public program_id?: string;
  public department_id?: string;
  public academic_year_id?: string;
  public created_by_user_id!: number;
  public created_by_user_type!: 'teacher' | 'student' | 'admin';
  public is_active?: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineConversation(sequelize: Sequelize) {
  Conversation.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      conversation_id: {
        type: DataTypes.STRING(36),
        allowNull: true,
        unique: true,
        defaultValue: () => randomUUID(),
      },
      // 'title' is stored in the 'subject' column of the existing DB table
      title: { type: DataTypes.STRING(255), allowNull: true, field: 'subject' },
      type: {
        type: DataTypes.ENUM('direct', 'class_broadcast', 'group'),
        allowNull: false,
        defaultValue: 'direct',
      },
      class_id: { type: DataTypes.STRING(50), allowNull: true },
      program_id: { type: DataTypes.STRING(50), allowNull: true },
      department_id: { type: DataTypes.STRING(50), allowNull: true },
      academic_year_id: { type: DataTypes.STRING(50), allowNull: true },
      created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      created_by_user_type: {
        type: DataTypes.ENUM('teacher', 'student', 'admin'),
        allowNull: false,
      },
      is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    },
    {
      sequelize,
      tableName: 'conversations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return Conversation;
}
