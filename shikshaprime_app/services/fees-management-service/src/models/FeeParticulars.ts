import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface FeeParticularAttributes {
  id: number;
  fee_head_id: number;
  academic_year_id: number;
  program_id: number;
  semester_id?: number | null;
  amount: number;
  is_optional: number;
  created_at: Date;
  updated_at: Date;
}

export interface FeeParticularCreationAttributes
  extends Optional<FeeParticularAttributes, 'id' | 'semester_id'> {}

export class FeeParticular
  extends Model<FeeParticularAttributes, FeeParticularCreationAttributes>
  implements FeeParticularAttributes
{
  public id!: number;
  public fee_head_id!: number;
  public academic_year_id!: number;
  public program_id!: number;
  public semester_id!: number | null;
  public amount!: number;
  public is_optional!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineFeeParticular(sequelize: Sequelize) {
  FeeParticular.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      fee_head_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      is_optional: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
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
      tableName: 'fee_particulars',
      timestamps: false,
    }
  );

  return FeeParticular;
}