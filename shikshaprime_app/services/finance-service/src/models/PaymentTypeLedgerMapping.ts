import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

interface PaymentTypeLedgerMappingAttributes {
  id: number;
  payment_type_id: number;
  ledger_id: number;
  is_active: number;
}

interface PaymentTypeLedgerMappingCreationAttributes
  extends Optional<PaymentTypeLedgerMappingAttributes, 'id'> {}

export class PaymentTypeLedgerMapping
  extends Model<
    PaymentTypeLedgerMappingAttributes,
    PaymentTypeLedgerMappingCreationAttributes
  >
  implements PaymentTypeLedgerMappingAttributes {
  public id!: number;
  public payment_type_id!: number;
  public ledger_id!: number;
  public is_active!: number;
}

export function definePaymentTypeLedgerMapping(sequelize: Sequelize) {
  PaymentTypeLedgerMapping.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      payment_type_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      ledger_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'payment_type_ledger_mapping',
      timestamps: false,
    }
  );

  return PaymentTypeLedgerMapping;
}