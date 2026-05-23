import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

interface LedgerBalanceCacheAttributes {
  id: number;
  ledger_id: number;
  opening_balance: number;
  current_balance: number;
  updated_at: Date;
}

interface LedgerBalanceCacheCreationAttributes
  extends Optional<LedgerBalanceCacheAttributes, 'id'> {}

export class LedgerBalanceCache
  extends Model<
    LedgerBalanceCacheAttributes,
    LedgerBalanceCacheCreationAttributes
  >
  implements LedgerBalanceCacheAttributes {
  public id!: number;
  public ledger_id!: number;
  public opening_balance!: number;
  public current_balance!: number;
  public updated_at!: Date;
}

export function defineLedgerBalanceCache(sequelize: Sequelize) {
  LedgerBalanceCache.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      ledger_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      opening_balance: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
      },
      current_balance: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'ledger_balances_cache',
      timestamps: false,
    }
  );

  return LedgerBalanceCache;
}