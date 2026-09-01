import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryAssetAttributes {
  id: number;
  asset_code: string;
  name: string;
  category_id: number;
  inventory_department_id: number;
  location_id?: number | null;
  vendor_id?: number | null;
  purchase_cost: number;
  current_value?: number | null;
  purchase_date?: Date | string | null;
  warranty_expiry?: Date | string | null;
  serial_number?: string | null;
  qr_code?: string | null;
  barcode?: string | null;
  created_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export type InventoryAssetCreationAttributes = Optional<InventoryAssetAttributes, 'id' | 'created_at' | 'updated_at'>;

export class InventoryAssets extends Model<InventoryAssetAttributes, InventoryAssetCreationAttributes> implements InventoryAssetAttributes {
  public id!: number;
  public asset_code!: string;
  public name!: string;
  public category_id!: number;
  public inventory_department_id!: number;
  public location_id!: number | null;
  public vendor_id!: number | null;
  public purchase_cost!: number;
  public current_value!: number | null;
  public purchase_date!: Date | null;
  public warranty_expiry!: Date | null;
  public serial_number!: string | null;
  public qr_code!: string | null;
  public barcode!: string | null;
  public created_by!: number | null;
  public created_at!: Date;
  public updated_at!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryAssets.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        asset_code: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        category_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        inventory_department_id: {
          type: DataTypes.BIGINT.UNSIGNED,
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
        purchase_cost: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
        },
        current_value: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
        },
        purchase_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        warranty_expiry: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        serial_number: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        qr_code: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: true,
        },
        barcode: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: true,
        },
        created_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'inventory_assets',
        modelName: 'InventoryAssets',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }
}
