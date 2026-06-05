import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface TeacherAssignmentAttributes {
  id: number;
  assignment_id?: string;
  title: string;
  description?: string;
  detailed_instructions?: string;
  type?: 'Assignment' | 'Homework';
  teacher_id: number;
  class_id: number;
  subject_id?: number;
  semester_id?: number;
  section_id?: number;
  program_id?: number;
  academic_year_id?: number;
  due_date?: Date;
  due_time?: string;
  maximum_marks?: number;
  allow_late_submissions?: number;
  file_url?: string;
  send_notification?: number;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface TeacherAssignmentCreationAttributes extends Optional<TeacherAssignmentAttributes, 'id'> {}

class TeacherAssignment extends Model<TeacherAssignmentAttributes, TeacherAssignmentCreationAttributes>
  implements TeacherAssignmentAttributes {
  public id!: number;
  public assignment_id?: string;
  public title!: string;
  public description?: string;
  public detailed_instructions?: string;
  public type?: 'Assignment' | 'Homework';
  public teacher_id!: number;
  public class_id!: number;
  public subject_id?: number;
  public semester_id?: number;
  public section_id?: number;
  public program_id?: number;
  public academic_year_id?: number;
  public due_date?: Date;
  public due_time?: string;
  public maximum_marks?: number;
  public allow_late_submissions?: number;
  public file_url?: string;
  public send_notification?: number;
  public is_active?: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineTeacherAssignment(sequelize: Sequelize) {
  TeacherAssignment.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      assignment_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      detailed_instructions: { type: DataTypes.TEXT, allowNull: true },
      type: { type: DataTypes.ENUM('Assignment', 'Homework'), allowNull: true },
      teacher_id: { type: DataTypes.BIGINT, allowNull: false },
      class_id: { type: DataTypes.BIGINT, allowNull: false },
      subject_id: { type: DataTypes.BIGINT, allowNull: true },
      semester_id: { type: DataTypes.BIGINT, allowNull: true },
      section_id: { type: DataTypes.BIGINT, allowNull: true },
      program_id: { type: DataTypes.BIGINT, allowNull: true },
      academic_year_id: { type: DataTypes.BIGINT, allowNull: true },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      due_time: { type: DataTypes.TIME, allowNull: true },
      maximum_marks: { type: DataTypes.INTEGER, defaultValue: 100 },
      allow_late_submissions: { type: DataTypes.TINYINT, defaultValue: 0 },
      file_url: { type: DataTypes.STRING(500), allowNull: true },
      send_notification: { type: DataTypes.TINYINT, defaultValue: 1 },
      is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    },
    {
      sequelize,
      tableName: 'teacher_assignments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return TeacherAssignment;
}
