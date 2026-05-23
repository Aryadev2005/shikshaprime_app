import { StudentIdGenerator } from '../utils/studentIdGenerator';
import { IdentityServiceClient } from '../clients/identityServiceClient';
import { AppError } from '../utils/appError';
import { col, fn, Op, QueryTypes } from 'sequelize';
import bcrypt from "bcrypt";
import { getTenantModels } from '../models';
import { getTenantSequelize } from '../server';
 
// Helper function to extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
 
export class StudentService {
  private identityServiceClient: IdentityServiceClient;
 
  constructor() {
    this.identityServiceClient = new IdentityServiceClient();
  }
 
  async createStudentFromRegistration(registrationId: string, section: string,
    semester: string, token: string, tenant: string, transaction: any) {
    try {
      console.log("In student service-------" + tenant);
      // 1. Fetch registration data from identity service
      const registrationData = await this.identityServiceClient.getRegistrationById(registrationId, token, tenant);
 
      if (!registrationData) {
        throw new AppError('Registration not found', 404);
      }
 
      const { Student } = getTenantModels(tenant);
 
      // 2. Check if student already exists by email (since registration_id is not stored)
      const existingStudent = await Student.findOne({
        where: { email: registrationData.email }
      });
 
      if (existingStudent) {
        throw new AppError('Student already exists with this email', 400);
      }
 
      let userId = null;
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('password123', saltRounds);
 
      try {
        const sequelize = getTenantSequelize(tenant);
        const [userResult]: any = await sequelize.query(
          `INSERT INTO users (username, email, password_hash, first_name, last_name, role, user_type, tenant_id, is_active, created_at)
            VALUES (:username, :email, :password_hash, :first_name, :last_name, 'student', 'student', 1, 1, NOW())`,
          {
            replacements: {
              username: registrationData.email.split('@')[0],
              email: registrationData.email,
              password_hash: hashedPassword,
              first_name: registrationData.first_name,
              last_name: registrationData.last_name,
            },
            type: QueryTypes.INSERT,
            transaction: transaction
          }
        );
        userId = userResult;
        console.log(`[studentservice] Created user in users with ID: ${userId}`);
      } catch (userError: any) {
        console.error('[studentservice] Failed to create user:', userError.message);
      }
 
      // 4. Generate student_id and roll_number
      const studentId = await StudentIdGenerator.generateStudentId(registrationData.department_name, Student);
      const rollNumber = await StudentIdGenerator.generateRollNumber(registrationData.department_name, Student);
 
      // 5. Create student data - mapping registration fields to students table schema
      const studentData: any = {
        user_id: userId,
        student_id: studentId,
        roll_number: rollNumber,
        department_id: registrationData.department_id,
        program_id: registrationData.program_id,
        academic_year_id: registrationData.academic_year_id,
        class_id: registrationData.class_id,
        section_id: Number(section),
        semester_id: Number(semester),
        student_name: `${registrationData.first_name || ''} ${registrationData.last_name || ''}`.trim(),
        dob: registrationData.date_of_birth,
        sex: registrationData.gender,
        religion: registrationData.religion,
        is_physically_challenged: registrationData.is_physically_challenged,
        nationality: registrationData.nationality,
        father_name: registrationData.father_name,
        mother_name: registrationData.mother_name,
        guardian_name: registrationData.guardian_name,
        mobile: registrationData.mobile,
        email: registrationData.email,
        address_line: registrationData.address_line,
        city: registrationData.city,
        state: registrationData.state,
        pin_code: registrationData.pin_code,
        caste: registrationData.caste || null,
        degree: registrationData.degree || null,
        id_proof_type: registrationData.id_proof_type || null,
        id_proof_number: registrationData.id_proof_number || null,
        status: 1,
      };
 
      // Map guardian contact and academic percentages from registration (if present)
      studentData.guardian_mobile = (registrationData as any).guardian_mobile || null;
      studentData.guardian_email = (registrationData as any).guardian_email || null;
 
      if ((registrationData as any).ten_percentage !== undefined && (registrationData as any).ten_percentage !== null) {
        studentData.ten_percentage = String((registrationData as any).ten_percentage);
        studentData.board_university_10th = (registrationData as any).board_university_10th || null;
        studentData.year_of_passing_10th = (registrationData as any).year_of_passing_10th || null;
      }
      if ((registrationData as any).twelve_percentage !== undefined && (registrationData as any).twelve_percentage !== null) {
        studentData.twelve_percentage = String((registrationData as any).twelve_percentage);
        studentData.board_university_12th = (registrationData as any).board_university_12th || null;
        studentData.year_of_passing_12th = (registrationData as any).year_of_passing_12th || null;
      }
 
      studentData.board_university_graduation = (registrationData as any).board_university_graduation || null;
      studentData.graduation_percentage = (registrationData as any).graduation_percentage || null;
      studentData.year_of_passing_graduation = (registrationData as any).year_of_passing_graduation || null;
 
      // Map registration documents to student document columns if present
      studentData.aadhar_doc = (registrationData as any).aadhar_doc || null;
      studentData.birth_certificate_doc = (registrationData as any).birth_certificate_doc || null;
      studentData.ten_marksheet_doc = (registrationData as any).ten_marksheet_doc || null;
      studentData.twelve_marksheet_doc = (registrationData as any).twelve_marksheet_doc || null;
      studentData.graduation_doc = (registrationData as any).graduation_doc || null;
      studentData.profile_img = (registrationData as any).profile_img || null;
      studentData.caste_certificate_doc = (registrationData as any).caste_certificate_doc || null;
      studentData.physically_challenged_certificate = (registrationData as any).physically_challenged_certificate || null;
      studentData.admission_date = new Date();
 
      // 6. Save student
      const newStudent = await Student.create(studentData, {transaction});
 
      return newStudent;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to create student: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getAllStudents(tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      return await Student.findAll({
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw new AppError(`Failed to fetch students: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentById(id: number, tenant:string) {
    try {
      const { Student, Subject } = getTenantModels(tenant);
      const studentRecord = await Student.findByPk(id, {
        include: [{
          model: Subject,
          as: 'subjects',
          through: { attributes: ['is_core'] } // include join table attributes if needed
        }]
      });
 
      if (!studentRecord) {
        throw new AppError('Student not found', 404);
      }
 
      return studentRecord;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch student: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentByEmail(email: string, tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      const studentRecord = await Student.findOne({
        where: { email }
      });
 
      if (!studentRecord) {
        throw new AppError('Student not found', 404);
      }
 
      return studentRecord;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch student: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentByStudentId(studentId: string, tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      const studentRecord = await Student.findOne({
        where: { student_id: studentId }
      });
 
      if (!studentRecord) {
        throw new AppError('Student not found', 404);
      }
 
      return studentRecord;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch student: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async updateStudent(id: number, updateData: any, tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      const studentRecord = await Student.findByPk(id);
 
      if (!studentRecord) {
        throw new AppError('Student not found', 404);
      }
 
      await studentRecord.update(updateData);
      return studentRecord;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to update student: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async deleteStudent(id: number, tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      const studentRecord = await Student.findByPk(id);
 
      if (!studentRecord) {
        throw new AppError('Student not found', 404);
      }
 
      await studentRecord.destroy();
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to delete student: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentsByDepartment(departmentId: number, tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      return await Student.findAll({
        where: { department_id: departmentId },
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw new AppError(`Failed to fetch students by department: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentsByClass(programId: string, departmentId: string, academicYearId: string, classId: string, tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      return await Student.findAll({
        where: {
          program_id: Number(programId),
          department_id: Number(departmentId),
          academic_year_id: Number(academicYearId),
          class_id: Number(classId),
          status: 1
        },
        order: [['student_name', 'ASC']]
      });
    } catch (error) {
      throw new AppError(`Failed to fetch students by class: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentsByAcademicYear(academicYearId: number, tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      return await Student.findAll({
        where: { academic_year_id: academicYearId },
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw new AppError(`Failed to fetch students by academic year: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async searchStudents(filters: {
    roll_number?: string;
    student_name?: string;
    email?: string;
    dept_name?: string;
    academic_year?: string;
    query?: string;
    department_id?: number;
    class_id?: number;
    status?: string;
  }, tenant: string) {
    try {
      const whereClause: any = {};
      const deptWhere: any = {};
 
      if (filters.roll_number) {
        whereClause.roll_number = { [Op.like]: `%${filters.roll_number}%` };
      }
 
      if (filters.student_name) {
        whereClause.student_name = { [Op.like]: `%${filters.student_name}%` };
      }
 
      if (filters.email) {
        whereClause.email = { [Op.like]: `%${filters.email}%` };
      }
 
      if (filters.dept_name) {
        deptWhere.name = { [Op.like]: `%${filters.dept_name}%` };
      }
 
      if (filters.academic_year) {
        const yearSuffix = filters.academic_year.slice(-2);
        whereClause[Op.or] = [
          { student_id: { [Op.like]: `${yearSuffix}%` } },
          { roll_number: { [Op.like]: `%${yearSuffix}%` } }
        ];
      }
 
      if (filters.department_id) {
        whereClause.department_id = filters.department_id;
      }
 
      if (filters.class_id) {
        whereClause.class_id = filters.class_id;
      }
 
      if (filters.status) {
        whereClause.status = filters.status;
      }
 
      if (filters.query) {
        whereClause[Op.or] = [
          { student_name: { [Op.like]: `%${filters.query}%` } },
          { student_id: { [Op.like]: `%${filters.query}%` } },
          { roll_number: { [Op.like]: `%${filters.query}%` } },
          { email: { [Op.like]: `%${filters.query}%` } },
          { mobile: { [Op.like]: `%${filters.query}%` } }
        ];
      }
      const { Student, Department } = getTenantModels(tenant);
      return await Student.findAll({
        where: whereClause,
        include: [
          {
            model: Department,
            as: 'department',
            where: deptWhere,
            required: Object.keys(deptWhere).length > 0
          }
        ],
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw new AppError(`Failed to search students: ${getErrorMessage(error)}`, 500);
    }
  }
 
 
  async getStudentStatistics(tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      const totalStudents = await Student.count();
      const activeStudents = await Student.count({ where: { status: 1 } });
 
      const byDepartment = await Student.findAll({
        attributes: [
          'department_id',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['department_id'],
        raw: true
      });
 
      const byClass = await Student.findAll({
        attributes: [
          'class_id',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['class_id'],
        raw: true
      });
 
      const byAcademicYear = await Student.findAll({
        attributes: [
          'academic_year_id',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['academic_year_id'],
        raw: true
      });
 
      const byStatus = await Student.findAll({
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });
 
      return {
        total_students: totalStudents,
        active_students: activeStudents,
        inactive_students: totalStudents - activeStudents,
        by_department: byDepartment,
        by_class: byClass,
        by_academic_year: byAcademicYear,
        by_status: byStatus
      };
    } catch (error) {
      throw new AppError(`Failed to fetch student statistics: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentDetailsByEmail(email: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      // This query joins 7 tables and uses JSON_ARRAYAGG — keeping as raw SQL (complex join exception)
      const [results] = await sequelize.query(`SELECT
              s.id, s.student_id, s.student_name, s.roll_number,
              s.university_registration_number,
              s.department_id AS department_id,
              d.name AS department_name,
              s.program_id AS program_id,
              p.name AS program_name,
              s.class_id AS class_id,
              c.name AS class_name,
              s.semester_id AS semester_id,
              sem.name AS semester_name,
              s.section_id AS section_id,
              sec.name AS section_name,
              s.academic_year_id AS academic_year_id,
              ac.name AS academic_year,
              s.sex,
              s.religion,
              s.nationality,
              s.caste,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'subject_id', subj.subject_id,
                  'subject_name', dept.name
                )
              ) AS subjects
          FROM students s
          LEFT JOIN departments d
            ON s.department_id = d.id
          LEFT JOIN programs p
            ON s.program_id = p.id
          LEFT JOIN classes c
            ON s.class_id = c.id
          LEFT JOIN semesters sem
            ON s.semester_id = sem.id
          LEFT JOIN sections sec
            ON s.section_id = sec.id
          LEFT JOIN academic_years ac
            ON s.academic_year_id = ac.id
          LEFT JOIN student_subjects subj
            ON subj.student_id = s.id
            AND subj.semester_id = s.semester_id
          LEFT JOIN departments dept
            ON subj.subject_id = dept.id
          WHERE s.email = :email
          GROUP BY s.id;
        `,
        {
          replacements: { email },
          type: QueryTypes.SELECT,
        }
      );
 
      if (!results) {
        throw new AppError("Student not found", 404);
      }
      return results;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch student: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentProfileBundleById(id: number, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      const [result] = await sequelize.query<any>(
        `SELECT
           s.id,
           s.student_id,
           s.roll_number,
           s.student_name,
           s.dob,
           s.sex,
           s.nationality,
           s.religion,
           s.caste,
           s.profile_img,
           s.admission_date,
           s.email,
           s.mobile,
           s.address_line,
           s.city,
           s.state,
           s.pin_code,
           s.father_name,
           s.guardian_email,
           s.guardian_mobile,
           s.degree,
           s.ten_percentage,
           s.twelve_percentage,
           s.aadhar_doc,
           s.birth_certificate_doc,
           s.ten_marksheet_doc,
           s.twelve_marksheet_doc,
           s.graduation_doc,
           s.caste_certificate_doc,
           p.name AS program_name,
           d.name AS department_name,
           GROUP_CONCAT(DISTINCT subj.name ORDER BY subj.name SEPARATOR '||') AS subject_names
         FROM students s
         LEFT JOIN programs p
           ON s.program_id = p.id
         LEFT JOIN departments d
           ON s.department_id = d.id
         LEFT JOIN student_subjects ss
           ON ss.student_id = s.id
         LEFT JOIN subjects subj
           ON ss.subject_id = subj.id
         WHERE s.id = :id
         GROUP BY
           s.id,
           s.student_id,
           s.roll_number,
           s.student_name,
           s.dob,
           s.sex,
           s.nationality,
           s.religion,
           s.caste,
           s.profile_img,
           s.admission_date,
           s.email,
           s.mobile,
           s.address_line,
           s.city,
           s.state,
           s.pin_code,
           s.father_name,
           s.guardian_email,
           s.guardian_mobile,
           s.degree,
           s.ten_percentage,
           s.twelve_percentage,
           s.aadhar_doc,
           s.birth_certificate_doc,
           s.ten_marksheet_doc,
           s.twelve_marksheet_doc,
           s.graduation_doc,
           s.caste_certificate_doc,
           p.name,
           d.name
         LIMIT 1`,
        {
          replacements: { id },
          type: QueryTypes.SELECT,
        }
      );
 
      if (!result) {
        throw new AppError("Student not found", 404);
      }
 
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch student profile bundle: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentProfileBundleByEmail(email: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      const [result] = await sequelize.query<any>(
        `SELECT
           s.id,
           s.student_id,
           s.roll_number,
           s.student_name,
           s.dob,
           s.sex,
           s.nationality,
           s.religion,
           s.caste,
           s.profile_img,
           s.admission_date,
           s.email,
           s.mobile,
           s.address_line,
           s.city,
           s.state,
           s.pin_code,
           s.father_name,
           s.guardian_email,
           s.guardian_mobile,
           s.degree,
           p.name AS program_name,
           d.name AS department_name,
           GROUP_CONCAT(DISTINCT subj.name ORDER BY subj.name SEPARATOR '||') AS subject_names
         FROM students s
         LEFT JOIN programs p
           ON s.program_id = p.id
         LEFT JOIN departments d
           ON s.department_id = d.id
         LEFT JOIN student_subjects ss
           ON ss.student_id = s.id
         LEFT JOIN subjects subj
           ON ss.subject_id = subj.id
         WHERE LOWER(TRIM(COALESCE(s.email, ''))) = LOWER(TRIM(:email))
         GROUP BY
           s.id,
           s.student_id,
           s.roll_number,
           s.student_name,
           s.dob,
           s.sex,
           s.nationality,
           s.religion,
           s.caste,
           s.profile_img,
           s.admission_date,
           s.email,
           s.mobile,
           s.address_line,
           s.city,
           s.state,
           s.pin_code,
           s.father_name,
           s.guardian_email,
           s.guardian_mobile,
           s.degree,
           p.name,
           d.name
         LIMIT 1`,
        {
          replacements: { email },
          type: QueryTypes.SELECT,
        }
      );
 
      if (!result) {
        throw new AppError("Student not found", 404);
      }
 
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch student profile bundle: ${getErrorMessage(error)}`, 500);
    }
  }
 
  async getStudentDashboardData(studentId: number, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
 
      const [summary] = await sequelize.query<any>(
        `SELECT
           (SELECT COUNT(*) FROM students WHERE COALESCE(status, 1) = 1) AS students_count,
           (SELECT COUNT(*) FROM teachers WHERE COALESCE(is_active, 1) = 1) AS teachers_count,
           (
             SELECT COUNT(*)
             FROM student_assignment_submissions sas
             WHERE sas.student_id = :studentId
               AND LOWER(COALESCE(sas.status, 'submitted')) IN ('submitted', 'graded')
           ) AS submitted_assignments_count,
           (
             SELECT COALESCE(SUM(amount_paid), 0)
             FROM payment_transactions
           ) AS total_revenue,
           (
             SELECT COALESCE(SUM(
               CASE
                 WHEN sp.status = 'pending' THEN COALESCE(sp.amount, 0) - COALESCE(sp.paid_amount, 0)
                 ELSE 0
               END
             ), 0)
             FROM student_payments sp
             WHERE sp.student_id = :studentId
           ) AS upcoming_fees,
           (
             SELECT COALESCE(SUM(
               CASE
                 WHEN sp.status = 'paid' THEN COALESCE(sp.paid_amount, sp.amount, 0)
                 ELSE 0
               END
             ), 0)
             FROM student_payments sp
             WHERE sp.student_id = :studentId
           ) AS paid_this_term,
           (
             SELECT COUNT(*)
             FROM student_payments sp
             WHERE sp.student_id = :studentId
               AND sp.status IN ('pending', 'partial', 'overdue')
           ) AS pending_payment_count`,
        {
          replacements: { studentId },
          type: QueryTypes.SELECT,
        }
      );
 
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
      const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
      const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${lastDayOfMonth}`;
 
      const [attendance] = await sequelize.query<any>(
        `SELECT
           SUM(CASE WHEN attendance_status = 'PRESENT' THEN 1 ELSE 0 END) AS present_days,
           SUM(CASE WHEN attendance_status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_days,
           (
             SUM(CASE WHEN attendance_status = 'PRESENT' THEN 1 ELSE 0 END) +
             SUM(CASE WHEN attendance_status = 'ABSENT' THEN 1 ELSE 0 END)
           ) AS total_days,
           ROUND(
             (SUM(CASE WHEN attendance_status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0) /
             NULLIF(
               (
                 SUM(CASE WHEN attendance_status = 'PRESENT' THEN 1 ELSE 0 END) +
                 SUM(CASE WHEN attendance_status = 'ABSENT' THEN 1 ELSE 0 END)
               ),
               0
             ),
             0
           ) AS attendance_percentage
         FROM student_daily_attendance
         WHERE student_id = :studentId
           AND attendance_date BETWEEN :monthStart AND :monthEnd`,
        {
          replacements: { studentId, monthStart, monthEnd },
          type: QueryTypes.SELECT,
        }
      );
 
      const [recentPaidFee] = await sequelize.query<any>(
        `SELECT
           sp.id AS payment_id,
           pt.name AS payment_type_name,
           sp.amount,
           sp.paid_amount,
           sp.paid_date,
           sp.updated_at
         FROM student_payments sp
         LEFT JOIN payment_types pt
           ON pt.id = sp.payment_type_id
         WHERE sp.student_id = :studentId
           AND sp.status = 'paid'
         ORDER BY COALESCE(sp.paid_date, sp.updated_at, sp.created_at) DESC, sp.id DESC
         LIMIT 1`,
        {
          replacements: { studentId },
          type: QueryTypes.SELECT,
        }
      );
 
      const pendingAssignments = await sequelize.query<any>(
        `SELECT
           ta.id,
           ta.title,
           sub.name AS subject_name,
           ta.type,
           ta.due_date,
           (ta.allow_late_submissions = 1) AS allow_late_submissions,
           CASE
             WHEN asub.id IS NOT NULL THEN 'Submitted'
             WHEN asub.id IS NULL AND ta.due_date < CURDATE() THEN 'Overdue'
             ELSE 'Pending'
           END AS status
         FROM teacher_assignments ta
         INNER JOIN students s
           ON ta.program_id = s.program_id
          AND ta.class_id = s.class_id
          AND ta.semester_id = s.semester_id
          AND (ta.section_id = s.section_id OR ta.section_id IS NULL)
         LEFT JOIN subjects sub
           ON ta.subject_id = sub.id
         LEFT JOIN student_assignment_submissions asub
           ON ta.id = asub.teacher_assignment_id
          AND asub.student_id = s.id
          AND asub.status IN ('submitted', 'graded')
         WHERE s.id = :studentId
           AND asub.id IS NULL
         ORDER BY ta.due_date ASC, ta.id DESC`,
        {
          replacements: { studentId },
          type: QueryTypes.SELECT,
        }
      );
 
      const notices = await sequelize.query<any>(
        `SELECT
           id,
           title,
           description,
           from_date,
           to_date
         FROM notices
         ORDER BY from_date DESC, id DESC`,
        {
          type: QueryTypes.SELECT,
        }
      );
 
      const gradedAssignments = await sequelize.query<any>(
        `SELECT
           asub.id AS submission_id,
           ta.id AS assignment_id,
           ta.title AS assignment_title,
           sub.name AS subject_name,
           asub.grade,
           asub.marks_obtained,
           asub.feedback,
           asub.graded_at
         FROM student_assignment_submissions asub
         INNER JOIN teacher_assignments ta
           ON ta.id = asub.teacher_assignment_id
         LEFT JOIN subjects sub
           ON sub.id = ta.subject_id
         WHERE asub.student_id = :studentId
           AND LOWER(COALESCE(asub.status, '')) = 'graded'
         ORDER BY COALESCE(asub.graded_at, asub.updated_at, asub.created_at) DESC, asub.id DESC`,
        {
          replacements: { studentId },
          type: QueryTypes.SELECT,
        }
      );
 
      const subjects = await sequelize.query<any>(
        `SELECT DISTINCT
           subj.id,
           subj.code,
           subj.name,
           subj.description
         FROM student_subjects ss
         INNER JOIN subjects subj
           ON subj.id = ss.subject_id
         WHERE ss.student_id = :studentId
         ORDER BY subj.name ASC`,
        {
          replacements: { studentId },
          type: QueryTypes.SELECT,
        }
      );
 
      return {
        summary: {
          studentsCount: Number(summary?.students_count || 0),
          teachersCount: Number(summary?.teachers_count || 0),
          submittedAssignmentsCount: Number(summary?.submitted_assignments_count || 0),
          totalRevenue: Number(summary?.total_revenue || 0),
          upcomingFees: Number(summary?.upcoming_fees || 0),
          paidThisTerm: Number(summary?.paid_this_term || 0),
          pendingPaymentCount: Number(summary?.pending_payment_count || 0),
        },
        attendance: {
          totalDays: Number(attendance?.total_days || 0),
          presentDays: Number(attendance?.present_days || 0),
          absentDays: Number(attendance?.absent_days || 0),
          attendancePercentage: Number(attendance?.attendance_percentage || 0),
        },
        recentPaidFee: recentPaidFee || null,
        pendingAssignments,
        subjects,
        notices,
        gradedAssignments,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch student dashboard data: ${getErrorMessage(error)}`, 500);
    }
  }
 
}