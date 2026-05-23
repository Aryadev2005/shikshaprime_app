import { Op, QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import bcrypt from "bcrypt";
import { Department } from "../models/department";
import { getTenantSequelize } from "../server";
import { getTenantModels } from "../models";

export class FacultyService {
  private toNumber(value: unknown): number {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async createFaculty(data: any, tenant: string): Promise<any> {
    const sequelize = getTenantSequelize(tenant);
    const transaction = await sequelize.transaction();
    try {
      const { Teacher, TeacherClass } = getTenantModels(tenant);
      const existingFaculty = await Teacher.findOne({
        where: { employee_id: data.employee_id },
      });

      if (existingFaculty) {
        throw new AppError(`Faculty with employee_id ${data.employee_id} already exists`, 409);
      }

      let userId = null;
      if (data.email) {
        const saltRounds = 10; 
        const hashedPassword = await bcrypt.hash('password123', saltRounds);
        try {
          const [userResult]: any = await sequelize.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, role, tenant_id, is_active, created_at)
             VALUES (:username, :email, :password_hash, :first_name, :last_name, 'teacher', 1, 1, NOW())`,
            {
              replacements: {
                username: data.email.split('@')[0],
                email: data.email,
                password_hash: hashedPassword,
                first_name: data.first_name,
                last_name: data.last_name,
              }, 
              type: QueryTypes.INSERT,
              transaction: transaction
            },
          );
          userId = userResult;
          console.log(`[FacultyService] Created user in school_users with ID: ${userId}`);
        } catch (userError: any) {
          console.error('[FacultyService] Failed to create user:', userError.message);
        }
      }

      const faculty = await Teacher.create({
        ...data,
        user_id: userId,
        tenant_id: data.tenant_id || 1,
        is_active: true,        
        status: 1,        
      }, { transaction });
      // Save subject assignments if provided 
      if (data.subjects && data.subjects.length > 0) { 
        for (const subject of data.subjects) { 
          await TeacherClass.create( 
             { program_id: subject.program,
               academic_year_id: subject.academicYear,
               class_id: subject.class,
               subject_id: subject.subject,
               assigned_date: subject.assignedDate ? new Date(subject.assignedDate) : null,
               teacher_id: faculty.id,
               is_active: 1, 
             }, { transaction } 
          ); 
        } 
      }

      await transaction.commit();

      return faculty;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  
  async generateEmployeeId(tenant: string): Promise<string> {
    const sequelize = getTenantSequelize(tenant);
    const result = await sequelize.query(
      "SELECT AUTO_INCREMENT as nextId FROM information_schema.TABLES WHERE TABLE_SCHEMA = :dbName AND TABLE_NAME = 'teachers'",
      {
        replacements: { dbName: `shikshaprime_${tenant}` },
        type: QueryTypes.SELECT,
      }
    );

    const nextId = (result[0] as any).nextId;
    return `EMP-${String(nextId).padStart(4, "0")}`;
  }
  

  async getAllFaculty(filters: any = {}, tenant: string): Promise<any[]> {
    const where: any = {
      is_active: 1,
    };

    if (filters.department_id) {
      where.department_id = filters.department_id;
    }
    if (filters.designation) {
      where.designation = { [Op.like]: `%${filters.designation}%` };
    }
    const { Teacher } = getTenantModels(tenant);
    return Teacher.findAll({
      where,
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
    });
  }
  

  async getFacultyById(id: number, tenant: string): Promise<any> {
    const { Teacher, TeacherClass, Program, Class, Subject, Department, AcademicYear } = getTenantModels(tenant);
    const faculty = await Teacher.findByPk(id, { include: 
      [ 
        { 
          model: TeacherClass, as: "teacher_classes", // Use correct association alias
          // Removed where clause to show all assignments (both active and inactive)
          required: false, // LEFT JOIN so teacher is returned even if no assignments
          attributes: ['id', 'assigned_date', 'is_active'], // Include is_active status
          include: [ 
            { model: Program, as: "program", attributes: ["id", "name"] }, 
            { model: Class, as: "class", attributes: ["id", "name"] },
            { model: Subject, as: "subject", attributes: ["id", "name"], 
              include: [ { model: Department, as: "department", attributes: ["id", "name"] } ],
            },
            { model: AcademicYear, as: "academic_year", attributes: ["id", "name"] }, 
          ],
        },
      ],
    });
    if (!faculty || !faculty.is_active) {
      throw new AppError('Faculty not found', 404);
    }
    return faculty;
  }

  async getFacultyByEmployeeId(employeeId: string, tenant: string): Promise<any> {
    const { Teacher } = getTenantModels(tenant);
    const faculty = await Teacher.findOne({
      where: { employee_id: employeeId, is_active: 1 },
    });
    if (!faculty) {
      throw new AppError('Faculty not found', 404);
    }
    return faculty;
  }

  
  async getFacultyByUserId(userId: number, tenant: string): Promise<any> {
    const { Teacher, TeacherClass, Program, Class, Subject, AcademicYear } = getTenantModels(tenant);
    const faculty = await Teacher.findOne({
    where: { user_id: userId, is_active: 1 },
    include: [
        {
          model: TeacherClass,
          as: "teacher_classes",
          required: false,
          attributes: ['id', 'academic_year_id', 'assigned_date', 'is_active'],
          include: [
            { model: Program, as: "program", attributes: ["id", "name"] },
            { model: Class, as: "class", attributes: ["id", "name"] },
            {
              model: Subject,
              as: "subject",
              attributes: ["id", "name"],
              include: [
                { model: Department, as: "department", attributes: ["id", "name"] },
              ],
            },
            { model: AcademicYear, as: "academic_year", attributes: ["id", "name"] },
          ],
        },
      ],
    });
    if (!faculty) {
      throw new AppError('Faculty not found', 404);
    }

    const facultyData = faculty.toJSON() as any;

    if (!facultyData.classes) {
      facultyData.classes = facultyData.teacher_classes || [];
    }

    return facultyData;
  }

  async updateFaculty(id: number, data: any, tenant: string): Promise<any> {
    const faculty = await this.getFacultyById(id, tenant);
    delete data.id;
    delete data.user_id;
    delete data.employee_id;

    await faculty.update(data);
    return faculty;
  }

  async deleteFaculty(id: number, tenant: string): Promise<void> {
    const faculty = await this.getFacultyById(id, tenant);
    await faculty.update({
      is_active: 0,
      });
  }

  async searchFaculty(query: string, tenant: string): Promise<any[]> {
    const { Teacher } = getTenantModels(tenant);
    return Teacher.findAll({
      where: {
        is_active: 1,
        [Op.or]: [
          { first_name: { [Op.like]: `%${query}%` } },
          { last_name: { [Op.like]: `%${query}%` } },
          { employee_id: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { phone: { [Op.like]: `%${query}%` } },
          { designation: { [Op.like]: `%${query}%` } },        
        ],
      },
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
    });
  }

  async getFacultyByDepartment(departmentId: number, tenant: string): Promise<any[]> {
    const { Teacher } = getTenantModels(tenant);
    return Teacher.findAll({
      where: {
        department_id: departmentId,
        is_active: 1,
      },
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
    });
  }
 

  async getFacultyStats(tenant: string): Promise<any> {
    const sequelize = getTenantSequelize(tenant);
    const [stats]: any = await sequelize.query(`
      SELECT 
        COUNT(*) as total_faculty,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_faculty,        
        COUNT(DISTINCT department_id) as departments_with_faculty
      FROM teachers
      WHERE is_active = 1
    `, { type: QueryTypes.SELECT });

    return stats;
  }

  async getTeacherDashboardData(facultyId: number, tenant: string): Promise<any> {
    const sequelize = getTenantSequelize(tenant);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${lastDayOfMonth}`;

    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - now.getDay() - 21);
    const trendStart = weekStartDate.toISOString().split("T")[0];

    const heatmapStartDate = new Date(now);
    heatmapStartDate.setDate(now.getDate() - now.getDay());
    const heatmapStart = heatmapStartDate.toISOString().split("T")[0];

    const assignedStudentsSubquery = `
      SELECT DISTINCT s.id
      FROM teacher_class_subjects tc
      INNER JOIN students s
        ON s.program_id = tc.program_id
       AND s.class_id = tc.class_id
       AND (s.academic_year_id = tc.academic_year_id OR tc.academic_year_id IS NULL)
      WHERE tc.teacher_id = :facultyId
        AND COALESCE(s.status, 1) = 1
    `;

    const [summary] = await sequelize.query<any>(
      `SELECT
         (${`SELECT COUNT(*) FROM (${assignedStudentsSubquery}) assigned_students`}) AS total_students,
         (
           SELECT COUNT(DISTINCT CONCAT_WS('-', tc.program_id, tc.class_id))
           FROM teacher_class_subjects tc
           WHERE tc.teacher_id = :facultyId
         ) AS my_classes,
         (
           SELECT COUNT(*)
           FROM student_assignment_submissions sas
           INNER JOIN teacher_assignments ta
             ON ta.id = sas.teacher_assignment_id
           WHERE ta.teacher_id = :facultyId
             AND LOWER(COALESCE(sas.status, '')) IN ('submitted', 'graded')
         ) AS submitted_assignments,
         (
           SELECT ROUND(AVG((COALESCE(sas.marks_obtained, 0) / NULLIF(COALESCE(ta.maximum_marks, 0), 0)) * 100), 0)
           FROM student_assignment_submissions sas
           INNER JOIN teacher_assignments ta
             ON ta.id = sas.teacher_assignment_id
           WHERE ta.teacher_id = :facultyId
             AND LOWER(COALESCE(sas.status, '')) = 'graded'
             AND ta.maximum_marks > 0
         ) AS class_avg_grade`,
      {
        replacements: { facultyId },
        type: QueryTypes.SELECT,
      }
    );

    const [attendanceOverview] = await sequelize.query<any>(
      `SELECT
         SUM(CASE WHEN sda.attendance_status = 'PRESENT' THEN 1 ELSE 0 END) AS present_today,
         SUM(CASE WHEN sda.attendance_status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_today,
         SUM(CASE WHEN sda.attendance_status NOT IN ('PRESENT', 'ABSENT') THEN 1 ELSE 0 END) AS excused_today,
         ROUND(
           (
             SUM(CASE WHEN sda.attendance_status = 'PRESENT' THEN 1 ELSE 0 END) * 100.0
           ) /
           NULLIF(
             SUM(CASE WHEN sda.attendance_status IN ('PRESENT', 'ABSENT') THEN 1 ELSE 0 END),
             0
           ),
           0
         ) AS average_attendance
       FROM student_daily_attendance sda
       WHERE sda.student_id IN (${assignedStudentsSubquery})
         AND sda.attendance_date BETWEEN :monthStart AND :monthEnd`,
      {
        replacements: { facultyId, monthStart, monthEnd },
        type: QueryTypes.SELECT,
      }
    );

    const assignmentProgressRows = await sequelize.query<any>(
      `SELECT
         COALESCE(sec.name, c.name, CONCAT('Class ', ta.class_id)) AS section_label,
         SUM(CASE WHEN LOWER(COALESCE(sas.status, '')) = 'graded' THEN 1 ELSE 0 END) AS checked_count,
         SUM(CASE WHEN LOWER(COALESCE(sas.status, '')) = 'submitted' THEN 1 ELSE 0 END) AS pending_review_count,
         SUM(
           CASE
             WHEN sas.submitted_at IS NOT NULL
               AND TIMESTAMP(ta.due_date, COALESCE(ta.due_time, '23:59:59')) < sas.submitted_at
             THEN 1
             ELSE 0
           END
         ) AS late_count
       FROM teacher_assignments ta
       LEFT JOIN student_assignment_submissions sas
         ON sas.teacher_assignment_id = ta.id
       LEFT JOIN classes c
         ON c.id = ta.class_id
       LEFT JOIN sections sec
         ON sec.id = ta.section_id
       WHERE ta.teacher_id = :facultyId
       GROUP BY COALESCE(sec.name, c.name, CONCAT('Class ', ta.class_id))
       ORDER BY COALESCE(sec.name, c.name, CONCAT('Class ', ta.class_id))`,
      {
        replacements: { facultyId },
        type: QueryTypes.SELECT,
      }
    );

    const attendanceTrendRows = await sequelize.query<any>(
      `SELECT
         YEARWEEK(sda.attendance_date, 1) AS year_week,
         MIN(sda.attendance_date) AS week_start,
         SUM(CASE WHEN sda.attendance_status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
         SUM(CASE WHEN sda.attendance_status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count
       FROM student_daily_attendance sda
       WHERE sda.student_id IN (${assignedStudentsSubquery})
         AND sda.attendance_date >= :trendStart
       GROUP BY YEARWEEK(sda.attendance_date, 1)
       ORDER BY YEARWEEK(sda.attendance_date, 1)`,
      {
        replacements: { facultyId, trendStart },
        type: QueryTypes.SELECT,
      }
    );

    const rosterRows = await sequelize.query<any>(
      `SELECT
         tc.id,
         c.name AS class_name,
         p.name AS program_name,
         sub.name AS subject_name,
         COUNT(DISTINCT s.id) AS roster_count
       FROM teacher_class_subjects tc
       LEFT JOIN classes c
         ON c.id = tc.class_id
       LEFT JOIN programs p
         ON p.id = tc.program_id
       LEFT JOIN subjects sub
         ON sub.id = tc.subject_id
       LEFT JOIN students s
         ON s.program_id = tc.program_id
        AND s.class_id = tc.class_id
        AND (s.academic_year_id = tc.academic_year_id OR tc.academic_year_id IS NULL)
        AND COALESCE(s.status, 1) = 1
       WHERE tc.teacher_id = :facultyId
       GROUP BY tc.id, c.name, p.name, sub.name
       ORDER BY c.name, sub.name`,
      {
        replacements: { facultyId },
        type: QueryTypes.SELECT,
      }
    );

    const recentClassRows = await sequelize.query<any>(
      `SELECT
         ta.id,
         ta.title,
         ta.description,
         ta.created_at,
         sub.name AS subject_name,
         c.name AS class_name
       FROM teacher_assignments ta
       LEFT JOIN subjects sub
         ON sub.id = ta.subject_id
       LEFT JOIN classes c
         ON c.id = ta.class_id
       WHERE ta.teacher_id = :facultyId
       ORDER BY COALESCE(ta.created_at, ta.updated_at) DESC, ta.id DESC
       LIMIT 3`,
      {
        replacements: { facultyId },
        type: QueryTypes.SELECT,
      }
    );

    const heatmapRows = await sequelize.query<any>(
      `SELECT
         COALESCE(sec.name, c.name, CONCAT('Class ', ta.class_id)) AS class_label,
         DAYOFWEEK(DATE(sas.submitted_at)) AS weekday_number,
         COUNT(*) AS submission_count
       FROM teacher_assignments ta
       INNER JOIN student_assignment_submissions sas
         ON sas.teacher_assignment_id = ta.id
       LEFT JOIN classes c
         ON c.id = ta.class_id
       LEFT JOIN sections sec
         ON sec.id = ta.section_id
       WHERE ta.teacher_id = :facultyId
         AND sas.submitted_at IS NOT NULL
         AND DATE(sas.submitted_at) >= :heatmapStart
       GROUP BY COALESCE(sec.name, c.name, CONCAT('Class ', ta.class_id)), DAYOFWEEK(DATE(sas.submitted_at))
       ORDER BY class_label, weekday_number`,
      {
        replacements: { facultyId, heatmapStart },
        type: QueryTypes.SELECT,
      }
    );

    const attendanceTrend = attendanceTrendRows.map((row: any, index: number) => {
      const presentCount = this.toNumber(row.present_count);
      const absentCount = this.toNumber(row.absent_count);
      const totalCount = presentCount + absentCount;
      const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      return {
        label: `Week ${index + 1}`,
        attendance: percentage,
      };
    });

    const weekdayKeys = ["Su", "M", "Tu", "We", "Th", "Fr", "Sa"];
    const heatmapMap = new Map<string, Record<string, number>>();

    for (const row of heatmapRows) {
      const classLabel = String(row.class_label || "Class");
      const weekdayIndex = Math.max(0, this.toNumber(row.weekday_number) - 1);
      const weekdayKey = weekdayKeys[weekdayIndex] || "Su";
      const existing = heatmapMap.get(classLabel) || {
        Su: 0,
        M: 0,
        Tu: 0,
        We: 0,
        Th: 0,
        Fr: 0,
        Sa: 0,
      };
      existing[weekdayKey] = this.toNumber(row.submission_count);
      heatmapMap.set(classLabel, existing);
    }

    const heatmap = Array.from(heatmapMap.entries()).map(([classLabel, days]) => ({
      classLabel,
      days,
    }));

    return {
      summary: {
        totalStudents: this.toNumber(summary?.total_students),
        myClasses: this.toNumber(summary?.my_classes),
        submittedAssignments: this.toNumber(summary?.submitted_assignments),
        classAverageGrade: this.toNumber(summary?.class_avg_grade),
      },
      attendanceOverview: {
        presentToday: this.toNumber(attendanceOverview?.present_today),
        excusedToday: this.toNumber(attendanceOverview?.excused_today),
        absentToday: this.toNumber(attendanceOverview?.absent_today),
        averageAttendance: this.toNumber(attendanceOverview?.average_attendance),
      },
      assignmentProgress: assignmentProgressRows.map((row: any) => ({
        label: row.section_label || "Class",
        checked: this.toNumber(row.checked_count),
        pendingReview: this.toNumber(row.pending_review_count),
        late: this.toNumber(row.late_count),
      })),
      attendanceTrend,
      rosters: rosterRows.map((row: any) => ({
        id: this.toNumber(row.id),
        section: row.class_name || "Class",
        subject: row.subject_name || "Subject",
        rosterCount: this.toNumber(row.roster_count),
        programName: row.program_name || "Program",
      })),
      recentClasses: recentClassRows.map((row: any) => ({
        id: this.toNumber(row.id),
        title: row.title || "Untitled",
        description: row.description || "",
        subjectName: row.subject_name || "Subject",
        className: row.class_name || "Class",
      })),
      submissionHeatmap: heatmap,
    };
  }

  async getTeacherProfilePageData(facultyId: number, tenant: string, year?: number): Promise<any> {
    const sequelize = getTenantSequelize(tenant);
    const teacherRecord = await this.getFacultyById(facultyId, tenant);
    const teacher =
      typeof (teacherRecord as any)?.toJSON === "function"
        ? (teacherRecord as any).toJSON()
        : teacherRecord;

    const [departmentRow] = teacher?.department_id
      ? await sequelize.query<any>(
          `SELECT name FROM departments WHERE id = :departmentId LIMIT 1`,
          {
            replacements: { departmentId: teacher.department_id },
            type: QueryTypes.SELECT,
          }
        )
      : [null];

    const selectedYear = year || new Date().getFullYear();
    const attendanceStart = `${selectedYear}-01-01`;
    const attendanceEnd = `${selectedYear}-12-31`;

    const attendanceRows = teacher?.employee_id
      ? await sequelize.query<any>(
          `SELECT
             DATE_FORMAT(attendance_date, '%Y-%m') AS month_key,
             DATE_FORMAT(attendance_date, '%b') AS month_label,
             SUM(
               CASE
                 WHEN attendance_status IN ('PRESENT', 'LATE', 'HALF_DAY', 'ON_DUTY') THEN 1
                 ELSE 0
               END
             ) AS present_days,
             COUNT(*) AS total_days
           FROM staff_daily_attendance
           WHERE employee_id = :employeeId
             AND attendance_date BETWEEN :attendanceStart AND :attendanceEnd
             AND COALESCE(is_trash, 0) = 0
           GROUP BY DATE_FORMAT(attendance_date, '%Y-%m'), DATE_FORMAT(attendance_date, '%b')
           ORDER BY month_key`,
          {
            replacements: {
              employeeId: teacher.employee_id,
              attendanceStart,
              attendanceEnd,
            },
            type: QueryTypes.SELECT,
          }
        )
      : [];

    const attendanceMap = new Map(
      attendanceRows.map((row: any) => [
        row.month_key,
        {
          label: String(row.month_label || "").toUpperCase(),
          percentage: this.toNumber(row.total_days)
            ? Math.round((this.toNumber(row.present_days) / this.toNumber(row.total_days)) * 100)
            : 0,
        },
      ])
    );

    const monthlyAttendance = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(selectedYear, index, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const existing = attendanceMap.get(monthKey);

      return {
        month: existing?.label || date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
        percentage: existing?.percentage || 0,
      };
    });

    let completedAssignments = await sequelize.query<any>(
      `SELECT
         ta.id,
         ta.title,
         ta.due_date,
         sub.name AS subject_name
       FROM teacher_assignments ta
       LEFT JOIN subjects sub
         ON sub.id = ta.subject_id
       WHERE ta.teacher_id = :facultyId
         AND ta.title IS NOT NULL
         AND ta.due_date IS NOT NULL
         AND ta.due_date <= CURDATE()
       ORDER BY ta.due_date DESC, ta.id DESC
       LIMIT 5`,
      {
        replacements: { facultyId },
        type: QueryTypes.SELECT,
      }
    );

    if (!completedAssignments.length) {
      completedAssignments = await sequelize.query<any>(
        `SELECT
           ta.id,
           ta.title,
           ta.due_date,
           sub.name AS subject_name
         FROM teacher_assignments ta
         LEFT JOIN subjects sub
           ON sub.id = ta.subject_id
         WHERE ta.teacher_id = :facultyId
           AND ta.title IS NOT NULL
         ORDER BY COALESCE(ta.updated_at, ta.created_at) DESC, ta.id DESC
         LIMIT 5`,
        {
          replacements: { facultyId },
          type: QueryTypes.SELECT,
        }
      );
    }

    const classAssignments = Array.isArray(teacher?.teacher_classes)
      ? teacher.teacher_classes.map((assignment: any) => ({
          id: assignment.id,
          subjectName: assignment.subject?.name || "Subject",
          className: assignment.class?.name || "Class",
          programName: assignment.program?.name || "Program",
          academicYear: assignment.academic_year?.name || "Academic Year",
          assignedDate: assignment.assigned_date || null,
        }))
      : [];

    return {
      teacher: {
        ...teacher,
        department_name: departmentRow?.name || null,
      },
      monthlyAttendance,
      completedAssignments: completedAssignments.map((item: any) => ({
        id: this.toNumber(item.id),
        title: item.title || "Untitled Assignment",
        dueDate: item.due_date || null,
        subjectName: item.subject_name || null,
      })),
      classAssignments,
    };
  }

  async createAssignment(facultyId: number, data: any, tenant: string): Promise<any> {
    await this.getFacultyById(facultyId, tenant);
    const { TeacherClass } = getTenantModels(tenant);
    const existing = await TeacherClass.findOne({
      where: {
        teacher_id: facultyId,
        program_id: data.program_id,
        class_id: data.class_id,
        academic_year_id: data.academic_year_id,
        subject_id: data.subject_id, // Include subject_id in duplicate check
        is_active: 1,
      },
    });

    if (existing) {
      throw new AppError('This assignment already exists', 409);
    }

    return TeacherClass.create({
      teacher_id: facultyId,
      program_id: data.program_id,
      class_id: data.class_id,
      academic_year_id: data.academic_year_id,
      subject_id: data.subject_id,
      assigned_date: new Date(),
      is_active: 1
    });
  }

  async getFacultyAssignments(facultyId: number, tenant: string): Promise<any[]> {
    const { TeacherClass } = getTenantModels(tenant);
    return TeacherClass.findAll({
      where: {
        teacher_id: facultyId,
        is_active: 1,
      },
      order: [['academic_year_id', 'DESC'], ['assigned_date', 'ASC']],
    });
  }

  async deleteAssignment(assignmentId: number, tenant: string): Promise<void> {
    const { TeacherClass } = getTenantModels(tenant);
    const assignment = await TeacherClass.findByPk(assignmentId);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    await assignment.destroy();
  }

  async getAssignmentsByAcademicYear(academicYearId: number, tenant: string): Promise<any[]> {
    const { TeacherClass } = getTenantModels(tenant);
    return TeacherClass.findAll({
      where: {
        academic_year_id: academicYearId,
        is_active: 1,
      },
    });
  }  
}
