import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryProcurementRequestAttributes {
  id: number;
  request_number: string;
  inventory_department_id: number;
  total_estimated_budget?: number;
  status?: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  requested_by: number;
  approved_by?: number | null;
  remarks?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type InventoryProcurementRequestCreationAttributes = Optional<InventoryProcurementRequestAttributes, 'id' | 'total_estimated_budget' | 'status' | 'created_at' | 'updated_at'>;

export class InventoryProcurementRequests extends Model<InventoryProcurementRequestAttributes, InventoryProcurementRequestCreationAttributes> implements InventoryProcurementRequestAttributes {
  public id!: number;
  public request_number!: string;
  public inventory_department_id!: number;
  public total_estimated_budget!: number;
  public status!: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  public requested_by!: number;
  public approved_by!: number | null;
  public remarks!: string | null;
  public created_at!: Date;
  public updated_at!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryProcurementRequests.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        request_number: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        inventory_department_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        total_estimated_budget: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
          defaultValue: 0.00,
        },
        status: {
          type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Completed'),
          allowNull: true,
          defaultValue: 'Pending',
        },
        requested_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        approved_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
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
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'inventory_procurement_requests',
        modelName: 'InventoryProcurementRequests',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }
}
