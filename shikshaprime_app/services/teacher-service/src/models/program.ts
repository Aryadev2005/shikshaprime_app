import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Define attributes interface
export interface ProgramAttributes {
  id: number;
  department_id: number;
  code: string;
  name: string;
  degree_type: 'UG' | 'PG' | 'DP';
  stream: 'SCIENCE' | 'ARTS' | 'COMMERCE';
  duration_years: number;
  total_semesters: number;
}

// For creation, id is optional
export interface ProgramCreationAttributes extends Optional<ProgramAttributes, 'id'> {}

class Program extends Model<ProgramAttributes, ProgramCreationAttributes>
  implements ProgramAttributes {
  public id!: number;
  public department_id!: number;
  public code!: string;
  public name!: string;
  public degree_type!: 'UG' | 'PG' | 'DP';
  public stream!: 'SCIENCE' | 'ARTS' | 'COMMERCE';
  public duration_years!: number;
  public total_semesters!: number;
}
export function defineProgram(sequelize: Sequelize) {
  Program.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      department_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      degree_type: {
        type: DataTypes.ENUM('UG', 'PG', 'DP'),
        allowNull: false,
      },
      stream: {
        type: DataTypes.ENUM('SCIENCE', 'ARTS', 'COMMERCE'),
        allowNull: false,
      },
      duration_years: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      total_semesters: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'programs',
      timestamps: false, 
      underscored: true,
    }
  );
  return Program;
}