import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from "sequelize";

export interface ExamMarksLockStatusAttributes {
  id: number;
  exam_id: number;

  status: "OPEN" | "DRAFT" | "SUBMITTED" | "LOCKED";

  locked_by: number | null;
  locked_at: Date | string | null;

  reopened_by?: number | null;
  reopened_at?: Date | string | null;

  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface ExamMarksLockStatusCreationAttributes
  extends Optional<
    ExamMarksLockStatusAttributes,
    | "id"
    | "locked_by"
    | "locked_at"
    | "reopened_by"
    | "reopened_at"
    | "created_at"
    | "updated_at"
  > {}

export class ExamMarksLockStatus
  extends Model<
    ExamMarksLockStatusAttributes,
    ExamMarksLockStatusCreationAttributes
  >
  implements ExamMarksLockStatusAttributes
{
  public id!: number;
  public exam_id!: number;

  public status!: "OPEN" | "DRAFT" | "SUBMITTED" | "LOCKED";

  public locked_by!: number | null;
  public locked_at!: Date | string | null;

  public reopened_by!: number | null;
  public reopened_at!: Date | string | null;

  public created_at!: Date | string | null;
  public updated_at!: Date | string | null;
}

export function defineExamMarksLockStatus(sequelize: Sequelize) {
  ExamMarksLockStatus.init(
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
      status: {
        type: DataTypes.ENUM("OPEN", "DRAFT", "SUBMITTED", "LOCKED"),
        allowNull: false,
        defaultValue: "OPEN",
      },
      locked_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      locked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reopened_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      reopened_at: {
        type: DataTypes.DATE,
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
      tableName: "exam_marks_lock_status",
      timestamps: false,
    }
  );

  return ExamMarksLockStatus;
}