import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentApplicationsAttributes {
  id: number;

  user_id: number;
  academic_year_id: number;
  program_id: number;

  degree_type: string;       // UG / PG
  program_type: string;      // FYUGP / CBCS / ENGINEERING / etc.
  department_id: number;

  application_status: string; // IN_PROGRESS / SUBMITTED / APPROVED
  is_locked: number;          // TINYINT(1)

  created_at?: Date;
  updated_at?: Date;
}

// -----------------------------
// CREATION ATTRIBUTES
// -----------------------------
export interface StudentApplicationsCreationAttributes
  extends Optional<
    StudentApplicationsAttributes,
    | "id"
    | "application_status"
    | "is_locked"
    | "created_at"
    | "updated_at"
  > { }

// -----------------------------
// MODEL CLASS
// -----------------------------
export class StudentApplications
  extends Model<
    StudentApplicationsAttributes,
    StudentApplicationsCreationAttributes
  >
  implements StudentApplicationsAttributes {
  public id!: number;

  public user_id!: number;
  public academic_year_id!: number;
  public program_id!: number;

  public degree_type!: string;
  public program_type!: string;
  public department_id!: number;

  public application_status!: string;
  public is_locked!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineStudentApplications(sequelize: Sequelize) {
  StudentApplications.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      degree_type: {
        type: DataTypes.STRING(16),
        allowNull: false
      },

      program_type: {
        type: DataTypes.STRING(32),
        allowNull: false
      },

      department_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      application_status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: "IN_PROGRESS"
      },

      is_locked: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: "student_applications",
      timestamps: false,
      underscored: true
    }
  );
  return StudentApplications;
}