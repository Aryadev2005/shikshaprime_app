import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacExtensionActivityAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  activity_name: string;
  activity_type?: string | null;
  organizing_unit?: string | null;
  description?: string | null;
  beneficiary_count?: number | null;
  activity_date?: Date | null;
  location?: string | null;
  report_url?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacExtensionActivityCreationAttributes
  extends Optional<
    NaacExtensionActivityAttributes,
    | "id"
    | "academic_year_id"
    | "activity_type"
    | "organizing_unit"
    | "description"
    | "beneficiary_count"
    | "activity_date"
    | "location"
    | "report_url"
    | "naac_metric_ref"
    | "created_at"
    | "updated_at"
  > {}

class NaacExtensionActivity
  extends Model<
    NaacExtensionActivityAttributes,
    NaacExtensionActivityCreationAttributes
  >
  implements NaacExtensionActivityAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public activity_name!: string;
  public activity_type?: string | null;
  public organizing_unit?: string | null;
  public description?: string | null;
  public beneficiary_count?: number | null;
  public activity_date?: Date | null;
  public location?: string | null;
  public report_url?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacExtensionActivity {
    NaacExtensionActivity.init(
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

        activity_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        activity_type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },

        organizing_unit: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },

        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        beneficiary_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        activity_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },

        location: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        report_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        naac_metric_ref: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },

        status: {
                  type: DataTypes.ENUM('SAVED', 'FINAL'),
                  allowNull: false,
                  defaultValue: 'SAVED',
                },

        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_extension_activities",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacExtensionActivity;
  }

  static associate(_models: any) {}
}

export default NaacExtensionActivity;