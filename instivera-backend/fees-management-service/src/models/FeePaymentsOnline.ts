import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface FeePaymentOnlineAttributes {
  id: number;
  student_id: number;
  order_id: string;
  payment_id?: string | null;
  amount: number;
  status: 'INITIATED' | 'SUCCESS' | 'FAILED';
  gateway_charges?: number | null;
  merchant_id?: string | null;
  bank_account_id?: number | null;
  gateway_response?: any | null;
  voucher_id?: number | null;
}

export interface FeePaymentOnlineCreationAttributes
  extends Optional<
    FeePaymentOnlineAttributes,
    'id' | 'payment_id' | 'gateway_charges' | 'bank_account_id' | 'gateway_response' | 'voucher_id'
  > {}

export class FeePaymentOnline
  extends Model<FeePaymentOnlineAttributes, FeePaymentOnlineCreationAttributes>
  implements FeePaymentOnlineAttributes
{
  public id!: number;
  public student_id!: number;
  public order_id!: string;
  public payment_id!: string | null;
  public amount!: number;
  public status!: 'INITIATED' | 'SUCCESS' | 'FAILED';
  public gateway_charges!: number | null;
  public bank_account_id!: number | null;
  public merchant_id!: string | null;
  public gateway_response!: any | null;
  public voucher_id!: number | null;
}

export function defineFeePaymentOnline(sequelize: Sequelize) {
  FeePaymentOnline.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      payment_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('INITIATED', 'SUCCESS', 'FAILED'),
        allowNull: false,
      },
      gateway_charges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      merchant_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bank_account_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      gateway_response: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      voucher_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },      
    },
    {
      sequelize,
      tableName: 'fee_payments_online',
      timestamps: false,
    }
  );

  return FeePaymentOnline;
}