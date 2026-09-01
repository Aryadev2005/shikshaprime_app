import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventorySettingAttributes {
  id: number;
  setting_key: string;
  setting_value: string;
  data_type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DECIMAL';
  updated_at?: Date | null;
}

export type InventorySettingCreationAttributes = Optional<
  InventorySettingAttributes,
  'id' | 'updated_at'
>;

export class InventorySettings
  extends Model<InventorySettingAttributes, InventorySettingCreationAttributes>
  implements InventorySettingAttributes
{
  public id!: number;
  public setting_key!: string;
  public setting_value!: string;
  public data_type!: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DECIMAL';
  public updated_at!: Date | null;

  static initModel(sequelize: Sequelize) {
    InventorySettings.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        setting_key: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        setting_value: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        data_type: {
          type: DataTypes.ENUM('STRING', 'INTEGER', 'BOOLEAN', 'DECIMAL'),
          allowNull: false,
          defaultValue: 'STRING',
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
      },
      {
        sequelize,
        tableName: 'inventory_settings',
        modelName: 'InventorySettings',
        timestamps: false,
      }
    );
  }
}