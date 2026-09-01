import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacAchievementAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  title: string;
  achievement_type?: string | null;
  level?: string | null;
  student_name?: string | null;
  event_name?: string | null;
  position_secured?: string | null;
  event_date?: Date | null;
  proof_url?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
  
}

export interface NaacAchievementCreationAttributes
  extends Optional<
    NaacAchievementAttributes,
    | "id"
    | "academic_year_id"
    | "achievement_type"
    | "level"
    | "student_name"
    | "event_name"
    | "position_secured"
    | "event_date"
    | "proof_url"
    | "naac_metric_ref"
    | "created_at"
    | "updated_at"
  > {}

class NaacAchievement
  extends Model<
    NaacAchievementAttributes,
    NaacAchievementCreationAttributes
  >
  implements NaacAchievementAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public title!: string;
  public achievement_type?: string | null;
  public level?: string | null;
  public student_name?: string | null;
  public event_name?: string | null;
  public position_secured?: string | null;
  public event_date?: Date | null;
  public proof_url?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacAchievement {
    NaacAchievement.init(
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

        achievement_type: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },

        level: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },

        student_name: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        event_name: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        position_secured: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },

        event_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },

        proof_url: {
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
        tableName: "naac_achievements",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacAchievement;
  }

  static associate(_models: any) {}
}

export default NaacAchievement;