import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

interface LedgerAttributes {
  id: number;
  group_id: number;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'CAPITAL';
  opening_balance?: number | null;
  is_system: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

interface LedgerCreationAttributes
  extends Optional<LedgerAttributes, 'id' | 'opening_balance'> {}

export class Ledger
  extends Model<LedgerAttributes, LedgerCreationAttributes>
  implements LedgerAttributes {
  public id!: number;
  public group_id!: number;
  public name!: string;
  public type!: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'CAPITAL';
  public opening_balance!: number | null;
  public is_system!: number;
  public is_active!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineLedger(sequelize: Sequelize) {
  Ledger.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      group_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'CAPITAL'),
        allowNull: false,
      },
      opening_balance: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
      },
      is_system: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'ledgers',
      timestamps: false,
    }
  );

  return Ledger;
}