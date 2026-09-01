import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface ClassAttributes {
  id: number;
  program_id: number;
  semester_id: number;
  batch_year: number;

  section?: string | null;
  code: string;
  name: string;

  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface ClassCreationAttributes
  extends Optional<
    ClassAttributes,
    "id" | "section" | "created_at" | "updated_at"
  > {}

export class Classes
  extends Model<ClassAttributes, ClassCreationAttributes>
  implements ClassAttributes
{
  public id!: number;
  public program_id!: number;
  public semester_id!: number;
  public batch_year!: number;

  public section!: string | null;
  public code!: string;
  public name!: string;

  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

export function defineClasses(sequelize: Sequelize) {
  Classes.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      batch_year: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      section: {
        type: DataTypes.STRING(1),
        allowNull: true
      },

      code: {
        type: DataTypes.STRING(20),
        allowNull: false
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        )
      }
    },
    {
      sequelize,
      tableName: "classes",
      timestamps: false,
      underscored: true
    }
  );

  return Classes;
}