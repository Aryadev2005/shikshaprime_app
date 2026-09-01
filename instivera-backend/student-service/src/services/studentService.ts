import { AppError } from '../utils/appError';
import { col, fn, Op, QueryTypes } from 'sequelize';
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

  async getStudentById(id: number, tenant: string) {
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
        //where: { department_id: departmentId },
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw new AppError(`Failed to fetch students by department: ${getErrorMessage(error)}`, 500);
    }
  }

  async getStudentsByClass(
    programId: string,
    academicYearId: string,
    classId: string,
    tenant: string
  ) {
    try {
      const { Student, StudentPersonalDetails, Program } = getTenantModels(tenant);

      return await Student.findAll({
        include: [
          {
            model: StudentPersonalDetails,
            as: "details",
            required: true,
            where: {
              program_id: Number(programId),
              academic_year_id: Number(academicYearId),
              class_id: Number(classId)
            },
            include: [
              {
                model: Program,
                as: "program",
                required: true,
                where: {
                  id: Number(programId)
                }
              }
            ]
          }
        ],
        order: [["first_name", "ASC"]]
      });
    } catch (error) {
      throw new AppError(
        `Failed to fetch students by class: ${getErrorMessage(error)}`,
        500
      );
    }
  }


  async getStudentsByAcademicYear(academicYearId: number, tenant: string) {
    try {
      const { Student } = getTenantModels(tenant);
      return await Student.findAll({
        //where: { academic_year_id: academicYearId },
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


      const { Student, StudentPersonalDetails, Program, Department } = getTenantModels(tenant);
      return await Student.findAll({
        where: whereClause,
        include: [
          {
            model: StudentPersonalDetails,
            as: 'details',
            include: [
              {
                model: Program,
                as: 'program',
                include: [
                  {
                    model: Department,
                    as: 'department',
                    where: deptWhere,
                    required: Object.keys(deptWhere).length > 0
                  }
                ]
              }
            ]
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
      const activeStudents = await Student.count();

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
      const [results] = await sequelize.query<any>(
        `SELECT
            st.id,
            st.student_id,
            st.university_registration_number,
            st.roll_number,
            TRIM(CONCAT(
              st.first_name, ' ',
              COALESCE(st.middle_name, ''), ' ',
              st.last_name
            )) AS student_name,
            p.id AS program_id,
            p.name AS program_name,
            p.department_id AS department_id,
            d.name AS department_name,
            spd.class_id AS class_id,
            c.name AS class_name,
            st.semester_id AS semester_id,
            sem.name AS semester_name,
            spd.academic_year_id AS academic_year_id,
            ac.name AS academic_year,
            st.gender AS sex,
            spd.religion,
            st.nationality,
            st.social_category AS caste,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'subject_id', subj.subject_id,
                'subject_name', subj_sub.name
              )
            ) AS subjects
          FROM students st
          LEFT JOIN student_personal_details spd 
            ON spd.student_id = st.id
          LEFT JOIN programs p 
            ON p.id = spd.program_id
          LEFT JOIN departments d 
            ON d.id = p.department_id
          LEFT JOIN classes c 
            ON c.id = spd.class_id
          LEFT JOIN semesters sem 
            ON sem.id = st.semester_id
          LEFT JOIN academic_years ac 
            ON ac.id = spd.academic_year_id
          LEFT JOIN student_subjects subj 
            ON subj.student_id = st.id
            AND subj.semester_id = st.semester_id
          LEFT JOIN subjects subj_sub
            ON subj.subject_id = subj_sub.id
          WHERE st.email = :email
          GROUP BY st.id;
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
            st.id,
            st.student_id,
            st.roll_number,

            TRIM(CONCAT(
              st.first_name, ' ',
              COALESCE(st.middle_name, ''), ' ',
              st.last_name
            )) AS student_name,

            st.dob,
            st.gender AS sex,
            st.nationality,
            st.religion,
            st.social_category AS caste,
            st.mobile,
            st.email,
            st.university_registration_number,
            st.admission_date,

            -- Program / Class / Year
            spd.academic_year_id,
            ac.name AS academic_year,
            spd.program_id,
            p.name AS program_name,
            p.department_id,
            d.name AS department_name,
            spd.class_id,
            c.name AS class_name,
            st.semester_id,
            sem.name AS semester_name,
            -- Permanent Address
            perm.address_line AS perm_address_line,
            perm.village AS perm_village,
            perm.post_office AS perm_post_office,
            perm.police_station AS perm_police_station,
            perm.district AS perm_district,
            perm.state AS perm_state,
            perm.pincode AS perm_pincode,
            perm.municipality_block AS perm_municipality_block,

            -- Present Address
            pres.address_line AS pres_address_line,
            pres.village AS pres_village,
            pres.post_office AS pres_post_office,
            pres.police_station AS pres_police_station,
            pres.district AS pres_district,
            pres.state AS pres_state,
            pres.pincode AS pres_pincode,
            pres.municipality_block AS pres_municipality_block,

            -- Guardians
            father.name AS father_name,
            mother.name AS mother_name,
            guardian.name AS guardian_name,
            guardian.email AS guardian_email,
            guardian.mobile AS guardian_mobile,

            -- Documents (grouped)
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', doc.id,
                'document_type', doc.document_type,
                'document_name', doc.document_name,
                'document_path', doc.document_path,
                'file_extension', doc.file_extension,
                'file_size_kb', doc.file_size_kb,
                'is_verified', doc.is_verified
              )
            ) AS documents,

            -- Subjects
            GROUP_CONCAT(DISTINCT subj.name ORDER BY subj.name SEPARATOR '||') AS subject_names

          FROM students st
          LEFT JOIN student_personal_details spd
            ON spd.student_id = st.id
          LEFT JOIN academic_years ac
            ON ac.id = spd.academic_year_id
          LEFT JOIN programs p
            ON p.id = spd.program_id
          LEFT JOIN departments d
            ON d.id = p.department_id
          LEFT JOIN classes c
            ON c.id = spd.class_id
          LEFT JOIN semesters sem
            ON sem.id = st.semester_id

          -- Addresses
          LEFT JOIN student_addresses perm
            ON perm.student_id = st.id AND perm.address_type = 'PERMANENT'

          LEFT JOIN student_addresses pres
            ON pres.student_id = st.id AND pres.address_type = 'PRESENT'

          -- Guardians
          LEFT JOIN student_guardians father
            ON father.student_id = st.id AND father.relationship = 'FATHER'

          LEFT JOIN student_guardians mother
            ON mother.student_id = st.id AND mother.relationship = 'MOTHER'

          LEFT JOIN student_guardians guardian
            ON guardian.student_id = st.id AND guardian.relationship = 'GUARDIAN'

          -- Documents
          LEFT JOIN student_documents doc
            ON doc.student_id = st.id

          -- Subjects
          LEFT JOIN student_subjects ss
            ON ss.student_id = st.id

          LEFT JOIN subjects subj
            ON ss.subject_id = subj.id

          WHERE st.id = :id

          GROUP BY st.id
          LIMIT 1;
        `,
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
            st.id,
            st.student_id,
            st.roll_number,

            TRIM(CONCAT(
              st.first_name, ' ',
              COALESCE(st.middle_name, ''), ' ',
              st.last_name
            )) AS student_name,

            st.dob,
            st.gender AS sex,
            st.nationality,
            st.religion,
            st.social_category AS caste,
            st.mobile,
            st.email,
            st.university_registration_number,
            st.admission_date,

            -- Program / Department / Class / Semester 
            spd.program_id,
            p.name AS program_name,
            p.department_id,
            d.name AS department_name,
            spd.class_id,
            c.name AS class_name,
            st.semester_id,
            sem.name AS semester_name,
           
            -- Permanent Address
            perm.address_line AS perm_address_line,
            perm.village AS perm_village,
            perm.post_office AS perm_post_office,
            perm.police_station AS perm_police_station,
            perm.district AS perm_district,
            perm.state AS perm_state,
            perm.pincode AS perm_pincode,

            -- Present Address
            pres.address_line AS pres_address_line,
            pres.village AS pres_village,
            pres.post_office AS pres_post_office,
            pres.police_station AS pres_police_station,
            pres.district AS pres_district,
            pres.state AS pres_state,
            pres.pincode AS pres_pincode,

            -- Guardians
            father.name AS father_name,
            mother.name AS mother_name,
            guardian.name AS guardian_name,
            guardian.email AS guardian_email,
            guardian.mobile AS guardian_mobile,

            -- Subjects
            GROUP_CONCAT(DISTINCT subj.name ORDER BY subj.name SEPARATOR '||') AS subject_names

          FROM students st

          LEFT JOIN student_personal_details spd
            ON spd.student_id = st.id

          LEFT JOIN programs p
            ON p.id = spd.program_id

          LEFT JOIN departments d
            ON d.id = p.department_id

          LEFT JOIN classes c
            ON c.id = spd.class_id

          LEFT JOIN semesters sem
            ON sem.id = st.semester_id

          -- Addresses
          LEFT JOIN student_addresses perm
            ON perm.student_id = st.id AND perm.address_type = 'PERMANENT'

          LEFT JOIN student_addresses pres
            ON pres.student_id = st.id AND pres.address_type = 'PRESENT'

          -- Guardians
          LEFT JOIN student_guardians father
            ON father.student_id = st.id AND father.relationship = 'FATHER'

          LEFT JOIN student_guardians mother
            ON mother.student_id = st.id AND mother.relationship = 'MOTHER'

          LEFT JOIN student_guardians guardian
            ON guardian.student_id = st.id AND guardian.relationship = 'GUARDIAN'

          -- Subjects
          LEFT JOIN student_subjects ss
            ON ss.student_id = st.id

          LEFT JOIN subjects subj
            ON ss.subject_id = subj.id

          WHERE LOWER(TRIM(st.email)) = LOWER(TRIM(:email))

          GROUP BY st.id
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
    console.log("Student id ====>", studentId);
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
             FROM student_fee_payments sp
             WHERE sp.student_id = :studentId
           ) AS upcoming_fees,
           (
             SELECT COALESCE(SUM(
               CASE
                 WHEN sp.status = 'paid' THEN COALESCE(sp.paid_amount, sp.amount, 0)
                 ELSE 0
               END
             ), 0)
             FROM student_fee_payments sp
             WHERE sp.student_id = :studentId
           ) AS paid_this_term,
           (
             SELECT COUNT(*)
             FROM student_fee_payments sp
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
         FROM student_fee_payments sp
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

          INNER JOIN students st
            ON st.id = :studentId

          INNER JOIN student_personal_details spd
            ON spd.student_id = st.id

          LEFT JOIN subjects sub
            ON ta.subject_id = sub.id

          LEFT JOIN student_assignment_submissions asub
            ON ta.id = asub.teacher_assignment_id
            AND asub.student_id = st.id
            AND asub.status IN ('submitted', 'graded')

          WHERE 
              ta.program_id = spd.program_id
              AND ta.class_id = spd.class_id
              AND ta.semester_id = st.semester_id              
              AND asub.id IS NULL   -- this MUST be inside WHERE, not inside JOIN

          ORDER BY ta.due_date ASC, ta.id DESC;
          `,
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
           attachment,
           from_date,
           to_date
         FROM notices
         WHERE DATE(to_date) >= CURDATE() AND DATE(from_date) <= CURDATE()
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
         FROM student_personal_details spd
         INNER JOIN program_subjects ps
           ON ps.semester_id = spd.class_id
           AND ps.program_id = spd.program_id
         INNER JOIN subjects subj
           ON subj.id = ps.subject_id
         WHERE spd.student_id = :studentId
         ORDER BY subj.name ASC`,
        {
          replacements: { studentId },
          type: QueryTypes.SELECT,
        }
      );

      const [readmission] = await sequelize.query<any>(
        `SELECT 
      rr.status,
      rr.program_id,
      rr.department_id,
      rr.from_class_id,
      rr.to_class_id,
      rr.from_semester_id,
      rr.to_semester_id,
      s.semester_number AS to_semester_number
   FROM readmission_requests rr
   LEFT JOIN semesters s
      ON s.id = rr.to_semester_id
   WHERE rr.student_id = :studentId
   ORDER BY rr.created_at DESC
   LIMIT 1`,
        {
          replacements: { studentId },
          type: QueryTypes.SELECT,
        }
      )

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
        readmission,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch student dashboard data: ${getErrorMessage(error)}`, 500);
    }
  }

}