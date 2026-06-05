import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from "uuid";

export interface StaffDailyAttendanceAttributes {
  id: number;
  attendance_id: string;
  employee_id: string;
  employee_code?: string;
  employee_name?: string;
  department_id?: number;
  designation?: string;
  attendance_date: Date;
  attendance_status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY' | 'LEAVE';
  check_in_time?: string;
  check_out_time?: string;
  late_minutes?: number;
  attendance_type?: 'MANUAL' | 'BIOMETRIC' | 'RFID' | 'MOBILE_APP';
  marked_by?: string;
  marked_by_type?: 'ADMIN' | 'SYSTEM' | 'SELF';
  remarks?: string;
  absence_reason?: string;
  status?: number;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StaffDailyAttendanceCreationAttributes extends Optional<StaffDailyAttendanceAttributes, 'id'> {}

class StaffDailyAttendance extends Model<StaffDailyAttendanceAttributes, StaffDailyAttendanceCreationAttributes>
  implements StaffDailyAttendanceAttributes {
  public id!: number;
  public attendance_id!: string;
  public employee_id!: string;
  public employee_code?: string;
  public employee_name?: string;
  public department_id?: number;
  public designation?: string;
  public attendance_date!: Date;
  public attendance_status!: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY' | 'LEAVE';
  public check_in_time?: string;
  public check_out_time?: string;
  public late_minutes?: number;
  public attendance_type?: 'MANUAL' | 'BIOMETRIC' | 'RFID' | 'MOBILE_APP';
  public marked_by?: string;
  public marked_by_type?: 'ADMIN' | 'SYSTEM' | 'SELF';
  public remarks?: string;
  public absence_reason?: string;
  public status?: number;
  public created_by?: string;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineStaffDailyAttendance(sequelize: Sequelize) {
  StaffDailyAttendance.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      attendance_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        defaultValue: () => uuidv4()
      },
      employee_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      employee_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      employee_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      department_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      designation: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      attendance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      attendance_status: {
        type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY', 'LEAVE'),
        allowNull: false,
      },
      check_in_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      check_out_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      late_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      attendance_type: {
        type: DataTypes.ENUM('MANUAL', 'BIOMETRIC', 'RFID', 'MOBILE_APP'),
        allowNull: true,
        defaultValue: 'MOBILE_APP'
      },
      marked_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      marked_by_type: {
        type: DataTypes.ENUM('ADMIN', 'SYSTEM', 'SELF'),
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      absence_reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
      created_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'staff_daily_attendance',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return StaffDailyAttendance;
}
