import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";
import { defineExam } from "./exam";
import { defineExamComponent } from "./examComponent";
import { defineExamSchedule } from "./examSchedule";
import { defineExamComponentTemplate } from "./examComponentTemplate";
import { defineExamComponentMapping } from "./examComponentMapping";
import { defineStudentExamRegistration } from "./studentExamRegistration";
import { defineExamMark } from "./examMarks";
import { defineExamResult } from "./examResults";
import { defineExamMarksLockStatus } from "./examMarksLockStatus";
import { defineExamExaminer } from "./examExaminers";
import { defineSubject } from "./subject";
import { defineStudent } from "./student";
import { defineTeacher } from "./teacher";


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
  const Exam = defineExam(sequelize);
  const ExamComponentTemplate = defineExamComponentTemplate(sequelize);
  const ExamComponentMapping =  defineExamComponentMapping(sequelize);
  const ExamSchedule = defineExamSchedule(sequelize);
  const StudentExamRegistration = defineStudentExamRegistration(sequelize);
  const ExamMark = defineExamMark(sequelize);
  const ExamResult = defineExamResult(sequelize);
  const ExamMarksLockStatus = defineExamMarksLockStatus(sequelize);
  const ExamExaminer = defineExamExaminer(sequelize);
  const Subject = defineSubject(sequelize);
  const Student = defineStudent(sequelize);
  const Teacher = defineTeacher(sequelize);

  
  // Step 2: define associations
 ExamComponentMapping.belongsTo(Exam, {
    foreignKey: "examId",
    as: "exam",
  });

  ExamComponentMapping.belongsTo(ExamComponentTemplate, {
    foreignKey: "componentTemplateId",
    as: "template",
  });

  ExamComponentTemplate.hasMany(ExamComponentMapping, {
    foreignKey: "componentTemplateId",
    as: "examMappings",
  });

  Exam.hasMany(ExamSchedule, {  foreignKey: 'exam_id',  as: 'schedules' });
  ExamSchedule.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });

  Exam.belongsTo(Subject, {  foreignKey: "subject_id",  as: "subject" });
  Subject.hasMany(Exam, {  foreignKey: "subject_id",  as: "exams"});
  
  ExamMark.belongsTo(Exam, {
    foreignKey: "exam_id",
    as: "exam",
  });

  // exam_marks → student
  ExamMark.belongsTo(Student, {
     foreignKey: "student_id",
     as: "student",
  });

  // exam_marks → exam_component_mappings
  ExamMark.belongsTo(ExamComponentMapping, {
    foreignKey: "component_mapping_id",
    as: "component_mapping",
  });

  // ExamMark.belongsTo(Teacher, {
  //   foreignKey: "entered_by",
  //   as: "entered_by_teacher",
  // });

  // exam_marks → teacher (updated_by)
  // ExamMark.belongsTo(Teacher, {
  //   foreignKey: "updated_by",
  //   as: "updated_by_teacher",
  // });
   ExamResult.belongsTo(Exam, {
    foreignKey: "exam_id",
    as: "exam",
  });

  // exam_results → student
  ExamResult.belongsTo(Student, {
     foreignKey: "student_id",
     as: "student",
  });

  // reverse
  Exam.hasMany(ExamResult, {
    foreignKey: "exam_id",
    as: "results",
  });

  // Student.hasMany(ExamResult, {
  //   foreignKey: "student_id",
  //   as: "exam_results",
  // });
  ExamMarksLockStatus.belongsTo(Exam, {
    foreignKey: "exam_id",
    as: "exam",
  });

  // lock_status → admin (locked_by)
  // ExamMarksLockStatus.belongsTo(Teacher, {
  //   foreignKey: "locked_by",
  //   as: "locked_by_admin",
  // });

  // // lock_status → admin (reopened_by)
  // ExamMarksLockStatus.belongsTo(Teacher, {
  //   foreignKey: "reopened_by",
  //   as: "reopened_by_admin",
  // });

  // reverse
  Exam.hasOne(ExamMarksLockStatus, {
    foreignKey: "exam_id",
    as: "marks_lock_status",
  });
  ExamExaminer.belongsTo(Exam, {
    foreignKey: "exam_id",
    as: "exam",
  });
  // ExamExaminer.belongsTo(Teacher, {
  //   foreignKey: "teacher_id",
  //   as: "internal_examiner",
  // });
  Exam.hasMany(ExamExaminer, {
    foreignKey: "exam_id",
    as: "examiners",
  });
  // Teacher.hasMany(ExamExaminer, {
  //   foreignKey: "teacher_id",
  //   as: "examiner_for_exams",
  // });
  StudentExamRegistration.belongsTo(Student, {
    foreignKey: "student_id",
    as: "student",
  });

  return  { Exam, ExamComponentTemplate, ExamComponentMapping , ExamSchedule, 
    StudentExamRegistration, ExamMark, ExamResult, ExamMarksLockStatus, ExamExaminer, Subject,
    Student, Teacher };
}