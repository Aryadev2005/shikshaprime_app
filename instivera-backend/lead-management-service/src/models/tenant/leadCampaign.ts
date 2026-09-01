import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadCampaignAttributes {
  id: number;
  campaign_name: string;
  channel: 'FB' | 'GOOGLE' | 'INSTAGRAM' | 'LINKEDIN' | 'SEMINAR' | 'FAIR' | 'ROADSHOW' | 'OTHER';
  start_date?: Date | null;
  end_date?: Date | null;
  budget?: number | null;
  leads_generated?: number | null;
  cost_per_lead?: number | null;
  conversion_rate?: number | null;
  created_at?: Date;
}

export interface LeadCampaignCreationAttributes
  extends Optional<
    LeadCampaignAttributes,
    | 'id'
    | 'start_date'
    | 'end_date'
    | 'budget'
    | 'leads_generated'
    | 'cost_per_lead'
    | 'conversion_rate'
  > {}

export class LeadCampaign
  extends Model<LeadCampaignAttributes, LeadCampaignCreationAttributes>
  implements LeadCampaignAttributes
{
  public id!: number;
  public campaign_name!: string;
  public channel!: 'FB' | 'GOOGLE' | 'INSTAGRAM' | 'LINKEDIN' | 'SEMINAR' | 'FAIR' | 'ROADSHOW' | 'OTHER';
  public start_date!: Date | null;
  public end_date!: Date | null;
  public budget!: number | null;
  public leads_generated!: number | null;
  public cost_per_lead!: number | null;
  public conversion_rate!: number | null;
  public created_at!: Date;
}

export function defineLeadCampaign(sequelize: Sequelize) {
  LeadCampaign.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      campaign_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      channel: {
        type: DataTypes.ENUM(
          'FB',
          'GOOGLE',
          'INSTAGRAM',
          'LINKEDIN',
          'SEMINAR',
          'FAIR',
          'ROADSHOW',
          'OTHER'
        ),
        allowNull: false
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      budget: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      leads_generated: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      cost_per_lead: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      conversion_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'lead_campaigns',
      timestamps: false,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true
    }
  );

  return LeadCampaign;
}