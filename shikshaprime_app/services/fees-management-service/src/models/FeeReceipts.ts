import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
  Association,
  HasManyGetAssociationsMixin,
  BelongsToGetAssociationMixin
} from "sequelize";
import { FeeReceiptItem } from "./FeeReceiptItems";
import { Student } from "./Student";


export interface FeeReceiptAttributes {
  id: number;
  receipt_no: string;
  student_id?: number | null;
  academic_year_id: number;
  payment_mode: "CASH" | "BANK" | "ONLINE" | "CHEQUE";
  bank_account_id?: number | null;
  total_amount: number;
  voucher_id?: number | null;
  reference_no?: string | null;
  narration?: string | null;
  collected_by: number;
  collected_at: Date;
}

export interface FeeReceiptCreationAttributes
  extends Optional<
    FeeReceiptAttributes,
    "id" | "bank_account_id" | "voucher_id" | "reference_no" | "narration"
  > {}

export class FeeReceipt
  extends Model<FeeReceiptAttributes, FeeReceiptCreationAttributes>
  implements FeeReceiptAttributes
{
  public id!: number;
  public receipt_no!: string;
  public student_id!: number | null;
  public academic_year_id!: number;
  public payment_mode!: "CASH" | "BANK" | "ONLINE" | "CHEQUE";
  public bank_account_id!: number | null;
  public total_amount!: number;
  public voucher_id!: number | null;
  public reference_no!: string | null;
  public narration!: string | null;
  public collected_by!: number;
  public collected_at!: Date;

  public fee_receipt_items?: FeeReceiptItem[];
  public student?: Student;

  public getFee_receipt_items!: HasManyGetAssociationsMixin<FeeReceiptItem>;
  public getStudent!: BelongsToGetAssociationMixin<Student>;


  public static associations: {
    fee_receipt_items: Association<FeeReceipt, FeeReceiptItem>;
    student: Association<FeeReceipt, Student>;
  };
}

export function defineFeeReceipt(sequelize: Sequelize) {
  FeeReceipt.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      receipt_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      payment_mode: {
        type: DataTypes.ENUM("CASH", "BANK", "ONLINE", "CHEQUE"),
        allowNull: false,
      },
      bank_account_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      voucher_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      reference_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      narration: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      collected_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      collected_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "fee_receipts",
      timestamps: false,
    }
  );

  return FeeReceipt;
}
