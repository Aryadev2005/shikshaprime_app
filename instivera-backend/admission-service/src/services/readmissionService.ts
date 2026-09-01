import { rulesService } from "@shared/rules";
import { getTenantModels, sequelize } from "../models";
import { tenantsService } from "@shared/tenants";
import { SubjectSelectionService } from "./subjectSelectionService";
import { normalizeEnum } from "../utils/util";
import { promotionEngine } from "./promotionEngine";
import { Op } from "sequelize";
import { StudentPersonalDetails } from "../models/tenant/studentPersonalDetails";

export class ReadmissionService {
    subjectSelectionService = new SubjectSelectionService();
    async checkEligibility(studentId: number, tenantName: string) {
        const models = getTenantModels(tenantName);
        const student = await models.Student.findByPk(studentId);
        if (!student) throw new Error("Student not found");
        const currentSemesterId = student.semester_id;
        const currentSemester = await models.Semester.findByPk(currentSemesterId);
        const semesterNumber = currentSemester?.semester_number;
        const tenant = await tenantsService.getTenantByName(tenantName);

        const rules = await rulesService.getReadmissionRules(null, tenant.id);
        const {
            readmission_required_after_semesters,
            readmission_max_gap_years,
            readmission_max_attempts_per_semester,
            readmission_min_attendance_percentage,
            readmission_allow_if_backlogs_upto,
            readmission_allow_after_dropp,
            readmission_allow_semester_gap,
            readmission_block_if_fees_pending,
            readmission_block_if_disciplinary_action,
            readmission_fee_required,
            readmission_fee_amount,
            readmission_fee_per_semester
        } = rules;
        const toSemesterId = currentSemesterId + 1;
        const requiresReadmission =
            readmission_required_after_semesters.includes(semesterNumber);
        const lastStatus = await models.StudentAcademicStatusHistory.findOne({
            where: { student_id: studentId },
            order: [["id", "DESC"]]
        });
        const personalDetails = await models.StudentPersonalDetails.findOne({
            where: { student_id: studentId }
        });
        const wasDropped = lastStatus?.status === "NOT_PROMOTED";
        const hasGap = await this.hasSemesterGap(studentId, models, rules);
        const attendanceOk = await this.checkAttendance(studentId,
            readmission_min_attendance_percentage,
            models);
        const backlogCount = await this.getBacklogCount(studentId, models);
        const backlogOk = backlogCount <= readmission_allow_if_backlogs_upto;
        if (!backlogOk) {
            return {
                eligible: false,
                reason: "TOO_MANY_BACKLOGS",
                backlog_count: backlogCount
            };
        }
        const hasDues = await this.hasPendingFees(studentId, models);
        if (readmission_block_if_fees_pending && hasDues) {
            return {
                eligible: false,
                reason: "FEES_PENDING"
            };
        }
        const hasDisciplinary = await this.hasDisciplinaryAction(studentId, models);
        if (readmission_block_if_disciplinary_action && hasDisciplinary) {
            return {
                eligible: false,
                reason: "DISCIPLINARY_ACTION"
            };
        }
        if (
            requiresReadmission ||
            (wasDropped && readmission_allow_after_dropp) ||
            (hasGap && readmission_allow_semester_gap)
        ) {
            return {
                eligible: true,
                reason: requiresReadmission
                    ? "SEMESTER_COMPLETED"
                    : wasDropped
                        ? "DROPP"
                        : "SEMESTER_GAP",
                from_semester_id: currentSemesterId,
                to_semester_id: toSemesterId,
                academic_year_id: personalDetails.academic_year_id,
                fee_required: readmission_fee_required,
                fee_amount:
                    readmission_fee_per_semester[toSemesterId] || readmission_fee_amount
            };
        }

        return {
            eligible: false,
            reason: "NOT_REQUIRED"
        };
    }

    async hasSemesterGap(studentId: number, models: any, rules: any): Promise<boolean> {
        // 1️⃣ Fetch academic history sorted by time
        const history = await models.StudentAcademicStatusHistory.findAll({
            where: { student_id: studentId },
            order: [["created_at", "ASC"]]
        });

        if (!history.length) return false;

        // 2️⃣ Extract semester IDs in chronological order
        const semesters = history.map(h => h.semester_id);

        // 3️⃣ Check for gaps between consecutive semesters
        for (let i = 0; i < semesters.length - 1; i++) {
            const current = semesters[i];
            const next = semesters[i + 1];
            // If next semester is more than +1 → GAP
            if (next - current > 1) {
                return true;
            }
        }
        const first = history[0].created_at;
        const last = history[history.length - 1].created_at;

        const diffYears = (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 365);

        if (diffYears > rules.readmission_max_gap_years) {
            return true;
        }
        return false;
    }

    async checkAttendance(studentId: number,
        minPercentage: number,
        models: any
    ) {
        //TO DO
        return true;
    }

    async getBacklogCount(studentId: number, models: any): Promise<number> {
        if (!models.StudentSubjectResults) return 0; // Model not implemented yet
        // 1️⃣ Fetch all subject results for the student
        const results = await models.StudentSubjectResults.findAll({
            where: { student_id: studentId }
        });

        if (!results.length) return 0;

        // 2️⃣ Count subjects where result_status is NOT PASS
        let backlogCount = 0;

        for (const r of results) {
            if (["FAIL", "ABSENT", "DET", "DROPPED"].includes(r.result_status)) {
                backlogCount++;
            }
        }

        return backlogCount;
    }
    async hasPendingFees(studentId: number, models: any): Promise<boolean> {
        if (!models.StudentFeeAssignment || !models.FeeReceipt) return false; // Models not fully implemented yet

        // 1️⃣ Fetch total fee demand for the student
        const assignedFees = await models.StudentFeeAssignment.findAll({
            where: { student_id: studentId },
            include: [
                {
                    model: models.FeeHead,
                    as: "fee_head",
                    attributes: ["id", "name"],
                },
            ],
        });
        const receipts = await models.FeeReceipt.findAll({
            where: { student_id: studentId },
            include: [
                {
                    model: models.FeeReceiptItem,
                    as: "items",
                    include: [
                        {
                            model: models.FeeHead,
                            as: "fee_head",
                            attributes: ["id", "name"],
                        },
                    ],
                },
            ],
        });

        // 3️⃣ If no demand exists, no pending fees
        if (!assignedFees || receipts === 0) return false;

        // 4️⃣ Compare
        return receipts < assignedFees;
    }
    async hasDisciplinaryAction(studentId: number, models: any): Promise<boolean> {
        if (!models.StudentDisciplinaryActions) return false; // Model not implemented yet

        // 1️⃣ Fetch any ACTIVE disciplinary action for the student
        const action = await models.StudentDisciplinaryActions.findOne({
            where: {
                student_id: studentId,
                status: "ACTIVE"
            }
        });

        // 2️⃣ If any active action exists → block
        return !!action;
    }

    async autoCreatePendingReadmission(payload: any, tenantName: string) {
        const tenant = await tenantsService.getTenantByName(tenantName);
        const models = getTenantModels(tenantName);

        const {
            program_id,
            department_id,
            class_id,
            semester_id,
            academic_year_id,
            triggered_by = "SYSTEM"
        } = payload;

        const rules = await rulesService.getReadmissionRules(null, tenant.id);

        // 1️⃣ Filter program_id / class_id from student_personal_details table
        const personalDetailsWhere: any = {};
        if (program_id) personalDetailsWhere.program_id = program_id;
        if (class_id) personalDetailsWhere.class_id = class_id;

        const matchingPersonalDetails = await models.StudentPersonalDetails.findAll({
            where: personalDetailsWhere,  // empty object = no filter = all rows
            attributes: ["program_id", "student_id", "class_id"]
        });

        // Build student_id list and a Map for O(1) lookup inside the loop
        const studentIds = matchingPersonalDetails.map((pd: any) => Number(pd.student_id));
        const personalDetailsMap = new Map<number, any>(
            matchingPersonalDetails.map((pd: any) => [Number(pd.student_id), pd])
        );

        if (!studentIds.length) {
            return {
                total_students_checked: 0,
                pending_requests_created: 0,
                skipped_due_to_existing_request: 0,
                skipped_due_to_ineligibility: 0,
                readmissions: []
            };
        }

        // 2️⃣ Filter students table by semester_id + student_ids from above
        const students = await models.Student.findAll({
            where: {
                id: { [Op.in]: studentIds },
                ...(semester_id && { semester_id })
            },
            attributes: [
                "user_id",
                "application_id",
                "first_name",
                "middle_name",
                "last_name",
                "student_id",
                "id",
                "semester_id"
            ]
        });

        let created = 0;
        let skippedExisting = 0;
        let skippedIneligible = 0;
        const readmissions: any[] = [];

        for (const student of students) {
            // Get personalDetails from pre-built map (no extra DB call)
            const personalDetails = personalDetailsMap.get(Number(student.id))
                ?? await models.StudentPersonalDetails.findOne({ where: { student_id: student.id } });

            const studentData: any = student.toJSON();
            if (personalDetails) {
                studentData.program_id = personalDetails.program_id;
            }

            // 3️⃣ Skip if a pending request already exists
            const existing = await models.ReadmissionRequests.findOne({
                where: {
                    student_id: student.id,
                    from_class_id: class_id
                }
            });

            if (existing) {
                skippedExisting++;
                studentData.readmission_request = existing;
                readmissions.push(studentData);
                continue;
            }

            const presentClass = await models.Class.findOne({
                where: { id: personalDetails.class_id }
            });

            const presentSemester = await models.Semester.findOne({
                where: { id: presentClass.semester_id }
            });

            // 4️⃣ Run eligibility engine
            const eligibility = await this.checkEligibility(student.id, tenantName);

            if (!eligibility.eligible) {
                skippedIneligible++;
                continue;
            }

            // 5️⃣ Determine next class + semester
            const nextSemesterId = eligibility.to_semester_id;
            const nextClassId = await this.subjectSelectionService.getClassForSemester(
                personalDetails.program_id,
                nextSemesterId,
                tenantName
            );

            // 6️⃣ Create readmission request
            const readmissionRequest = await models.ReadmissionRequests.create({
                student_id: student.id,

                program_id: personalDetails.program_id,
                department_id: department_id,

                from_class_id: personalDetails.class_id,
                to_class_id: nextClassId,

                from_semester_id: student.semester_id,
                to_semester_id: nextSemesterId,

                academic_year_id,
                status: "PENDING",

                fee_required: rules.readmission_fee_required,
                fee_amount: rules.readmission_fee_amount,
                fee_paid: false,
                remarks: "Auto-created after result publication"
            });

            // 7️⃣ Add academic status history
            await models.StudentAcademicStatusHistory.create({
                student_id: student.id,
                program_id: personalDetails.program_id,
                class_id: personalDetails.class_id,
                semester_id: student.semester_id,
                academic_year_id: readmissionRequest.academic_year_id,
                status: "RE_ADMISSION_PENDING",
                remarks: "Auto-created after result publication"
            });

            created++;

            // 8️⃣ Collect student + readmission_request for response
            studentData.readmission_request = readmissionRequest.toJSON();
            readmissions.push(studentData);
        }

        return {
            total_students_checked: students.length,
            pending_requests_created: created,
            skipped_due_to_existing_request: skippedExisting,
            skipped_due_to_ineligibility: skippedIneligible,
            readmissions
        };
    }

    async getReadmissionRequest(page: number = 1, pageSize: number = 10, tenantName: string) {
        const models = getTenantModels(tenantName);
        const offset = (page - 1) * pageSize;

        const { count, rows } = await models.ReadmissionRequests.findAndCountAll({
            // where: { status: 'FEE_PAID' },
            limit: pageSize,
            offset,
        });

        // Collect unique student IDs from this page
        const studentIds = [...new Set(rows.map((r: any) => r.student_id))];

        // Batch-fetch students (first_name, middle_name, last_name)
        const students = await models.Student.findAll({
            where: { id: studentIds },
            attributes: ['id', 'first_name', 'middle_name', 'last_name', 'student_id'],
        });
        const studentMap = new Map(students.map((s: any) => [s.id, s]));

        // Enrich each readmission record with student info
        const data = rows.map((r: any) => {
            const record = r.toJSON();
            const student = studentMap.get(record.student_id);
            return {
                ...record,
                student: student
                    ? {
                        id: student.id,
                        student_id: student.student_id,
                        first_name: student.first_name,
                        middle_name: student.middle_name,
                        last_name: student.last_name,
                    }
                    : null,
            };
        });

        return {
            total: count,
            page,
            pageSize,
            data,
        };
    }

    // re-admissin by student
    async getReadmissionDetails(studentId: number, tenant: string) {
        const models = getTenantModels(tenant);
        // 1️⃣ Fetch student
        const student: any = await models.Student.findOne({
            where: { id: studentId }
        });

        if (!student) {
            return ({ message: "Student not found" });
        }

        const personalDetails: any = await models.StudentPersonalDetails.findOne({
            where: { student_id: studentId }
        });

        let programName = null;
        let departmentName = null;
        let className = null;

        if (personalDetails) {
            if (personalDetails.program_id) {
                const program = await models.Program.findOne({
                    where: { id: personalDetails.program_id }
                });
                if (program) {
                    programName = program.name;
                    if (program.department_id) {
                        const department = await models.Department.findOne({
                            where: { id: program.department_id }
                        });
                        if (department) {
                            departmentName = department.name;
                        }
                    }
                }
            }
            if (personalDetails.class_id) {
                const studentClass = await models.Class.findOne({
                    where: { id: personalDetails.class_id }
                });
                if (studentClass) {
                    className = studentClass.name;
                }
            }
        }

        // 2️⃣ Fetch readmission request
        const request = await models.ReadmissionRequests.findOne({
            where: { student_id: studentId, status: "PENDING" }
        });

        if (!request) {
            return ({
                message: "No pending readmission request found"
            });
        }

        // 3️⃣ Fetch target class + semester
        const toClass = await models.Class.findOne({
            where: { id: request.to_class_id }
        });

        const toSemester = await models.Semester.findOne({
            where: { id: request.to_semester_id }
        });

        const programSubjects = await models.ProgramSubject.findAll({
            where: { semester_id: toSemester.id },
            attributes: ['subject_id', "semester_id", "course_type_id", "is_core", "is_active"],
            raw: true,
        });
        // console.log("programSubjects ====>", programSubjects);

        const subjectIds = programSubjects?.map(item => item.subject_id);
        const subjects = await models.Subject.findAll({
            where: {
                id: subjectIds,
            },
        });
        const subjectData = subjects.map(subject => {
            // console.log("Subject ===>", subject);
            const ps = programSubjects.find(
                item => item.subject_id === subject.id
            );

            return {
                ...subject.toJSON(),
                is_core: ps?.is_core,
                semester_id: ps?.semester_id,
                course_type_id: ps?.course_type_id,
                is_active: ps?.is_active,
            };
        });

        // 4️⃣ Build response object
        const response = {
            student: {
                id: student.id,
                student_id: student.student_id,
                name: `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`,
                roll_no: student.roll_number,
                program: programName,
                department: departmentName,
                current_class: className,
                current_semester: student.semester_id
            },

            readmission_request: {
                id: request.id,
                status: request.status,
                academic_year_id: request.academic_year_id,

                from_class_id: request.from_class_id,
                to_class_id: request.to_class_id,
                from_semester_id: request.from_semester_id,
                to_semester_id: request.to_semester_id,

                to_class_name: toClass?.name,
                to_semester_name: toSemester?.name,

                fee_required: request.fee_required,
                fee_amount: request.fee_amount,
                fee_paid: request.fee_paid,
                student_confirmed: request.student_confirmed,
                remarks: request.remarks,
                created_at: request.created_at,
                updated_at: request.updated_at
            },
            subjects: subjectData
        };
        return response;
    }

    // student confirm re admission
    async confirmReadmissionRequest(studentId: number, tenantName: string, subjects?: any[], user?: any) {
        const tenant = await tenantsService.getTenantByName(tenantName);
        const models = getTenantModels(tenantName);

        // 1️⃣ Fetch student
        const student = await models.Student.findOne({ where: { id: studentId } });
        if (!student) {
            return { message: "Student not found" };
        }

        // 2️⃣ Fetch pending readmission request
        const request = await models.ReadmissionRequests.findOne({
            where: {
                student_id: studentId,
                status: "PENDING"
            }
        });

        if (!request) {
            return { message: "No pending readmission request found" };
        }

        // 3️⃣ Fetch rules
        const rules = await rulesService.getReadmissionRules(
            tenant.university_id,
            tenant.id
        );
        const feeHeadId = rules.readmission_fee_head_id;

        if (request.fee_required && !feeHeadId) {
            throw new Error("Readmission fee head ID is not configured for this tenant");
        }

        // 9️⃣ Fetch personal details
        const personalDetails = await models.StudentPersonalDetails.findOne({
            where: { student_id: student.id }
        });

        // 4️⃣ If student confirmation is NOT required
        if (!rules.readmission_student_confirmation_required) {
            if (request.fee_required && rules.readmission_fee_before_approval) {
                await this.assignReadmissionFee(personalDetails, request, tenantName, feeHeadId);
            }
            return { message: "Student confirmation not required" };
        }

        // 5️⃣ Prevent double confirmation
        if (request.student_confirmed) {
            return { message: "Readmission request already confirmed by student" };
        }

        // 6️⃣ Determine new status
        let newStatus = "PENDING";
        if (request.fee_required && !request.fee_paid) {
            if (rules.readmission_fee_before_approval) {
                newStatus = "AWAITING_FEE_PAYMENT";
            }
        }

        // 7️⃣ Update request
        await request.update({
            student_confirmed: true,
            student_confirmed_at: new Date(),
            status: normalizeEnum(
                newStatus,
                ["PENDING", "AWAITING_FEE_PAYMENT", "APPROVED", "REJECTED", "COMPLETED"] as const,
                "PENDING"
            )
        });

        // 8️⃣ Assign fee (if required BEFORE approval)
        if (request.fee_required && rules.readmission_fee_before_approval) {
            await this.assignReadmissionFee(personalDetails, request, tenantName, feeHeadId);
        }

        // 🔟 Fetch class → correct semester_id + year_number
        const classInfo = await models.Class.findOne({
            where: { id: personalDetails.class_id }
        });

        // 1️⃣1️⃣ Insert academic status history
        await models.StudentAcademicStatusHistory.create({
            student_id: student.id,
            program_id: personalDetails.program_id,
            class_id: personalDetails.class_id,
            semester_id: classInfo.semester_id, // ✔ Correct semester
            academic_year_id: request.academic_year_id,
            status: normalizeEnum(
                "RE_ADMISSION_CONFIRMED",
                [
                    "ADMITTED", "PROMOTED_FYUGP", "PROMOTED", "RE_ADMITTED",
                    "EXITED_FYUGP", "RE_ADMISSION_PENDING", "RE_ADMISSION_CONFIRMED",
                    "NOT_PROMOTED", "COMPLETED"
                ] as const,
                "RE_ADMISSION_PENDING"
            ),
            remarks: "Student confirmed readmission request"
        });
        console.log("create StudentAcademicStatusHistory end");

        // 1️⃣2️⃣ Store subjects in student_subjects table
        if (subjects && Array.isArray(subjects) && subjects.length > 0) {
            const targetSemesterId = request.to_semester_id;
            const userId = student.user_id;
            const dbStudentId = student.id;

            if (userId && targetSemesterId) {
                // Delete existing enrollments for this user + semester
                await models.StudentSubjects.destroy({
                    where: { user_id: userId, semester_id: targetSemesterId },
                });

                // Build rows to insert into student_subjects
                const rowsToInsert = subjects.map((ps: any) => ({
                    user_id: Number(userId),
                    student_id: Number(dbStudentId),
                    semester_id: Number(ps.semester_id || targetSemesterId),
                    subject_id: Number(ps.id || ps.subject_id),
                    course_type_id: Number(ps.course_type_id),
                    is_core: ps.is_core !== undefined ? Number(ps.is_core) : 1,
                    is_active: 1,
                    status: 'ENROLLED',
                    assigned_by: user?.id ? String(user.id) : String(dbStudentId),
                }));

                await models.StudentSubjects.bulkCreate(rowsToInsert as any);
            }
        }

        return { message: "Readmission request confirmed successfully" };
    }

    getYearForSemester(semesterId: number): number {
        if (semesterId === 1 || semesterId === 2) return 1;
        if (semesterId === 3 || semesterId === 4) return 2;
        if (semesterId === 5 || semesterId === 6) return 3;
        if (semesterId === 7 || semesterId === 8) return 4;
        throw new Error(`No year mapping for semester ${semesterId}`);
    }

    async assignReadmissionFee(personalDetails: StudentPersonalDetails, request, tenantName, feeHeadId) {
        const models = getTenantModels(tenantName);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        const assignment = await models.StudentFeeAssignment.create({
            student_id: personalDetails.student_id,
            academic_year_id: personalDetails.academic_year_id,
            fee_head_id: feeHeadId,
            amount: request.fee_amount,
            status: normalizeEnum("PENDING",
                ["PENDING", "PARTIAL", "PAID", ""] as const,
                "PENDING"
            ),
            due_date: dueDate
        });
        const paymentType = await models.PaymentType.findOne({ where: { fee_head_id: feeHeadId } });
        await models.StudentPayment.create({
            student_id: personalDetails.student_id,
            assignment_id: assignment.id,
            payment_type_id: paymentType.id,
            fee_head_id: feeHeadId,
            amount: request.fee_amount,
            due_date: dueDate,
            status: normalizeEnum("pending",
                ["pending", "paid", "partial", "overdue"] as const,
                "pending"
            ),
        });
    }

    // After payment Admin student reapprove
    async approveReadmissionRequest(readmissionRequestId, tenantName) {
        const models = getTenantModels(tenantName);
        const tenant = await tenantsService.getTenantByName(tenantName);

        const requestId = Number(readmissionRequestId);

        // 1️⃣ Fetch request (PENDING or AWAITING_FEE_PAYMENT)
        const request = await models.ReadmissionRequests.findOne({
            where: {
                id: requestId,
                status: {
                    [Op.in]: ["PENDING", "AWAITING_FEE_PAYMENT", "FEE_PAID"]
                }
            }
        });

        if (!request) {
            return { message: "Pending readmission request not found" };
        }

        // 2️⃣ Fetch student + personal details
        const student = await models.Student.findOne({
            where: { id: request.student_id }
        });

        if (!student) {
            return { message: "Student not found" };
        }

        const personalDetails = await models.StudentPersonalDetails.findOne({
            where: { student_id: student.id }
        });

        if (!personalDetails) {
            return { message: "Student personal details not found" };
        }

        // console.log('inside approveReadmissionRequest --- fetching rules');

        // 3️⃣ Load rules
        const rules = await rulesService.getReadmissionRules(
            tenant.university_id,
            tenant.id
        );

        // 4️⃣ If confirmation required → block if not confirmed
        if (rules.readmission_student_confirmation_required) {
            if (!request.student_confirmed) {
                return { message: "Student has not confirmed the readmission request" };
            }
        }

        // 5️⃣ If fee-before-approval → block if unpaid
        if (request.fee_required && rules.readmission_fee_before_approval) {
            if (!request.fee_paid) {
                return { message: "Fee payment required before approval" };
            }
        }

        const feeHeadId = rules.readmission_fee_head_id;

        // 6️⃣ Fee-after-approval → assign fee now
        if (request.fee_required && !rules.readmission_fee_before_approval) {
            await this.assignReadmissionFee(
                personalDetails,
                request,
                tenantName,
                feeHeadId
            );
        }

        // 7️⃣ Approve request
        await request.update({
            status: "APPROVED"
        });

        // 8️⃣ Trigger promotion engine (READMISSION)
        await promotionEngine.promoteStudent(student, personalDetails, {
            reason: "READMISSION",
            academic_year_id: request.academic_year_id,
            tenantId: tenantName
        });

        // Update student personal details to the next class
        await personalDetails.update({
            class_id: request.to_class_id
        });

        // 9️⃣ Log academic status history (RE_ADMITTED)
        await models.StudentAcademicStatusHistory.create({
            student_id: student.id,
            program_id: personalDetails.program_id,
            class_id: request.to_class_id,
            semester_id: request.to_semester_id,
            academic_year_id: request.academic_year_id,
            status: "RE_ADMITTED",
            remarks: "Admin approved readmission request"
        });

        await request.update({
            status: "COMPLETED"
        });

        return {
            message: "Readmission request approved successfully",
            student_promoted_to: {
                class_id: request.to_class_id,
                semester_id: request.to_semester_id
            }
        };
    }
}