import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface TenantLeadSettingsAttributes {
  id: number;
  tenant_id: number;
  auto_assign_enabled: boolean;
  default_assignment_rule: 'ROUND_ROBIN' | 'LOAD_BALANCED' | 'MANUAL';
  welcome_message_enabled: boolean;
  auto_reminder_enabled: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface TenantLeadSettingsCreationAttributes
  extends Optional<
    TenantLeadSettingsAttributes,
    'id' | 'auto_assign_enabled' | 'welcome_message_enabled' | 'auto_reminder_enabled'
  > {}

export class TenantLeadSettings
  extends Model<
    TenantLeadSettingsAttributes,
    TenantLeadSettingsCreationAttributes
  >
  implements TenantLeadSettingsAttributes
{
  public id!: number;
  public tenant_id!: number;
  public auto_assign_enabled!: boolean;
  public default_assignment_rule!: 'ROUND_ROBIN' | 'LOAD_BALANCED' | 'MANUAL';
  public welcome_message_enabled!: boolean;
  public auto_reminder_enabled!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineTenantLeadSettings(sequelize: Sequelize) {
  TenantLeadSettings.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      tenant_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true
      },
      auto_assign_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      default_assignment_rule: {
        type: DataTypes.ENUM('ROUND_ROBIN', 'LOAD_BALANCED', 'MANUAL'),
        allowNull: false,
        defaultValue: 'MANUAL'
      },
      welcome_message_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      auto_reminder_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      tableName: 'tenant_lead_settings',
      timestamps: true,
      underscored: true
    }
  );

  return TenantLeadSettings;
}