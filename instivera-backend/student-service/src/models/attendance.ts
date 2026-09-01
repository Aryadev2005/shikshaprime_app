import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface AttendanceAttributes {
  id: number;
  attendance_id: string;
  student_id: number;
  student_code: string;
  student_name?: string | null;
  attendance_date: Date | string;
  attendance_status?: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "HOLIDAY" | "LEAVE" | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  late_minutes?: number | null;
  attendance_type?: "MANUAL" | "BIOMETRIC" | "RFID" | "MOBILE_APP" | null;
  marked_by?: string | null;
  marked_by_type?: "TEACHER" | "ADMIN" | "SYSTEM" | "PARENT" | null;
  location_marked?: string | null;
  device_info?: string | null;
  remarks?: string | null;
  absence_reason?: "SICK" | "FAMILY" | "EMERGENCY" | "PERSONAL" | "OTHER" | null;
  leave_approval_required?: number | null;
  leave_approved_by?: string | null;
  leave_approved_at?: Date | null;
  parent_notified?: number | null;
  parent_notification_sent_at?: Date | null;
  sms_sent?: number | null;
  email_sent?: number | null;
  approved_by?: string | null;
  approved_at?: Date | null;
  status?: number | null;
  is_trash?: number | null;
  created_by?: string | null;
  updated_by?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, "id"> { }

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  public id!: number;
  public attendance_id!: string;
  public student_id!: number;
  public student_code!: string;
  public student_name?: string | null;
  public attendance_date!: Date | string;
  public attendance_status?: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "HOLIDAY" | "LEAVE" | null;
  public check_in_time?: string | null;
  public check_out_time?: string | null;
  public late_minutes?: number | null;
  public attendance_type?: "MANUAL" | "BIOMETRIC" | "RFID" | "MOBILE_APP" | null;
  public marked_by?: string | null;
  public marked_by_type?: "TEACHER" | "ADMIN" | "SYSTEM" | "PARENT" | null;
  public location_marked?: string | null;
  public device_info?: string | null;
  public remarks?: string | null;
  public absence_reason?: "SICK" | "FAMILY" | "EMERGENCY" | "PERSONAL" | "OTHER" | null;
  public leave_approval_required?: number | null;
  public leave_approved_by?: string | null;
  public leave_approved_at?: Date | null;
  public parent_notified?: number | null;
  public parent_notification_sent_at?: Date | null;
  public sms_sent?: number | null;
  public email_sent?: number | null;
  public approved_by?: string | null;
  public approved_at?: Date | null;
  public status?: number | null;
  public is_trash?: number | null;
  public created_by?: string | null;
  public updated_by?: string | null;
  public createdAt?: Date;
  public updatedAt?: Date;
}

export function defineAttendance(sequelize: Sequelize) {
  Attendance.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      attendance_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      student_code: {
        type: DataTypes.STRING(50),
        allowNull: false
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
        allowNull: true,
        defaultValue: "PRESENT"
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
        allowNull: true,
        defaultValue: 0
      },
      attendance_type: {
        type: DataTypes.ENUM(
          "MANUAL",
          "BIOMETRIC",
          "RFID",
          "MOBILE_APP"
        ),
        allowNull: true,
        defaultValue: "MANUAL"
      },
      marked_by: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      marked_by_type: {
        type: DataTypes.ENUM(
          "TEACHER",
          "ADMIN",
          "SYSTEM",
          "PARENT"
        ),
        allowNull: true,
        defaultValue: "TEACHER"
      },
      location_marked: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      device_info: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      absence_reason: {
        type: DataTypes.ENUM(
          "SICK",
          "FAMILY",
          "EMERGENCY",
          "PERSONAL",
          "OTHER"
        ),
        allowNull: true
      },
      leave_approval_required: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0
      },
      leave_approved_by: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      leave_approved_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      parent_notified: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0
      },
      parent_notification_sent_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      sms_sent: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0
      },
      email_sent: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0
      },
      approved_by: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1
      },
      is_trash: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0
      },
      created_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "SYSTEM"
      },
      updated_by: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: "student_daily_attendance",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      indexes: [
        { fields: ["attendance_id"], unique: true },
        { fields: ["student_id"] },
        { fields: ["attendance_date"] },
        { fields: ["attendance_status"] },
        { fields: ["createdAt"] },
      ],
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