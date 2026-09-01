import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface FeeHeadAttributes {
  id: number;
  name: string;
  description?: string | null;
  ledger_id: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface FeeHeadCreationAttributes
  extends Optional<FeeHeadAttributes, 'id' | 'description'> {}

export class FeeHead
  extends Model<FeeHeadAttributes, FeeHeadCreationAttributes>
  implements FeeHeadAttributes
{
  public id!: number;
  public name!: string;
  public description!: string | null;
  public ledger_id!: number;
  public is_active!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineFeeHead(sequelize: Sequelize) {
  FeeHead.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ledger_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
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
      tableName: 'fee_heads',
      timestamps: false,
    }
  );

  return FeeHead;
}