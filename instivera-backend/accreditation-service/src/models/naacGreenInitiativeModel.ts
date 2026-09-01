import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacGreenInitiativeAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  initiative_name: string;
  initiative_type?: string | null;
  description?: string | null;
  investment_amount?: number | null;
  impact_metrics?: string | null;
  photo_url?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacGreenInitiativeCreationAttributes
  extends Optional<
    NaacGreenInitiativeAttributes,
    | "id"
    | "academic_year_id"
    | "initiative_type"
    | "description"
    | "investment_amount"
    | "impact_metrics"
    | "photo_url"
    | "naac_metric_ref"
    | "created_at"
    | "updated_at"
  > {}

class NaacGreenInitiative
  extends Model<
    NaacGreenInitiativeAttributes,
    NaacGreenInitiativeCreationAttributes
  >
  implements NaacGreenInitiativeAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public initiative_name!: string;
  public initiative_type?: string | null;
  public description?: string | null;
  public investment_amount?: number | null;
  public impact_metrics?: string | null;
  public photo_url?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacGreenInitiative {
    NaacGreenInitiative.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },

        tenant_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },

        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        initiative_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        initiative_type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },

        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        investment_amount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
        },

        impact_metrics: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        photo_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        naac_metric_ref: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },

        status: {
                  type: DataTypes.ENUM('SAVED', 'FINAL'),
                  allowNull: false,
                  defaultValue: 'SAVED',
                },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },

        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_green_initiatives",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacGreenInitiative;
  }

  static associate(_models: any) {}
}

export default NaacGreenInitiative;