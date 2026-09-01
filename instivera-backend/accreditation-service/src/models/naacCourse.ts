import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacCourseAttributes {
  id: number;
  program_id: number;
  course_code: string;
  course_name: string;
  semester?: number | null;
  credits?: number | null;
  course_type?: "core" | "elective" | "lab" | "project" | null;
  syllabus_url?: string | null;
  status?: "SAVED" | "FINAL" | null;
  created_at?: Date;
  updated_at?: Date;
  is_deleted?: boolean | null;
}

export interface NaacCourseCreationAttributes
  extends Optional<
    NaacCourseAttributes,
    | "id"
    | "semester"
    | "credits"
    | "course_type"
    | "syllabus_url"
    | "status"
    | "created_at"
    | "updated_at"
    | "is_deleted"
  > {}

class NaacCourse
  extends Model<NaacCourseAttributes, NaacCourseCreationAttributes>
  implements NaacCourseAttributes
{
  public id!: number;
  public program_id!: number;
  public course_code!: string;
  public course_name!: string;
  public semester?: number | null;
  public credits?: number | null;
  public course_type?: "core" | "elective" | "lab" | "project" | null;
  public syllabus_url?: string | null;
  public status?: "SAVED" | "FINAL" | null;
  public created_at?: Date;
  public updated_at?: Date;
  public is_deleted?: boolean | null;

  static initModel(sequelize: Sequelize): typeof NaacCourse {
    NaacCourse.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        program_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        course_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        course_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        semester: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        credits: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        course_type: {
          type: DataTypes.ENUM("core", "elective", "lab", "project"),
          allowNull: true,
        },
        syllabus_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("SAVED", "FINAL"),
          allowNull: true,
          defaultValue: "SAVED",
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
        is_deleted: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: "naac_courses",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacCourse;
  }

  static associate(models: any) {
    NaacCourse.belongsTo(models.NaacProgram, {
      foreignKey: "program_id",
      as: "program",
    });
  }
}

export default NaacCourse;
