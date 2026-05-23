import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface FeeReceiptItemAttributes {
  id: number;
  receipt_id: number;
  fee_head_id?: number | null;
  amount: number;
  discount_amount: number;
  fine_amount: number;
}

export interface FeeReceiptItemCreationAttributes
  extends Optional<FeeReceiptItemAttributes, 'id'> {}

export class FeeReceiptItem
  extends Model<FeeReceiptItemAttributes, FeeReceiptItemCreationAttributes>
  implements FeeReceiptItemAttributes
{
  public id!: number;
  public receipt_id!: number;
  public fee_head_id!: number | null;
  public amount!: number;
  public discount_amount!: number;
  public fine_amount!: number;
}

export function defineFeeReceiptItem(sequelize: Sequelize) {
  FeeReceiptItem.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      receipt_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      fee_head_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      fine_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },      
    },
    {
      sequelize,
      tableName: 'fee_receipt_items',
      timestamps: false,
    }
  );

  return FeeReceiptItem;
}