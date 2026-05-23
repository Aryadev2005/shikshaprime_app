import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";
import { defineAcademicYear } from "./academic-year";
import { defineAssignmentAttachment } from "./assignment-attachment";
import { defineAssignmentSubmission } from "./assignment-submission";
import { defineClass } from "./class";
import { defineDepartment } from "./department";
import { defineProgram } from "./program";
import { defineSection } from "./section";
import { defineSemester } from "./semester";
import { defineStaffDailyAttendance } from "./staff-attendance";
import { defineSubject } from "./subject";
import { defineTeacher } from "./teacher";
import { defineTeacherAssignment } from "./teacher-assignment";
import { defineTeacherClass } from "./teacher-class";


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

// Tenant‑aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  // Step 1: define models
  const AcademicYear = defineAcademicYear(sequelize);
  const AssignmentAttachment = defineAssignmentAttachment(sequelize);
  const AssignmentSubmission = defineAssignmentSubmission(sequelize);
  const Class = defineClass(sequelize);
  const Department = defineDepartment(sequelize);
  const Program = defineProgram(sequelize);
  const Section = defineSection(sequelize);
  const Semester = defineSemester(sequelize);
  const StaffDailyAttendance = defineStaffDailyAttendance(sequelize);
  const Subject = defineSubject(sequelize);
  const TeacherAssignment = defineTeacherAssignment(sequelize);
  const TeacherClass = defineTeacherClass(sequelize);
  const Teacher = defineTeacher(sequelize);

  // Step 2: define associations
  Teacher.hasMany(TeacherAssignment, {
          foreignKey: "teacher_id",
          as: "assignments",
  });
    Teacher.hasMany(TeacherClass, {foreignKey: "teacher_id", as: "teacher_classes" });

    Program.hasMany(Section, { foreignKey: 'program_id', as: 'sections' });
    Section.belongsTo(Program, { foreignKey: 'program_id', as: 'program' });

    TeacherClass.belongsTo(Program, { foreignKey: "program_id", as: "program" }); 
    TeacherClass.belongsTo(Class, { foreignKey: "class_id", as: "class" }); 
    TeacherClass.belongsTo(Subject, { foreignKey: "subject_id", as: "subject" });
    TeacherClass.belongsTo(AcademicYear, { foreignKey: "academic_year_id", as: "academic_year" });
    Subject.belongsTo(Department, { foreignKey: "department_id", as: "department" });

    TeacherAssignment.belongsTo(Teacher, { foreignKey: "teacher_id", as: "teacher"});

    TeacherAssignment.belongsTo(Program, { foreignKey: 'program_id', as: 'program' });
    TeacherAssignment.belongsTo(Section, { foreignKey: 'section_id', as: 'section' });
    TeacherAssignment.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });
    TeacherAssignment.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
    TeacherAssignment.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });


    TeacherAssignment.hasMany(AssignmentSubmission, {
            foreignKey: "teacher_assignment_id",
            as: "submissions",
    });

    AssignmentSubmission.belongsTo(TeacherAssignment, {
            foreignKey: "teacher_assignment_id",
            as: "assignment",
    });

    // Assignment -> AssignmentAttachment relationships
    TeacherAssignment.hasMany(AssignmentAttachment, {
            foreignKey: "teacher_assignment_id",
            as: "attachments",
    });

    AssignmentAttachment.belongsTo(TeacherAssignment, {
            foreignKey: "teacher_assignment_id",
            as: "assignment",
    }); 
    return  {
          Teacher, TeacherAssignment, TeacherClass,
          AssignmentSubmission,
          AssignmentAttachment, StaffDailyAttendance, 
          Program, Section, Semester, AcademicYear, Department, Subject, Class
    };
}