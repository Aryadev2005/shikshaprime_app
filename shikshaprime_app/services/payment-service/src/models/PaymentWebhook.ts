import { DataTypes, Model, Sequelize } from "sequelize";

export interface PaymentWebhookAttributes {
  id?: number;
  payment_id: number;
  webhook_event?: string;
  gateway_response?: any;
  received_at?: Date;
  processed_at?: Date;
  status?: 'received' | 'processed' | 'failed';
  error_message?: string;
}

class PaymentWebhook extends Model<PaymentWebhookAttributes> implements PaymentWebhookAttributes {
  public id!: number;
  public payment_id!: number;
  public webhook_event!: string;
  public gateway_response!: any;
  public received_at!: Date;
  public processed_at!: Date;
  public status!: 'received' | 'processed' | 'failed';
  public error_message!: string;
}
export function definePaymentWebhook(sequelize: Sequelize) {
PaymentWebhook.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    webhook_event: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    gateway_response: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    received_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('received', 'processed', 'failed'),
      defaultValue: 'received',
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "payment_webhooks",
    timestamps: false,
  }
);
return PaymentWebhook;
}