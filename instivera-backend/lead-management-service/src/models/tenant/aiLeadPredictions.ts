import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface AiLeadPredictionAttributes {
  id: number;
  lead_id: number;
  lead_score?: number | null;
  admission_probability?: number | null;
  dropout_risk?: number | null;
  sentiment?: string | null;
  next_best_action?: string | null;
  scholarship_recommendation?: string | null;
  generated_at?: Date;
}

export interface AiLeadPredictionCreationAttributes
  extends Optional<
    AiLeadPredictionAttributes,
    | 'id'
    | 'lead_score'
    | 'admission_probability'
    | 'dropout_risk'
    | 'sentiment'
    | 'next_best_action'
    | 'scholarship_recommendation'
    | 'generated_at'
  > {}

export class AiLeadPrediction
  extends Model<AiLeadPredictionAttributes, AiLeadPredictionCreationAttributes>
  implements AiLeadPredictionAttributes
{
  public id!: number;
  public lead_id!: number;
  public lead_score!: number | null;
  public admission_probability!: number | null;
  public dropout_risk!: number | null;
  public sentiment!: string | null;
  public next_best_action!: string | null;
  public scholarship_recommendation!: string | null;
  public generated_at!: Date;
}

export function defineAiLeadPrediction(sequelize: Sequelize) {
  AiLeadPrediction.init(
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
      lead_score: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      admission_probability: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      dropout_risk: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      sentiment: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      next_best_action: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      scholarship_recommendation: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      generated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'ai_lead_predictions',
      timestamps: false,
      underscored: true
    }
  );

  return AiLeadPrediction;
}