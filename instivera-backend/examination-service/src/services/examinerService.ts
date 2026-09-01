import { QueryTypes } from "sequelize";
import { getTenantSequelize } from "../server";
import { getTenantModels } from "../models";

export class ExaminerService {

    async getEligibleExaminers(tenant: string, examId: number) {
        const sequelize = getTenantSequelize(tenant);

        const result = await sequelize.query(
            `
            SELECT 
                tcs.teacher_id,
                CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
                t.email,
                t.phone
            FROM teacher_class_subjects tcs
            JOIN teachers t ON t.id = tcs.teacher_id
            JOIN exams e ON 
                e.subject_id = tcs.subject_id AND
                e.program_id = tcs.program_id AND
                e.class_id = tcs.class_id AND
                e.academic_year_id = tcs.academic_year_id
            WHERE e.id = :examId;`,
            {
            replacements: { examId },
            type: QueryTypes.SELECT,
            }
        );
        return result;
    }

    async assignExaminer(
        tenant: string,
        examId: number,
        adminId: number,
        payload: any
        ) {
        const {
            role,
            teacher_id,
            external_name,
            external_email,
            external_mobile,
            external_institution
        } = payload;

        // Validation
        if (role !== "EXTERNAL" && !teacher_id) {
            throw new Error("teacher_id is required for internal examiners");
        }

        if (role === "EXTERNAL" && !external_name) {
            throw new Error("External examiner details are required");
        }

        const { ExamExaminer } = getTenantModels(tenant);

        // Prevent duplicate assignment (Sequelize way)
        const existing = await ExamExaminer.findOne({
            where: {
            exam_id: examId,
            role,
            ...(role === "EXTERNAL"
                ? { external_email }
                : { teacher_id })
            }
        });

        if (existing) {
            throw new Error("This examiner is already assigned for this role");
        }

        // Create examiner entry
        const record = await ExamExaminer.create({
            exam_id: examId,
            teacher_id: role === "EXTERNAL" ? null : teacher_id,
            external_name: role === "EXTERNAL" ? external_name : null,
            external_email: role === "EXTERNAL" ? external_email : null,
            external_mobile: role === "EXTERNAL" ? external_mobile : null,
            external_institution: role === "EXTERNAL" ? external_institution : null,
            role,
            assigned_by: adminId,
            assigned_at: new Date(),
            is_active: 1
        });
        return record;
    }
    async getAssignedExaminers(tenant: string, examId: number) {
        const sequelize = getTenantSequelize(tenant);
        const result = await sequelize.query(
            `
            SELECT 
                ee.id,
                ee.role,
                ee.teacher_id,
                CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
                t.email,
                t.phone,
                ee.external_name,
                ee.external_email,
                ee.external_mobile,
                ee.external_institution,
                u.email AS assigned_by_name,                
                ee.assigned_at
            FROM exam_examiners ee
            LEFT JOIN teachers t ON t.id = ee.teacher_id   
            LEFT JOIN users u ON u.user_id = ee.assigned_by         
            WHERE ee.exam_id = :examId
            AND ee.is_active = 1;
            `,
            {
            replacements: { examId },
            type: QueryTypes.SELECT,
            }
        );
        return result;
    }
    async getTeacherExamSummary(
        tenant: string,
        examId: number,
        teacherId: number
        ) {
        const {
            Exam,
            Subject,
            ExamSchedule,
            ExamExaminer,
            ExamComponentMapping,
            ExamComponentTemplate,
            StudentExamRegistration,
            Student,
            ExamMark,
            ExamMarksLockStatus
        } = getTenantModels(tenant);

        // 1. Validate teacher is assigned as examiner
        const isExaminer = await ExamExaminer.findOne({
            where: { exam_id: examId, teacher_id: teacherId, is_active: 1 }
        });

        if (!isExaminer) {
            throw new Error("You are not assigned as examiner for this exam");
        }

        // 2. Fetch exam details
        const exam: any = await Exam.findOne({
            where: { id: examId },
            include: [
            { model: Subject, as: "subject", attributes: ["name"] },
            { model: ExamSchedule, as: "schedules" },
            { model: ExamMarksLockStatus, as: "marks_lock_status" }
            ]
        });

        // 3. Fetch components 
        const components: any = await ExamComponentMapping.findAll({
            where: { examId: examId },
            include: [
            {
                model: ExamComponentTemplate,
                as: "template", 
                attributes: ["componentName", "defaultWeightage"]
            }
            ],
            order: [["sequence", "ASC"]]
        });

        // Build component metadata map
        const componentMap = new Map();
        components.forEach((c: any) => {
            componentMap.set(c.id, {
            component_name: c.template.componentName,
            max_marks: c.maxMarks ?? c.template.defaultWeightage,
            sequence: c.sequence
            });
        });

        // 4. Fetch students
        const registrations: any = await StudentExamRegistration.findAll({
            where: { exam_id: examId },
            include: [
            {
                model: Student,
                as: "student",
                attributes: ["id", "student_id", "student_name", "roll_number"]
            }
            ],
            order: [["id", "ASC"]]
        });

        // 5. Fetch marks
        const marks: any = await ExamMark.findAll({
            where: { exam_id: examId },
            attributes: ["student_id", "component_mapping_id", "marks_obtained"]
        });


        // Build marks map 
        const marksMap = new Map();
        marks.forEach((m: any) => {
            const key = `${m.student_id}_${m.component_mapping_id}`;
            marksMap.set(key, m.marks_obtained);
        });

        // 6. Build student summary with enriched components
        const studentSummary = registrations.map((reg: any) => {
            const s = reg.student;

            const enrichedComponents = components.map((c: any) => {
            const meta = componentMap.get(c.id);
            const key = `${s.id}_${c.id}`;
            const marksObtained = marksMap.get(key) ?? null;

            return {
                mapping_id: c.id,
                component_name: meta.component_name,
                max_marks: meta.max_marks,
                sequence: meta.sequence,
                marks_obtained: marksObtained
            };
            });

            return {
            student_id: s.student_id,
            roll_number: s.roll_number,
            student_name: s.student_name,
            components: enrichedComponents
            };
        });

        // 7. Stats
        const totalStudents = studentSummary.length;

        const studentsCompleted = studentSummary.filter((s: any) =>
            s.components.every(
            (c: any) => c.marks_obtained !== null && c.marks_obtained !== ""
            )
        ).length;

        const completionPercentage =
            totalStudents === 0
            ? 0
            : Math.round((studentsCompleted / totalStudents) * 100);

        return {
            exam: {
            exam_id: exam.id,
            exam_name: exam.exam_name,
            subject_name: exam.subject.name,
            scheduled_date: exam.schedules?.[0]?.scheduled_date || null,
            start_time: exam.schedules?.[0]?.start_time || null,
            end_time: exam.schedules?.[0]?.end_time || null,
            status: exam.marks_lock_status?.status || "OPEN"
            },
            components: components.map((c: any) => {
            const meta = componentMap.get(c.id);
            return {
                mapping_id: c.id,
                component_name: meta.component_name,
                max_marks: meta.max_marks,
                sequence: meta.sequence
            };
            }),
            students: studentSummary,
            stats: {
            total_students: totalStudents,
            students_completed: studentsCompleted,
            completion_percentage: completionPercentage
            }
        };
    }
}