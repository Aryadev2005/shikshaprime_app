import { Model, DataTypes, Optional, Sequelize } from "sequelize";

interface ChartOfAccountGroupAttributes {
  id: number;
  financial_year: string;
  name: string;
  parent_group_id?: number | null;
  root_type: "ASSET" | "LIABILITY" | "CAPITAL" | "INCOME" | "EXPENSE";
  is_system: number;
  created_at: Date;
  updated_at: Date;
  created_by: number;
  is_deleted: number;
}

interface ChartOfAccountGroupCreationAttributes
  extends Optional<
    ChartOfAccountGroupAttributes,
    "id" | "parent_group_id"
  > {}

export class ChartOfAccountGroup
  extends Model<
    ChartOfAccountGroupAttributes,
    ChartOfAccountGroupCreationAttributes
  >
  implements ChartOfAccountGroupAttributes {
  public id!: number;
  public financial_year!: string;
  public name!: string;
  public parent_group_id!: number | null;
  public root_type!: "ASSET" | "LIABILITY" | "CAPITAL" | "INCOME" | "EXPENSE";
  public is_system!: number;
  public created_at!: Date;
  public updated_at!: Date;
  public created_by!: number;
  public is_deleted!: number;
}

export function defineChartOfAccountGroup(sequelize: Sequelize) {
  ChartOfAccountGroup.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      financial_year: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      parent_group_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      root_type: {
        type: DataTypes.ENUM(
          "ASSET",
          "LIABILITY",
          "CAPITAL",
          "INCOME",
          "EXPENSE"
        ),
        allowNull: false,
      },
      is_system: {
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
      created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      is_deleted: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "chart_of_account_groups",
      timestamps: false,
    }
  );

  return ChartOfAccountGroup;
}