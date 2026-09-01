import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacExamResultAttributes {
  id: number;
  program_id?: number | null;
  academic_year_id?: number | null;
  exam_name: string;
  exam_type?:
    | "internal"
    | "external"
    | "semester"
    | "annual"
    | null;
  total_students?: number | null;
  students_appeared?: number | null;
  students_passed?: number | null;
  students_failed?: number | null;
  pass_percentage?: number | null;
  failed_percentage?: number | null;
  university_avg_pass_percentage?: number | null;
  distinction_count?: number | null;
  result_document_url?: string | null;
  status?: "SAVED" | "FINAL";
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacExamResultCreationAttributes
  extends Optional<
    NaacExamResultAttributes,
    | "id"
    | "program_id"
    | "academic_year_id"
    | "exam_type"
    | "total_students"
    | "students_appeared"
    | "students_passed"
    | "students_failed"
    | "pass_percentage"
    | "failed_percentage"
    | "university_avg_pass_percentage"
    | "distinction_count"
    | "result_document_url"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

class NaacExamResult
  extends Model<
    NaacExamResultAttributes,
    NaacExamResultCreationAttributes
  >
  implements NaacExamResultAttributes
{
  public id!: number;
  public program_id?: number | null;
  public academic_year_id?: number | null;
  public exam_name!: string;
  public exam_type?:
    | "internal"
    | "external"
    | "semester"
    | "annual"
    | null;
  public total_students?: number | null;
  public students_appeared?: number | null;
  public students_passed?: number | null;
  public students_failed?: number | null;
  public pass_percentage?: number | null;
  public failed_percentage?: number | null;
  public university_avg_pass_percentage?: number | null;
  public distinction_count?: number | null;
  public result_document_url?: string | null;
  public status?: "SAVED" | "FINAL";
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacExamResult {
    NaacExamResult.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },

        program_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        exam_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },

        exam_type: {
          type: DataTypes.ENUM(
            "internal",
            "external",
            "semester",
            "annual"
          ),
          allowNull: true,
        },

        total_students: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        students_appeared: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        students_passed: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        students_failed: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        pass_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },

        failed_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },

        university_avg_pass_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },

        distinction_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        result_document_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        status: {
          type: DataTypes.ENUM(
            "SAVED",
            "FINAL"
          ),
          allowNull: false,
          defaultValue: "SAVED",
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },

        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_exam_results",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacExamResult;
  }

  static associate(models: any) {
    NaacExamResult.belongsTo(models.NaacProgram, {
      foreignKey: "program_id",
      as: "program",
    });
  }
}

export default NaacExamResult;