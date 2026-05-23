import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

interface VoucherAttributes {
  id: number;
  voucher_no: string;
  voucher_type: 'RECEIPT' | 'PAYMENT' | 'CONTRA' | 'JOURNAL' | 'INVOICE';
  voucher_date: Date;
  financial_year_id: number;
  reference_no?: string | null;
  narration?: string | null;
  created_by?: number | null;  
  voided: boolean;
}

interface VoucherCreationAttributes
  extends Optional<VoucherAttributes, 'id' | 'narration' | 'voided'> {}

export class Voucher
  extends Model<VoucherAttributes, VoucherCreationAttributes>
  implements VoucherAttributes {
  public id!: number;
  public voucher_no!: string;
  public voucher_type!: 'RECEIPT' | 'PAYMENT' | 'CONTRA' | 'JOURNAL' | 'INVOICE';
  public voucher_date!: Date;
  public financial_year_id!: number;
  public reference_no!: string | null;
  public narration!: string | null;
  public created_by!: number | null;  
  public voided!: boolean; 

  // Association typing
  public entries?: any[]; 
  public createdByUser?: { email: string };
}

export function defineVoucher(sequelize: Sequelize) {
  Voucher.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      voucher_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      voucher_type: {
        type: DataTypes.ENUM('RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL', 'INVOICE'),
        allowNull: false,
      },
      voucher_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      financial_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      reference_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      narration: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },      
      voided: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    },
    {
      sequelize,
      tableName: 'vouchers',
      timestamps: false,
    }
  );

  return Voucher;
}