import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from "sequelize";

export interface ExamComponentTemplateAttributes {
  id: number;
  componentName: string;
  componentType: "THEORY" | "PRACTICAL" | "PROJECT" | "VIVA";
  defaultDuration?: number | null;
  defaultWeightage?: number | null;
  isActive: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExamComponentTemplateCreationAttributes
  extends Optional<ExamComponentTemplateAttributes, "id" | "defaultDuration" | "defaultWeightage" | "createdAt" | "updatedAt"> {}

export class ExamComponentTemplate
  extends Model<ExamComponentTemplateAttributes, ExamComponentTemplateCreationAttributes>
  implements ExamComponentTemplateAttributes
{
  public id!: number;
  public componentName!: string;
  public componentType!: "THEORY" | "PRACTICAL" | "PROJECT" | "VIVA";
  public defaultDuration!: number | null;
  public defaultWeightage!: number | null;
  public isActive!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

  export function defineExamComponentTemplate(sequelize: Sequelize) {
    ExamComponentTemplate.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        componentName: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        componentType: {
          type: DataTypes.ENUM("THEORY", "PRACTICAL", "PROJECT", "VIVA"),
          allowNull: false,
          defaultValue: "THEORY",
        },
        defaultDuration: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        defaultWeightage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },
        isActive: {
          type: DataTypes.TINYINT,
          allowNull: true,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: "exam_component_templates",
        underscored: true,
        timestamps: false,
      }
    );

    return ExamComponentTemplate;
  }

