import { DataTypes, Model, Optional, Sequelize } from 'sequelize';


// Define attributes interface
export interface TeacherAssignmentAttributes {
  id: number;
  teacher_id: number;
  program_id: number;
  class_id: number;
  semester_id: number;
  section_id?: number;
  academic_year_id: number;
  is_class_incharge?: number;
  is_active?: number;
  created_at?: Date;
  title?: string;
  description?: string;
  detailed_instructions?: string;
  type?: 'Assignment' | 'Homework';
  subject_id?: number;
  due_date?: Date;
  due_time?: string;
  maximum_marks?: number;
  allow_late_submissions?: number;
  send_notification?: number;
  updated_at?: Date;
}

// For creation, id is optional
export interface TeacherAssignmentCreationAttributes extends Optional<TeacherAssignmentAttributes, 'id'> {}

class TeacherAssignment extends Model<TeacherAssignmentAttributes, TeacherAssignmentCreationAttributes>
  implements TeacherAssignmentAttributes {
  public id!: number;
  public teacher_id!: number;
  public program_id!: number;
  public class_id!: number;
  public semester_id!: number;
  public section_id?: number;
  public academic_year_id!: number;
  public is_class_incharge?: number;
  public is_active?: number;
  public created_at?: Date;
  public title?: string;
  public description?: string;
  public detailed_instructions?: string;
  public type?: 'Assignment' | 'Homework';
  public subject_id?: number;
  public due_date?: Date;
  public due_time?: string;
  public maximum_marks?: number;
  public allow_late_submissions?: number;
  public send_notification?: number;
  public updated_at?: Date;
}
export function defineTeacherAssignment(sequelize: Sequelize) {
  TeacherAssignment.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      teacher_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      program_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      class_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      semester_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      section_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      academic_year_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },    
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      detailed_instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('Assignment', 'Homework'),
        allowNull: true,
      },
      subject_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      due_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      maximum_marks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      allow_late_submissions: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      send_notification: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'teacher_assignments',
      timestamps: false, // created_at and updated_at are managed manually
      underscored: true,
    }
  );
  return TeacherAssignment;
}