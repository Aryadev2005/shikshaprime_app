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

// Tenant‑aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  // Step 1: define models
  const Attendance = defineAttendance(sequelize);
  const Department = defineDepartment(sequelize);
  const Student = defineStudent(sequelize);
  const StudentSubject = defineStudentSubject(sequelize);
  const Subject = defineSubject(sequelize);

  // Step 2: define associations
  Student.belongsTo(Department, { foreignKey: "department_id", as: "department" });
  Department.hasMany(Student, { foreignKey: "department_id", as: "students" });

  Student.belongsToMany(Subject, {
    through: StudentSubject,
    foreignKey: "student_id",
    otherKey: "subject_id",
    as: "subjects",
  });
  Subject.belongsToMany(Student, {
    through: StudentSubject,
    foreignKey: "subject_id",
    otherKey: "student_id",
    as: "students",
  });
  Attendance.belongsTo(Student, { foreignKey: "student_id", as: "student" });
  Student.hasMany(Attendance, { foreignKey: "student_id", as: "attendances" });

  return { Attendance, Department, Student, StudentSubject, Subject };
}