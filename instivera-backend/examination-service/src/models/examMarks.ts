import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from "sequelize";

export interface ExamMarkAttributes {
  id: number;
  exam_id: number;
  student_id: number;

  // IMPORTANT: this refers to exam_component_mappings.id
  component_mapping_id: number;

  marks_obtained: number;

  entered_by: number | null;
  updated_by: number | null;

  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface ExamMarkCreationAttributes
  extends Optional<
    ExamMarkAttributes,
    "id" | "entered_by" | "updated_by" | "created_at" | "updated_at"
  > {}

export class ExamMark
  extends Model<ExamMarkAttributes, ExamMarkCreationAttributes>
  implements ExamMarkAttributes
{
  public id!: number;
  public exam_id!: number;
  public student_id!: number;
  public component_mapping_id!: number;
  public marks_obtained!: number;

  public entered_by!: number | null;
  public updated_by!: number | null;

  public created_at!: Date | string | null;
  public updated_at!: Date | string | null;
}

export function defineExamMark(sequelize: Sequelize) {
  ExamMark.init(
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
      component_mapping_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment: "Reference to exam_component_mappings.id",
      },
      marks_obtained: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      entered_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      updated_by: {
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
      tableName: "exam_marks",
      timestamps: false,
    }
  );

  return ExamMark;
}