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
interface UserAttrs {
  user_id: number; username: string; email: string; password_hash: string;
  first_name?: string; last_name?: string; role: string; user_type: string;
  status?: string; last_login?: Date; access_code?: string; is_active?: number;
  avatar?: string; created_at?: Date; updated_at?: Date;
}
interface UserCreate extends Optional<UserAttrs, 'user_id'> {}
class User extends Model<UserAttrs, UserCreate> implements UserAttrs {
  public user_id!: number; public username!: string; public email!: string; public password_hash!: string;
  public first_name?: string; public last_name?: string; public role!: string; public user_type!: string;
  public status?: string; public last_login?: Date; public access_code?: string; public is_active?: number;
  public avatar?: string; public created_at?: Date; public updated_at?: Date;
}
function defineUser(seq: Sequelize) {
  User.init({
    user_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    first_name: { type: DataTypes.STRING(50), allowNull: true },
    last_name: { type: DataTypes.STRING(50), allowNull: true },
    role: { type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent', 'applicant'), allowNull: false, defaultValue: 'student' },
    user_type: { type: DataTypes.ENUM('admin', 'teacher', 'student', 'parent', 'applicant'), allowNull: false, defaultValue: 'student' },
    status: { type: DataTypes.ENUM('active', 'inactive', 'pending'), allowNull: true, defaultValue: 'pending' },
    last_login: { type: DataTypes.DATE, allowNull: true },
    access_code: { type: DataTypes.STRING(255), allowNull: true },
    is_active: { type: DataTypes.INTEGER, allowNull: true },
    avatar: { type: DataTypes.STRING(100), allowNull: true },
  }, { sequelize: seq, tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return User;
}

// ── PhoneOtpRequest (phone/SMS channel) ────────────────────────────────────────
interface PhoneOtpAttrs { id: number; phone_number: string; otp_code: string; expires_at: Date; attempts?: number; created_at?: Date; updated_at?: Date; }
interface PhoneOtpCreate extends Optional<PhoneOtpAttrs, 'id'> {}
class PhoneOtpRequest extends Model<PhoneOtpAttrs, PhoneOtpCreate> implements PhoneOtpAttrs {
  public id!: number; public phone_number!: string; public otp_code!: string; public expires_at!: Date;
  public attempts?: number; public created_at?: Date; public updated_at?: Date;
}
function definePhoneOtpRequest(seq: Sequelize) {
  PhoneOtpRequest.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    phone_number: { type: DataTypes.STRING(20), allowNull: false },
    otp_code: { type: DataTypes.STRING(6), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    attempts: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  }, { sequelize: seq, tableName: 'otp_requests', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return PhoneOtpRequest;
}

// ── EmailOtpRequest (email channel) ─────────────────────────────────────────────
interface EmailOtpAttrs { id: number; email: string; otp_code: string; expires_at: Date; attempts?: number; created_at?: Date; updated_at?: Date; }
interface EmailOtpCreate extends Optional<EmailOtpAttrs, 'id'> {}
class EmailOtpRequest extends Model<EmailOtpAttrs, EmailOtpCreate> implements EmailOtpAttrs {
  public id!: number; public email!: string; public otp_code!: string; public expires_at!: Date;
  public attempts?: number; public created_at?: Date; public updated_at?: Date;
}
function defineEmailOtpRequest(seq: Sequelize) {
  EmailOtpRequest.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    otp_code: { type: DataTypes.STRING(10), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    attempts: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  }, { sequelize: seq, tableName: 'email_otp_requests', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return EmailOtpRequest;
}

// ── Permission ───────────────────────────────────────────────────────────────
interface PermissionAttrs { permission_id: number; module_id?: number; permission_key?: string; permission_name?: string; created_at?: Date; }
interface PermissionCreate extends Optional<PermissionAttrs, 'permission_id'> {}
class Permission extends Model<PermissionAttrs, PermissionCreate> implements PermissionAttrs {
  public permission_id!: number; public module_id?: number; public permission_key?: string;
  public permission_name?: string; public created_at?: Date;
}
function definePermission(seq: Sequelize) {
  Permission.init({
    permission_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    module_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    permission_key: { type: DataTypes.STRING(100), allowNull: true },
    permission_name: { type: DataTypes.STRING(200), allowNull: true },
  }, { sequelize: seq, tableName: 'permissions', timestamps: true, createdAt: 'created_at', updatedAt: false });
  return Permission;
}

// ── Role ─────────────────────────────────────────────────────────────────────
interface RoleAttrs { role_id: number; role_name?: string; is_system_role?: boolean; module_ids?: string; created_at?: Date; updated_at?: Date; }
interface RoleCreate extends Optional<RoleAttrs, 'role_id'> {}
class Role extends Model<RoleAttrs, RoleCreate> implements RoleAttrs {
  public role_id!: number; public role_name?: string; public is_system_role?: boolean;
  public module_ids?: string; public created_at?: Date; public updated_at?: Date;
}
function defineRole(seq: Sequelize) {
  Role.init({
    role_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    role_name: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    is_system_role: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    module_ids: { type: DataTypes.TEXT('long'), allowNull: true },
  }, { sequelize: seq, tableName: 'roles', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return Role;
}

// ── UserRole ─────────────────────────────────────────────────────────────────
interface UserRoleAttrs { id: number; user_id?: number; role_id?: number; created_at?: Date; }
interface UserRoleCreate extends Optional<UserRoleAttrs, 'id'> {}
class UserRole extends Model<UserRoleAttrs, UserRoleCreate> implements UserRoleAttrs {
  public id!: number; public user_id?: number; public role_id?: number; public created_at?: Date;
}
function defineUserRole(seq: Sequelize) {
  UserRole.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  }, { sequelize: seq, tableName: 'user_roles', timestamps: true, createdAt: 'created_at', updatedAt: false });
  return UserRole;
}

// ── UserModulePermission ───────────────────────────────────────────────────────
interface UserModulePermissionAttrs { id: number; user_id: number; role_id: number; module_id: number; can_view: boolean; can_edit: boolean; created_at?: Date; updated_at?: Date; }
interface UserModulePermissionCreate extends Optional<UserModulePermissionAttrs, 'id'> {}
class UserModulePermission extends Model<UserModulePermissionAttrs, UserModulePermissionCreate> implements UserModulePermissionAttrs {
  public id!: number; public user_id!: number; public role_id!: number; public module_id!: number;
  public can_view!: boolean; public can_edit!: boolean; public created_at?: Date; public updated_at?: Date;
}
function defineUserModulePermission(seq: Sequelize) {
  UserModulePermission.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    module_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    can_view: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_edit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { sequelize: seq, tableName: 'user_module_permissions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return UserModulePermission;
}

// ── VerifiedPhoneNumber ─────────────────────────────────────────────────────────
interface VerifiedPhoneNumberAttrs { id: number; phone_number: string; verified_at: Date; created_at?: Date; updated_at?: Date; }
interface VerifiedPhoneNumberCreate extends Optional<VerifiedPhoneNumberAttrs, 'id'> {}
class VerifiedPhoneNumber extends Model<VerifiedPhoneNumberAttrs, VerifiedPhoneNumberCreate> implements VerifiedPhoneNumberAttrs {
  public id!: number; public phone_number!: string; public verified_at!: Date; public created_at?: Date; public updated_at?: Date;
}
function defineVerifiedPhoneNumber(seq: Sequelize) {
  VerifiedPhoneNumber.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    phone_number: { type: DataTypes.STRING(20), allowNull: false },
    verified_at: { type: DataTypes.DATE, allowNull: false },
  }, { sequelize: seq, tableName: 'verified_phone_numbers', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return VerifiedPhoneNumber;
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
  TeacherClass.init({ id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }, teacher_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: 1 }, academic_year_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, class_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, subject_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, assigned_date: { type: DataTypes.DATEONLY, allowNull: true }, is_active: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 } }, { sequelize: seq, tableName: 'teacher_class_subjects', timestamps: false });
  return TeacherClass;
}

// ── StudentDailyAttendance ────────────────────────────────────────────────────
// NOTE: this table has no class_id column (confirmed via live schema — do not add
// one back without also fixing the callers in attendance.controller.ts /
// teacher-attendance.service.ts that currently filter/write class_id here).
// NOTE: student_id is bigint (students.id), NOT the varchar student_id business
// code used elsewhere (students.student_id / the JWT's resolved user_code).
interface SDAAttrs { id: number; attendance_id: string; student_id: number; student_code: string; student_name?: string; attendance_date: Date; attendance_status?: string; attendance_type?: string; marked_by?: string; marked_by_type?: string; location_marked?: string; device_info?: string; remarks?: string; absence_reason?: string; leave_approval_required?: boolean; leave_approved_by?: string; leave_approved_at?: Date; check_in_time?: string; check_out_time?: string; late_minutes?: number; parent_notified?: number; parent_notification_sent_at?: Date; sms_sent?: number; email_sent?: number; approved_by?: string; approved_at?: Date; status?: number; is_trash?: number; created_by?: string; updated_by?: string; createdAt?: Date; updatedAt?: Date; }
interface SDACreate extends Optional<SDAAttrs, 'id'> {}
class StudentDailyAttendance extends Model<SDAAttrs, SDACreate> implements SDAAttrs {
  public id!: number; public attendance_id!: string; public student_id!: number; public student_code!: string;
  public student_name?: string; public attendance_date!: Date; public attendance_status?: string;
  public attendance_type?: string; public marked_by?: string; public marked_by_type?: string;
  public location_marked?: string; public device_info?: string; public remarks?: string;
  public absence_reason?: string; public leave_approval_required?: boolean; public leave_approved_by?: string;
  public leave_approved_at?: Date; public check_in_time?: string; public check_out_time?: string; public late_minutes?: number;
  public parent_notified?: number; public parent_notification_sent_at?: Date; public sms_sent?: number; public email_sent?: number;
  public approved_by?: string; public approved_at?: Date; public status?: number;
  public is_trash?: number; public created_by?: string; public updated_by?: string; public createdAt?: Date; public updatedAt?: Date;
}
function defineStudentDailyAttendance(seq: Sequelize) {
  StudentDailyAttendance.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    attendance_id: { type: DataTypes.STRING(50), allowNull: false, unique: true, defaultValue: () => uuidv4() },
    student_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    student_code: { type: DataTypes.STRING(50), allowNull: false },
    student_name: { type: DataTypes.STRING(255), allowNull: true },
    attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
    attendance_status: { type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY', 'LEAVE'), allowNull: true, defaultValue: 'PRESENT' },
    attendance_type: { type: DataTypes.ENUM('MANUAL', 'BIOMETRIC', 'RFID', 'MOBILE_APP'), allowNull: true, defaultValue: 'MANUAL' },
    marked_by: { type: DataTypes.STRING(50), allowNull: true },
    marked_by_type: { type: DataTypes.ENUM('TEACHER', 'ADMIN', 'SYSTEM', 'PARENT'), allowNull: true, defaultValue: 'TEACHER' },
    location_marked: { type: DataTypes.STRING(255), allowNull: true },
    device_info: { type: DataTypes.TEXT, allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    absence_reason: { type: DataTypes.ENUM('SICK', 'FAMILY', 'EMERGENCY', 'PERSONAL', 'OTHER'), allowNull: true },
    leave_approval_required: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    leave_approved_by: { type: DataTypes.STRING(50), allowNull: true },
    leave_approved_at: { type: DataTypes.DATE, allowNull: true },
    check_in_time: { type: DataTypes.TIME, allowNull: true },
    check_out_time: { type: DataTypes.TIME, allowNull: true },
    late_minutes: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    parent_notified: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    parent_notification_sent_at: { type: DataTypes.DATE, allowNull: true },
    sms_sent: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    email_sent: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    approved_by: { type: DataTypes.STRING(50), allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    is_trash: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    created_by: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'SYSTEM' },
    updated_by: { type: DataTypes.STRING(50), allowNull: true },
  }, {
    sequelize: seq, tableName: 'student_daily_attendance', timestamps: true, createdAt: 'createdAt', updatedAt: 'updatedAt',
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
interface StaffAttrs { id: number; attendance_id: string; employee_id: string; employee_code?: string; employee_name?: string; department_id?: number; designation?: string; attendance_date: Date; attendance_status: string; check_in_time?: string; check_out_time?: string; late_minutes?: number; attendance_type?: string; marked_by?: string; marked_by_type?: string; remarks?: string; absence_reason?: string; status?: number; is_trash?: number; created_by?: string; created_at?: Date; updated_at?: Date; }
interface StaffCreate extends Optional<StaffAttrs, 'id'> {}
class StaffDailyAttendance extends Model<StaffAttrs, StaffCreate> implements StaffAttrs {
  public id!: number; public attendance_id!: string; public employee_id!: string; public employee_code?: string;
  public employee_name?: string; public department_id?: number; public designation?: string; public attendance_date!: Date;
  public attendance_status!: string; public check_in_time?: string; public check_out_time?: string; public late_minutes?: number;
  public attendance_type?: string; public marked_by?: string; public marked_by_type?: string; public remarks?: string;
  public absence_reason?: string; public status?: number; public is_trash?: number; public created_by?: string; public created_at?: Date; public updated_at?: Date;
}
function defineStaffDailyAttendance(seq: Sequelize) {
  StaffDailyAttendance.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    attendance_id: { type: DataTypes.STRING(100), allowNull: false, unique: true, defaultValue: () => uuidv4() },
    employee_id: { type: DataTypes.STRING(50), allowNull: false },
    employee_code: { type: DataTypes.STRING(50), allowNull: true },
    employee_name: { type: DataTypes.STRING(200), allowNull: true },
    department_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    designation: { type: DataTypes.STRING(100), allowNull: true },
    attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
    attendance_status: { type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY', 'LEAVE', 'ON_DUTY'), allowNull: false },
    check_in_time: { type: DataTypes.TIME, allowNull: true },
    check_out_time: { type: DataTypes.TIME, allowNull: true },
    late_minutes: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    attendance_type: { type: DataTypes.ENUM('MANUAL', 'BIOMETRIC', 'RFID', 'MOBILE_APP'), allowNull: true, defaultValue: 'MANUAL' },
    marked_by: { type: DataTypes.STRING(100), allowNull: true },
    marked_by_type: { type: DataTypes.ENUM('ADMIN', 'SYSTEM', 'SELF'), allowNull: true, defaultValue: 'ADMIN' },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    absence_reason: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    is_trash: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    created_by: { type: DataTypes.STRING(100), allowNull: true },
  }, { sequelize: seq, tableName: 'staff_daily_attendance', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return StaffDailyAttendance;
}

// ── TeacherAssignment ─────────────────────────────────────────────────────────
// NOTE: no assignment_id column exists on this table (confirmed via live schema) —
// removed a phantom field that was in the old model and unused by any call site.
interface TAAttrs { id: number; title?: string; description?: string; detailed_instructions?: string; type?: string; teacher_id: number; class_id: number; subject_id?: number; semester_id: number; section_id?: number; program_id: number; academic_year_id: number; due_date?: Date; due_time?: string; maximum_marks?: number; allow_late_submissions?: number; send_notification?: number; is_active?: number; created_at?: Date; updated_at?: Date; }
interface TACreate extends Optional<TAAttrs, 'id'> {}
class TeacherAssignment extends Model<TAAttrs, TACreate> implements TAAttrs {
  public id!: number; public title?: string; public description?: string;
  public detailed_instructions?: string; public type?: string; public teacher_id!: number; public class_id!: number;
  public subject_id?: number; public semester_id!: number; public section_id?: number; public program_id!: number;
  public academic_year_id!: number; public due_date?: Date; public due_time?: string; public maximum_marks?: number;
  public allow_late_submissions?: number; public send_notification?: number; public is_active?: number;
  public created_at?: Date; public updated_at?: Date;
}
function defineTeacherAssignment(seq: Sequelize) {
  TeacherAssignment.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    detailed_instructions: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.ENUM('Assignment', 'Homework'), allowNull: true },
    teacher_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    class_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    subject_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    semester_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    section_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    academic_year_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    due_date: { type: DataTypes.DATEONLY, allowNull: true },
    due_time: { type: DataTypes.TIME, allowNull: true },
    maximum_marks: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 100 },
    allow_late_submissions: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    send_notification: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    is_active: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
  }, { sequelize: seq, tableName: 'teacher_assignments', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return TeacherAssignment;
}

// ── AssignmentSubmission (StudentAssignmentSubmission) ────────────────────────
// NOTE: student_id is bigint (students.id), NOT the varchar student_id business
// code used elsewhere. No submission_id or student_name columns exist on this
// table (confirmed live) — both removed; neither was referenced by any call site.
interface ASAttrs { id: number; teacher_assignment_id: number; student_id: number; submission_text?: string; file_url?: string; submitted_at?: Date; marks_obtained?: number; grade?: string; feedback?: string; teacher_remarks?: string; is_late_submission?: number; status?: string; graded_at?: Date; graded_by?: number; created_at?: Date; updated_at?: Date; }
interface ASCreate extends Optional<ASAttrs, 'id'> {}
class AssignmentSubmission extends Model<ASAttrs, ASCreate> implements ASAttrs {
  public id!: number; public teacher_assignment_id!: number; public student_id!: number;
  public submission_text?: string; public file_url?: string; public submitted_at?: Date;
  public marks_obtained?: number; public grade?: string; public feedback?: string; public teacher_remarks?: string;
  public is_late_submission?: number; public status?: string; public graded_at?: Date; public graded_by?: number;
  public created_at?: Date; public updated_at?: Date;
}
function defineAssignmentSubmission(seq: Sequelize) {
  AssignmentSubmission.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    teacher_assignment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    student_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    submission_text: { type: DataTypes.TEXT, allowNull: true },
    file_url: { type: DataTypes.STRING(500), allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    marks_obtained: { type: DataTypes.INTEGER, allowNull: true },
    grade: { type: DataTypes.STRING(10), allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    teacher_remarks: { type: DataTypes.TEXT, allowNull: true },
    is_late_submission: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    status: { type: DataTypes.ENUM('not_submitted', 'submitted', 'graded'), allowNull: true, defaultValue: 'not_submitted' },
    graded_at: { type: DataTypes.DATE, allowNull: true },
    graded_by: { type: DataTypes.BIGINT, allowNull: true },
  }, { sequelize: seq, tableName: 'student_assignment_submissions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return AssignmentSubmission;
}

// ── TeacherAssignmentAttachment ───────────────────────────────────────────────
interface TAAAttrs { id: number; teacher_assignment_id: number; file_name: string; file_url: string; file_size?: number; file_type?: string; uploaded_at?: Date; }
interface TAACreate extends Optional<TAAAttrs, 'id'> {}
class TeacherAssignmentAttachment extends Model<TAAAttrs, TAACreate> implements TAAAttrs {
  public id!: number; public teacher_assignment_id!: number; public file_name!: string; public file_url!: string;
  public file_size?: number; public file_type?: string; public uploaded_at?: Date;
}
function defineTeacherAssignmentAttachment(seq: Sequelize) {
  TeacherAssignmentAttachment.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    teacher_assignment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    file_url: { type: DataTypes.STRING(500), allowNull: false },
    file_size: { type: DataTypes.BIGINT, allowNull: true },
    file_type: { type: DataTypes.STRING(100), allowNull: true },
  }, { sequelize: seq, tableName: 'teacher_assignment_attachments', timestamps: true, createdAt: 'uploaded_at', updatedAt: false });
  return TeacherAssignmentAttachment;
}

// ── ReadmissionRequest ─────────────────────────────────────────────────────────
interface RRAttrs { id: number; student_id: number; program_id: number; department_id?: number; from_class_id: number; to_class_id: number; from_semester_id: number; to_semester_id: number; academic_year_id: number; status?: string; student_confirmed?: boolean; student_confirmed_at?: Date; fee_required?: boolean; fee_amount?: number; fee_paid?: boolean; remarks?: string; created_at?: Date; updated_at?: Date; }
interface RRCreate extends Optional<RRAttrs, 'id'> {}
class ReadmissionRequest extends Model<RRAttrs, RRCreate> implements RRAttrs {
  public id!: number; public student_id!: number; public program_id!: number; public department_id?: number;
  public from_class_id!: number; public to_class_id!: number; public from_semester_id!: number; public to_semester_id!: number;
  public academic_year_id!: number; public status?: string; public student_confirmed?: boolean; public student_confirmed_at?: Date;
  public fee_required?: boolean; public fee_amount?: number; public fee_paid?: boolean; public remarks?: string;
  public created_at?: Date; public updated_at?: Date;
}
function defineReadmissionRequest(seq: Sequelize) {
  ReadmissionRequest.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    student_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    department_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    from_class_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    to_class_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    from_semester_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    to_semester_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    academic_year_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'), allowNull: false, defaultValue: 'PENDING' },
    student_confirmed: { type: DataTypes.BOOLEAN, allowNull: true },
    student_confirmed_at: { type: DataTypes.DATEONLY, allowNull: true },
    fee_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    fee_amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    fee_paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    remarks: { type: DataTypes.TEXT, allowNull: true },
  }, { sequelize: seq, tableName: 'readmission_requests', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return ReadmissionRequest;
}

// ── StudentAddress ─────────────────────────────────────────────────────────────
interface SAddrAttrs { id: number; student_id?: number; user_id: number; address_type: string; address_line?: string; village?: string; post_office?: string; police_station?: string; district?: string; state?: string; pincode?: string; municipality_block?: string; created_at?: Date; updated_at?: Date; }
interface SAddrCreate extends Optional<SAddrAttrs, 'id'> {}
class StudentAddress extends Model<SAddrAttrs, SAddrCreate> implements SAddrAttrs {
  public id!: number; public student_id?: number; public user_id!: number; public address_type!: string;
  public address_line?: string; public village?: string; public post_office?: string; public police_station?: string;
  public district?: string; public state?: string; public pincode?: string; public municipality_block?: string;
  public created_at?: Date; public updated_at?: Date;
}
function defineStudentAddress(seq: Sequelize) {
  StudentAddress.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    student_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    address_type: { type: DataTypes.ENUM('PERMANENT', 'PRESENT'), allowNull: false },
    address_line: { type: DataTypes.TEXT, allowNull: true },
    village: { type: DataTypes.STRING(150), allowNull: true },
    post_office: { type: DataTypes.STRING(150), allowNull: true },
    police_station: { type: DataTypes.STRING(150), allowNull: true },
    district: { type: DataTypes.STRING(150), allowNull: true },
    state: { type: DataTypes.STRING(150), allowNull: true },
    pincode: { type: DataTypes.STRING(20), allowNull: true },
    municipality_block: { type: DataTypes.STRING(150), allowNull: true },
  }, { sequelize: seq, tableName: 'student_addresses', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return StudentAddress;
}

// ── StudentGuardian ─────────────────────────────────────────────────────────────
interface SGAttrs { id: number; student_id?: number; user_id: number; relationship: string; name: string; qualification?: string; email?: string; mobile?: string; is_primary_guardian?: boolean; created_at?: Date; updated_at?: Date; }
interface SGCreate extends Optional<SGAttrs, 'id'> {}
class StudentGuardian extends Model<SGAttrs, SGCreate> implements SGAttrs {
  public id!: number; public student_id?: number; public user_id!: number; public relationship!: string; public name!: string;
  public qualification?: string; public email?: string; public mobile?: string; public is_primary_guardian?: boolean;
  public created_at?: Date; public updated_at?: Date;
}
function defineStudentGuardian(seq: Sequelize) {
  StudentGuardian.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    student_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    relationship: { type: DataTypes.ENUM('FATHER', 'MOTHER', 'GUARDIAN'), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    qualification: { type: DataTypes.STRING(100), allowNull: true },
    email: { type: DataTypes.STRING(150), allowNull: true },
    mobile: { type: DataTypes.STRING(20), allowNull: true },
    is_primary_guardian: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { sequelize: seq, tableName: 'student_guardians', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return StudentGuardian;
}

// ── StudentApplication ─────────────────────────────────────────────────────────
interface SApAttrs { id: number; user_id: number; academic_year_id: number; program_id: number; degree_type: string; program_type: string; department_id: number; application_status?: string; is_locked?: boolean; created_at?: Date; updated_at?: Date; }
interface SApCreate extends Optional<SApAttrs, 'id'> {}
class StudentApplication extends Model<SApAttrs, SApCreate> implements SApAttrs {
  public id!: number; public user_id!: number; public academic_year_id!: number; public program_id!: number;
  public degree_type!: string; public program_type!: string; public department_id!: number;
  public application_status?: string; public is_locked?: boolean; public created_at?: Date; public updated_at?: Date;
}
function defineStudentApplication(seq: Sequelize) {
  StudentApplication.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    academic_year_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    program_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    degree_type: { type: DataTypes.STRING(16), allowNull: false },
    program_type: { type: DataTypes.STRING(32), allowNull: false },
    department_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    application_status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'IN_PROGRESS' },
    is_locked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { sequelize: seq, tableName: 'student_applications', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return StudentApplication;
}

// ── StudentApplicationStatus ─────────────────────────────────────────────────────
interface SASAttrs { id: number; user_id: number; application_id?: string; preview_confirmed?: boolean; preview_confirmed_at?: Date; subjects_selected?: boolean; subjects_selected_at?: Date; final_submitted?: boolean; final_submitted_at?: Date; status?: string; created_at?: Date; updated_at?: Date; }
interface SASCreate extends Optional<SASAttrs, 'id'> {}
class StudentApplicationStatus extends Model<SASAttrs, SASCreate> implements SASAttrs {
  public id!: number; public user_id!: number; public application_id?: string;
  public preview_confirmed?: boolean; public preview_confirmed_at?: Date;
  public subjects_selected?: boolean; public subjects_selected_at?: Date;
  public final_submitted?: boolean; public final_submitted_at?: Date;
  public status?: string; public created_at?: Date; public updated_at?: Date;
}
function defineStudentApplicationStatus(seq: Sequelize) {
  StudentApplicationStatus.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    application_id: { type: DataTypes.STRING(50), allowNull: true },
    preview_confirmed: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    preview_confirmed_at: { type: DataTypes.DATE, allowNull: true },
    subjects_selected: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    subjects_selected_at: { type: DataTypes.DATE, allowNull: true },
    final_submitted: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    final_submitted_at: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM('REGISTRATION_COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'ADMITTED'), allowNull: true },
  }, { sequelize: seq, tableName: 'student_application_status', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
  return StudentApplicationStatus;
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
  const PhoneOtpRequest_ = definePhoneOtpRequest(seq);
  const EmailOtpRequest_ = defineEmailOtpRequest(seq);
  const Permission_ = definePermission(seq);
  const Role_ = defineRole(seq);
  const UserRole_ = defineUserRole(seq);
  const UserModulePermission_ = defineUserModulePermission(seq);
  const VerifiedPhoneNumber_ = defineVerifiedPhoneNumber(seq);
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
  const TeacherAssignmentAttachment_ = defineTeacherAssignmentAttachment(seq);
  const ReadmissionRequest_ = defineReadmissionRequest(seq);
  const StudentAddress_ = defineStudentAddress(seq);
  const StudentGuardian_ = defineStudentGuardian(seq);
  const StudentApplication_ = defineStudentApplication(seq);
  const StudentApplicationStatus_ = defineStudentApplicationStatus(seq);
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
  User_.hasMany(UserRole_, { foreignKey: 'user_id' });
  UserRole_.belongsTo(User_, { foreignKey: 'user_id' });
  Role_.hasMany(UserRole_, { foreignKey: 'role_id' });
  UserRole_.belongsTo(Role_, { foreignKey: 'role_id' });

  User_.hasMany(UserModulePermission_, { foreignKey: 'user_id' });
  Role_.hasMany(UserModulePermission_, { foreignKey: 'role_id' });
  UserModulePermission_.belongsTo(User_, { foreignKey: 'user_id' });
  UserModulePermission_.belongsTo(Role_, { foreignKey: 'role_id' });

  Student_.belongsTo(Department_, { foreignKey: 'department_id', as: 'department' });
  Department_.hasMany(Student_, { foreignKey: 'department_id', as: 'students' });

  Student_.belongsToMany(Subject_, { through: StudentSubject_, foreignKey: 'student_id', otherKey: 'subject_id', as: 'subjects' });
  Subject_.belongsToMany(Student_, { through: StudentSubject_, foreignKey: 'subject_id', otherKey: 'student_id', as: 'students' });

  Teacher_.hasMany(TeacherClass_, { foreignKey: 'teacher_id', as: 'classes' });
  TeacherClass_.belongsTo(Teacher_, { foreignKey: 'teacher_id', as: 'teacher' });
  TeacherClass_.belongsTo(SchoolClass_, { foreignKey: 'class_id', as: 'class' });
  TeacherClass_.belongsTo(Subject_, { foreignKey: 'subject_id', as: 'subject' });
  Teacher_.belongsTo(Department_, { foreignKey: 'department_id', as: 'department' });

  // student_daily_attendance.student_id is students.id (numeric PK), not the
  // varchar students.student_id business code — see model NOTE.
  StudentDailyAttendance_.belongsTo(Student_, { foreignKey: 'student_id', targetKey: 'id', as: 'student' });
  Student_.hasMany(StudentDailyAttendance_, { foreignKey: 'student_id', sourceKey: 'id', as: 'attendances' });

  Teacher_.hasMany(TeacherAssignment_, { foreignKey: 'teacher_id', as: 'assignments' });
  TeacherAssignment_.belongsTo(Teacher_, { foreignKey: 'teacher_id', as: 'teacher' });
  TeacherAssignment_.belongsTo(SchoolClass_, { foreignKey: 'class_id', as: 'class' });
  TeacherAssignment_.belongsTo(Subject_, { foreignKey: 'subject_id', as: 'subject' });
  TeacherAssignment_.hasMany(AssignmentSubmission_, { foreignKey: 'teacher_assignment_id', as: 'submissions' });
  AssignmentSubmission_.belongsTo(TeacherAssignment_, { foreignKey: 'teacher_assignment_id', as: 'assignment' });
  TeacherAssignment_.hasMany(TeacherAssignmentAttachment_, { foreignKey: 'teacher_assignment_id', as: 'attachments' });
  TeacherAssignmentAttachment_.belongsTo(TeacherAssignment_, { foreignKey: 'teacher_assignment_id', as: 'assignment' });

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
    User: User_, PhoneOtpRequest: PhoneOtpRequest_, EmailOtpRequest: EmailOtpRequest_,
    Permission: Permission_, Role: Role_, UserRole: UserRole_,
    UserModulePermission: UserModulePermission_, VerifiedPhoneNumber: VerifiedPhoneNumber_,
    Student: Student_, Teacher: Teacher_,
    Department: Department_, Subject: Subject_, Class: SchoolClass_,
    StudentSubject: StudentSubject_, TeacherClass: TeacherClass_,
    StudentDailyAttendance: StudentDailyAttendance_, StaffDailyAttendance: StaffDailyAttendance_,
    TeacherAssignment: TeacherAssignment_, AssignmentSubmission: AssignmentSubmission_,
    TeacherAssignmentAttachment: TeacherAssignmentAttachment_,
    ReadmissionRequest: ReadmissionRequest_, StudentAddress: StudentAddress_,
    StudentGuardian: StudentGuardian_, StudentApplication: StudentApplication_,
    StudentApplicationStatus: StudentApplicationStatus_,
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
  User, PhoneOtpRequest, EmailOtpRequest, Permission, Role, UserRole, UserModulePermission,
  VerifiedPhoneNumber, Institution, Student, Teacher, Department, Subject,
  SchoolClass as Class, StudentSubject, TeacherClass, StudentDailyAttendance, StaffDailyAttendance,
  TeacherAssignment, AssignmentSubmission, TeacherAssignmentAttachment,
  ReadmissionRequest, StudentAddress, StudentGuardian, StudentApplication, StudentApplicationStatus,
  RepositoryCategory, RepositoryFile,
  FeeHead, FeeCollection, Receipt, LedgerEntry, Payment, PaymentTransaction,
  Conversation, ConversationParticipant, Message, MessageReadStatus, Notice,
};
