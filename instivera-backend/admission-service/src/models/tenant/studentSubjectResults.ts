import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentSubjectResultAttributes {
  id: number;
  student_id: number;
  subject_id: number;
  semester_id: number;
  program_id: number;
  academic_year_id: number;
  internal_marks?: number | null;
  external_marks?: number | null;
  practical_marks?: number | null;
  viva_marks?: number | null;
  attendance_marks?: number | null;
  total_marks?: number | null;
  percentage?: number | null;
  grade?: string | null;
  grade_point?: number | null;
  credit_value?: number | null;
  credit_earned?: number | null;
  result_status?: "PASS" | "FAIL" | "ABSENT" | "DET" | "DROPPED" | null;
  attempt_no?: number | null;
  exam_type?: "REGULAR" | "BACKLOG" | "SUPPLEMENTARY" | "SPECIAL" | null;
  is_finalized?: boolean | null;
  remarks?: string | null;
}

export interface StudentSubjectResultCreationAttributes
  extends Optional<
    StudentSubjectResultAttributes,
    | "id"
    | "internal_marks"
    | "external_marks"
    | "practical_marks"
    | "viva_marks"
    | "attendance_marks"
    | "total_marks"
    | "percentage"
    | "grade"
    | "grade_point"
    | "credit_value"
    | "credit_earned"
    | "result_status"
    | "attempt_no"
    | "exam_type"
    | "is_finalized"
    | "remarks"
  > {}

export class StudentSubjectResults
  extends Model<StudentSubjectResultAttributes, StudentSubjectResultCreationAttributes>
  implements StudentSubjectResultAttributes
{
  public id!: number;
  public student_id!: number;
  public subject_id!: number;
  public semester_id!: number;
  public program_id!: number;
  public academic_year_id!: number;
  public internal_marks!: number | null;
  public external_marks!: number | null;
  public practical_marks!: number | null;
  public viva_marks!: number | null;
  public attendance_marks!: number | null;
  public total_marks!: number | null;
  public percentage!: number | null;
  public grade!: string | null;
  public grade_point!: number | null;
  public credit_value!: number | null;
  public credit_earned!: number | null;
  public result_status!: "PASS" | "FAIL" | "ABSENT" | "DET" | "DROPPED" | null;
  public attempt_no!: number | null;
  public exam_type!: "REGULAR" | "BACKLOG" | "SUPPLEMENTARY" | "SPECIAL" | null;
  public is_finalized!: boolean | null;
  public remarks!: string | null;
}

export function defineStudentSubjectResults(sequelize: Sequelize) {
  StudentSubjectResults.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      subject_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      internal_marks: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      external_marks: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      practical_marks: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      viva_marks: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      attendance_marks: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      total_marks: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      grade: {
        type: DataTypes.STRING(5),
        allowNull: true
      },
      grade_point: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true
      },
      credit_value: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true
      },
      credit_earned: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true
      },
      result_status: {
        type: DataTypes.ENUM("PASS", "FAIL", "ABSENT", "DET", "DROPPED"),
        allowNull: true,
        defaultValue: "FAIL"
      },
      attempt_no: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
      },
      exam_type: {
        type: DataTypes.ENUM("REGULAR", "BACKLOG", "SUPPLEMENTARY", "SPECIAL"),
        allowNull: true,
        defaultValue: "REGULAR"
      },
      is_finalized: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: true,
        defaultValue: 0
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: "student_subject_results",
      timestamps: false,
      underscored: true
    }
  );

  return StudentSubjectResults;
}
