import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface PaymentAttributes {
  id: number;
  payment_id?: string;
  student_id: string;
  amount: number;
  paid_amount?: number;
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  due_date?: Date;
  payment_mode?: string;
  merchant_order_id?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes {
  public id!: number;
  public payment_id?: string;
  public student_id!: string;
  public amount!: number;
  public paid_amount?: number;
  public status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  public due_date?: Date;
  public payment_mode?: string;
  public merchant_order_id?: string;
  public description?: string;
  public created_at?: Date;
  public updated_at?: Date;
}

export function definePayment(sequelize: Sequelize) {
  Payment.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      payment_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
      student_id: { type: DataTypes.STRING(50), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      paid_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL'),
        defaultValue: 'PENDING',
      },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      payment_mode: { type: DataTypes.STRING(50), allowNull: true },
      merchant_order_id: { type: DataTypes.STRING(100), allowNull: true },
      description: { type: DataTypes.STRING(500), allowNull: true },
    },
    { sequelize, tableName: 'payments', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
  return Payment;
}
