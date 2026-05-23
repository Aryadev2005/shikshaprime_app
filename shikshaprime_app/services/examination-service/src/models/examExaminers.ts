import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from "sequelize";

export interface ExamExaminerAttributes {
  id: number;

  exam_id: number;

  // Internal examiner
  teacher_id: number | null;

  // External examiner fields
  external_name: string | null;
  external_email: string | null;
  external_mobile: string | null;
  external_institution: string | null;

  role: "PRIMARY" | "SECONDARY" | "EXTERNAL";

  assigned_by: number;
  assigned_at: Date | string | null;

  is_active: number | null;

  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface ExamExaminerCreationAttributes
  extends Optional<
    ExamExaminerAttributes,
    | "id"
    | "teacher_id"
    | "external_name"
    | "external_email"
    | "external_mobile"
    | "external_institution"
    | "assigned_at"
    | "is_active"
    | "created_at"
    | "updated_at"
  > {}

export class ExamExaminer
  extends Model<ExamExaminerAttributes, ExamExaminerCreationAttributes>
  implements ExamExaminerAttributes
{
  public id!: number;

  public exam_id!: number;

  public teacher_id!: number | null;

  public external_name!: string | null;
  public external_email!: string | null;
  public external_mobile!: string | null;
  public external_institution!: string | null;

  public role!: "PRIMARY" | "SECONDARY" | "EXTERNAL";

  public assigned_by!: number;
  public assigned_at!: Date | string | null;

  public is_active!: number | null;

  public created_at!: Date | string | null;
  public updated_at!: Date | string | null;
}

export function defineExamExaminer(sequelize: Sequelize) {
  ExamExaminer.init(
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

      teacher_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        comment: "Internal examiner reference",
      },

      external_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      external_email: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      external_mobile: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      external_institution: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      role: {
        type: DataTypes.ENUM("PRIMARY", "SECONDARY", "EXTERNAL"),
        allowNull: false,
        defaultValue: "PRIMARY",
      },

      assigned_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      assigned_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },

      is_active: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1,
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
      tableName: "exam_examiners",
      timestamps: false,
    }
  );

  return ExamExaminer;
}
