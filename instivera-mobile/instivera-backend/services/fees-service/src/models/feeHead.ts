import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface FeeHeadAttributes {
  id: number;
  fee_head_id?: string;
  name: string;
  amount: number;
  academic_year_id?: number;
  program_id?: number;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface FeeHeadCreationAttributes extends Optional<FeeHeadAttributes, 'id'> {}

class FeeHead extends Model<FeeHeadAttributes, FeeHeadCreationAttributes>
  implements FeeHeadAttributes {
  public id!: number;
  public fee_head_id?: string;
  public name!: string;
  public amount!: number;
  public academic_year_id?: number;
  public program_id?: number;
  public is_active?: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineFeeHead(sequelize: Sequelize) {
  FeeHead.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      fee_head_id: { type: DataTypes.STRING(100), allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      academic_year_id: { type: DataTypes.BIGINT, allowNull: true },
      program_id: { type: DataTypes.BIGINT, allowNull: true },
      is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    },
    { sequelize, tableName: 'fee_heads', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
  return FeeHead;
}
