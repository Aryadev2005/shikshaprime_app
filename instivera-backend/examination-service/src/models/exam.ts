import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from 'sequelize';

export interface ExamAttributes {
  id: number;
  exam_name: string;
  program_id: number;
  subject_id: number;
  semester_id: number;
  department_id: number;
  academic_year_id: number;
  class_id: number;
  exam_type: 'INTERNAL' | 'MIDTERM' | 'FINAL';
  total_marks: number;
  duration_minutes: number;
  is_active: number | null;
  is_deleted: number | null;
  created_by: number;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  is_published: number | null;
  published_by?: number| null;
  published_at?: Date | string | null;
}

export interface ExamCreationAttributes
  extends Optional<
    ExamAttributes,
    'id' | 'is_active' | 'is_deleted' | 'created_at' | 'updated_at'
  > {}

export class Exam
  extends Model<ExamAttributes, ExamCreationAttributes>
  implements ExamAttributes
{
  public id!: number;
  public exam_name!: string;
  public program_id!: number;
  public subject_id!: number;
  public semester_id!: number;
  public department_id!: number;
  public academic_year_id!: number;
  public class_id!: number;
  public exam_type!: 'INTERNAL' | 'MIDTERM' | 'FINAL';
  public total_marks!: number;
  public duration_minutes!: number;
  public is_active!: number | null;
  public is_deleted!: number | null;
  public created_by!: number;
  public created_at!: Date | string | null;
  public updated_at!: Date | string | null;
  public is_published!: number | null;
  public published_by!: number | null;
  public published_at!: Date | string | null;
}

export function defineExam(sequelize: Sequelize) {
  Exam.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      exam_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      department_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      subject_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Reference to subject',
      },
      semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      exam_type: {
        type: DataTypes.ENUM('INTERNAL', 'MIDTERM', 'FINAL'),
        allowNull: false,
      },
      total_marks: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1,
      },
      is_deleted: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
      },
      is_published: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      published_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      published_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'exams',
      timestamps: false,
    }
  );

  return Exam;
}