import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export interface StudentDailyAttendanceAttributes {
  id: number;
  attendance_id: string;
  student_id?: string;
  student_code?: string;
  student_name?: string;
  class_id?: number;
  attendance_date: Date;
  attendance_status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "HOLIDAY" | "LEAVE";
  attendance_type?: "MANUAL" | "BIOMETRIC" | "RFID" | "MOBILE_APP";
  marked_by?: string;
  marked_by_type?: "TEACHER" | "ADMIN" | "SYSTEM";
  remarks?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StudentDailyAttendanceCreationAttributes extends Optional<StudentDailyAttendanceAttributes, "id"> {}

class StudentDailyAttendance extends Model<StudentDailyAttendanceAttributes, StudentDailyAttendanceCreationAttributes> implements StudentDailyAttendanceAttributes {
  public id!: number;
  public attendance_id!: string;
  public student_id?: string;
  public student_code?: string;
  public student_name?: string;
  public class_id?: number;
  public attendance_date!: Date;
  public attendance_status!: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "HOLIDAY" | "LEAVE";
  public attendance_type?: "MANUAL" | "BIOMETRIC" | "RFID" | "MOBILE_APP";
  public marked_by?: string;
  public marked_by_type?: "TEACHER" | "ADMIN" | "SYSTEM";
  public remarks?: string;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineStudentDailyAttendance(sequelize: Sequelize) {
  StudentDailyAttendance.init(
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
      class_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      attendance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      attendance_status: {
        type: DataTypes.ENUM("PRESENT", "ABSENT", "LATE", "HALF_DAY", "HOLIDAY", "LEAVE"),
        allowNull: false
      },
      attendance_type: {
        type: DataTypes.ENUM("MANUAL", "BIOMETRIC", "RFID", "MOBILE_APP"),
        allowNull: true,
        defaultValue: "MOBILE_APP"
      },
      marked_by: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      marked_by_type: {
        type: DataTypes.ENUM("TEACHER", "ADMIN", "SYSTEM"),
        allowNull: true
      },
      remarks: {
        type: DataTypes.TEXT,
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
  return StudentDailyAttendance;
}
