import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryVendorAttributes {
  id: number;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at?: Date;
}

export type InventoryVendorCreationAttributes = Optional<InventoryVendorAttributes, 'id' | 'created_at'>;

export class InventoryVendors extends Model<InventoryVendorAttributes, InventoryVendorCreationAttributes> implements InventoryVendorAttributes {
  public id!: number;
  public name!: string;
  public contact_person!: string | null;
  public email!: string | null;
  public phone!: string | null;
  public address!: string | null;
  public created_at!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryVendors.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        contact_person: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        address: {
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
        tableName: 'inventory_vendors',
        modelName: 'InventoryVendors',
        timestamps: false,
      }
    );
  }
}
