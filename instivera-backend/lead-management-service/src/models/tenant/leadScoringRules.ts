import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadScoringRuleAttributes {
  id: number;
  rule_name: string;
  points: number;
  condition_type: 'FIELD' | 'EVENT' | 'AI';
  condition_key: string;
  condition_value?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface LeadScoringRuleCreationAttributes
  extends Optional<LeadScoringRuleAttributes, 'id' | 'condition_value' | 'is_active'> {}

export class LeadScoringRule
  extends Model<LeadScoringRuleAttributes, LeadScoringRuleCreationAttributes>
  implements LeadScoringRuleAttributes
{
  public id!: number;
  public rule_name!: string;
  public points!: number;
  public condition_type!: 'FIELD' | 'EVENT' | 'AI';
  public condition_key!: string;
  public condition_value!: string | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineLeadScoringRule(sequelize: Sequelize) {
  LeadScoringRule.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      rule_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      points: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      condition_type: {
        type: DataTypes.ENUM('FIELD', 'EVENT', 'AI'),
        allowNull: false
      },
      condition_key: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      condition_value: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      tableName: 'lead_scoring_rules',
      timestamps: true,
      underscored: true
    }
  );

  return LeadScoringRule;
}