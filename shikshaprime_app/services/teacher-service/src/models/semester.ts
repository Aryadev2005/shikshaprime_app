import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Define attributes interface
export interface SemesterAttributes {
  id: number;
  program_id: number;
  class_id: number;
  semester_number: number;
  name: string;
  is_active?: number;
}

// For creation, id is optional
export interface SemesterCreationAttributes extends Optional<SemesterAttributes, 'id'> {}

class Semester extends Model<SemesterAttributes, SemesterCreationAttributes>
  implements SemesterAttributes {
  public id!: number;
  public program_id!: number;
  public class_id!: number;
  public semester_number!: number;
  public name!: string;
  public is_active?: number;
}
export function defineSemester(sequelize: Sequelize) {
  Semester.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      semester_number: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      tableName: 'semesters',
      timestamps: false,
      underscored: true,
    }
  );
  return Semester;
}