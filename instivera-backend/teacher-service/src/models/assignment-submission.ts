import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Define attributes interface
export interface AssignmentSubmissionAttributes {
  id: number;
  teacher_assignment_id: number;
  student_id: number;
  submission_text?: string;
  file_url?: string;
  submitted_at?: Date;
  marks_obtained?: number;
  grade?: string;
  feedback?: string;
  is_late_submission?: number;
  status?: 'not_submitted' | 'submitted' | 'graded';
  graded_at?: Date;
  graded_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

// For creation, id is optional
export interface AssignmentSubmissionCreationAttributes extends Optional<AssignmentSubmissionAttributes, 'id'> {}

class AssignmentSubmission extends Model<AssignmentSubmissionAttributes, AssignmentSubmissionCreationAttributes>
  implements AssignmentSubmissionAttributes {
  public id!: number;
  public teacher_assignment_id!: number;
  public student_id!: number;
  public submission_text?: string;
  public file_url?: string;
  public submitted_at?: Date;
  public marks_obtained?: number;
  public grade?: string;
  public feedback?: string;
  public is_late_submission?: number;
  public status?: 'not_submitted' | 'submitted' | 'graded';
  public graded_at?: Date;
  public graded_by?: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineAssignmentSubmission(sequelize: Sequelize) {
  AssignmentSubmission.init(
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
      student_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      submission_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      file_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      marks_obtained: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      grade: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_late_submission: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('not_submitted', 'submitted', 'graded'),
        allowNull: true,
        defaultValue: 'not_submitted',
      },
      graded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      graded_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'student_assignment_submissions',
      timestamps: false, // created_at and updated_at are managed manually
      underscored: true,
    }
  );
  return AssignmentSubmission;
}