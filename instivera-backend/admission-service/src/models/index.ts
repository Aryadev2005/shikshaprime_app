import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";
import { defineUniversity } from "./main/university";
import { defineTenant } from "./main/tenant";
import { defineRule } from "./main/rules";
import { defineAdmissionMode } from "./main/admissionModes";
import { defineCourseType } from "./main/courseTypes";
import { defineProgramCourseStructure } from "./main/programCourseStructure";
import { defineAcademicYear } from "./tenant/academicYear";
import { defineDepartment } from "./tenant/department";
import { defineProgram } from "./tenant/program";
import { defineStudent } from "./tenant/student";
import { defineStudentAcademicHistory } from "./tenant/studentAcademicHistory";
import { defineStudentAddress } from "./tenant/studentAddress";
import { defineStudentBankDetails } from "./tenant/studentBankDetails";
import { defineStudentGuardian } from "./tenant/studentGuardians";
import { defineStudentSubject } from "./tenant/studentSubject";
import { defineSubject } from "./tenant/subject";
import { defineUser } from "./tenant/user";
import { defineStudentPreRegistration } from "./tenant/studentPreRegistration";
import { defineStudentPersonalDetails } from "./tenant/studentPersonalDetails";
import { defineStudentDocuments } from "./tenant/studentDocuments";
import { defineStudentApplicationStatus } from "./tenant/studentApplicationStatus";
import { defineStudentApplications } from "./tenant/studentApplications";
import { defineProgramSubjects } from "./tenant/programSubjects";
import { defineStudentAcademicStatusHistory } from "./tenant/studentAcademicStatusHistory";
import { defineReadmissionRequests } from "./tenant/readmissionRequest";
import { defineClasses } from "./tenant/class";
import { defineSemesters } from "./tenant/semester";
import { defineStudentFeeAssignment } from "./tenant/studentFeeAssignments";
import { defineProgramRules } from "./tenant/programRules";
import { defineStudentProgramChoices } from "./tenant/studentProgramChoices";
import { defineStudentPayment } from "./tenant/studentPayment";
import { definePaymentType } from "./tenant/paymentType";
import { defineStudentSubjectResults } from "./tenant/studentSubjectResults";
import { defineSemesterResults } from "./tenant/semesterResults";
import { defineResultPublications } from "./tenant/resultPublication";

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

export function getMainModels() {
  const University = defineUniversity(sequelize);
  const Tenant = defineTenant(sequelize);
  const Rule = defineRule(sequelize);
  const AdmissionMode = defineAdmissionMode(sequelize);
  const CourseType = defineCourseType(sequelize);
  const ProgramCourseStructure = defineProgramCourseStructure(sequelize);

  return { University, Tenant, Rule, AdmissionMode, CourseType, ProgramCourseStructure };
}

// Tenant-aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  const AcademicYear = defineAcademicYear(sequelize);
  const Department = defineDepartment(sequelize);
  const Program = defineProgram(sequelize);
  const ProgramSubject = defineProgramSubjects(sequelize);
  const Student = defineStudent(sequelize);
  const StudentAcademicHistory = defineStudentAcademicHistory(sequelize);
  const StudentAddress = defineStudentAddress(sequelize);
  const StudentBankDetails = defineStudentBankDetails(sequelize);
  const StudentGuardians = defineStudentGuardian(sequelize);
  const StudentSubjects = defineStudentSubject(sequelize);
  const Subject = defineSubject(sequelize);
  const User = defineUser(sequelize);
  const StudentPreRegistration = defineStudentPreRegistration(sequelize);
  const StudentPersonalDetails = defineStudentPersonalDetails(sequelize);
  const StudentDocuments = defineStudentDocuments(sequelize);
  const StudentApplicationStatus = defineStudentApplicationStatus(sequelize);
  const StudentApplications = defineStudentApplications(sequelize);
  const StudentAcademicStatusHistory = defineStudentAcademicStatusHistory(sequelize);
  const StudentFeeAssignment = defineStudentFeeAssignment(sequelize);
  const ReadmissionRequests = defineReadmissionRequests(sequelize);
  const Class = defineClasses(sequelize);
  const Semester = defineSemesters(sequelize);
  const ProgramRules = defineProgramRules(sequelize);
  const StudentProgramChoices = defineStudentProgramChoices(sequelize);
  const StudentPayment = defineStudentPayment(sequelize);
  const PaymentType = definePaymentType(sequelize);
  const StudentSubjectResults = defineStudentSubjectResults(sequelize);
  const SemesterResults = defineSemesterResults(sequelize);
  const ResultPublications = defineResultPublications(sequelize);

  return {
    sequelize,
    AcademicYear, Department, Program, Class, ProgramSubject, ProgramRules, Student, Semester, StudentAcademicHistory, StudentAddress, StudentBankDetails,
    StudentGuardians, StudentSubjects, Subject, User, StudentPreRegistration, StudentPersonalDetails, StudentPayment,
    StudentApplicationStatus, StudentDocuments, StudentApplications, StudentAcademicStatusHistory, StudentFeeAssignment, ReadmissionRequests, StudentProgramChoices, PaymentType,
    StudentSubjectResults, SemesterResults, ResultPublications
  };
}