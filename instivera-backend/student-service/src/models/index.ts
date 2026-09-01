import { config } from "../config";
import { Sequelize } from "sequelize";


// Global (shared) Sequelize instance – for system tables, tenant registry, etc.
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: Number(config.db.port),
  dialect: "mysql",
});

// Test the global connection
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

// Import models to register them
import { defineStudent } from './student';
import { defineAttendance } from './attendance';
import { defineDepartment } from './department';
import { getTenantSequelize } from "../server";
import { defineStudentSubject } from "./studentSubjects";
import { defineSubject } from "./subject";
import { defineProgram } from "./programs";
import { defineClass } from "./classes";
import { defineSemester } from "./semesters";
import { defineAcademicYear } from "./academicYear";
import { defineLearningMaterial } from "./learningMaterials";
import { defineStudentPersonalDetails } from "./studentPersonalDetails";
import { defineAttendanceSession } from "./attendanceSession";
import { defineStudentAttendance } from "./studentAttendance";
import { defineGeneralNotification } from "./Notification";

// Tenant‑aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);

  // Step 1: define models
  const Attendance = defineAttendance(sequelize);
  const Department = defineDepartment(sequelize);
  const Student = defineStudent(sequelize);
  const StudentSubject = defineStudentSubject(sequelize);
  const Subject = defineSubject(sequelize);
  const LearningMaterial = defineLearningMaterial(sequelize);
  const Program = defineProgram(sequelize);
  const Class = defineClass(sequelize);
  const Semester = defineSemester(sequelize);
  const AcademicYear = defineAcademicYear(sequelize);
  const StudentPersonalDetails = defineStudentPersonalDetails(sequelize);
  const AttendanceSession = defineAttendanceSession(sequelize);
  const StudentAttendance = defineStudentAttendance(sequelize);
  const GeneralNotification = defineGeneralNotification(sequelize);


  // Step 2: define associations
  Department.hasMany(Program, {
    foreignKey: "department_id",
    as: "programs"
  });

  Program.belongsTo(Department, {
    foreignKey: "department_id",
    as: "department"
  });
  Student.hasOne(StudentPersonalDetails, {
    foreignKey: "student_id",
    as: "details"
  });

  StudentPersonalDetails.belongsTo(Student, {
    foreignKey: "student_id",
    as: "student"
  });
  StudentPersonalDetails.belongsTo(Program, {
    foreignKey: "program_id",
    as: "program"
  });

  Program.hasMany(StudentPersonalDetails, {
    foreignKey: "program_id",
    as: "students"
  });

  Class.belongsTo(Program, {
    foreignKey: "program_id",
    as: "program"
  });

  Program.hasMany(Class, {
    foreignKey: "program_id",
    as: "classes"
  });
  Semester.belongsTo(Class, {
    foreignKey: "class_id",
    as: "class"
  });

  Class.hasMany(Semester, {
    foreignKey: "class_id",
    as: "semesters"
  });
  Student.belongsToMany(Subject, {
    through: StudentSubject,
    foreignKey: "student_id",
    otherKey: "subject_id",
    as: "subjects"
  });

  Subject.belongsToMany(Student, {
    through: StudentSubject,
    foreignKey: "subject_id",
    otherKey: "student_id",
    as: "students"
  });

  Attendance.belongsTo(Student, {
    foreignKey: "student_id",
    as: "student"
  });

  Student.hasMany(Attendance, {
    foreignKey: "student_id",
    as: "attendances"
  });
  LearningMaterial.belongsTo(Department, {
    foreignKey: "department_id",
    as: "department"
  });

  LearningMaterial.belongsTo(Subject, {
    foreignKey: "subject_id",
    as: "subject"
  });

  AttendanceSession.hasMany(StudentAttendance, {
    foreignKey: "attendance_session_id",
    as: "attendances"
  });

  StudentAttendance.belongsTo(AttendanceSession, {
    foreignKey: "attendance_session_id",
    as: "session"
  });

  Student.hasMany(StudentAttendance, {
    foreignKey: "student_id",
    as: "sessionAttendances"
  });

  StudentAttendance.belongsTo(Student, {
    foreignKey: "student_id",
    as: "student"
  });

  return {
    Attendance,
    Department,
    Student,
    StudentPersonalDetails,
    StudentSubject,
    Subject,
    LearningMaterial,
    Program,
    Class,
    Semester,
    AcademicYear,
    AttendanceSession,
    StudentAttendance,
    GeneralNotification
  };
}