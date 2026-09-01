import { DataTypes, Model, Sequelize } from "sequelize";

export interface PaymentAttributes {
  id?: number;
  registration_id: number;
  merchant_id: string;
  fee_type: "ADMISSION" | "REGISTRATION" | "COURSE" | "EXAM";
  amount: number;
  currency?: string;
  payment_mode: "UPI" | "DEBIT_CARD" | "CREDIT_CARD" | "NET_BANKING" | "UNKNOWN";
  gateway_transaction_id?: string | null;
  status: "INITIATED" | "SUCCESS" | "FAILED" | "REFUNDED";
  receipt_no?: string | null;
  receipt_pdf_url?: string | null;
  paid_at?: Date | null;
  voucher_id?: number | null;
  receipt_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export class Payment
  extends Model<PaymentAttributes>
  implements PaymentAttributes
{
  public id!: number;
  public registration_id!: number;
  public merchant_id!: string;
  public fee_type!: "ADMISSION" | "REGISTRATION" | "COURSE" | "EXAM";
  public amount!: number;
  public currency!: string;
  public payment_mode!: "UPI" | "DEBIT_CARD" | "CREDIT_CARD" | "NET_BANKING" | "UNKNOWN";
  public gateway_transaction_id!: string | null;
  public status!: "INITIATED" | "SUCCESS" | "FAILED" | "REFUNDED";
  public receipt_no!: string | null;
  public receipt_pdf_url!: string | null;
  public paid_at!: Date | null;
  public voucher_id!: number | null;
  public receipt_id!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
}

export function definePayment(sequelize: Sequelize) {
  Payment.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      registration_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      merchant_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      fee_type: {
        type: DataTypes.ENUM("ADMISSION", "REGISTRATION", "COURSE", "EXAM"),
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      currency: {
        type: DataTypes.STRING(8),
        allowNull: false,
        defaultValue: "INR",
      },

      payment_mode: {
        type: DataTypes.ENUM(
          "UPI",
          "DEBIT_CARD",
          "CREDIT_CARD",
          "NET_BANKING",
          "UNKNOWN"
        ),
        allowNull: false,
        defaultValue: "UNKNOWN",
      },

      gateway_transaction_id: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("INITIATED", "SUCCESS", "FAILED", "REFUNDED"),
        allowNull: false,
        defaultValue: "INITIATED",
      },

      receipt_no: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },

      receipt_pdf_url: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },

      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      voucher_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      receipt_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "payments",
      timestamps: false,
    }
  );

  return Payment;
}