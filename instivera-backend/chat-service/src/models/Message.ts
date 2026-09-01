import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { sequelize } from './index';

interface MessageAttributes {
  id: number;
  conversation_id: number;
  sender_user_id: number;
  sender_user_type: 'teacher' | 'student' | 'admin' | 'staff';
  message_text: string;
  message_type: 'text' | 'announcement' | 'important' | 'file';
  subject?: string;
  parent_message_id?: number;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_deleted: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public conversation_id!: number;
  public sender_user_id!: number;
  public sender_user_type!: 'teacher' | 'student' | 'admin' | 'staff';
  public message_text!: string;
  public message_type!: 'text' | 'announcement' | 'important' | 'file';
  public subject?: string;
  public parent_message_id?: number;
  public file_url?: string;
  public file_name?: string;
  public file_size?: number;
  public is_deleted!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual properties for sender info (populated via joins)
  public sender_name?: string;
  public sender_email?: string;
  public is_read?: boolean;
  public read_at?: Date;
}
export function defineMessage(sequelize: Sequelize) {
  Message.init(
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
      sender_user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Sender ID from college_users or students',
      },
      sender_user_type: {
        type: DataTypes.ENUM('teacher', 'student', 'admin', 'staff'),
        allowNull: false,
      },
      message_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      message_type: {
        type: DataTypes.ENUM('text', 'announcement', 'important', 'file'),
        defaultValue: 'text',
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Broadcast/Announcement subject text',
      },
      parent_message_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'For threaded replies',
        references: {
          model: 'messages',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      file_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'File attachment URL if any',
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Original filename',
      },
      file_size: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'File size in bytes',
      },
      is_deleted: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        comment: 'Soft delete flag',
      },
    },
    {
      sequelize,
      tableName: 'messages',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          name: 'idx_conversation',
          fields: ['conversation_id'],
        },
        {
          name: 'idx_sender',
          fields: ['sender_user_id', 'sender_user_type'],
        },
        {
          name: 'idx_created_at',
          fields: ['created_at'],
        },
        {
          name: 'idx_parent',
          fields: ['parent_message_id'],
        },
        {
          name: 'idx_deleted',
          fields: ['is_deleted'],
        },
        {
          name: 'idx_conversation_unread',
          fields: ['conversation_id', 'created_at', 'is_deleted'],
        },
        {
          name: 'idx_conversation_pagination',
          fields: ['conversation_id', 'is_deleted', 'created_at'],
        },
      ],
    }
  );
  return Message;
}