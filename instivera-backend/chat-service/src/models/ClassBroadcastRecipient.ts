import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface ClassBroadcastRecipientAttributes {
  id: number;
  conversation_id: number;
  student_id: number;
  is_delivered: boolean;
  delivered_at?: Date;
}

interface ClassBroadcastRecipientCreationAttributes extends Optional<ClassBroadcastRecipientAttributes, 'id'> {}

class ClassBroadcastRecipient extends Model<ClassBroadcastRecipientAttributes, ClassBroadcastRecipientCreationAttributes> implements ClassBroadcastRecipientAttributes {
  public id!: number;
  public conversation_id!: number;
  public student_id!: number;
  public is_delivered!: boolean;
  public delivered_at!: Date;

  // Virtual properties for student info (populated via joins)
  public student_name?: string;
  public student_email?: string;
  public student_roll_number?: string;
}
export function defineClassBroadcastRecipient(sequelize: Sequelize) {
  ClassBroadcastRecipient.init(
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
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Student ID from students table',
      },
      is_delivered: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: 'Whether message was delivered to this student',
      },
      delivered_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'class_broadcast_recipients',
      timestamps: false,
      indexes: [
        {
          name: 'unique_broadcast_recipient',
          unique: true,
          fields: ['conversation_id', 'student_id'],
        },
        {
          name: 'idx_conversation',
          fields: ['conversation_id'],
        },
        {
          name: 'idx_student',
          fields: ['student_id'],
        },
        {
          name: 'idx_delivered',
          fields: ['is_delivered'],
        },
      ],
    }
  );
  return ClassBroadcastRecipient;
}