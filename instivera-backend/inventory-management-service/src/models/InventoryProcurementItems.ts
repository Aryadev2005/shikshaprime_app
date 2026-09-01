import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryProcurementItemAttributes {
  id: number;
  procurement_request_id: number;
  item_name: string;
  quantity: number;
  estimated_unit_cost: number;
  category_id?: number | null;
  location_id?: number | null;
  vendor_id?: number | null;
}

export type InventoryProcurementItemCreationAttributes = Optional<InventoryProcurementItemAttributes, 'id'>;

export class InventoryProcurementItems extends Model<InventoryProcurementItemAttributes, InventoryProcurementItemCreationAttributes> implements InventoryProcurementItemAttributes {
  public id!: number;
  public procurement_request_id!: number;
  public item_name!: string;
  public quantity!: number;
  public estimated_unit_cost!: number;
  public category_id!: number | null;
  public location_id!: number | null;
  public vendor_id!: number | null;

  static initModel(sequelize: Sequelize) {
    InventoryProcurementItems.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        procurement_request_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        category_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        item_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        estimated_unit_cost: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
        },
        location_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        vendor_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'inventory_procurement_items',
        modelName: 'InventoryProcurementItems',
        timestamps: false,
      }
    );
  }
}
