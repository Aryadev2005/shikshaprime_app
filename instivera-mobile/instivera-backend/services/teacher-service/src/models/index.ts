import { getTenantSequelize } from '../server';
import { defineTeacher } from './teacher';
import { defineStudentDailyAttendance } from './studentDailyAttendance';
import { defineStaffDailyAttendance } from './staffDailyAttendance';
import { defineTeacherClass } from './teacherClass';
import { defineStudent } from './student';
import { defineClass } from './class';
import { defineSubject } from './subject';
import { defineDepartment } from './department';
import { defineTeacherAssignment } from './teacherAssignment';
import { defineAssignmentSubmission } from './assignmentSubmission';

export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);

  // Step 1: define models
  const Teacher = defineTeacher(sequelize);
  const StudentDailyAttendance = defineStudentDailyAttendance(sequelize);
  const StaffDailyAttendance = defineStaffDailyAttendance(sequelize);
  const TeacherClass = defineTeacherClass(sequelize);
  const Student = defineStudent(sequelize);
  const Class = defineClass(sequelize);
  const Subject = defineSubject(sequelize);
  const Department = defineDepartment(sequelize);
  const TeacherAssignment = defineTeacherAssignment(sequelize);
  const AssignmentSubmission = defineAssignmentSubmission(sequelize);

  // Step 2: define associations
  Teacher.hasMany(TeacherClass, { foreignKey: 'teacher_id', as: 'classes' });
  TeacherClass.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

  TeacherClass.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
  TeacherClass.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

  Teacher.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
  Department.hasMany(Teacher, { foreignKey: 'department_id', as: 'teachers' });

  Subject.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

  StudentDailyAttendance.belongsTo(Student, { foreignKey: 'student_id', targetKey: 'student_id', as: 'student' });
  Student.hasMany(StudentDailyAttendance, { foreignKey: 'student_id', sourceKey: 'student_id', as: 'attendances' });

  // Assignment associations
  Teacher.hasMany(TeacherAssignment, { foreignKey: 'teacher_id', as: 'assignments' });
  TeacherAssignment.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

  TeacherAssignment.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
  TeacherAssignment.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

  TeacherAssignment.hasMany(AssignmentSubmission, { foreignKey: 'teacher_assignment_id', as: 'submissions' });
  AssignmentSubmission.belongsTo(TeacherAssignment, { foreignKey: 'teacher_assignment_id', as: 'assignment' });

  return {
    Teacher,
    StudentDailyAttendance,
    StaffDailyAttendance,
    TeacherClass,
    Student,
    Class,
    Subject,
    Department,
    TeacherAssignment,
    AssignmentSubmission,
  };
}
