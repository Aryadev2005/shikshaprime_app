import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { Voucher } from './Voucher';

interface VoucherEntryAttributes {
  id: number;
  voucher_id: number;
  ledger_id: number;
  debit_amount?: number | null;
  credit_amount?: number | null;
  particulars?: string | null;
}

interface VoucherEntryCreationAttributes
  extends Optional<VoucherEntryAttributes, 'id' | 'particulars'> {}

export class VoucherEntry
  extends Model<VoucherEntryAttributes, VoucherEntryCreationAttributes>
  implements VoucherEntryAttributes {
  public id!: number;
  public voucher_id!: number;
  public ledger_id!: number;
  public debit_amount!: number | null;
  public credit_amount!: number | null;
  public particulars!: string | null;

  public voucher?: Voucher; 

  public total_debit?: number;
  public total_credit?: number;
}

export function defineVoucherEntry(sequelize: Sequelize) {
  VoucherEntry.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      voucher_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      ledger_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      debit_amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
      },
      credit_amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
      },
      particulars: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'voucher_entries',
      timestamps: false,
    }
  );

  return VoucherEntry;
}