import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadCommunicationAttributes {
  id: number;
  lead_id: number;
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP';
  template_id?: number | null;
  message_body?: string | null;
  notes?: string | null;
  sent_at: Date;
  delivery_status: 'SENT' | 'FAILED' | 'DELIVERED';
}

export interface LeadCommunicationCreationAttributes
  extends Optional<
    LeadCommunicationAttributes,
    'id' | 'template_id' | 'message_body' | 'sent_at' | 'delivery_status'
  > {}

export class LeadCommunication
  extends Model<LeadCommunicationAttributes, LeadCommunicationCreationAttributes>
  implements LeadCommunicationAttributes
{
  public id!: number;
  public lead_id!: number;
  public channel!: 'SMS' | 'EMAIL' | 'WHATSAPP';
  public template_id!: number | null;
  public message_body!: string | null;
  public notes!: string | null;
  public sent_at!: Date;
  public delivery_status!: 'SENT' | 'FAILED' | 'DELIVERED';
}

export function defineLeadCommunication(sequelize: Sequelize) {
  LeadCommunication.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      lead_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      channel: {
        type: DataTypes.ENUM('SMS', 'EMAIL', 'WHATSAPP'),
        allowNull: false
      },
      template_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      message_body: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      delivery_status: {
        type: DataTypes.ENUM('SENT', 'FAILED', 'DELIVERED'),
        allowNull: false,
        defaultValue: 'SENT'
      }
    },
    {
      sequelize,
      tableName: 'lead_communications',
      timestamps: false,
      underscored: true
    }
  );

  return LeadCommunication;
}