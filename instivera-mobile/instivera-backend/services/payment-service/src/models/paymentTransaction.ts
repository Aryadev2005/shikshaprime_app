import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface PaymentTransactionAttributes {
  id: number;
  transaction_id?: string;
  payment_id: number;
  gateway_status?: string;
  gateway_reference?: string;
  amount?: number;
  is_completed?: number;
  created_at?: Date;
}

export interface PaymentTransactionCreationAttributes
  extends Optional<PaymentTransactionAttributes, 'id'> {}

class PaymentTransaction
  extends Model<PaymentTransactionAttributes, PaymentTransactionCreationAttributes>
  implements PaymentTransactionAttributes {
  public id!: number;
  public transaction_id?: string;
  public payment_id!: number;
  public gateway_status?: string;
  public gateway_reference?: string;
  public amount?: number;
  public is_completed?: number;
  public created_at?: Date;
}

export function definePaymentTransaction(sequelize: Sequelize) {
  PaymentTransaction.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      transaction_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
      payment_id: { type: DataTypes.BIGINT, allowNull: false },
      gateway_status: { type: DataTypes.STRING(50), allowNull: true },
      gateway_reference: { type: DataTypes.STRING(200), allowNull: true },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      is_completed: { type: DataTypes.TINYINT, defaultValue: 0 },
    },
    { sequelize, tableName: 'payment_transactions', timestamps: true, createdAt: 'created_at', updatedAt: false }
  );
  return PaymentTransaction;
}
