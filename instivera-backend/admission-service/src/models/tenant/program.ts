import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface ProgramAttributes {
  id: number;
  department_id: number;

  code: string;
  name: string;

  degree_type: "UG" | "PG" | "DOCTORAL";
  program_type: string; // ENGINEERING, FYUGP, CBCS, etc.

  duration_years?: number | null;
  total_semesters?: number | null;
}

export interface ProgramCreationAttributes
  extends Optional<
    ProgramAttributes,
    "id" | "duration_years" | "total_semesters"
  > {}

export class Program
  extends Model<ProgramAttributes, ProgramCreationAttributes>
  implements ProgramAttributes
{
  public id!: number;
  public department_id!: number;

  public code!: string;
  public name!: string;

  public degree_type!: "UG" | "PG" | "DOCTORAL";
  public program_type!: string;

  public duration_years!: number | null;
  public total_semesters!: number | null;
}

export function defineProgram(sequelize: Sequelize) {
    Program.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        department_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        code: {
          type: DataTypes.STRING(30),
          allowNull: false
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        degree_type: {
          type: DataTypes.ENUM("UG", "PG", "DOCTORAL"),
          allowNull: false
        },
        program_type: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        duration_years: {
          type: DataTypes.TINYINT,
          allowNull: true
        },
        total_semesters: {
          type: DataTypes.TINYINT,
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: "programs",
        timestamps: false,
        underscored: true
      }
    );

    return Program;
  }