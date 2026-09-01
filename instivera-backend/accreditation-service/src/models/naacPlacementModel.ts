import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacPlacementAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  student_id?: number | null;
  company_name: string;
  job_role?: string | null;
  package_lpa?: number | null;
  placement_type?: string | null;
  higher_studies_institution?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
}

export interface NaacPlacementCreationAttributes
  extends Optional<
    NaacPlacementAttributes,
    | "id"
    | "academic_year_id"
    | "student_id"
    | "job_role"
    | "package_lpa"
    | "placement_type"
    | "higher_studies_institution"
    | "naac_metric_ref"
    | "status"
    | "created_at"
  > {}

class NaacPlacement
  extends Model<
    NaacPlacementAttributes,
    NaacPlacementCreationAttributes
  >
  implements NaacPlacementAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public student_id?: number | null;
  public company_name!: string;
  public job_role?: string | null;
  public package_lpa?: number | null;
  public placement_type?: string | null;
  public higher_studies_institution?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacPlacement {
    NaacPlacement.init(
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

        student_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        company_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        job_role: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        package_lpa: {
          type: DataTypes.DECIMAL(8, 2),
          allowNull: true,
        },

        placement_type: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },

        higher_studies_institution: {
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
      },
      {
        sequelize,
        tableName: "naac_placements",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacPlacement;
  }

  static associate(_models: any) {}
}

export default NaacPlacement;