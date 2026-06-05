import { getTenantSequelize } from '../server';
import { defineStudent } from './student';
import { defineAttendance } from './attendance';
import { defineDepartment } from './department';
import { defineStudentSubject } from './studentSubject';
import { defineSubject } from './subject';
import { defineTeacherAssignment } from './teacherAssignment';
import { defineAssignmentSubmission } from './assignmentSubmission';
import { defineRepositoryCategory } from './repositoryCategory';
import { defineRepositoryFile } from './repositoryFile';

export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);

  // Step 1: define models
  const Attendance = defineAttendance(sequelize);
  const Department = defineDepartment(sequelize);
  const Student = defineStudent(sequelize);
  const StudentSubject = defineStudentSubject(sequelize);
  const Subject = defineSubject(sequelize);
  const TeacherAssignment = defineTeacherAssignment(sequelize);
  const AssignmentSubmission = defineAssignmentSubmission(sequelize);
  const RepositoryCategory = defineRepositoryCategory(sequelize);
  const RepositoryFile = defineRepositoryFile(sequelize);

  // Step 2: define associations
  Student.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
  Department.hasMany(Student, { foreignKey: 'department_id', as: 'students' });

  Student.belongsToMany(Subject, {
    through: StudentSubject,
    foreignKey: 'student_id',
    otherKey: 'subject_id',
    as: 'subjects',
  });
  Subject.belongsToMany(Student, {
    through: StudentSubject,
    foreignKey: 'subject_id',
    otherKey: 'student_id',
    as: 'students',
  });

  Attendance.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
  Student.hasMany(Attendance, { foreignKey: 'student_id', as: 'attendances' });

  // Assignment associations
  TeacherAssignment.hasMany(AssignmentSubmission, {
    foreignKey: 'teacher_assignment_id',
    as: 'submissions',
  });
  AssignmentSubmission.belongsTo(TeacherAssignment, {
    foreignKey: 'teacher_assignment_id',
    as: 'assignment',
  });

  return {
    Attendance,
    Department,
    Student,
    StudentSubject,
    Subject,
    TeacherAssignment,
    AssignmentSubmission,
    RepositoryCategory,
    RepositoryFile,
  };
}
