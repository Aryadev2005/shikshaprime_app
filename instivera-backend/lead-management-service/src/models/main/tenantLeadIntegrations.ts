import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface TenantLeadIntegrationAttributes {
  id: number;
  tenant_id: number;
  channel: 'FB' | 'GOOGLE' | 'WHATSAPP';
  api_key?: string | null;
  api_secret?: string | null;
  config_json?: any | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface TenantLeadIntegrationCreationAttributes
  extends Optional<
    TenantLeadIntegrationAttributes,
    'id' | 'api_key' | 'api_secret' | 'config_json' | 'is_active'
  > {}

export class TenantLeadIntegration
  extends Model<
    TenantLeadIntegrationAttributes,
    TenantLeadIntegrationCreationAttributes
  >
  implements TenantLeadIntegrationAttributes
{
  public id!: number;
  public tenant_id!: number;
  public channel!: 'FB' | 'GOOGLE' | 'WHATSAPP';
  public api_key!: string | null;
  public api_secret!: string | null;
  public config_json!: any | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineTenantLeadIntegration(sequelize: Sequelize) {
  TenantLeadIntegration.init(
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
      channel: {
        type: DataTypes.ENUM('FB', 'GOOGLE', 'WHATSAPP'),
        allowNull: false
      },
      api_key: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      api_secret: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      config_json: {
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
      tableName: 'tenant_lead_integrations',
      timestamps: true,
      underscored: true
    }
  );

  return TenantLeadIntegration;
}