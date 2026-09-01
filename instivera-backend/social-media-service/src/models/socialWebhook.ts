import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SocialWebhookAttributes {
  id: number;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'x';
  event_type: string;
  payload: any;
  received_at?: Date;
}

export interface SocialWebhookCreationAttributes
  extends Optional<
    SocialWebhookAttributes,
    'id' | 'received_at'
  > {}

class SocialWebhook
  extends Model<SocialWebhookAttributes, SocialWebhookCreationAttributes>
  implements SocialWebhookAttributes
{
  public id!: number;
  public platform!: 'facebook' | 'instagram' | 'linkedin' | 'x';
  public event_type!: string;
  public payload!: any;
  public received_at?: Date;

  static initModel(sequelize: Sequelize): typeof SocialWebhook {
    SocialWebhook.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        platform: {
          type: DataTypes.ENUM('facebook', 'instagram', 'linkedin', 'x'),
          allowNull: false,
        },
        event_type: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        payload: {
          type: DataTypes.JSON,
          allowNull: false,
        },
        received_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "social_webhooks",
        timestamps: false,
        underscored: true,
      }
    );

    return SocialWebhook;
  }

  static associate(models: any) {
    // Define associations here
  }
}

export default SocialWebhook;
