import { DataTypes, Model, Sequelize } from 'sequelize';

export interface PaymentTypeAttributes {
  id?: number;
  fee_head_id: number;
  name: string;
  description?: string;
  amount?: number | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class PaymentType extends Model<PaymentTypeAttributes> implements PaymentTypeAttributes {
  public id!: number;
  public fee_head_id!: number;
  public name!: string;
  public description!: string;
  public amount!: number | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function definePaymentType(sequelize: Sequelize) {
  PaymentType.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fee_head_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "payment_types",
      timestamps: false,
    }
  );
  return PaymentType;
}