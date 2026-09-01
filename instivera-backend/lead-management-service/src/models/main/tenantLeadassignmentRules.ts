import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface TenantLeadAssignmentRuleAttributes {
  id: number;
  tenant_id: number;
  rule_type: 'ROUND_ROBIN' | 'LOAD_BALANCED' | 'SOURCE_BASED';
  source_code?: string | null;
  counsellor_ids?: any | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface TenantLeadAssignmentRuleCreationAttributes
  extends Optional<
    TenantLeadAssignmentRuleAttributes,
    'id' | 'source_code' | 'counsellor_ids' | 'is_active'
  > {}

export class TenantLeadAssignmentRule
  extends Model<
    TenantLeadAssignmentRuleAttributes,
    TenantLeadAssignmentRuleCreationAttributes
  >
  implements TenantLeadAssignmentRuleAttributes
{
  public id!: number;
  public tenant_id!: number;
  public rule_type!: 'ROUND_ROBIN' | 'LOAD_BALANCED' | 'SOURCE_BASED';
  public source_code!: string | null;
  public counsellor_ids!: any | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineTenantLeadAssignmentRule(sequelize: Sequelize) {
  TenantLeadAssignmentRule.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      tenant_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      rule_type: {
        type: DataTypes.ENUM('ROUND_ROBIN', 'LOAD_BALANCED', 'SOURCE_BASED'),
        allowNull: false
      },
      source_code: {
        type: DataTypes.STRING(50),
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
      tableName: 'tenant_lead_assignment_rules',
      timestamps: true,
      underscored: true
    }
  );

  return TenantLeadAssignmentRule;
}