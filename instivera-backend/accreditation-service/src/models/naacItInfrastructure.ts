// ============================================
// Table: naac_it_infrastructure
// File: NaacItInfrastructure.ts
// ============================================

import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacItInfrastructureAttributes {
  id: number;

  tenant_id: number ;
  academic_year_id?: number | null;

  total_computers?: number | null;
  internet_bandwidth_mbps?: number | null;

  wifi_coverage_percent?: number | null;

  smart_classrooms_count?: number | null;

  erp_system_name?: string | null;
  erp_modules_active?: string | null;

  computer_labs_count?: number | null;

  licensed_software?: string | null;

  naac_metric_ref?: string | null;

  created_at?: Date;
  updated_at?: Date;
}

export interface NaacItInfrastructureCreationAttributes
  extends Optional<
    NaacItInfrastructureAttributes,
    | "id"
    | "academic_year_id"
    | "total_computers"
    | "internet_bandwidth_mbps"
    | "wifi_coverage_percent"
    | "smart_classrooms_count"
    | "erp_system_name"
    | "erp_modules_active"
    | "computer_labs_count"
    | "licensed_software"
    | "naac_metric_ref"
    | "created_at"
    | "updated_at"
  > {}

class NaacItInfrastructure
  extends Model<
    NaacItInfrastructureAttributes,
    NaacItInfrastructureCreationAttributes
  >
  implements NaacItInfrastructureAttributes
{
  public id!: number;

  public tenant_id!: number ;
  public academic_year_id?: number | null;

  public total_computers?: number | null;
  public internet_bandwidth_mbps?: number | null;

  public wifi_coverage_percent?: number | null;

  public smart_classrooms_count?: number | null;

  public erp_system_name?: string | null;
  public erp_modules_active?: string | null;

  public computer_labs_count?: number | null;

  public licensed_software?: string | null;

  public naac_metric_ref?: string | null;

  public created_at?: Date;
  public updated_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacItInfrastructure {
    NaacItInfrastructure.init(
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

        total_computers: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        internet_bandwidth_mbps: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        wifi_coverage_percent: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
        },

        smart_classrooms_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        erp_system_name: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        erp_modules_active: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        computer_labs_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        licensed_software: {
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

        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_it_infrastructure",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacItInfrastructure;
  }

  static associate(_models: any) {}
}

export default NaacItInfrastructure;