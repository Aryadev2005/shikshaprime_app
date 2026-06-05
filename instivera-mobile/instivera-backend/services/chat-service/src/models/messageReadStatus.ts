import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface MessageReadStatusAttributes {
  id: number;
  message_id: number;
  user_id: number;
  user_type: 'teacher' | 'student' | 'admin';
  read_at?: Date;
}

export interface MessageReadStatusCreationAttributes
  extends Optional<MessageReadStatusAttributes, 'id'> {}

export class MessageReadStatus
  extends Model<MessageReadStatusAttributes, MessageReadStatusCreationAttributes>
  implements MessageReadStatusAttributes {
  public id!: number;
  public message_id!: number;
  public user_id!: number;
  public user_type!: 'teacher' | 'student' | 'admin';
  public read_at?: Date;
}

export function defineMessageReadStatus(sequelize: Sequelize) {
  MessageReadStatus.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      message_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'messages', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_type: {
        type: DataTypes.ENUM('teacher', 'student', 'admin'),
        allowNull: false,
      },
      read_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: 'message_read_status',
      timestamps: false,
      indexes: [
        { name: 'unique_reader', unique: true, fields: ['message_id', 'user_id', 'user_type'] },
      ],
    }
  );
  return MessageReadStatus;
}
