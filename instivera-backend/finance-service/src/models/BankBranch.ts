import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

interface BankBranchAttributes {
  id: number;
  bank_id: number;
  branch_name?: string | null;
  branch_address?: string | null;
  ifsc_code?: string | null;
  micr_code?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  is_active: number;
}

interface BankBranchCreationAttributes
  extends Optional<
    BankBranchAttributes,
    | 'id'
    | 'branch_name'
    | 'branch_address'
    | 'ifsc_code'
    | 'micr_code'
    | 'contact_person'
    | 'contact_phone'
  > {}

export class BankBranch
  extends Model<BankBranchAttributes, BankBranchCreationAttributes>
  implements BankBranchAttributes {
  public id!: number;
  public bank_id!: number;
  public branch_name!: string | null;
  public branch_address!: string | null;
  public ifsc_code!: string | null;
  public micr_code!: string | null;
  public contact_person!: string | null;
  public contact_phone!: string | null;
  public is_active!: number;
}

export function defineBankBranch(sequelize: Sequelize) {
  BankBranch.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      bank_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      branch_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      branch_address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ifsc_code: {
        type: DataTypes.STRING(11),
        allowNull: true,
      },
      micr_code: {
        type: DataTypes.STRING(9),
        allowNull: true,
      },
      contact_person: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'bank_branches',
      timestamps: false,
    }
  );
  return BankBranch;
}