import { DataTypes, Model, Sequelize } from "sequelize";

export interface PaymentTransactionAttributes {
  id?: number;
  student_payment_id: number;
  amount_paid: number;
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
  transaction_ref?: string;
  payment_date?: Date;
  receipt_number?: string;
  notes?: string;
  created_by?: number;
  created_at?: Date;
  gateway_order_id?: string;
  gateway_transaction_id?: string;
  gateway_status?: string;
  gateway_response?: any;
  payment_gateway_fee?: number;
  updated_at?: Date;
}

class PaymentTransaction extends Model<PaymentTransactionAttributes> implements PaymentTransactionAttributes {
  public id!: number;
  public student_payment_id!: number;
  public amount_paid!: number;
  public payment_method!: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
  public transaction_ref!: string;
  public payment_date!: Date;
  public receipt_number!: string;
  public notes!: string;
  public created_by!: number;
  public created_at!: Date;
  public gateway_order_id!: string;
  public gateway_transaction_id!: string;
  public gateway_status!: string;
  public gateway_response!: any;
  public payment_gateway_fee!: number;
  public updated_at!: Date;
}

export function definePaymentTransaction(sequelize: Sequelize) {
  PaymentTransaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },      
      student_payment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM('cash', 'upi', 'card', 'bank_transfer', 'cheque'),
        allowNull: false,
      },
      transaction_ref: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      payment_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      receipt_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      gateway_order_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      gateway_transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      gateway_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gateway_response: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      payment_gateway_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "payment_transactions",
      timestamps: false,
    }
  );
  return PaymentTransaction;
}
