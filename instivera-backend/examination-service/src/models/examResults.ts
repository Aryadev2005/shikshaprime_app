import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from "sequelize";

export interface ExamResultAttributes {
  id: number;
  exam_id: number;
  student_id: number;

  total_marks: number;
  percentage: number | null;
  grade: string | null;
  pass_fail: "PASS" | "FAIL" | null;

  is_finalized?: number | null;
  finalized_at?: Date | string | null;
  finalized_by?: number | null;

  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface ExamResultCreationAttributes
  extends Optional<
    ExamResultAttributes,
    | "id"
    | "percentage"
    | "grade"
    | "pass_fail"
    | "is_finalized"
    | "finalized_at"
    | "finalized_by"
    | "created_at"
    | "updated_at"
  > {}

export class ExamResult
  extends Model<ExamResultAttributes, ExamResultCreationAttributes>
  implements ExamResultAttributes
{
  public id!: number;
  public exam_id!: number;
  public student_id!: number;

  public total_marks!: number;
  public percentage!: number | null;
  public grade!: string | null;
  public pass_fail!: "PASS" | "FAIL" | null;

  public is_finalized!: number | null;
  public finalized_at!: Date | string | null;
  public finalized_by!: number | null;

  public created_at!: Date | string | null;
  public updated_at!: Date | string | null;
}

export function defineExamResult(sequelize: Sequelize) {
  ExamResult.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      exam_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      total_marks: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
      percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      grade: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      pass_fail: {
        type: DataTypes.ENUM("PASS", "FAIL"),
        allowNull: true,
      },
      is_finalized: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      finalized_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      finalized_by: {
        type: DataTypes.BIGINT.UNSIGNED,
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
      tableName: "exam_results",
      timestamps: false,
    }
  );

  return ExamResult;
}