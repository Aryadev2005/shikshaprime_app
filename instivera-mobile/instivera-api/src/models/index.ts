/**
 * Central model registry for instivera-api.
 * All Sequelize model definitions live here so every module imports from one place.
 * Models are cached per tenant to avoid repeated Model.init() calls.
 */

import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { randomUUID } from 'crypto';
import { getTenantSequelize, globalSequelize } from '../db';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

// ── User ──────────────────────────────────────────────────────────────────────
interface UserAttrs { id: number; username: string; email: string; password_hash: string; role: string; user_type: string; user_code: string; is_active: number; created_at?: Date; updated_at?: Date; }
interface UserCreate extends Optional<UserAttrs, 'id'> {}
class User extends Model<UserAttrs, UserCreate> implements UserAttrs {
  public id!: number; public username!: string; public email!: string; public password_hash!: string;
  public role!: string; public user_type!: string; public user_code!: string; public is_active!: number;
  public created_at?: Date; public updated_at?: Date;
}
function defineUser(seq: Sequelize) {
  User.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, username: { type: DataTypes.STRING(100), allowNull: false, unique: true }, email: { type: DataTypes.STRING(255), allowNull: false, unique: true }, password_hash: { type: DataTypes.STRING(255), allowNull: false }, role: { type: DataTypes.ENUM('admin', 'teacher', 'student'), allowNull: false }, user_type: { type: DataTypes.STRING(50), allowNull: false }, user_code: { type: DataTypes.STRING(50), allowNull: false, unique: true }, is_active: { type: DataTypes.TINYINT, defaultValue: 1 } }, { sequelize: seq, tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return User;
}

// ── OtpRequest ────────────────────────────────────────────────────────────────
interface OtpAttrs { id: number; email: string; otp_hash: string; expires_at: Date; attempts: number; is_used: number; created_at?: Date; updated_at?: Date; }
interface OtpCreate extends Optional<OtpAttrs, 'id'> {}
class OtpRequest extends Model<OtpAttrs, OtpCreate> implements OtpAttrs {
  public id!: number; public email!: string; public otp_hash!: string; public expires_at!: Date;
  public attempts!: number; public is_used!: number; public created_at?: Date; public updated_at?: Date;
}
function defineOtpRequest(seq: Sequelize) {
  OtpRequest.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, email: { type: DataTypes.STRING(255), allowNull: false }, otp_hash: { type: DataTypes.STRING(255), allowNull: false }, expires_at: { type: DataTypes.DATE, allowNull: false }, attempts: { type: DataTypes.INTEGER, defaultValue: 0 }, is_used: { type: DataTypes.TINYINT, defaultValue: 0 } }, { sequelize: seq, tableName: 'otp_requests', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return OtpRequest;
}

// ── Institution (global) ──────────────────────────────────────────────────────
interface InstitutionAttrs { id: number; name: string; slug: string; type: 'school' | 'college'; logo_url?: string; is_active: number; created_at?: Date; updated_at?: Date; }
interface InstitutionCreate extends Optional<InstitutionAttrs, 'id'> {}
class Institution extends Model<InstitutionAttrs, InstitutionCreate> implements InstitutionAttrs {
  public id!: number; public name!: string; public slug!: string; public type!: 'school' | 'college';
  public logo_url?: string; public is_active!: number; public created_at?: Date; public updated_at?: Date;
}
function defineInstitution(seq: Sequelize) {
  Institution.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, name: { type: DataTypes.STRING(255), allowNull: false }, slug: { type: DataTypes.STRING(100), allowNull: false, unique: true }, type: { type: DataTypes.ENUM('school', 'college'), allowNull: false }, logo_url: { type: DataTypes.STRING(500), allowNull: true }, is_active: { type: DataTypes.TINYINT, defaultValue: 1 } }, { sequelize: seq, tableName: 'institutions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Institution;
}

// ── Student (comprehensive — union of identity + student-service + teacher-service) ──
interface StudentAttrs {
  id: number; user_id?: number; student_id: string; roll_number?: string;
  university_registration_number?: string; department_id?: number; program_id?: number;
  class_id?: number; semester_id?: number; academic_year_id?: number; section_id?: number;
  student_name?: string; first_name?: string; last_name?: string;
  dob?: Date; sex?: string; mobile?: string; phone?: string; email?: string;
  profile_picture?: string; profile_img?: string; is_active?: number; status?: number;
  father_name?: string; mother_name?: string; guardian_name?: string; guardian_email?: string; guardian_mobile?: string;
  address_line?: string; city?: string; state?: string; pin_code?: string;
  present_count?: number; absent_count?: number; attendance_percentage?: number;
  created_by?: string; updated_by?: string; created_at?: Date; updated_at?: Date;
}
interface StudentCreate extends Optional<StudentAttrs, 'id'> {}
class Student extends Model<StudentAttrs, StudentCreate> implements StudentAttrs {
  public id!: number; public user_id?: number; public student_id!: string; public roll_number?: string;
  public university_registration_number?: string; public department_id?: number; public program_id?: number;
  public class_id?: number; public semester_id?: number; public academic_year_id?: number; public section_id?: number;
  public student_name?: string; public first_name?: string; public last_name?: string;
  public dob?: Date; public sex?: string; public mobile?: string; public phone?: string; public email?: string;
  public profile_picture?: string; public profile_img?: string; public is_active?: number; public status?: number;
  public father_name?: string; public mother_name?: string; public guardian_name?: string;
  public guardian_email?: string; public guardian_mobile?: string;
  public address_line?: string; public city?: string; public state?: string; public pin_code?: string;
  public present_count?: number; public absent_count?: number; public attendance_percentage?: number;
  public created_by?: string; public updated_by?: string; public created_at?: Date; public updated_at?: Date;
}
function defineStudent(seq: Sequelize) {
  Student.init({
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT, allowNull: true },
    student_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    roll_number: { type: DataTypes.STRING(50), allowNull: true },
    university_registration_number: { type: DataTypes.STRING(100), allowNull: true },
    department_id: { type: DataTypes.BIGINT, allowNull: true },
    program_id: { type: DataTypes.BIGINT, allowNull: true },
    class_id: { type: DataTypes.BIGINT, allowNull: true },
    semester_id: { type: DataTypes.BIGINT, allowNull: true },
    academic_year_id: { type: DataTypes.BIGINT, allowNull: true },
    section_id: { type: DataTypes.BIGINT, allowNull: true },
    student_name: { type: DataTypes.STRING(255), allowNull: true },
    first_name: { type: DataTypes.STRING(100), allowNull: true },
    last_name: { type: DataTypes.STRING(100), allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    sex: { type: DataTypes.STRING(20), allowNull: true },
    mobile: { type: DataTypes.STRING(20), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    profile_picture: { type: DataTypes.STRING(500), allowNull: true },
    profile_img: { type: DataTypes.STRING(500), allowNull: true },
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
    father_name: { type: DataTypes.STRING(255), allowNull: true },
    mother_name: { type: DataTypes.STRING(255), allowNull: true },
    guardian_name: { type: DataTypes.STRING(255), allowNull: true },
    guardian_email: { type: DataTypes.STRING(255), allowNull: true },
    guardian_mobile: { type: DataTypes.STRING(20), allowNull: true },
    address_line: { type: DataTypes.STRING(500), allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    pin_code: { type: DataTypes.STRING(10), allowNull: true },
    present_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    absent_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    attendance_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    created_by: { type: DataTypes.STRING(255), allowNull: true },
    updated_by: { type: DataTypes.STRING(255), allowNull: true },
  }, { sequelize: seq, tableName: 'students', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Student;
}

// ── Teacher (comprehensive — union of identity + teacher-service) ─────────────
interface TeacherAttrs {
  id: number; user_id?: number; employee_id: string; teacher_id?: string;
  first_name: string; last_name: string; designation?: string; department_id?: number;
  qualification?: string; experience_years?: number; phone?: string; email?: string;
  profile_picture?: string; emergency_contact?: string; address?: string;
  date_of_birth?: Date; date_of_joining?: Date; is_active?: number; created_at?: Date; updated_at?: Date;
}
interface TeacherCreate extends Optional<TeacherAttrs, 'id'> {}
class Teacher extends Model<TeacherAttrs, TeacherCreate> implements TeacherAttrs {
  public id!: number; public user_id?: number; public employee_id!: string; public teacher_id?: string;
  public first_name!: string; public last_name!: string; public designation?: string; public department_id?: number;
  public qualification?: string; public experience_years?: number; public phone?: string; public email?: string;
  public profile_picture?: string; public emergency_contact?: string; public address?: string;
  public date_of_birth?: Date; public date_of_joining?: Date; public is_active?: number;
  public created_at?: Date; public updated_at?: Date;
}
function defineTeacher(seq: Sequelize) {
  Teacher.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: true },
    employee_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    teacher_id: { type: DataTypes.STRING(50), allowNull: true },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    last_name: { type: DataTypes.STRING(100), allowNull: false },
    designation: { type: DataTypes.STRING(100), allowNull: true },
    department_id: { type: DataTypes.BIGINT, allowNull: true },
    qualification: { type: DataTypes.TEXT, allowNull: true },
    experience_years: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    profile_picture: { type: DataTypes.STRING(500), allowNull: true },
    emergency_contact: { type: DataTypes.STRING(20), allowNull: true },
    address: { type: DataTypes.STRING(255), allowNull: true },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
    date_of_joining: { type: DataTypes.DATEONLY, allowNull: true },
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
  }, { sequelize: seq, tableName: 'teachers', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Teacher;
}

// ── Department ────────────────────────────────────────────────────────────────
interface DeptAttrs { id: number; parent_id?: number; name: string; code: string; level?: number; created_at?: Date; updated_at?: Date; }
interface DeptCreate extends Optional<DeptAttrs, 'id'> {}
class Department extends Model<DeptAttrs, DeptCreate> implements DeptAttrs {
  public id!: number; public parent_id?: number; public name!: string; public code!: string;
  public level?: number; public created_at?: Date; public updated_at?: Date;
}
function defineDepartment(seq: Sequelize) {
  Department.init({ id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true }, parent_id: { type: DataTypes.BIGINT, allowNull: true }, name: { type: DataTypes.STRING(128), allowNull: false }, code: { type: DataTypes.STRING(64), allowNull: false, unique: true }, level: { type: DataTypes.TINYINT, allowNull: true } }, { sequelize: seq, tableName: 'departments', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Department;
}

// ── Subject ───────────────────────────────────────────────────────────────────
interface SubjectAttrs { id: number; department_id: number; name: string; code: string; description?: string; is_active?: boolean; created_at?: Date; updated_at?: Date; }
interface SubjectCreate extends Optional<SubjectAttrs, 'id'> {}
class Subject extends Model<SubjectAttrs, SubjectCreate> implements SubjectAttrs {
  public id!: number; public department_id!: number; public name!: string; public code!: string;
  public description?: string; public is_active?: boolean; public created_at?: Date; public updated_at?: Date;
}
function defineSubject(seq: Sequelize) {
  Subject.init({ id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true }, department_id: { type: DataTypes.BIGINT, allowNull: false }, name: { type: DataTypes.STRING(150), allowNull: false }, code: { type: DataTypes.STRING(100), allowNull: false, unique: true }, description: { type: DataTypes.TEXT, allowNull: true }, is_active: { type: DataTypes.BOOLEAN, defaultValue: true } }, { sequelize: seq, tableName: 'subjects', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Subject;
}

// ── Class ─────────────────────────────────────────────────────────────────────
interface ClassAttrs { id: number; code: string; name: string; created_at?: Date; updated_at?: Date; }
interface ClassCreate extends Optional<ClassAttrs, 'id'> {}
class SchoolClass extends Model<ClassAttrs, ClassCreate> implements ClassAttrs {
  public id!: number; public code!: string; public name!: string; public created_at?: Date; public updated_at?: Date;
}
function defineClass(seq: Sequelize) {
  SchoolClass.init({ id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, code: { type: DataTypes.STRING(64), allowNull: false }, name: { type: DataTypes.STRING(128), allowNull: false } }, { sequelize: seq, tableName: 'classes', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return SchoolClass;
}

// ── StudentSubject ────────────────────────────────────────────────────────────
interface StudSubjAttrs { id: number; student_id: number; semester_id: number; subject_id: number; is_core?: boolean; grade?: string; status?: string; created_at?: Date; updated_at?: Date; }
interface StudSubjCreate extends Optional<StudSubjAttrs, 'id'> {}
class StudentSubject extends Model<StudSubjAttrs, StudSubjCreate> implements StudSubjAttrs {
  public id!: number; public student_id!: number; public semester_id!: number; public subject_id!: number;
  public is_core?: boolean; public grade?: string; public status?: string; public created_at?: Date; public updated_at?: Date;
}
function defineStudentSubject(seq: Sequelize) {
  StudentSubject.init({ id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true }, student_id: { type: DataTypes.BIGINT, allowNull: false }, semester_id: { type: DataTypes.BIGINT, allowNull: false }, subject_id: { type: DataTypes.BIGINT, allowNull: false }, is_core: { type: DataTypes.BOOLEAN, defaultValue: false }, grade: { type: DataTypes.STRING(20), allowNull: true }, status: { type: DataTypes.STRING(50), allowNull: true } }, { sequelize: seq, tableName: 'student_subjects', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return StudentSubject;
}

// ── TeacherClass ──────────────────────────────────────────────────────────────
interface TcAttrs { id: number; teacher_id: number; program_id: number; academic_year_id: number; class_id: number; subject_id: number; assigned_date?: Date; is_active?: number; }
interface TcCreate extends Optional<TcAttrs, 'id'> {}
class TeacherClass extends Model<TcAttrs, TcCreate> implements TcAttrs {
  public id!: number; public teacher_id!: number; public program_id!: number; public academic_year_id!: number;
  public class_id!: number; public subject_id!: number; public assigned_date?: Date; public is_active?: number;
}
function defineTeacherClass(seq: Sequelize) {
  TeacherClass.init({ id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, teacher_id: { type: DataTypes.BIGINT, allowNull: false }, program_id: { type: DataTypes.BIGINT, allowNull: false }, academic_year_id: { type: DataTypes.BIGINT, allowNull: false }, class_id: { type: DataTypes.BIGINT, allowNull: false }, subject_id: { type: DataTypes.BIGINT, allowNull: false }, assigned_date: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: DataTypes.NOW }, is_active: { type: DataTypes.TINYINT, defaultValue: 1 } }, { sequelize: seq, tableName: 'teacher_class_subjects', timestamps: false });
  return TeacherClass;
}

// ── StudentDailyAttendance ────────────────────────────────────────────────────
interface SDAAttrs { id: number; attendance_id: string; student_id?: string; student_code?: string; student_name?: string; class_id?: number; attendance_date: Date; attendance_status: string; attendance_type?: string; marked_by?: string; marked_by_type?: string; remarks?: string; absence_reason?: string; check_in_time?: string; check_out_time?: string; late_minutes?: number; parent_notified?: number; sms_sent?: number; email_sent?: number; status?: number; is_trash?: number; created_by?: string; created_at?: Date; updated_at?: Date; }
interface SDACreate extends Optional<SDAAttrs, 'id'> {}
class StudentDailyAttendance extends Model<SDAAttrs, SDACreate> implements SDAAttrs {
  public id!: number; public attendance_id!: string; public student_id?: string; public student_code?: string;
  public student_name?: string; public class_id?: number; public attendance_date!: Date; public attendance_status!: string;
  public attendance_type?: string; public marked_by?: string; public marked_by_type?: string; public remarks?: string;
  public absence_reason?: string; public check_in_time?: string; public check_out_time?: string; public late_minutes?: number;
  public parent_notified?: number; public sms_sent?: number; public email_sent?: number; public status?: number;
  public is_trash?: number; public created_by?: string; public created_at?: Date; public updated_at?: Date;
}
function defineStudentDailyAttendance(seq: Sequelize) {
  StudentDailyAttendance.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    attendance_id: { type: DataTypes.STRING(255), allowNull: false, unique: true, defaultValue: () => uuidv4() },
    student_id: { type: DataTypes.STRING(50), allowNull: true },
    student_code: { type: DataTypes.STRING(50), allowNull: true },
    student_name: { type: DataTypes.STRING(255), allowNull: true },
    class_id: { type: DataTypes.BIGINT, allowNull: true },
    attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
    attendance_status: { type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY', 'LEAVE'), allowNull: false },
    attendance_type: { type: DataTypes.ENUM('MANUAL', 'BIOMETRIC', 'RFID', 'MOBILE_APP'), allowNull: true, defaultValue: 'MOBILE_APP' },
    marked_by: { type: DataTypes.STRING(255), allowNull: true },
    marked_by_type: { type: DataTypes.ENUM('TEACHER', 'ADMIN', 'SYSTEM', 'PARENT'), allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    absence_reason: { type: DataTypes.STRING(500), allowNull: true },
    check_in_time: { type: DataTypes.TIME, allowNull: true },
    check_out_time: { type: DataTypes.TIME, allowNull: true },
    late_minutes: { type: DataTypes.INTEGER, allowNull: true },
    parent_notified: { type: DataTypes.TINYINT, defaultValue: 0 },
    sms_sent: { type: DataTypes.TINYINT, defaultValue: 0 },
    email_sent: { type: DataTypes.TINYINT, defaultValue: 0 },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
    is_trash: { type: DataTypes.TINYINT, defaultValue: 0 },
    created_by: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    sequelize: seq, tableName: 'student_daily_attendance', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
    hooks: {
      beforeBulkCreate: (instances: any[]) => {
        const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        for (let i = instances.length - 1; i >= 0; i--) {
          const date = String(instances[i].attendance_date || '').trim();
          if (!validDateRegex.test(date)) instances.splice(i, 1);
        }
      },
    },
  });
  return StudentDailyAttendance;
}

// ── StaffDailyAttendance ──────────────────────────────────────────────────────
interface StaffAttrs { id: number; attendance_id: string; employee_id: string; employee_code?: string; employee_name?: string; department_id?: number; designation?: string; attendance_date: Date; attendance_status: string; check_in_time?: string; check_out_time?: string; late_minutes?: number; attendance_type?: string; marked_by?: string; marked_by_type?: string; remarks?: string; absence_reason?: string; status?: number; created_by?: string; created_at?: Date; updated_at?: Date; }
interface StaffCreate extends Optional<StaffAttrs, 'id'> {}
class StaffDailyAttendance extends Model<StaffAttrs, StaffCreate> implements StaffAttrs {
  public id!: number; public attendance_id!: string; public employee_id!: string; public employee_code?: string;
  public employee_name?: string; public department_id?: number; public designation?: string; public attendance_date!: Date;
  public attendance_status!: string; public check_in_time?: string; public check_out_time?: string; public late_minutes?: number;
  public attendance_type?: string; public marked_by?: string; public marked_by_type?: string; public remarks?: string;
  public absence_reason?: string; public status?: number; public created_by?: string; public created_at?: Date; public updated_at?: Date;
}
function defineStaffDailyAttendance(seq: Sequelize) {
  StaffDailyAttendance.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    attendance_id: { type: DataTypes.STRING(255), allowNull: false, unique: true, defaultValue: () => uuidv4() },
    employee_id: { type: DataTypes.STRING(50), allowNull: false },
    employee_code: { type: DataTypes.STRING(50), allowNull: true },
    employee_name: { type: DataTypes.STRING(200), allowNull: true },
    department_id: { type: DataTypes.BIGINT, allowNull: true },
    designation: { type: DataTypes.STRING(100), allowNull: true },
    attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
    attendance_status: { type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY', 'LEAVE'), allowNull: false },
    check_in_time: { type: DataTypes.TIME, allowNull: true },
    check_out_time: { type: DataTypes.TIME, allowNull: true },
    late_minutes: { type: DataTypes.INTEGER, allowNull: true },
    attendance_type: { type: DataTypes.ENUM('MANUAL', 'BIOMETRIC', 'RFID', 'MOBILE_APP'), allowNull: true, defaultValue: 'MOBILE_APP' },
    marked_by: { type: DataTypes.STRING(255), allowNull: true },
    marked_by_type: { type: DataTypes.ENUM('ADMIN', 'SYSTEM', 'SELF'), allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    absence_reason: { type: DataTypes.STRING(500), allowNull: true },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
    created_by: { type: DataTypes.STRING(255), allowNull: true },
  }, { sequelize: seq, tableName: 'staff_daily_attendance', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return StaffDailyAttendance;
}

// ── TeacherAssignment ─────────────────────────────────────────────────────────
interface TAAttrs { id: number; assignment_id?: string; title: string; description?: string; detailed_instructions?: string; type?: string; teacher_id: number; class_id: number; subject_id?: number; semester_id?: number; section_id?: number; program_id?: number; academic_year_id?: number; due_date?: Date; due_time?: string; maximum_marks?: number; allow_late_submissions?: number; file_url?: string; send_notification?: number; is_active?: number; created_at?: Date; updated_at?: Date; }
interface TACreate extends Optional<TAAttrs, 'id'> {}
class TeacherAssignment extends Model<TAAttrs, TACreate> implements TAAttrs {
  public id!: number; public assignment_id?: string; public title!: string; public description?: string;
  public detailed_instructions?: string; public type?: string; public teacher_id!: number; public class_id!: number;
  public subject_id?: number; public semester_id?: number; public section_id?: number; public program_id?: number;
  public academic_year_id?: number; public due_date?: Date; public due_time?: string; public maximum_marks?: number;
  public allow_late_submissions?: number; public file_url?: string; public send_notification?: number; public is_active?: number;
  public created_at?: Date; public updated_at?: Date;
}
function defineTeacherAssignment(seq: Sequelize) {
  TeacherAssignment.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    assignment_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    detailed_instructions: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.ENUM('Assignment', 'Homework'), allowNull: true },
    teacher_id: { type: DataTypes.BIGINT, allowNull: false },
    class_id: { type: DataTypes.BIGINT, allowNull: false },
    subject_id: { type: DataTypes.BIGINT, allowNull: true },
    semester_id: { type: DataTypes.BIGINT, allowNull: true },
    section_id: { type: DataTypes.BIGINT, allowNull: true },
    program_id: { type: DataTypes.BIGINT, allowNull: true },
    academic_year_id: { type: DataTypes.BIGINT, allowNull: true },
    due_date: { type: DataTypes.DATEONLY, allowNull: true },
    due_time: { type: DataTypes.TIME, allowNull: true },
    maximum_marks: { type: DataTypes.INTEGER, defaultValue: 100 },
    allow_late_submissions: { type: DataTypes.TINYINT, defaultValue: 0 },
    file_url: { type: DataTypes.STRING(500), allowNull: true },
    send_notification: { type: DataTypes.TINYINT, defaultValue: 1 },
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
  }, { sequelize: seq, tableName: 'teacher_assignments', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return TeacherAssignment;
}

// ── AssignmentSubmission ──────────────────────────────────────────────────────
interface ASAttrs { id: number; submission_id?: string; teacher_assignment_id: number; student_id: string; student_name?: string; submission_text?: string; file_url?: string; submitted_at?: Date; marks_obtained?: number; grade?: string; feedback?: string; is_late_submission?: number; status?: string; graded_at?: Date; graded_by?: number; created_at?: Date; updated_at?: Date; }
interface ASCreate extends Optional<ASAttrs, 'id'> {}
class AssignmentSubmission extends Model<ASAttrs, ASCreate> implements ASAttrs {
  public id!: number; public submission_id?: string; public teacher_assignment_id!: number; public student_id!: string;
  public student_name?: string; public submission_text?: string; public file_url?: string; public submitted_at?: Date;
  public marks_obtained?: number; public grade?: string; public feedback?: string; public is_late_submission?: number;
  public status?: string; public graded_at?: Date; public graded_by?: number; public created_at?: Date; public updated_at?: Date;
}
function defineAssignmentSubmission(seq: Sequelize) {
  AssignmentSubmission.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    submission_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    teacher_assignment_id: { type: DataTypes.BIGINT, allowNull: false },
    student_id: { type: DataTypes.STRING(50), allowNull: false },
    student_name: { type: DataTypes.STRING(255), allowNull: true },
    submission_text: { type: DataTypes.TEXT, allowNull: true },
    file_url: { type: DataTypes.STRING(500), allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    marks_obtained: { type: DataTypes.INTEGER, allowNull: true },
    grade: { type: DataTypes.STRING(10), allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    is_late_submission: { type: DataTypes.TINYINT, defaultValue: 0 },
    status: { type: DataTypes.ENUM('not_submitted', 'submitted', 'graded'), defaultValue: 'not_submitted' },
    graded_at: { type: DataTypes.DATE, allowNull: true },
    graded_by: { type: DataTypes.BIGINT, allowNull: true },
  }, { sequelize: seq, tableName: 'student_assignment_submissions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return AssignmentSubmission;
}

// ── RepositoryCategory ────────────────────────────────────────────────────────
interface RCAttrs { id: number; name: string; subject_id?: number; class_id?: number; description?: string; is_active?: number; created_at?: Date; updated_at?: Date; }
interface RCCreate extends Optional<RCAttrs, 'id'> {}
class RepositoryCategory extends Model<RCAttrs, RCCreate> implements RCAttrs {
  public id!: number; public name!: string; public subject_id?: number; public class_id?: number;
  public description?: string; public is_active?: number; public created_at?: Date; public updated_at?: Date;
}
function defineRepositoryCategory(seq: Sequelize) {
  RepositoryCategory.init({ id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true }, name: { type: DataTypes.STRING(200), allowNull: false }, subject_id: { type: DataTypes.BIGINT, allowNull: true }, class_id: { type: DataTypes.BIGINT, allowNull: true }, description: { type: DataTypes.TEXT, allowNull: true }, is_active: { type: DataTypes.TINYINT, defaultValue: 1 } }, { sequelize: seq, tableName: 'repository_categories', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return RepositoryCategory;
}

// ── RepositoryFile ────────────────────────────────────────────────────────────
interface RFAttrs { id: number; category_id: number; title: string; description?: string; file_path: string; file_type?: string; file_size_kb?: number; uploaded_by?: string; uploaded_by_type?: string; is_active?: number; created_at?: Date; updated_at?: Date; }
interface RFCreate extends Optional<RFAttrs, 'id'> {}
class RepositoryFile extends Model<RFAttrs, RFCreate> implements RFAttrs {
  public id!: number; public category_id!: number; public title!: string; public description?: string;
  public file_path!: string; public file_type?: string; public file_size_kb?: number;
  public uploaded_by?: string; public uploaded_by_type?: string; public is_active?: number; public created_at?: Date; public updated_at?: Date;
}
function defineRepositoryFile(seq: Sequelize) {
  RepositoryFile.init({ id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true }, category_id: { type: DataTypes.BIGINT, allowNull: false }, title: { type: DataTypes.STRING(255), allowNull: false }, description: { type: DataTypes.TEXT, allowNull: true }, file_path: { type: DataTypes.STRING(500), allowNull: false }, file_type: { type: DataTypes.STRING(50), allowNull: true }, file_size_kb: { type: DataTypes.INTEGER, allowNull: true }, uploaded_by: { type: DataTypes.STRING(255), allowNull: true }, uploaded_by_type: { type: DataTypes.ENUM('ADMIN', 'TEACHER'), allowNull: true, defaultValue: 'TEACHER' }, is_active: { type: DataTypes.TINYINT, defaultValue: 1 } }, { sequelize: seq, tableName: 'repository_files', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return RepositoryFile;
}

// ── FeeHead ───────────────────────────────────────────────────────────────────
interface FHAttrs { id: number; fee_head_id?: string; name: string; amount: number; academic_year_id?: number; program_id?: number; is_active?: number; created_at?: Date; updated_at?: Date; }
interface FHCreate extends Optional<FHAttrs, 'id'> {}
class FeeHead extends Model<FHAttrs, FHCreate> implements FHAttrs {
  public id!: number; public fee_head_id?: string; public name!: string; public amount!: number;
  public academic_year_id?: number; public program_id?: number; public is_active?: number; public created_at?: Date; public updated_at?: Date;
}
function defineFeeHead(seq: Sequelize) {
  FeeHead.init({ id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, fee_head_id: { type: DataTypes.STRING(100), allowNull: true }, name: { type: DataTypes.STRING(255), allowNull: false }, amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }, academic_year_id: { type: DataTypes.BIGINT, allowNull: true }, program_id: { type: DataTypes.BIGINT, allowNull: true }, is_active: { type: DataTypes.TINYINT, defaultValue: 1 } }, { sequelize: seq, tableName: 'fee_heads', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return FeeHead;
}

// ── FeeCollection ─────────────────────────────────────────────────────────────
interface FCAttrs { id: number; collection_id?: string; student_id: string; fee_head_id?: number; amount: number; paid_amount?: number; balance?: number; due_date?: Date; status?: string; created_at?: Date; updated_at?: Date; }
interface FCCreate extends Optional<FCAttrs, 'id'> {}
class FeeCollection extends Model<FCAttrs, FCCreate> implements FCAttrs {
  public id!: number; public collection_id?: string; public student_id!: string; public fee_head_id?: number;
  public amount!: number; public paid_amount?: number; public balance?: number; public due_date?: Date; public status?: string; public created_at?: Date; public updated_at?: Date;
}
function defineFeeCollection(seq: Sequelize) {
  FeeCollection.init({ id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, collection_id: { type: DataTypes.STRING(100), allowNull: true }, student_id: { type: DataTypes.STRING(50), allowNull: false }, fee_head_id: { type: DataTypes.BIGINT, allowNull: true }, amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }, paid_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }, balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }, due_date: { type: DataTypes.DATEONLY, allowNull: true }, status: { type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL'), defaultValue: 'PENDING' } }, { sequelize: seq, tableName: 'fee_collections', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return FeeCollection;
}

// ── Receipt ───────────────────────────────────────────────────────────────────
interface ReceiptAttrs { id: number; receipt_id?: string; receipt_number?: string; student_id: string; date?: Date; amount: number; payment_mode?: string; description?: string; created_at?: Date; updated_at?: Date; }
interface ReceiptCreate extends Optional<ReceiptAttrs, 'id'> {}
class Receipt extends Model<ReceiptAttrs, ReceiptCreate> implements ReceiptAttrs {
  public id!: number; public receipt_id?: string; public receipt_number?: string; public student_id!: string;
  public date?: Date; public amount!: number; public payment_mode?: string; public description?: string; public created_at?: Date; public updated_at?: Date;
}
function defineReceipt(seq: Sequelize) {
  Receipt.init({ id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, receipt_id: { type: DataTypes.STRING(100), allowNull: true }, receipt_number: { type: DataTypes.STRING(100), allowNull: true }, student_id: { type: DataTypes.STRING(50), allowNull: false }, date: { type: DataTypes.DATEONLY, allowNull: true }, amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }, payment_mode: { type: DataTypes.STRING(50), allowNull: true }, description: { type: DataTypes.STRING(500), allowNull: true } }, { sequelize: seq, tableName: 'receipts', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Receipt;
}

// ── LedgerEntry ───────────────────────────────────────────────────────────────
interface LEAttrs { id: number; student_id: string; date?: Date; description?: string; debit?: number; credit?: number; balance?: number; created_at?: Date; }
interface LECreate extends Optional<LEAttrs, 'id'> {}
class LedgerEntry extends Model<LEAttrs, LECreate> implements LEAttrs {
  public id!: number; public student_id!: string; public date?: Date; public description?: string;
  public debit?: number; public credit?: number; public balance?: number; public created_at?: Date;
}
function defineLedgerEntry(seq: Sequelize) {
  LedgerEntry.init({ id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, student_id: { type: DataTypes.STRING(50), allowNull: false }, date: { type: DataTypes.DATEONLY, allowNull: true }, description: { type: DataTypes.STRING(500), allowNull: true }, debit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }, credit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }, balance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 } }, { sequelize: seq, tableName: 'ledger_entries', timestamps: true, createdAt: 'created_at', updatedAt: false });
  return LedgerEntry;
}

// ── Payment ───────────────────────────────────────────────────────────────────
interface PayAttrs { id: number; payment_id?: string; student_id: string; amount: number; paid_amount?: number; status?: string; due_date?: Date; payment_mode?: string; merchant_order_id?: string; description?: string; created_at?: Date; updated_at?: Date; }
interface PayCreate extends Optional<PayAttrs, 'id'> {}
class Payment extends Model<PayAttrs, PayCreate> implements PayAttrs {
  public id!: number; public payment_id?: string; public student_id!: string; public amount!: number;
  public paid_amount?: number; public status?: string; public due_date?: Date; public payment_mode?: string;
  public merchant_order_id?: string; public description?: string; public created_at?: Date; public updated_at?: Date;
}
function definePayment(seq: Sequelize) {
  Payment.init({ id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, payment_id: { type: DataTypes.STRING(100), allowNull: true, unique: true }, student_id: { type: DataTypes.STRING(50), allowNull: false }, amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, paid_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }, status: { type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL'), defaultValue: 'PENDING' }, due_date: { type: DataTypes.DATEONLY, allowNull: true }, payment_mode: { type: DataTypes.STRING(50), allowNull: true }, merchant_order_id: { type: DataTypes.STRING(100), allowNull: true }, description: { type: DataTypes.STRING(500), allowNull: true } }, { sequelize: seq, tableName: 'payments', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Payment;
}

// ── PaymentTransaction ────────────────────────────────────────────────────────
interface PTAttrs { id: number; transaction_id?: string; payment_id: number; gateway_status?: string; gateway_reference?: string; amount?: number; is_completed?: number; created_at?: Date; }
interface PTCreate extends Optional<PTAttrs, 'id'> {}
class PaymentTransaction extends Model<PTAttrs, PTCreate> implements PTAttrs {
  public id!: number; public transaction_id?: string; public payment_id!: number; public gateway_status?: string;
  public gateway_reference?: string; public amount?: number; public is_completed?: number; public created_at?: Date;
}
function definePaymentTransaction(seq: Sequelize) {
  PaymentTransaction.init({ id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, transaction_id: { type: DataTypes.STRING(100), allowNull: true, unique: true }, payment_id: { type: DataTypes.BIGINT, allowNull: false }, gateway_status: { type: DataTypes.STRING(50), allowNull: true }, gateway_reference: { type: DataTypes.STRING(200), allowNull: true }, amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true }, is_completed: { type: DataTypes.TINYINT, defaultValue: 0 } }, { sequelize: seq, tableName: 'payment_transactions', timestamps: true, createdAt: 'created_at', updatedAt: false });
  return PaymentTransaction;
}

// ── Conversation ──────────────────────────────────────────────────────────────
type ConvType = 'direct' | 'class_broadcast' | 'group';
interface ConvAttrs { id: number; conversation_id?: string; title?: string; type: ConvType; class_id?: string; program_id?: string; department_id?: string; academic_year_id?: string; created_by_user_id: number; created_by_user_type: string; is_active?: number; created_at?: Date; updated_at?: Date; }
interface ConvCreate extends Optional<ConvAttrs, 'id'> {}
class Conversation extends Model<ConvAttrs, ConvCreate> implements ConvAttrs {
  public id!: number; public conversation_id?: string; public title?: string; public type!: ConvType;
  public class_id?: string; public program_id?: string; public department_id?: string; public academic_year_id?: string;
  public created_by_user_id!: number; public created_by_user_type!: string; public is_active?: number;
  public created_at?: Date; public updated_at?: Date;
}
function defineConversation(seq: Sequelize) {
  Conversation.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    conversation_id: { type: DataTypes.STRING(36), allowNull: true, unique: true, defaultValue: () => randomUUID() },
    title: { type: DataTypes.STRING(255), allowNull: true, field: 'subject' },
    type: { type: DataTypes.ENUM('direct', 'class_broadcast', 'group'), allowNull: false, defaultValue: 'direct' },
    class_id: { type: DataTypes.STRING(50), allowNull: true },
    program_id: { type: DataTypes.STRING(50), allowNull: true },
    department_id: { type: DataTypes.STRING(50), allowNull: true },
    academic_year_id: { type: DataTypes.STRING(50), allowNull: true },
    created_by_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    created_by_user_type: { type: DataTypes.ENUM('teacher', 'student', 'admin'), allowNull: false },
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
  }, { sequelize: seq, tableName: 'conversations', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Conversation;
}

// ── ConversationParticipant ───────────────────────────────────────────────────
interface CPAttrs { id: number; conversation_id: number; user_id: number; user_type: string; joined_at?: Date; last_read_at?: Date; is_muted?: number; is_active?: number; }
interface CPCreate extends Optional<CPAttrs, 'id'> {}
class ConversationParticipant extends Model<CPAttrs, CPCreate> implements CPAttrs {
  public id!: number; public conversation_id!: number; public user_id!: number; public user_type!: string;
  public joined_at?: Date; public last_read_at?: Date; public is_muted?: number; public is_active?: number;
}
function defineConversationParticipant(seq: Sequelize) {
  ConversationParticipant.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    conversation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    user_type: { type: DataTypes.ENUM('teacher', 'student', 'admin'), allowNull: false },
    joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    last_read_at: { type: DataTypes.DATE, allowNull: true },
    is_muted: { type: DataTypes.TINYINT, defaultValue: 0 },
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
  }, { sequelize: seq, tableName: 'conversation_participants', timestamps: false, indexes: [{ name: 'unique_participant', unique: true, fields: ['conversation_id', 'user_id', 'user_type'] }] });
  return ConversationParticipant;
}

// ── Message ───────────────────────────────────────────────────────────────────
interface MsgAttrs { id: number; message_id?: string; conversation_id: number; sender_id: number; sender_type: string; content: string; message_type?: string; file_url?: string; file_name?: string; file_size?: number; parent_message_id?: number; is_deleted?: number; sent_at?: Date; updated_at?: Date; }
interface MsgCreate extends Optional<MsgAttrs, 'id'> {}
class Message extends Model<MsgAttrs, MsgCreate> implements MsgAttrs {
  public id!: number; public message_id?: string; public conversation_id!: number; public sender_id!: number;
  public sender_type!: string; public content!: string; public message_type?: string; public file_url?: string;
  public file_name?: string; public file_size?: number; public parent_message_id?: number; public is_deleted?: number;
  public sent_at?: Date; public updated_at?: Date;
}
function defineMessage(seq: Sequelize) {
  Message.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    message_id: { type: DataTypes.STRING(36), allowNull: true, unique: true, defaultValue: () => randomUUID() },
    conversation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sender_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'sender_user_id' },
    sender_type: { type: DataTypes.ENUM('teacher', 'student', 'admin'), allowNull: false, field: 'sender_user_type' },
    content: { type: DataTypes.TEXT, allowNull: false, field: 'message_text' },
    message_type: { type: DataTypes.ENUM('text', 'announcement', 'important', 'file', 'image'), defaultValue: 'text' },
    file_url: { type: DataTypes.STRING(500), allowNull: true },
    file_name: { type: DataTypes.STRING(255), allowNull: true },
    file_size: { type: DataTypes.BIGINT, allowNull: true },
    parent_message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    is_deleted: { type: DataTypes.TINYINT, defaultValue: 0 },
    sent_at: { type: DataTypes.DATE, allowNull: true, field: 'created_at' },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  }, { sequelize: seq, tableName: 'messages', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Message;
}

// ── MessageReadStatus ─────────────────────────────────────────────────────────
interface MRSAttrs { id: number; message_id: number; user_id: number; user_type: string; read_at?: Date; }
interface MRSCreate extends Optional<MRSAttrs, 'id'> {}
class MessageReadStatus extends Model<MRSAttrs, MRSCreate> implements MRSAttrs {
  public id!: number; public message_id!: number; public user_id!: number; public user_type!: string; public read_at?: Date;
}
function defineMessageReadStatus(seq: Sequelize) {
  MessageReadStatus.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, user_type: { type: DataTypes.ENUM('teacher', 'student', 'admin'), allowNull: false }, read_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW } }, { sequelize: seq, tableName: 'message_read_status', timestamps: false, indexes: [{ name: 'unique_reader', unique: true, fields: ['message_id', 'user_id', 'user_type'] }] });
  return MessageReadStatus;
}

// ── Notice ────────────────────────────────────────────────────────────────────
interface NoticeAttrs { id: number; notice_id?: string; title: string; content?: string; description?: string; published_date?: Date; from_date?: Date; to_date?: Date; expires_at?: Date; target_audience?: string; is_active?: number; created_by?: string; attachment?: string; institution_type?: string; created_at?: Date; updated_at?: Date; }
interface NoticeCreate extends Optional<NoticeAttrs, 'id'> {}
class Notice extends Model<NoticeAttrs, NoticeCreate> implements NoticeAttrs {
  public id!: number; public notice_id?: string; public title!: string; public content?: string; public description?: string;
  public published_date?: Date; public from_date?: Date; public to_date?: Date; public expires_at?: Date;
  public target_audience?: string; public is_active?: number; public created_by?: string; public attachment?: string;
  public institution_type?: string; public created_at?: Date; public updated_at?: Date;
}
function defineNotice(seq: Sequelize) {
  Notice.init({ id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, notice_id: { type: DataTypes.STRING(100), allowNull: true, unique: true }, title: { type: DataTypes.STRING(255), allowNull: false }, content: { type: DataTypes.TEXT, allowNull: true }, description: { type: DataTypes.STRING(500), allowNull: true }, published_date: { type: DataTypes.DATEONLY, allowNull: true }, from_date: { type: DataTypes.DATEONLY, allowNull: true }, to_date: { type: DataTypes.DATEONLY, allowNull: true }, expires_at: { type: DataTypes.DATEONLY, allowNull: true }, target_audience: { type: DataTypes.ENUM('ALL', 'STUDENT', 'TEACHER'), allowNull: true, defaultValue: 'ALL' }, is_active: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 }, created_by: { type: DataTypes.STRING(255), allowNull: true }, attachment: { type: DataTypes.STRING(255), allowNull: true }, institution_type: { type: DataTypes.ENUM('school', 'college'), allowNull: true } }, { sequelize: seq, tableName: 'notices', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Notice;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODEL CACHE + FACTORY
// ─────────────────────────────────────────────────────────────────────────────

type TenantModels = ReturnType<typeof buildTenantModels>;
const tenantModelCache = new Map<string, TenantModels>();

function buildTenantModels(seq: Sequelize) {
  const User_ = defineUser(seq);
  const OtpRequest_ = defineOtpRequest(seq);
  const Student_ = defineStudent(seq);
  const Teacher_ = defineTeacher(seq);
  const Department_ = defineDepartment(seq);
  const Subject_ = defineSubject(seq);
  const SchoolClass_ = defineClass(seq);
  const StudentSubject_ = defineStudentSubject(seq);
  const TeacherClass_ = defineTeacherClass(seq);
  const StudentDailyAttendance_ = defineStudentDailyAttendance(seq);
  const StaffDailyAttendance_ = defineStaffDailyAttendance(seq);
  const TeacherAssignment_ = defineTeacherAssignment(seq);
  const AssignmentSubmission_ = defineAssignmentSubmission(seq);
  const RepositoryCategory_ = defineRepositoryCategory(seq);
  const RepositoryFile_ = defineRepositoryFile(seq);
  const FeeHead_ = defineFeeHead(seq);
  const FeeCollection_ = defineFeeCollection(seq);
  const Receipt_ = defineReceipt(seq);
  const LedgerEntry_ = defineLedgerEntry(seq);
  const Payment_ = definePayment(seq);
  const PaymentTransaction_ = definePaymentTransaction(seq);
  const Conversation_ = defineConversation(seq);
  const ConversationParticipant_ = defineConversationParticipant(seq);
  const Message_ = defineMessage(seq);
  const MessageReadStatus_ = defineMessageReadStatus(seq);
  const Notice_ = defineNotice(seq);

  // Associations
  Student_.belongsTo(Department_, { foreignKey: 'department_id', as: 'department' });
  Department_.hasMany(Student_, { foreignKey: 'department_id', as: 'students' });

  Student_.belongsToMany(Subject_, { through: StudentSubject_, foreignKey: 'student_id', otherKey: 'subject_id', as: 'subjects' });
  Subject_.belongsToMany(Student_, { through: StudentSubject_, foreignKey: 'subject_id', otherKey: 'student_id', as: 'students' });

  Teacher_.hasMany(TeacherClass_, { foreignKey: 'teacher_id', as: 'classes' });
  TeacherClass_.belongsTo(Teacher_, { foreignKey: 'teacher_id', as: 'teacher' });
  TeacherClass_.belongsTo(SchoolClass_, { foreignKey: 'class_id', as: 'class' });
  TeacherClass_.belongsTo(Subject_, { foreignKey: 'subject_id', as: 'subject' });
  Teacher_.belongsTo(Department_, { foreignKey: 'department_id', as: 'department' });

  StudentDailyAttendance_.belongsTo(Student_, { foreignKey: 'student_id', targetKey: 'student_id', as: 'student' });
  Student_.hasMany(StudentDailyAttendance_, { foreignKey: 'student_id', sourceKey: 'student_id', as: 'attendances' });

  Teacher_.hasMany(TeacherAssignment_, { foreignKey: 'teacher_id', as: 'assignments' });
  TeacherAssignment_.belongsTo(Teacher_, { foreignKey: 'teacher_id', as: 'teacher' });
  TeacherAssignment_.belongsTo(SchoolClass_, { foreignKey: 'class_id', as: 'class' });
  TeacherAssignment_.belongsTo(Subject_, { foreignKey: 'subject_id', as: 'subject' });
  TeacherAssignment_.hasMany(AssignmentSubmission_, { foreignKey: 'teacher_assignment_id', as: 'submissions' });
  AssignmentSubmission_.belongsTo(TeacherAssignment_, { foreignKey: 'teacher_assignment_id', as: 'assignment' });

  FeeCollection_.belongsTo(FeeHead_, { foreignKey: 'fee_head_id', as: 'feeHead' });
  FeeHead_.hasMany(FeeCollection_, { foreignKey: 'fee_head_id', as: 'collections' });

  Payment_.hasMany(PaymentTransaction_, { foreignKey: 'payment_id', as: 'transactions' });
  PaymentTransaction_.belongsTo(Payment_, { foreignKey: 'payment_id', as: 'payment' });

  Conversation_.hasMany(ConversationParticipant_, { foreignKey: 'conversation_id', as: 'participants' });
  ConversationParticipant_.belongsTo(Conversation_, { foreignKey: 'conversation_id', as: 'conversation' });
  Conversation_.hasMany(Message_, { foreignKey: 'conversation_id', as: 'messages' });
  Message_.belongsTo(Conversation_, { foreignKey: 'conversation_id', as: 'conversation' });
  Message_.hasMany(MessageReadStatus_, { foreignKey: 'message_id', as: 'readStatuses' });
  MessageReadStatus_.belongsTo(Message_, { foreignKey: 'message_id', as: 'message' });

  return {
    User: User_, OtpRequest: OtpRequest_, Student: Student_, Teacher: Teacher_,
    Department: Department_, Subject: Subject_, Class: SchoolClass_,
    StudentSubject: StudentSubject_, TeacherClass: TeacherClass_,
    StudentDailyAttendance: StudentDailyAttendance_, StaffDailyAttendance: StaffDailyAttendance_,
    TeacherAssignment: TeacherAssignment_, AssignmentSubmission: AssignmentSubmission_,
    RepositoryCategory: RepositoryCategory_, RepositoryFile: RepositoryFile_,
    FeeHead: FeeHead_, FeeCollection: FeeCollection_, Receipt: Receipt_, LedgerEntry: LedgerEntry_,
    Payment: Payment_, PaymentTransaction: PaymentTransaction_,
    Conversation: Conversation_, ConversationParticipant: ConversationParticipant_,
    Message: Message_, MessageReadStatus: MessageReadStatus_,
    Notice: Notice_,
  };
}

/** Returns tenant-scoped models. Results are cached per tenant. */
export function getTenantModels(tenant: string): TenantModels {
  if (!tenantModelCache.has(tenant)) {
    const seq = getTenantSequelize(tenant);
    tenantModelCache.set(tenant, buildTenantModels(seq));
  }
  return tenantModelCache.get(tenant)!;
}

/** Returns global (cross-tenant) models using the global Sequelize connection. */
let _globalModels: { Institution: typeof Institution } | null = null;
export function getGlobalModels() {
  if (!_globalModels) {
    _globalModels = { Institution: defineInstitution(globalSequelize) };
  }
  return _globalModels;
}

// Re-export class types for use in service type annotations
export type {
  User, OtpRequest, Institution, Student, Teacher, Department, Subject,
  SchoolClass as Class, StudentSubject, TeacherClass, StudentDailyAttendance, StaffDailyAttendance,
  TeacherAssignment, AssignmentSubmission, RepositoryCategory, RepositoryFile,
  FeeHead, FeeCollection, Receipt, LedgerEntry, Payment, PaymentTransaction,
  Conversation, ConversationParticipant, Message, MessageReadStatus, Notice,
};
