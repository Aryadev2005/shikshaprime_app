import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface SemesterAttributes {
  id: number;
  program_id: number;
  semester_number: number;
  year_number: number;
  name: string;

  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface SemesterCreationAttributes
  extends Optional<
    SemesterAttributes,
    "id" | "created_at" | "updated_at"
  > { }

export class Semesters
  extends Model<SemesterAttributes, SemesterCreationAttributes>
  implements SemesterAttributes {
  public id!: number;
  public program_id!: number;
  public semester_number!: number;
  public year_number!: number;
  public name!: string;

  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

export function defineSemesters(sequelize: Sequelize) {
  Semesters.init(
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

      semester_number: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      year_number: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      name: {
        type: DataTypes.STRING(50),
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
      tableName: "semesters",
      modelName: "Semesters",
      timestamps: false,
      underscored: true
    }
  );

  return Semesters;
}