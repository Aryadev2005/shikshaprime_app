import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Define attributes interface
export interface AcademicYearAttributes {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  is_active: number;
  created_at?: Date;
  updated_at?: Date;
}

// For creation, id is optional
export interface AcademicYearCreationAttributes extends Optional<AcademicYearAttributes, 'id'> {}

class AcademicYear extends Model<AcademicYearAttributes, AcademicYearCreationAttributes>
  implements AcademicYearAttributes {
  public id!: number;
  public name!: string;
  public start_date!: Date;
  public end_date!: Date;
  public is_active!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineAcademicYear(sequelize: Sequelize) {
  AcademicYear.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'academic_years',
      timestamps: false,
      underscored: true,
    }
  );
  return AcademicYear;
}