import { QueryTypes } from "sequelize";
import { getTenantModels, sequelize } from "../models";
import { getTenantSequelize } from "../server";
import { AppError } from "../utils/appError";
import { isPositiveNumber, isValidEnum, requireFields } from "../utils/validators";

export enum ExamType {
  INTERNAL = "INTERNAL",
  MIDTERM = "MIDTERM",
  FINAL = "FINAL",
}

export class ExamService {
    async createExam(payload: any, tenant: string) {
        requireFields(payload, ["exam_name", "department_id","program_id", 
            "academic_year_id", "class_id", "subject_id", "semester_id", "exam_type", "total_marks", "duration_minutes", "created_by"]);
        isValidEnum(payload.exam_type, Object.values(ExamType), "exam_type");
        isPositiveNumber(payload.total_marks, "total_marks");
        isPositiveNumber(payload.duration_minutes, "duration_minutes");
        const { Exam, StudentExamRegistration } = getTenantModels(tenant);
        const sequelize = getTenantSequelize(tenant);
        const exam = await Exam.create({
            exam_name: payload.exam_name,
            department_id: payload.department_id,
            program_id: payload.program_id,
            academic_year_id: payload.academic_year_id,
            class_id: payload.class_id,
            subject_id: payload.subject_id,
            semester_id: payload.semester_id,
            exam_type: payload.exam_type,
            total_marks: payload.total_marks,
            duration_minutes: payload.duration_minutes,
            is_active: payload.is_active !== undefined ? payload.is_active : true,
            created_by: payload.created_by,
        });
        const students: any = await sequelize.query(
        `SELECT id 
        FROM students
        WHERE program_id = :programId
            AND department_id = :departmentId
            AND academic_year_id = :academicYearId
            AND class_id = :classId
            AND semester_id = :semesterId
        `,
        {
            replacements: {
            programId: exam.program_id,
            departmentId: exam.department_id,
            academicYearId: exam.academic_year_id,
            classId: exam.class_id,
            semesterId: exam.semester_id,
            },
            type: QueryTypes.SELECT,
        }
        );
        await StudentExamRegistration.bulkCreate(
            students.map((s) => ({
            student_id: s.id,
            exam_id: exam.id,
            status: "REGISTERED"
            }))
        );

        return exam;
    }
    async getAllExams(tenant: string, filters: any = {}) {
        const { Exam } = getTenantModels(tenant);
        const where: any = {};
        if (filters.program_id) where.subject_id = filters.program_id;
        if (filters.subject_id) where.subject_id = filters.subject_id;
        if (filters.semester_id) where.semester = filters.semester_id;
        if (filters.exam_type) where.exam_type = filters.exam_type;
        if (filters.is_active !== undefined) where.is_active = filters.is_active;

        const exams = await Exam.findAll({ where, order: [["created_at", "DESC"]] });
        return exams;
    }
    async getExamById(id: string, tenant: string) {
        const { Exam, ExamSchedule } = getTenantModels(tenant);
        const exam = await Exam.findOne({
            where: { id },
            include: [{ model: ExamSchedule, as: "schedules" }],
        });
        if (!exam) throw new AppError("Exam not found", 404);
        return exam;
    }
    async updateExam(id: string, data: any, tenant: string) {
        const { Exam } = getTenantModels(tenant);
        const exam = await Exam.findOne({ where: { id } });
        if (!exam) throw new AppError("Exam not found", 404);
        if (data.exam_type) isValidEnum(data.exam_type, Object.values(ExamType), "exam_type");
        if (data.total_marks) isPositiveNumber(data.total_marks, "total_marks");
        if (data.duration_minutes) isPositiveNumber(data.duration_minutes, "duration_minutes");
        await exam.update(data);
        return exam;
    }
    async deleteExam(id: string, tenant: string) {
        const { Exam } = getTenantModels(tenant);
        const exam = await Exam.findOne({ where: { id } });
        if (!exam) throw new AppError("Exam not found", 404);
        await exam.destroy();
        return { message: "Exam deleted successfully" };
    }
    
    async getExamSchedulesWithDetailsService(
        exam_id: number,
        tenant: string
        ) {
        if (!exam_id) {
            throw new Error("exam_id is required");
        }

        const sequelize = getTenantSequelize(tenant);
        const { ExamSchedule } = getTenantModels(tenant);

        // 1. Fetch exam + academic structure + subject details
        const [examDetails] = await sequelize.query(
            `
            SELECT 
                e.id AS exam_id,
                e.exam_name,
                e.program_id,
                p.name AS program_name,
                e.department_id,
                d.name AS department_name,
                e.academic_year_id,
                ay.year AS academic_year_name,
                e.class_id,
                c.name AS class_name,
                e.semester_id,
                s.semester_number AS semester_number,
                e.subject_id,
                subj.name AS subject_name,
                e.exam_type,
                e.total_marks,
                e.duration_minutes
            FROM exams e
            LEFT JOIN programs p ON p.id = e.program_id
            LEFT JOIN departments d ON d.id = e.department_id
            LEFT JOIN academic_years ay ON ay.id = e.academic_year_id
            LEFT JOIN classes c ON c.id = e.class_id
            LEFT JOIN semesters s ON s.id = e.semester_id
            LEFT JOIN subjects subj ON subj.id = e.subject_id
            WHERE e.id = :examId
            LIMIT 1;
            `,
            {
            replacements: { examId: exam_id },
            type: QueryTypes.SELECT,
            }
        );

        if (!examDetails) {
            throw new Error("Exam not found");
        }

        // 2. Fetch schedules for this exam
        const schedules = await ExamSchedule.findAll({
            where: { exam_id },
            order: [
            ["scheduled_date", "ASC"],
            ["start_time", "ASC"],
            ],
        });

        return {
            exam: examDetails,
            schedules,
        };
    }
    async getTeacherExams(tenant: string, teacherId: number) {
        const {
            Exam,
            Subject,
            ExamSchedule,
            ExamExaminer,
            ExamMark,
            ExamMarksLockStatus,
            StudentExamRegistration
        } = getTenantModels(tenant);

        // Step 1: Find all exams where teacher is assigned as examiner
        const assignedExams = await ExamExaminer.findAll({
            where: { teacher_id: teacherId, is_active: 1 },
            attributes: ["exam_id", "role"],
        });

        if (assignedExams.length === 0) return [];

        const examIds = assignedExams.map((e) => e.exam_id);

        // Step 2: Fetch exam details + schedule + subject
        const exams: any = await Exam.findAll({
            where: { id: examIds },
            include: [
            {
                model: Subject,
                as: "subject",
                attributes: ["name"],
            },
            {
                model: ExamSchedule,
                as: "schedules",
                attributes: ["scheduled_date", "start_time", "end_time"],
            },
            {
                model: ExamMarksLockStatus,
                as: "marks_lock_status",
                attributes: ["status"],
            },
            ],
        });

        // Step 3: Build response with student counts + marks progress
        const response = [];

        for (const exam of exams) {
            const examId = exam.id;

            // total students
            const totalStudents = await StudentExamRegistration.count({
            where: { exam_id: examId },
            });

            // students with marks
            const studentsMarked = await ExamMark.count({
            where: { exam_id: examId },
            distinct: true,
            col: "student_id",
            });

            response.push({
            exam_id: exam.id,
            exam_name: exam.exam_name,
            subject_name: exam.subject?.subject_name || "",
            scheduled_date: exam.schedules?.[0]?.scheduled_date || null,
            start_time: exam.schedules?.[0]?.start_time || null,
            end_time: exam.schedules?.[0]?.end_time || null,
            total_students: totalStudents,
            students_marked: studentsMarked,
            marks_status: exam.marks_lock_status?.status || "OPEN",
            });
        }
        return response;
    }
    async getTeacherExamStudents(tenant: string, examId: number, teacherId: number) {
        const {
            StudentExamRegistration,
            Student,
            ExamMark,
            ExamExaminer,
            ExamComponentMapping
        } = getTenantModels(tenant);

        // Step 1: Ensure teacher is assigned as examiner
        const isExaminer = await ExamExaminer.findOne({
            where: { exam_id: examId, teacher_id: teacherId, is_active: 1 }
        });

        if (!isExaminer) {
            throw new Error("You are not assigned as examiner for this exam");
        }

        // Step 2: Fetch all registered students
        const registrations: any = await StudentExamRegistration.findAll({
            where: { exam_id: examId },
            include: [
                {
                    model: Student,
                    as: "student",
                    attributes: ["id", "student_name", "roll_number", "student_id"]
                }
            ],
            order: [["student_id", "ASC"]]
        });

        // Step 3: Fetch total components for this exam
        const components = await ExamComponentMapping.findAll({
            where: { examId: examId },
            attributes: ["id"]
        });

        const totalComponents = components.length;

        // Step 4: Fetch all marks for this exam
        const marks = await ExamMark.findAll({
            where: { exam_id: examId },
            attributes: ["student_id", "component_mapping_id", "marks_obtained"],
        });

        // Step 5: Group marks by student
        const marksMap = new Map();

        marks.forEach((m) => {
            if (!marksMap.has(m.student_id)) {
                marksMap.set(m.student_id, []);
            }
            marksMap.get(m.student_id).push(m);
        });

        // Step 6: Build response
        return registrations.map((reg) => {
            const s = reg.student;

            const studentMarks = marksMap.get(s.id) || [];

            const hasDraft = studentMarks.length > 0;
            const marksEntered = studentMarks.length === totalComponents;

            return {
                registration_id: reg.id,
                student_id: s.student_id,
                roll_number: s.roll_number,
                student_name: s.student_name,
                marks_entered: marksEntered,
                has_draft: hasDraft && !marksEntered,
                total_components: totalComponents,
                filled_components: studentMarks.length,
                marks: studentMarks
            };
        });
    }
    async adminExamSummary(tenant, examId) {
        const {
            Exam,
            ExamComponentMapping,
            StudentExamRegistration,
            ExamComponentTemplate,
            ExamResult            
        } = getTenantModels(tenant);

        // 1. Load exam
        const exam = await Exam.findOne({ where: { id: examId } });
        if (!exam) throw new Error("Exam not found");

        // 2. Load components
        const components = await ExamComponentMapping.findAll({
            where: { examId },
            attributes: ["id", "maxMarks"],
            include: [
                {
                model: ExamComponentTemplate,
                as: "template",
                attributes: ["id", "componentName"]
                }
            ]
            });

            // Normalize for response
            const componentList = components.map((c: any) => ({
            id: c.id,
            component_id: c.component_id,
            component_name: c.component?.name,
            max_marks: c.maxMarks
            }));
        // 3. Load student registrations
        const registrations = await StudentExamRegistration.findAll({
            where: { exam_id: examId },
            attributes: ["student_id"]
        });

        const totalStudents = registrations.length;
        const studentIds = registrations.map((r) => r.student_id);

        // 4. Count completed students
        const completedStudents: any = await getTenantSequelize(tenant).query(
            `
            SELECT COUNT(DISTINCT student_id) AS completed
            FROM exam_marks
            WHERE exam_id = :examId
            GROUP BY student_id
            HAVING COUNT(marks_obtained) = (
            SELECT COUNT(*) FROM exam_component_mapping WHERE exam_id = :examId
            )
            `,
            {
            replacements: { examId },
            type: QueryTypes.SELECT
            }
        );

        const studentsCompleted = completedStudents?.[0]?.completed || 0;
        const completionPercentage =
            totalStudents === 0
            ? 0
            : Math.round((studentsCompleted / totalStudents) * 100);

        // 5. Determine status from exam_results + exam table
        const resultRows = await ExamResult.findAll({
            where: { exam_id: examId },
            attributes: ["is_finalized"]
        });

        let status = "NOT_CALCULATED";

        if (resultRows.length > 0) {
            const allFinalised = resultRows.every((r) => r.is_finalized === 1);

            if (exam.is_published === 1) {
            status = "RESULT_PUBLISHED";
            } else if (allFinalised) {
            status = "FINALIZED";
            } else {
            status = "RESULT_CALCULATED";
            }
        }

        return {
            exam: {
            id: exam.id,
            exam_name: exam.exam_name,
            status,
            is_published: exam.is_published,
            published_at: exam.published_at
            },
            stats: {
            total_students: totalStudents,
            students_completed: studentsCompleted,
            completion_percentage: completionPercentage
            },
            componentList
        };
    }
}