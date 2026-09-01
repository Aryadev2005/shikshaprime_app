import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryLocationAttributes {
  id: number;
  name: string;
  building?: string | null;
  campus?: string | null;
  description?: string | null;
  created_at?: Date;
}

export type InventoryLocationCreationAttributes = Optional<InventoryLocationAttributes, 'id' | 'created_at'>;

export class InventoryLocations extends Model<InventoryLocationAttributes, InventoryLocationCreationAttributes> implements InventoryLocationAttributes {
  public id!: number;
  public name!: string;
  public building!: string | null;
  public campus!: string | null;
  public description!: string | null;
  public created_at!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryLocations.init(
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
        building: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        campus: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        description: {
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
        tableName: 'inventory_locations',
        modelName: 'InventoryLocations',
        timestamps: false,
      }
    );
  }
}
