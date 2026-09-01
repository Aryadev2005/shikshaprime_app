import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacAcademicCalendarAttributes {
  id: number;
  tenant_id: number ;
  title: string;
  description?: string | null;
  file_url?: string | null;
  academic_year_id?: number | null;
  academic_year_text: string;
  start_date: string;
  end_date: string;
  is_current_year?: boolean | null;
  status: "SAVED" | "FINAL";
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacAcademicCalendarCreationAttributes
  extends Optional<
    NaacAcademicCalendarAttributes,
    | "id"
    | "description"
    | "file_url"
    | "academic_year_id"
    | "is_current_year"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

class NaacAcademicCalendar
  extends Model<
    NaacAcademicCalendarAttributes,
    NaacAcademicCalendarCreationAttributes
  >
  implements NaacAcademicCalendarAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public title!: string;
  public description?: string | null;
  public file_url?: string | null;
  public academic_year_id?: number | null;
  public academic_year_text!: string;
  public start_date!: string;
  public end_date!: string;
  public is_current_year?: boolean | null;
  public status: "SAVED" | "FINAL";
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacAcademicCalendar {
    NaacAcademicCalendar.init(
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
        title: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        file_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        academic_year_text: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        start_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        end_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        is_current_year: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        status: {
          type: DataTypes.ENUM('SAVED', 'FINAL'),
          allowNull: false,
          defaultValue: 'SAVED',
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_academic_calendar",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacAcademicCalendar;
  }

  static associate(_models: any) {}
}

export default NaacAcademicCalendar;
