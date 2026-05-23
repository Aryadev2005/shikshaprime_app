import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

interface BankAttributes {
  id: number;
  bank_name: string;
  bank_code: string;
  ifsc_prefix: string;
  is_active: number;
}

interface BankCreationAttributes
  extends Optional<BankAttributes, 'id'> {}

export class Bank extends Model<BankAttributes, BankCreationAttributes>
  implements BankAttributes {
  public id!: number;
  public bank_name!: string;
  public bank_code!: string;
  public ifsc_prefix!: string;
  public is_active!: number;
}

export function defineBank(sequelize: Sequelize) {
  Bank.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      bank_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      ifsc_prefix: {
        type: DataTypes.STRING(4),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'banks',
      timestamps: false,
    }
  );
  return Bank;
}