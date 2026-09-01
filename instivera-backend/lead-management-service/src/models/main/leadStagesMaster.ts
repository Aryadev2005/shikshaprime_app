import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadStageAttributes {
  id: number;
  stage_code: string;
  description?: string | null;
  order_no: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface LeadStageCreationAttributes
  extends Optional<LeadStageAttributes, 'id' | 'description' | 'is_active'> {}

export class LeadStage
  extends Model<LeadStageAttributes, LeadStageCreationAttributes>
  implements LeadStageAttributes
{
  public id!: number;
  public stage_code!: string;
  public description!: string | null;
  public order_no!: number;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineLeadStage(sequelize: Sequelize) {
  LeadStage.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      stage_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      order_no: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      tableName: 'lead_stages_master',
      timestamps: true,
      underscored: true
    }
  );

  return LeadStage;
}