import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacBestPracticeAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  title: string;
  context?: string | null;
  objectives?: string | null;
  implementation?: string | null;
  impact?: string | null;
  resources_required?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacBestPracticeCreationAttributes
  extends Optional<
    NaacBestPracticeAttributes,
    | "id"
    | "academic_year_id"
    | "context"
    | "objectives"
    | "implementation"
    | "impact"
    | "resources_required"
    | "naac_metric_ref"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

class NaacBestPractice
  extends Model<
    NaacBestPracticeAttributes,
    NaacBestPracticeCreationAttributes
  >
  implements NaacBestPracticeAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public title!: string;
  public context?: string | null;
  public objectives?: string | null;
  public implementation?: string | null;
  public impact?: string | null;
  public resources_required?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacBestPractice {
    NaacBestPractice.init(
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

        title: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        context: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        objectives: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        implementation: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        impact: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        resources_required: {
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
        tableName: "naac_best_practices",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacBestPractice;
  }

  static associate(_models: any) {}
}

export default NaacBestPractice;