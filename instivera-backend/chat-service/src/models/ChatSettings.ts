import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface ChatSettingsAttributes {
  id: number;
  user_id: number;
  user_type: 'teacher' | 'student' | 'admin' | 'staff';
  email_notifications: boolean;
  sound_notifications: boolean;
  desktop_notifications: boolean;
  online_status: 'online' | 'away' | 'busy' | 'offline';
  last_seen?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface ChatSettingsCreationAttributes extends Optional<ChatSettingsAttributes, 'id'> {}

class ChatSettings extends Model<ChatSettingsAttributes, ChatSettingsCreationAttributes> implements ChatSettingsAttributes {
  public id!: number;
  public user_id!: number;
  public user_type!: 'teacher' | 'student' | 'admin' | 'staff';
  public email_notifications!: boolean;
  public sound_notifications!: boolean;
  public desktop_notifications!: boolean;
  public online_status!: 'online' | 'away' | 'busy' | 'offline';
  public last_seen?: Date;
  public created_at!: Date;
  public updated_at!: Date;
}
export function defineChatSettings(sequelize: Sequelize) {
  ChatSettings.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      user_type: {
        type: DataTypes.ENUM('teacher', 'student', 'admin', 'staff'),
        allowNull: false,
      },
      email_notifications: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: 'Send email notifications for new messages',
      },
      sound_notifications: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: 'Play sound for new messages',
      },
      desktop_notifications: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: 'Show desktop notifications',
      },
      online_status: {
        type: DataTypes.ENUM('online', 'away', 'busy', 'offline'),
        defaultValue: 'online',
      },
      last_seen: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last activity timestamp',
      },
    },
    {
      sequelize,
      tableName: 'chat_settings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          name: 'unique_user_settings',
          unique: true,
          fields: ['user_id', 'user_type'],
        },
        {
          name: 'idx_user',
          fields: ['user_id', 'user_type'],
        },
        {
          name: 'idx_online_status',
          fields: ['online_status'],
        },
        {
          name: 'idx_last_seen',
          fields: ['last_seen'],
        },
      ],
    }
  );
  return ChatSettings;
}