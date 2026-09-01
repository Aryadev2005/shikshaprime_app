import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacAdmissionAttributes {
  id: number;
  tenant_id: number ;
  admission_process: string;
  eligibility_criteria?: string | null;
  selection_criteria?: string | null;
  entrance_exam_name?: string | null;
  application_start_date?: Date | null;
  application_end_date?: Date | null;
  application_mode?: "online" | "offline" | "both" | null;
  reservation_policy?: string | null;
  total_seats?: number | null;
  application_url?: string | null;
  admission_guidelines_url?: string | null;
  naac_metric_ref?: string | null;
  is_active?: boolean;
  academic_year_id?: number | null;
  program_id?: number | null;
  admission_title: string;
  status?: "SAVED" | "FINAL";
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacAdmissionCreationAttributes
  extends Optional<
    NaacAdmissionAttributes,
    | "id"
    | "eligibility_criteria"
    | "selection_criteria"
    | "entrance_exam_name"
    | "application_start_date"
    | "application_end_date"
    | "application_mode"
    | "reservation_policy"
    | "total_seats"
    | "application_url"
    | "admission_guidelines_url"
    | "naac_metric_ref"
    | "is_active"
    | "academic_year_id"
    | "program_id"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

class NaacAdmission
  extends Model<
    NaacAdmissionAttributes,
    NaacAdmissionCreationAttributes
  >
  implements NaacAdmissionAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public admission_process!: string;
  public eligibility_criteria?: string | null;
  public selection_criteria?: string | null;
  public entrance_exam_name?: string | null;
  public application_start_date?: Date | null;
  public application_end_date?: Date | null;
  public application_mode?: "online" | "offline" | "both" | null;
  public reservation_policy?: string | null;
  public total_seats?: number | null;
  public application_url?: string | null;
  public admission_guidelines_url?: string | null;
  public naac_metric_ref?: string | null;
  public is_active?: boolean;
  public academic_year_id?: number | null;
  public program_id?: number | null;
  public admission_title!: string;
  public status?: "SAVED" | "FINAL";
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacAdmission {
    NaacAdmission.init(
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

        admission_process: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        eligibility_criteria: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        selection_criteria: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        entrance_exam_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },

        application_start_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },

        application_end_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },

        application_mode: {
          type: DataTypes.ENUM(
            "online",
            "offline",
            "both"
          ),
          allowNull: true,
        },

        reservation_policy: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        total_seats: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        application_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        admission_guidelines_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        naac_metric_ref: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },

        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },

        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        program_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        admission_title: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },

        status: {
          type: DataTypes.ENUM("SAVED", "FINAL"),
          allowNull: false,
          defaultValue: "SAVED",
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
        tableName: "naac_admissions",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacAdmission;
  }

  static associate(_models: any) {}
}

export default NaacAdmission;