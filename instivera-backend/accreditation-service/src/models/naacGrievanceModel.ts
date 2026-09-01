import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacGrievanceAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  grievance_type?: string | null;
  total_received?: number | null;
  total_resolved?: number | null;
  total_pending?: number | null;
  avg_resolution_days?: number | null;
  committee_name?: string | null;
  portal_link?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacGrievanceCreationAttributes
  extends Optional<
    NaacGrievanceAttributes,
    | "id"
    | "academic_year_id"
    | "grievance_type"
    | "total_received"
    | "total_resolved"
    | "total_pending"
    | "avg_resolution_days"
    | "committee_name"
    | "portal_link"
    | "naac_metric_ref"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

class NaacGrievance
  extends Model<
    NaacGrievanceAttributes,
    NaacGrievanceCreationAttributes
  >
  implements NaacGrievanceAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public grievance_type?: string | null;
  public total_received?: number | null;
  public total_resolved?: number | null;
  public total_pending?: number | null;
  public avg_resolution_days?: number | null;
  public committee_name?: string | null;
  public portal_link?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacGrievance {
    NaacGrievance.init(
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

        grievance_type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },

        total_received: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },

        total_resolved: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },

        total_pending: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },

        avg_resolution_days: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },

        committee_name: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        portal_link: {
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
        tableName: "naac_grievances",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacGrievance;
  }

  static associate(_models: any) {}
}

export default NaacGrievance;