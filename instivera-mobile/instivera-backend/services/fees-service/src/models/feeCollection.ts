import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface FeeCollectionAttributes {
  id: number;
  collection_id?: string;
  student_id: string;
  fee_head_id?: number;
  amount: number;
  paid_amount?: number;
  balance?: number;
  due_date?: Date;
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface FeeCollectionCreationAttributes extends Optional<FeeCollectionAttributes, 'id'> {}

class FeeCollection extends Model<FeeCollectionAttributes, FeeCollectionCreationAttributes>
  implements FeeCollectionAttributes {
  public id!: number;
  public collection_id?: string;
  public student_id!: string;
  public fee_head_id?: number;
  public amount!: number;
  public paid_amount?: number;
  public balance?: number;
  public due_date?: Date;
  public status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineFeeCollection(sequelize: Sequelize) {
  FeeCollection.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      collection_id: { type: DataTypes.STRING(100), allowNull: true },
      student_id: { type: DataTypes.STRING(50), allowNull: false },
      fee_head_id: { type: DataTypes.BIGINT, allowNull: true },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      paid_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL'),
        defaultValue: 'PENDING',
      },
    },
    { sequelize, tableName: 'fee_collections', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
  return FeeCollection;
}
