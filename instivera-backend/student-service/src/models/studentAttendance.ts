import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface StudentAttendanceAttributes {
  id: number;
  attendance_session_id: number;
  student_id: number;
  attendance_status: "PRESENT" | "ABSENT";
  correction_reason?: string | null;
  marked_by: number;
  marked_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface StudentAttendanceCreationAttributes
  extends Optional<
    StudentAttendanceAttributes,
    "id" | "created_at" | "updated_at" | "correction_reason"
  > {}

export class StudentAttendance
  extends Model<StudentAttendanceAttributes, StudentAttendanceCreationAttributes>
  implements StudentAttendanceAttributes
{
  public id!: number;
  public attendance_session_id!: number;
  public student_id!: number;
  public attendance_status!: "PRESENT" | "ABSENT";
  public correction_reason?: string | null;
  public marked_by!: number;
  public marked_at!: Date;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineStudentAttendance(sequelize: Sequelize) {
  StudentAttendance.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      attendance_session_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      attendance_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "ABSENT",
      },
      correction_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      marked_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      marked_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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
      tableName: "student_attendance",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          name: "uk_session_student",
          fields: ["attendance_session_id", "student_id"],
        },
        {
          name: "idx_session",
          fields: ["attendance_session_id"],
        },
        {
          name: "idx_student",
          fields: ["student_id"],
        },
      ],
    }
  );
  return StudentAttendance;
}
