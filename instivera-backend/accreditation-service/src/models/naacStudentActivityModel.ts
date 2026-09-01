import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacStudentActivityAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  activity_name: string;
  activity_type?: string | null;
  description?: string | null;
  participant_count?: number | null;
  achievement?: string | null;
  event_date?: Date | null;
  photo_url?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacStudentActivityCreationAttributes
  extends Optional<
    NaacStudentActivityAttributes,
    | "id"
    | "academic_year_id"
    | "activity_type"
    | "description"
    | "participant_count"
    | "achievement"
    | "event_date"
    | "photo_url"
    | "naac_metric_ref"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

class NaacStudentActivity
  extends Model<
    NaacStudentActivityAttributes,
    NaacStudentActivityCreationAttributes
  >
  implements NaacStudentActivityAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public activity_name!: string;
  public activity_type?: string | null;
  public description?: string | null;
  public participant_count?: number | null;
  public achievement?: string | null;
  public event_date?: Date | null;
  public photo_url?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacStudentActivity {
    NaacStudentActivity.init(
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

        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        participant_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        achievement: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        event_date: {
          type: DataTypes.DATEONLY,
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
        tableName: "naac_student_activities",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacStudentActivity;
  }

  static associate(_models: any) {}
}

export default NaacStudentActivity;