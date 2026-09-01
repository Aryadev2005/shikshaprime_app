import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryActivityAttributes {
  id: number;
  action_type: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'COMPLETE';
  description: string;
  user_id: number;
  timestamp?: Date;
}

export type InventoryActivityCreationAttributes = Optional<InventoryActivityAttributes, 'id' | 'timestamp'>;

export class InventoryActivities extends Model<InventoryActivityAttributes, InventoryActivityCreationAttributes> implements InventoryActivityAttributes {
  public id!: number;
  public action_type!: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'COMPLETE';
  public description!: string;
  public user_id!: number;
  public timestamp!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryActivities.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        action_type: {
          type: DataTypes.ENUM('CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'COMPLETE'),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'inventory_activities',
        modelName: 'InventoryActivities',
        timestamps: false,
      }
    );
  }
}
