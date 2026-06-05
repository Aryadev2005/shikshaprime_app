import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ReceiptAttributes {
  id: number;
  receipt_id?: string;
  receipt_number?: string;
  student_id: string;
  date?: Date;
  amount: number;
  payment_mode?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReceiptCreationAttributes extends Optional<ReceiptAttributes, 'id'> {}

class Receipt extends Model<ReceiptAttributes, ReceiptCreationAttributes>
  implements ReceiptAttributes {
  public id!: number;
  public receipt_id?: string;
  public receipt_number?: string;
  public student_id!: string;
  public date?: Date;
  public amount!: number;
  public payment_mode?: string;
  public description?: string;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineReceipt(sequelize: Sequelize) {
  Receipt.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      receipt_id: { type: DataTypes.STRING(100), allowNull: true },
      receipt_number: { type: DataTypes.STRING(100), allowNull: true },
      student_id: { type: DataTypes.STRING(50), allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: true },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      payment_mode: { type: DataTypes.STRING(50), allowNull: true },
      description: { type: DataTypes.STRING(500), allowNull: true },
    },
    { sequelize, tableName: 'receipts', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
  return Receipt;
}
