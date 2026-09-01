import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryDepartmentAttributes {
  id: number;
  name: string;
  head_of_department_id?: number | null;
  created_at?: Date;
}

export type InventoryDepartmentCreationAttributes = Optional<InventoryDepartmentAttributes, 'id' | 'created_at'>;

export class InventoryDepartments extends Model<InventoryDepartmentAttributes, InventoryDepartmentCreationAttributes> implements InventoryDepartmentAttributes {
  public id!: number;
  public name!: string;
  public head_of_department_id!: number | null;
  public created_at!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryDepartments.init(
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
        head_of_department_id: {
          type: DataTypes.BIGINT.UNSIGNED,
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
        tableName: 'inventory_departments',
        modelName: 'InventoryDepartments',
        timestamps: false,
      }
    );
  }
}
