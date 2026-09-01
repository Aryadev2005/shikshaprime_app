import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface InventoryVerificationAttributes {
  id: number;
  asset_id: number;
  status: 'Active' | 'Maintenance' | 'Disposed' | 'Lost' | 'Inactive' | 'Verified' | 'Damaged' | 'Missing' | 'Pending Review';
  verified_by: number;
  remarks?: string | null;
  verification_date?: Date;
}

export type InventoryVerificationCreationAttributes = Optional<InventoryVerificationAttributes, 'id' | 'verification_date'>;

export class InventoryVerifications extends Model<InventoryVerificationAttributes, InventoryVerificationCreationAttributes> implements InventoryVerificationAttributes {
  public id!: number;
  public asset_id!: number;
  public status!: 'Active' | 'Maintenance' | 'Disposed' | 'Lost' | 'Inactive' | 'Verified' | 'Damaged' | 'Missing' | 'Pending Review';
  public verified_by!: number;
  public remarks!: string | null;
  public verification_date!: Date;

  static initModel(sequelize: Sequelize) {
    InventoryVerifications.init(
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
        status: {
          type: DataTypes.ENUM('Active', 'Maintenance', 'Disposed', 'Lost', 'Inactive', 'Verified', 'Damaged', 'Missing', 'Pending Review'),
          allowNull: false,
          defaultValue: 'Active',
        },
        verified_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        verification_date: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'inventory_verifications',
        modelName: 'InventoryVerifications',
        timestamps: false,
      }
    );
  }
}
