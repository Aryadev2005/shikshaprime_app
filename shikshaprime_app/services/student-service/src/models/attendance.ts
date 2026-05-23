import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { sequelize } from ".";

export interface AttendanceAttributes {
  id: number;
  attendance_id: string;
  student_id?: string;
  student_code?: string;
  student_name?: string;
  attendance_date: Date;
  attendance_status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "HOLIDAY" | "LEAVE";
  check_in_time?: string;
  check_out_time?: string;
  late_minutes?: number;
  attendance_type?: "MANUAL" | "BIOMETRIC" | "RFID" | "MOBILE_APP";
  marked_by?: string;
  marked_by_type?: "TEACHER" | "ADMIN" | "SYSTEM" | "PARENT";
  remarks?: string;
  absence_reason?: string;
  parent_notified?: number;
  sms_sent?: number;
  email_sent?: number;
  status?: number;
  is_trash?: number;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, "id"> { }

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  public id!: number;
  public attendance_id!: string;
  public student_id?: string;
  public student_code?: string;
  public student_name?: string;
  public attendance_date!: Date;
  public attendance_status!: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "HOLIDAY" | "LEAVE";
  public check_in_time?: string;
  public check_out_time?: string;
  public late_minutes?: number;
  public attendance_type?: "MANUAL" | "BIOMETRIC" | "RFID" | "MOBILE_APP";
  public marked_by?: string;
  public marked_by_type?: "TEACHER" | "ADMIN" | "SYSTEM" | "PARENT";
  public remarks?: string;
  public absence_reason?: string;
  public parent_notified?: number;
  public sms_sent?: number;
  public email_sent?: number;
  public status?: number;
  public is_trash?: number;
  public created_by?: string;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineAttendance(sequelize: Sequelize) {
  Attendance.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      attendance_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      student_id: DataTypes.STRING,
      student_code: DataTypes.STRING,
      student_name: DataTypes.STRING,
      attendance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      attendance_status: {
        type: DataTypes.ENUM(
          "PRESENT",
          "ABSENT",
          "LATE",
          "HALF_DAY",
          "HOLIDAY",
          "LEAVE"
        ),
        allowNull: false
      },
      check_in_time: DataTypes.TIME,
      check_out_time: DataTypes.TIME,
      late_minutes: DataTypes.INTEGER,
      attendance_type: DataTypes.ENUM(
        "MANUAL",
        "BIOMETRIC",
        "RFID",
        "MOBILE_APP"
      ),
      marked_by: DataTypes.STRING,
      marked_by_type: DataTypes.ENUM(
        "TEACHER",
        "ADMIN",
        "SYSTEM",
        "PARENT"
      ),
      remarks: DataTypes.TEXT,
      absence_reason: DataTypes.STRING,
      parent_notified: DataTypes.TINYINT,
      sms_sent: DataTypes.TINYINT,
      email_sent: DataTypes.TINYINT,
      status: DataTypes.TINYINT,
      is_trash: DataTypes.TINYINT,
      created_by: DataTypes.STRING
    },
    {
      sequelize,
      tableName: "student_daily_attendance",
      timestamps: true,
      hooks: {
        beforeBulkCreate: (instances: any[]) => {
          const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;
          const originalCount = instances.length;

          for (let i = instances.length - 1; i >= 0; i--) {
            const date = String(instances[i].attendance_date || "").trim();
            if (!validDateRegex.test(date)) {
              console.warn(`[MODEL HOOK] Removing record with invalid date: '${date}'`);
              instances.splice(i, 1);
            }
          }

          console.log(`[MODEL HOOK] Filtered: ${originalCount} -> ${instances.length} records`);
        }
      }
    }
  );
  return Attendance;
}