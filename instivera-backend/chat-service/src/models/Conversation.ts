import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface ConversationAttributes {
  id: number;
  type: 'direct' | 'broadcast' | 'group';
  subject?: string;
  class_id?: string;
  program_id?: string;
  department_id?: string;
  academic_year_id?: string;
  created_by_user_id: number;
  created_by_user_type: 'teacher' | 'student' | 'admin' | 'staff';
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: number;
  public type!: 'direct' | 'broadcast' | 'group';
  public subject?: string;
  public class_id?: string;
  public program_id?: string;
  public department_id?: string;
  public academic_year_id?: string;
  public created_by_user_id!: number;
  public created_by_user_type!: 'teacher' | 'student' | 'admin' | 'staff';
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public participants?: any[];
  public messages?: any[];
}
export function defineConversation(sequelize: Sequelize) {
  Conversation.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM('direct', 'broadcast', 'group'),
        allowNull: false,
        defaultValue: 'direct',
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Subject for class broadcasts',
      },
      class_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Class ID for class broadcasts',
      },
      program_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Program ID for class broadcasts',
      },
      department_id: {
        type: DataTypes.STRING(50), 
        allowNull: true,
        comment: 'Department ID for class broadcasts',
      },
      academic_year_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Academic Year ID for class broadcasts',
      },
      created_by_user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Creator user ID from users',
      },
      created_by_user_type: {
        type: DataTypes.ENUM('teacher', 'student', 'admin', 'staff'),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      tableName: 'conversations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          name: 'idx_created_by',
          fields: ['created_by_user_id', 'created_by_user_type'],
        },
        {
          name: 'idx_type',
          fields: ['type'],
        },
        {
          name: 'idx_class_id',
          fields: ['class_id'],
        },
        {
          name: 'idx_active',
          fields: ['is_active'],
        },
      ],
    }
  );
  return Conversation;
}