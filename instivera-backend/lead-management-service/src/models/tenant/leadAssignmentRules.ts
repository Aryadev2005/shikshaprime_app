import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadAssignmentRuleAttributes {
  id: number;
  rule_type: 'ROUND_ROBIN' | 'LOAD_BALANCED' | 'TERRITORY' | 'COURSE' | 'SOURCE_BASED' | 'AI';
  source_code?: string | null;
  territory?: string | null;
  course_category?: string | null;
  counsellor_ids?: any | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface LeadAssignmentRuleCreationAttributes
  extends Optional<
    LeadAssignmentRuleAttributes,
    'id' | 'source_code' | 'territory' | 'course_category' | 'counsellor_ids' | 'is_active'
  > {}

export class LeadAssignmentRule
  extends Model<LeadAssignmentRuleAttributes, LeadAssignmentRuleCreationAttributes>
  implements LeadAssignmentRuleAttributes
{
  public id!: number;
  public rule_type!: 'ROUND_ROBIN' | 'LOAD_BALANCED' | 'TERRITORY' | 'COURSE' | 'SOURCE_BASED' | 'AI';
  public source_code!: string | null;
  public territory!: string | null;
  public course_category!: string | null;
  public counsellor_ids!: any | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineLeadAssignmentRule(sequelize: Sequelize) {
  LeadAssignmentRule.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      rule_type: {
        type: DataTypes.ENUM(
          'ROUND_ROBIN',
          'LOAD_BALANCED',
          'TERRITORY',
          'COURSE',
          'SOURCE_BASED',
          'AI'
        ),
        allowNull: false
      },
      source_code: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      territory: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      course_category: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      counsellor_ids: {
        type: DataTypes.JSON,
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
      tableName: 'lead_assignment_rules',
      timestamps: false,
      underscored: true
    }
  );

  return LeadAssignmentRule;
}