import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadFollowupAttributes {
  id: number;
  lead_id: number;
  counsellor_id: number;
  followup_type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'VISIT' | 'COUNSELLING';
  notes?: string | null;
  followup_date: Date;
  next_followup_date?: Date | null;
  status: 'DONE' | 'PENDING' | 'MISSED';
  ai_call_summary?: string | null;
  ai_sentiment?: string | null;
  created_at?: Date;
}

export interface LeadFollowupCreationAttributes
  extends Optional<
    LeadFollowupAttributes,
    'id' | 'notes' | 'next_followup_date' | 'status' | 'ai_call_summary' | 'ai_sentiment'
  > {}

export class LeadFollowup
  extends Model<LeadFollowupAttributes, LeadFollowupCreationAttributes>
  implements LeadFollowupAttributes
{
  public id!: number;
  public lead_id!: number;
  public counsellor_id!: number;
  public followup_type!: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'VISIT' | 'COUNSELLING';
  public notes!: string | null;
  public followup_date!: Date;
  public next_followup_date!: Date | null;
  public status!: 'DONE' | 'PENDING' | 'MISSED';
  public ai_call_summary!: string | null;
  public ai_sentiment!: string | null;
  public created_at!: Date;
}

export function defineLeadFollowup(sequelize: Sequelize) {
  LeadFollowup.init(
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
      counsellor_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      followup_type: {
        type: DataTypes.ENUM('CALL', 'WHATSAPP', 'EMAIL', 'SMS', 'VISIT', 'COUNSELLING'),
        allowNull: false
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      followup_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      next_followup_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('DONE', 'PENDING', 'MISSED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      ai_call_summary: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ai_sentiment: {
        type: DataTypes.STRING(50),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'lead_followups',
      timestamps: false,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true
    }
  );

  return LeadFollowup;
}