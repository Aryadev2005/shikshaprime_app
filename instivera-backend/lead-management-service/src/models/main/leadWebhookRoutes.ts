import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadWebhookRouteAttributes {
  id: number;
  tenant_id: number;
  channel: 'FB' | 'GOOGLE' | 'WHATSAPP';
  external_identifier: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface LeadWebhookRouteCreationAttributes
  extends Optional<LeadWebhookRouteAttributes, 'id'> {}

export class LeadWebhookRoute
  extends Model<
    LeadWebhookRouteAttributes,
    LeadWebhookRouteCreationAttributes
  >
  implements LeadWebhookRouteAttributes
{
  public id!: number;
  public tenant_id!: number;
  public channel!: 'FB' | 'GOOGLE' | 'WHATSAPP';
  public external_identifier!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineLeadWebhookRoute(sequelize: Sequelize) {
  LeadWebhookRoute.init(
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
      external_identifier: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      }
    },
    {
      sequelize,
      tableName: 'lead_webhook_routes',
      timestamps: true,
      underscored: true
    }
  );

  return LeadWebhookRoute;
}