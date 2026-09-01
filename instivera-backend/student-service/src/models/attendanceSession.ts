import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface AttendanceSessionAttributes {
  id: number;
  routine_entry_id: number;
  attendance_date: string;
  status: "OPEN" | "SUBMITTED";
  started_at: Date;
  submitted_at?: Date | null;
  submitted_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface AttendanceSessionCreationAttributes
  extends Optional<
    AttendanceSessionAttributes,
    "id" | "status" | "submitted_at" | "submitted_by" | "created_at" | "updated_at"
  > {}

export class AttendanceSession
  extends Model<AttendanceSessionAttributes, AttendanceSessionCreationAttributes>
  implements AttendanceSessionAttributes
{
  public id!: number;
  public routine_entry_id!: number;
  public attendance_date!: string;
  public status!: "OPEN" | "SUBMITTED";
  public started_at!: Date;
  public submitted_at?: Date | null;
  public submitted_by?: number | null;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineAttendanceSession(sequelize: Sequelize) {
  AttendanceSession.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      routine_entry_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      attendance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "OPEN",
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      submitted_by: {
        type: DataTypes.BIGINT.UNSIGNED,
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
      tableName: "attendance_sessions",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          name: "uk_routine_date",
          fields: ["routine_entry_id", "attendance_date"],
        },
        {
          name: "idx_routine_entry",
          fields: ["routine_entry_id"],
        },
        {
          name: "idx_attendance_date",
          fields: ["attendance_date"],
        },
      ],
    }
  );
  return AttendanceSession;
}
