import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

interface FinancialYearAttributes {
  id: number;
  year_label: string;
  start_date: Date;
  end_date: Date;
  is_locked: number;
  created_at: Date;
  updated_at: Date;
}

interface FinancialYearCreationAttributes
  extends Optional<FinancialYearAttributes, 'id'> {}

export class FinancialYear
  extends Model<FinancialYearAttributes, FinancialYearCreationAttributes>
  implements FinancialYearAttributes {
  public id!: number;
  public year_label!: string;
  public start_date!: Date;
  public end_date!: Date;
  public is_locked!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineFinancialYear(sequelize: Sequelize) {
  FinancialYear.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      year_label: {
        type: DataTypes.STRING(20),
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
      is_locked: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'financial_years',
      timestamps: false,
    }
  );

  return FinancialYear;
}