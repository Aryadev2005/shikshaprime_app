import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from "sequelize";

export interface ExamComponentMappingAttributes {
  id: number;
  examId: number;
  componentTemplateId: number;
  maxMarks: number;
  minMarks: number;
  weightage: number;
  durationMinutes?: number | null;
  sequence: number;
  passRequired: number;
}

export interface ExamComponentMappingCreationAttributes
  extends Optional<ExamComponentMappingAttributes, "id" | "durationMinutes"> {}

export class ExamComponentMapping
  extends Model<ExamComponentMappingAttributes, ExamComponentMappingCreationAttributes>
  implements ExamComponentMappingAttributes
{
  public id!: number;
  public examId!: number;
  public componentTemplateId!: number;
  public maxMarks!: number;
  public minMarks!: number;
  public weightage!: number;
  public durationMinutes!: number | null;
  public sequence!: number;
  public passRequired!: number;
}

  export function defineExamComponentMapping(sequelize: Sequelize) {
    ExamComponentMapping.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        examId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        componentTemplateId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        maxMarks: {
          type: DataTypes.DECIMAL(6, 2),
          allowNull: false,
        },
        minMarks: {
          type: DataTypes.DECIMAL(6, 2),
          allowNull: false,
          defaultValue: 0.0,
        },
        weightage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 100.0,
        },
        durationMinutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        sequence: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        passRequired: {
          type: DataTypes.TINYINT,
          allowNull: true,
          defaultValue: 1,
        },
      },
      {
        sequelize,
        tableName: "exam_component_mapping",
        underscored: true,
        timestamps: false,
      }
    );

    return ExamComponentMapping;
  }
