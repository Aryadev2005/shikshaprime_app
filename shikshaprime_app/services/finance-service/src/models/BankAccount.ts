import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

interface BankAccountAttributes {
  id: number;
  bank_id: number;
  branch_id: number;
  ledger_id: number;
  account_name: string;
  account_number: string;
  account_type: 'Savings' | 'Current' | 'Fixed Deposits' | 'Recurring Deposits';
  opening_balance: number;
  opening_balance_date: Date;
  is_primary_account: number;
  is_active: number;
}

interface BankAccountCreationAttributes
  extends Optional<BankAccountAttributes, 'id'> {}

export class BankAccount
  extends Model<BankAccountAttributes, BankAccountCreationAttributes>
  implements BankAccountAttributes {
  public id!: number;
  public bank_id!: number;
  public branch_id!: number;
  public ledger_id!: number;
  public account_name!: string;
  public account_number!: string;
  public account_type!: 'Savings' | 'Current' | 'Fixed Deposits' | 'Recurring Deposits';
  public opening_balance!: number;
  public opening_balance_date!: Date;
  public is_primary_account!: number;
  public is_active!: number;
}

export function defineBankAccount(sequelize: Sequelize) {
  BankAccount.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
      },
      bank_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      branch_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      ledger_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      account_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      account_number: {
        type: DataTypes.STRING(25),
        allowNull: false,
      },
      account_type: {
        type: DataTypes.ENUM(
          'Savings',
          'Current',
          'Fixed Deposits',
          'Recurring Deposits'
        ),
        allowNull: false,
      },
      opening_balance: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
      },
      opening_balance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      is_primary_account: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'bank_accounts',
      timestamps: false,
    }
  );
  return BankAccount;
}