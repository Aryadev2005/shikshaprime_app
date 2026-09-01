import { Op } from "sequelize";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

export class ExamResultService {

    async calculateExamResults(
        tenant: string,
        adminId: number,
        examId: number
        ) {
        const {
            Exam,
            ExamComponentMapping,
            StudentExamRegistration,
            ExamMark,
            ExamResult,
        } = getTenantModels(tenant);

        return await getTenantSequelize(tenant).transaction(async (t) => {

            // 1. Validate exam exists
            const exam = await Exam.findOne({
            where: { id: examId },
            transaction: t
            });

            if (!exam) throw new Error("Exam not found");

            // 2. Ensure results are not finalised
            const existing = await ExamResult.findOne({
            where: { exam_id: examId },
            attributes: ["is_finalized"],
            transaction: t
            });

            if (existing?.is_finalized === 1) {
            throw new Error("Results are already finalised and cannot be recalculated");
            }

            // 3. Load components
            const components = await ExamComponentMapping.findAll({
            where: { examId },
            transaction: t
            });

            if (!components.length) {
            throw new Error("No components mapped to this exam");
            }

            const totalMaxMarks = components.reduce(
            (sum, c) => sum + Number(c.maxMarks),
            0
            );

            // 4. Load registered students
            const registrations = await StudentExamRegistration.findAll({
            where: { exam_id: examId },
            attributes: ["student_id"],
            transaction: t
            });

            if (!registrations.length) {
            throw new Error("No students registered for this exam");
            }

            const studentIds = registrations.map((r) => r.student_id);

            // 5. Load all marks
            const marks = await ExamMark.findAll({
            where: {
                exam_id: examId,
                student_id: { [Op.in]: studentIds }
            },
            transaction: t
            });

            // Build marks map
            const marksByStudent = new Map();
            marks.forEach((m) => {
                const arr = marksByStudent.get(m.student_id) || [];
                arr.push(m);
                marksByStudent.set(m.student_id, arr);
            });

            // 6. Compute results
            const resultsPayload = [];

            for (const reg of registrations) {
                const sid = reg.student_id;
                const studentMarks = marksByStudent.get(sid) || [];

                let totalMarks = 0;
                let failedComponent = false;

            for (const c of components) {
                const m = studentMarks.find(
                (mk) => mk.component_mapping_id === c.id
                );

                const obtained = m ? Number(m.marks_obtained) : 0;
                totalMarks += obtained;

                // per-component pass rule
                if (c.passRequired && obtained < Number(c.minMarks)) {
                failedComponent = true;
                }
            }

            const percentage =
                totalMaxMarks === 0
                ? 0
                : Number(((totalMarks / totalMaxMarks) * 100).toFixed(2));

            const passPercentage = 40; // configurable later
            const isPass = !failedComponent && percentage >= passPercentage;

            const grade = this.getGradeFromPercentage(percentage);

            resultsPayload.push({
                exam_id: examId,
                student_id: sid,
                total_marks: totalMarks,
                percentage,
                grade,
                result_status: isPass ? "PASS" : "FAIL",
                is_finalised: 0, // always reset to editable
                finalised_at: null,
                finalised_by: null
            });
            }

            // 7. Upsert results
            for (const r of resultsPayload) {
                await ExamResult.upsert(r, {
                    transaction: t,
                    conflictFields: ["exam_id", "student_id"]
                } as any);
            }           

            return {
            status: 1,
            message: "Results calculated successfully"
            };
        });
    }

    getGradeFromPercentage(p: number): string {
        if (p >= 90) return "A+";
        if (p >= 80) return "A";
        if (p >= 70) return "B+";
        if (p >= 60) return "B";
        if (p >= 50) return "C";
        if (p >= 40) return "D";
        return "F";
    }


    async finaliseExamResults(
        tenant: string,
        adminId: number,
        examId: number
    ) {
        const {
            ExamResult,
            ExamMarksLockStatus,
            Exam,
        } = getTenantModels(tenant);

        return await getTenantSequelize(tenant).transaction(async (t) => {

            // 1. Validate exam exists
            const exam = await Exam.findOne({
            where: { id: examId },
            transaction: t
            });

            if (!exam) {
            throw new Error("Exam not found");
            }

            // 2. Ensure marks are submitted (teacher side)
            const lock = await ExamMarksLockStatus.findOne({
            where: { exam_id: examId },
            transaction: t
            });

            if (!lock || lock.status !== "SUBMITTED") {
            throw new Error("Marks must be submitted before finalising results");
            }

            // 3. Ensure results are calculated
            const anyResult = await ExamResult.findOne({
            where: { exam_id: examId },
            transaction: t
            });

            if (!anyResult) {
            throw new Error("Results not calculated yet");
            }

            // 4. Prevent double finalisation
            if (anyResult.is_finalized === 1) {
            throw new Error("Results are already finalised");
            }

            // 5. Finalise all results
            await ExamResult.update(
            {
                is_finalized: 1,
                finalized_at: new Date(),
                finalized_by: adminId
            },
            {
                where: { exam_id: examId },
                transaction: t
            }
            );

            // 6. Update lock status to FINALIZED (optional but recommended)
            // await lock.update(
            // {
            //     status: "FINALIZED",
            //     locked_by: adminId,
            //     locked_at: new Date()
            // },
            // { transaction: t }
            // );

            return {
            status: 1,
            message: "Results finalised successfully"
            };
        });
    }
    async publishExamResults(
        tenant: string,
        adminId: number,
        examId: number
        ) {
        const {
            Exam,
            ExamResult,
        } = getTenantModels(tenant);

        return await getTenantSequelize(tenant).transaction(async (t) => {

            // 1. Validate exam exists
            const exam = await Exam.findOne({
            where: { id: examId },
            transaction: t
            });

            if (!exam) {
            throw new Error("Exam not found");
            }

            // 2. Ensure results are finalised
            const anyResult = await ExamResult.findOne({
            where: { exam_id: examId },
            attributes: ["is_finalized"],
            transaction: t
            });

            if (!anyResult) {
            throw new Error("Results not calculated yet");
            }

            if (anyResult.is_finalized !== 1) {
            throw new Error("Results must be finalised before publishing");
            }

            // 3. Prevent double publishing
            if (exam.is_published === 1) {
            throw new Error("Results are already published");
            }

            // 3.5. Library Clearance Check
            const results = await ExamResult.findAll({
              where: { exam_id: examId },
              attributes: ["student_id"],
              transaction: t
            });

            // for (const r of results) {
            //   try {
            //     const libRes = await fetch(`http://127.0.0.1:9040/api/library/students/${r.student_id}/status`, {
            //       headers: { "x-tenant": tenant }
            //     });
                
            //     if (libRes.ok) {
            //       const libData = await libRes.json();
            //       if (libData.data && libData.data.is_clear === false) {
            //         throw new Error(`Cannot publish results. Student ID ${r.student_id} has pending library dues (Books: ${libData.data.pending_books_count}, Fines: ₹${libData.data.pending_fine_amount}).`);
            //       }
            //     }
            //   } catch (err: any) {
            //     // If it's our specific error, rethrow it to abort the transaction
            //     if (err.message.includes("Cannot publish results")) {
            //       throw err;
            //     }
            //     // If the library service is down or student not mapped, we can just log and proceed
            //     console.warn(`Library clearance check failed for student ${r.student_id}:`, err.message);
            //   }
            // }

            // 4. Publish results
            await exam.update(
            {
                is_published: 1,
                published_at: new Date(),
                published_by: adminId,
            },
            { transaction: t }
            );

            return {
            status: 1,
            message: "Results published successfully"
            };
        });
    }
    async getExamResults(tenant, examId) {
        const {
            Exam,
            ExamResult,
            Student,
        } = getTenantModels(tenant);

        // 1. Validate exam exists
        const exam = await Exam.findOne({ where: { id: examId },  
            attributes: ["id", "is_published", "published_at"] });
        if (!exam) throw new Error("Exam not found");

        // 2. Fetch results joined with student table
        const results: any = await ExamResult.findAll({
            where: { exam_id: examId },
            attributes: [
            "student_id",
            "total_marks",
            "percentage",
            "grade",
            "pass_fail",
            "is_finalized",
            ],
            include: [
            {
                model: Student,
                as: "student",
                attributes: ["student_name"]
            }
            ],
            order: [["student_id", "ASC"]]
        });

        // 3. Format response
        const formatted = results.map((r) => ({
            student_id: r.student_id,
            student_name: r.student?.student_name || "",
            total_marks: r.total_marks,
            percentage: r.percentage,
            grade: r.grade,
            result_status: r.pass_fail,
            is_finalised: r.is_finalized,
            is_published: exam.is_published,
            published_at: exam.published_at
        }));
        return formatted;
    }
    async getStudentResults(tenant, studentId) {
        const {
            Exam,
            ExamResult
        } = getTenantModels(tenant);

        const results: any = await ExamResult.findAll({
            where: { student_id: studentId },
            include: [
            {
                model: Exam,
                as: "exam",
                where: { is_published: 1 },
                attributes: ["id", "exam_name", "published_at"]
            }
            ],
            attributes: [
            "total_marks",
            "percentage",
            "grade",
            "pass_fail"
            ],
            order: [[{ model: Exam, as: "exam" }, "published_at", "DESC"]]
        });

        return results.map((r) => ({
            exam_id: r.exam.id,
            exam_name: r.exam.exam_name,
            published_at: r.exam.published_at,
            total_marks: r.total_marks,
            percentage: r.percentage,
            grade: r.grade,
            result_status: r.pass_fail
        }));
    }
    async getStudentResultDetails(tenant, studentId, examId) {
        const {
            Exam,
            ExamResult,
            ExamMark,
            ExamComponentMapping,
            ExamComponentTemplate
        } = getTenantModels(tenant);

        const exam = await Exam.findOne({
            where: { id: examId, is_published: 1 },
            attributes: ["id", "exam_name", "published_at"]
        });

        if (!exam) throw new Error("Result not published");

        const result = await ExamResult.findOne({
            where: { exam_id: examId, student_id: studentId },
            attributes: ["total_marks", "percentage", "grade", "pass_fail"]
        });

        const marks: any = await ExamMark.findAll({
            where: { exam_id: examId, student_id: studentId },
            include: [
            {
                model: ExamComponentMapping,
                as: "component_mapping",
                attributes: ["maxMarks"],
                include: [
                {
                    model: ExamComponentTemplate,
                    as: "template",
                    attributes: ["componentName"]
                }
                ]
            }
            ]
        });
        const componentMarks = marks.map((m) => ({
            component_name: m.component_mapping.template.componentName,
            max_marks: m.component_mapping.maxMarks,
            marks_obtained: m.marks_obtained
        }));
        return {
            exam,
            result,
            components: componentMarks
        };
    }

}