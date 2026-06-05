import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { v4 as uuidv4 } from "uuid";

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

export interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, "id"> {}

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
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        defaultValue: () => uuidv4()
      },
      student_id: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      student_code: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      student_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
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
      check_in_time: {
        type: DataTypes.TIME,
        allowNull: true
      },
      check_out_time: {
        type: DataTypes.TIME,
        allowNull: true
      },
      late_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      attendance_type: {
        type: DataTypes.ENUM(
          "MANUAL",
          "BIOMETRIC",
          "RFID",
          "MOBILE_APP"
        ),
        allowNull: true,
        defaultValue: "MOBILE_APP"
      },
      marked_by: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      marked_by_type: {
        type: DataTypes.ENUM(
          "TEACHER",
          "ADMIN",
          "SYSTEM",
          "PARENT"
        ),
        allowNull: true
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      absence_reason: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      parent_notified: {
        type: DataTypes.TINYINT,
        defaultValue: 0
      },
      sms_sent: {
        type: DataTypes.TINYINT,
        defaultValue: 0
      },
      email_sent: {
        type: DataTypes.TINYINT,
        defaultValue: 0
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 1
      },
      is_trash: {
        type: DataTypes.TINYINT,
        defaultValue: 0
      },
      created_by: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: "student_daily_attendance",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
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
