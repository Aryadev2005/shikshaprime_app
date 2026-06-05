import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface TeacherClassAttributes {
  id: number;
  teacher_id: number;
  program_id: number;
  academic_year_id: number;
  class_id: number;
  subject_id: number;
  assigned_date?: Date;
  is_active?: number;
}

export interface TeacherClassCreationAttributes extends Optional<TeacherClassAttributes, 'id'> {}

class TeacherClass extends Model<TeacherClassAttributes, TeacherClassCreationAttributes> implements TeacherClassAttributes {
  public id!: number;
  public teacher_id!: number;
  public program_id!: number;
  public academic_year_id!: number;
  public class_id!: number;
  public subject_id!: number;
  public assigned_date?: Date;
  public is_active?: number;
}

export function defineTeacherClass(sequelize: Sequelize) {
  TeacherClass.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      teacher_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      program_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      academic_year_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      class_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      subject_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      assigned_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      is_active: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      tableName: 'teacher_class_subjects',
      timestamps: false,
    }
  );
  return TeacherClass;
}
