import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface SemesterResultAttributes {
  id: number;
  student_id: number;
  semester_id: number;
  program_id: number;
  academic_year_id: number;
  failed_subjects_count?: string | null;
  sgpa?: number | null;
  cgpa?: number | null;
  total_credits_earned?: number | null;
  total_marks?: number | null;
  result_status?: "PASS" | "FAIL" | "PROMOTED" | "NOT_PROMOTED" | null;
  is_finalized?: boolean | null;
  published_at?: Date | null;
}

export interface SemesterResultCreationAttributes
  extends Optional<
    SemesterResultAttributes,
    | "id"
    | "sgpa"
    | "cgpa"
    | "total_credits_earned"
    | "total_marks"
    | "result_status"
    | "is_finalized"
    | "published_at"
  > { }

export class SemesterResults
  extends Model<SemesterResultAttributes, SemesterResultCreationAttributes>
  implements SemesterResultAttributes {
  public id!: number;
  public student_id!: number;
  public semester_id!: number;
  public program_id!: number;
  public academic_year_id!: number;
  public failed_subjects_count: string | null;
  public sgpa!: number | null;
  public cgpa!: number | null;
  public total_credits_earned!: number | null;
  public total_marks!: number | null;
  public result_status!: "PASS" | "FAIL" | "PROMOTED" | "NOT_PROMOTED" | null;
  public is_finalized!: boolean | null;
  public published_at!: Date | null;
}

export function defineSemesterResults(sequelize: Sequelize) {
  SemesterResults.init(
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
      failed_subjects_count: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
      sgpa: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true
      },
      cgpa: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true
      },
      total_credits_earned: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      total_marks: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true
      },
      result_status: {
        type: DataTypes.ENUM("PASS", "FAIL", "PROMOTED", "NOT_PROMOTED"),
        allowNull: true,
        defaultValue: "PASS"
      },
      is_finalized: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: true,
        defaultValue: 0
      },
      published_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: "semester_results",
      timestamps: false,
      underscored: true
    }
  );

  return SemesterResults;
}