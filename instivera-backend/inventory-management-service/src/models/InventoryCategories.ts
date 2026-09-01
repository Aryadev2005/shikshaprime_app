import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryCategoryAttributes {
  id: number;
  name: string;
  description?: string | null;
  created_at?: Date;
}

export type InventoryCategoryCreationAttributes = Optional<InventoryCategoryAttributes, 'id' | 'created_at'>;

export class InventoryCategories extends Model<InventoryCategoryAttributes, InventoryCategoryCreationAttributes> implements InventoryCategoryAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public created_at!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryCategories.init(
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
        tableName: 'inventory_categories',
        modelName: 'InventoryCategories',
        timestamps: false,
      }
    );
  }
}
