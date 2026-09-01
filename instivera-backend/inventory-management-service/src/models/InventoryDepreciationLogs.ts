import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryDepreciationLogAttributes {
  id: number;
  asset_id: number;
  depreciation_date: Date | string;
  value_deducted: number;
  new_value: number;
  remarks?: string | null;
  created_at?: Date;
}

export type InventoryDepreciationLogCreationAttributes = Optional<InventoryDepreciationLogAttributes, 'id' | 'created_at'>;

export class InventoryDepreciationLogs extends Model<InventoryDepreciationLogAttributes, InventoryDepreciationLogCreationAttributes> implements InventoryDepreciationLogAttributes {
  public id!: number;
  public asset_id!: number;
  public depreciation_date!: Date;
  public value_deducted!: number;
  public new_value!: number;
  public remarks!: string | null;
  public created_at!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryDepreciationLogs.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        asset_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        depreciation_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        value_deducted: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
        },
        new_value: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'inventory_depreciation_logs',
        modelName: 'InventoryDepreciationLogs',
        timestamps: false,
      }
    );
  }
}
