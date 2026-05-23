import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Define attributes interface
export interface AssignmentAttachmentAttributes {
  id: number;
  teacher_assignment_id: number;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_at?: Date;
}

// For creation, id is optional
export interface AssignmentAttachmentCreationAttributes extends Optional<AssignmentAttachmentAttributes, 'id'> {}

class AssignmentAttachment extends Model<AssignmentAttachmentAttributes, AssignmentAttachmentCreationAttributes>
  implements AssignmentAttachmentAttributes {
  public id!: number;
  public teacher_assignment_id!: number;
  public file_name!: string;
  public file_url!: string;
  public file_size?: number;
  public file_type?: string;
  public uploaded_at?: Date;
}

export function defineAssignmentAttachment(sequelize: Sequelize) {
  AssignmentAttachment.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      teacher_assignment_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      file_size: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      file_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      uploaded_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'teacher_assignment_attachments',
      timestamps: false, 
      underscored: true,
    }
  );
  return AssignmentAttachment;
}