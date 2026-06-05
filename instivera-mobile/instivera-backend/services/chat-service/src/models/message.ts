import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { randomUUID } from 'crypto';

export type MessageType = 'text' | 'announcement' | 'important' | 'file' | 'image';

export interface MessageAttributes {
  id: number;
  message_id?: string;                  // UUID surrogate key for API exposure
  conversation_id: number;
  // DB columns are sender_user_id / sender_user_type — aliased via field mapping
  sender_id: number;
  sender_type: 'teacher' | 'student' | 'admin';
  content: string;                      // DB column: message_text
  message_type?: MessageType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  parent_message_id?: number;
  is_deleted?: number;
  sent_at?: Date;                       // DB column: created_at
  updated_at?: Date;
}

export interface MessageCreationAttributes extends Optional<MessageAttributes, 'id'> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes {
  public id!: number;
  public message_id?: string;
  public conversation_id!: number;
  public sender_id!: number;
  public sender_type!: 'teacher' | 'student' | 'admin';
  public content!: string;
  public message_type?: MessageType;
  public file_url?: string;
  public file_name?: string;
  public file_size?: number;
  public parent_message_id?: number;
  public is_deleted?: number;
  public sent_at?: Date;
  public updated_at?: Date;
}

export function defineMessage(sequelize: Sequelize) {
  Message.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      message_id: {
        type: DataTypes.STRING(36),
        allowNull: true,
        unique: true,
        defaultValue: () => randomUUID(),
      },
      conversation_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'conversations', key: 'id' },
        onDelete: 'CASCADE',
      },
      sender_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        field: 'sender_user_id',        // actual DB column name
      },
      sender_type: {
        type: DataTypes.ENUM('teacher', 'student', 'admin'),
        allowNull: false,
        field: 'sender_user_type',      // actual DB column name
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'message_text',          // actual DB column name
      },
      message_type: {
        type: DataTypes.ENUM('text', 'announcement', 'important', 'file', 'image'),
        defaultValue: 'text',
      },
      file_url: { type: DataTypes.STRING(500), allowNull: true },
      file_name: { type: DataTypes.STRING(255), allowNull: true },
      file_size: { type: DataTypes.BIGINT, allowNull: true },
      parent_message_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'messages', key: 'id' },
        onDelete: 'SET NULL',
      },
      is_deleted: { type: DataTypes.TINYINT, defaultValue: 0 },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'created_at',            // actual DB column name
      },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: 'messages',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return Message;
}
