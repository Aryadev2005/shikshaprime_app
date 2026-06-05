import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface LedgerEntryAttributes {
  id: number;
  student_id: string;
  date?: Date;
  description?: string;
  debit?: number;
  credit?: number;
  balance?: number;
  created_at?: Date;
}

export interface LedgerEntryCreationAttributes extends Optional<LedgerEntryAttributes, 'id'> {}

class LedgerEntry extends Model<LedgerEntryAttributes, LedgerEntryCreationAttributes>
  implements LedgerEntryAttributes {
  public id!: number;
  public student_id!: string;
  public date?: Date;
  public description?: string;
  public debit?: number;
  public credit?: number;
  public balance?: number;
  public created_at?: Date;
}

export function defineLedgerEntry(sequelize: Sequelize) {
  LedgerEntry.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      student_id: { type: DataTypes.STRING(50), allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: true },
      description: { type: DataTypes.STRING(500), allowNull: true },
      debit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      credit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
      balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    },
    { sequelize, tableName: 'ledger_entries', timestamps: true, createdAt: 'created_at', updatedAt: false }
  );
  return LedgerEntry;
}
