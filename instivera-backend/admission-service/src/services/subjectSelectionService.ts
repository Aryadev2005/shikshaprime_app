import { tenantsService } from "@shared/tenants";
import { getMainModels, getTenantModels, sequelize } from "../models";
import { rulesService } from "@shared/rules";

export class SubjectSelectionService {
    async getProgramSelectionData(userId :number, tenant: string) {
        const models = getTenantModels(tenant);
        // 1. Load academic years (from tenant DB)
        const academicYears = await models.AcademicYear.findAll({
        where: { is_active: 1 },
        order: [["start_year", "DESC"]]
        });

        // 2. Load all active programs for this college
        const programs = await models.Program.findAll({
        order: [
            ["degree_type", "ASC"],
            ["program_type", "ASC"],
            ["name", "ASC"]
        ]
        });

        // 3. Group programs by degree_type → program_type
        const groupedPrograms = {};

        for (const p of programs) {
        if (!groupedPrograms[p.degree_type]) {
            groupedPrograms[p.degree_type] = {};
        }
        if (!groupedPrograms[p.degree_type][p.program_type]) {
            groupedPrograms[p.degree_type][p.program_type] = [];
        }

        groupedPrograms[p.degree_type][p.program_type].push({
            id: p.id,
            code: p.code,
            name: p.name,
            department_id: p.department_id,
            duration_years: p.duration_years,
            total_semesters: p.total_semesters
        });
        }

        return {
        academic_years: academicYears.map(y => ({
            id: y.id,
            name: y.name
        })),
        programs: groupedPrograms
        };
    }
    async getSubjectSelectionData(userId: number, tenantName: string) {
        const models = getTenantModels(tenantName);
        const mainModels = getMainModels();

        // 1️⃣ Convert tenantName → tenantId
        const tenant = await tenantsService.getTenantByName(tenantName);

        // 2️⃣ Fetch rules
        const academicFramework = await rulesService.getString(tenant.university_id, tenant.id, "academic_framework");
        const totalSemesters = await rulesService.getInt(tenant.university_id, tenant.id, "total_semesters");
        const multiExitEnabled = await rulesService.getBool(tenant.university_id, tenant.id, "multi_exit_enabled");

        // 3️⃣ Load application
        const application = await models.StudentApplications.findOne({
            where: { user_id: userId }
        });

        if (!application) {
            throw new Error("Application not found");
        }

        const programId = application.program_id;
        const programType = application.program_type;

        // 4️⃣ Check preview status
        const status = await models.StudentApplicationStatus.findOne({
            where: { application_id: application.id }
        });

        if (!status || status.preview_confirmed !== 1) {
            throw new Error("Preview must be confirmed before subject selection");
        }

        // 5️⃣ Load program departments (Major)
        const program = await models.Program.findOne({
            where: { id: programId }
        });

        const majorDepartment = await models.Department.findOne({
            where: { id: program.department_id }
        });

        // 6️⃣ Load all level‑2 departments (Minor + MDC)
        const allDepartments = await models.Department.findAll({
            where: { level: 2 }
        });

        const minorDepartments = allDepartments.filter(
            d => d.id !== program.department_id
        );

        const mdcDepartments = minorDepartments;

        // 7️⃣ Load course types for this program type
        const structureRows = await mainModels.ProgramCourseStructure.findAll({
            where: { program_type: programType }
        });

        const courseTypeIds = structureRows.map(s => s.course_type_id);

        const courseTypes = await mainModels.CourseType.findAll({
            where: { id: courseTypeIds }
        });

        // 8️⃣ Load academic papers mapped to this program
        const programSubjects = await models.ProgramSubject.findAll({
            where: { program_id: programId, is_active: 1 }
        });

        const subjectIds = programSubjects.map(ps => ps.subject_id);

        const subjects = await models.Subject.findAll({
            where: { id: subjectIds, is_active: 1 }
        });

        // Group papers by course_type
        const subjectsByCourseType = {};

        for (const ps of programSubjects) {
            if (!subjectsByCourseType[ps.course_type_id]) {
            subjectsByCourseType[ps.course_type_id] = [];
            }

            const subject = subjects.find(s => s.id === ps.subject_id);

            if (subject) {
            subjectsByCourseType[ps.course_type_id].push({
                id: subject.id,
                code: subject.code,
                name: subject.name,
                department_id: subject.department_id,
                credit_value: subject.credit_value,
                is_core: ps.is_core,
                semester_id: ps.semester_id
            });
            }
        }

        // 9️⃣ Load previously selected subjects
        const studentSubjects = await models.StudentSubjects.findAll({
            where: { user_id: userId, is_active: 1 }
        });

        // 🔟 Final response
        return {
            program: {
            id: application.program_id,
            degree_type: application.degree_type,
            program_type: application.program_type
            },

            major_department: {
                id: majorDepartment.id,
                code: majorDepartment.code,
                name: majorDepartment.name
            },

            minor_departments: minorDepartments.map(d => ({
                id: d.id,
                code: d.code,
                name: d.name
            })),

            mdc_departments: mdcDepartments.map(d => ({
            id: d.id,
            code: d.code,
            name: d.name
            })),

            course_types: courseTypes.map(ct => {
            const structure = structureRows.find(s => s.course_type_id === ct.id);

            return {
                id: ct.id,
                code: ct.code,
                name: ct.name,
                min_credits: structure?.min_credits || null,
                max_credits: structure?.max_credits || null,
                is_required: structure?.is_required,
                subjects: subjectsByCourseType[ct.id] || []
            };
            }),

            selected_subjects: studentSubjects.map(ss => ({
            subject_id: ss.subject_id,
            course_type_id: ss.course_type_id,
            semester_id: ss.semester_id
            })),

            workflow: {
            preview_confirmed: status.preview_confirmed === 1,
            subjects_selected: status.subjects_selected === 1,
            final_submitted: status.final_submitted === 1
            },

            // ⭐ RULES RETURNED TO FRONTEND
            rules: {
            academic_framework: academicFramework,
            total_semesters: totalSemesters,
            multi_exit_enabled: multiExitEnabled
            }
        };
    }

    async saveSubjectSelection({ userId, payload }, tenantName: string) {
        const models = getTenantModels(tenantName);
        const mainModels = getMainModels();
        const t = await models.sequelize.transaction();

        try {
            const {
            major_department_id,
            minor_department_id,
            mdc_department_id,
            selected_subjects
            } = payload;

            // 1️⃣ Convert tenantName → tenantId
            const tenant = await tenantsService.getTenantByName(tenantName);

            // 2️⃣ Fetch rules
            const academicFramework = await rulesService.getString(tenant.university_id, tenant.id, "academic_framework");
            const totalSemesters = await rulesService.getInt(tenant.university_id, tenant.id, "total_semesters");
            const multiExitEnabled = await rulesService.getBool(tenant.university_id, tenant.id, "multi_exit_enabled");

            // 3️⃣ Load application
            const application = await models.StudentApplications.findOne({
            where: { user_id: userId }
            });

            if (!application) {
            throw new Error("Application not found");
            }

            const programId = application.program_id;
            const programType = application.program_type;

            // 4️⃣ Validate preview confirmed
            const status = await models.StudentApplicationStatus.findOne({
            where: { application_id: application.id }
            });

            if (!status || status.preview_confirmed !== 1) {
            throw new Error("Preview must be confirmed before subject selection");
            }

            // 5️⃣ Validate major department
           const program = await models.Program.findOne({
                where: { id: programId }
            });

            const majorDepartment = await models.Department.findOne({
                where: { id: program.department_id }
            });

            if (!majorDepartment) {
            throw new Error("Invalid major department selected");
            }

            // 6️⃣ Rule: academic_framework → Minor/MDC logic
            if (academicFramework === "FYUGP") {
            if (!minor_department_id) throw new Error("Minor department is required for FYUGP");
            if (!mdc_department_id) throw new Error("MDC department is required for FYUGP");
            }

            if (academicFramework === "CBCS") {
            // CBCS does NOT require Minor/MDC
            if (minor_department_id || mdc_department_id) {
                throw new Error("Minor/MDC not allowed under CBCS framework");
            }
            }

            // 7️⃣ Validate Minor/MDC not same as Major
            if (minor_department_id === major_department_id) {
            throw new Error("Minor cannot be same as Major");
            }

            if (mdc_department_id === major_department_id) {
            throw new Error("MDC cannot be same as Major");
            }

            // 8️⃣ Load course structure rules
            const structureRows = await mainModels.ProgramCourseStructure.findAll({
            where: { program_type: programType }
            });

            const courseTypeRules = {};
            for (const row of structureRows) {
            courseTypeRules[row.course_type_id] = {
                min_credits: row.min_credits,
                max_credits: row.max_credits,
                is_required: row.is_required
            };
            }

            // 9️⃣ Load program subjects
            const programSubjects = await models.ProgramSubject.findAll({
            where: { program_id: programId, is_active: 1 }
            });

            const validSubjectIds = programSubjects.map(ps => ps.subject_id);

            // 🔟 Validate selected subjects exist in program
            for (const ss of selected_subjects) {
            if (!validSubjectIds.includes(ss.subject_id)) {
                throw new Error(`Invalid subject selected: ${ss.subject_id}`);
            }
            }

            // 1️⃣1️⃣ Rule: total_semesters → validate semester_id
            for (const ss of selected_subjects) {
            if (ss.semester_id < 1 || ss.semester_id > totalSemesters) {
                throw new Error(`Invalid semester selected: ${ss.semester_id}`);
            }
            }

            // 1️⃣2️⃣ Rule: multi_exit_enabled
            if (!multiExitEnabled) {
            const exitYearSubjects = selected_subjects.filter(s => s.semester_id > 6);
            if (exitYearSubjects.length > 0) {
                throw new Error("Exit-year subjects not allowed when multi-exit is disabled");
            }
            }

            // 1️⃣3️⃣ Validate credit limits per course type
            const subjects = await models.Subject.findAll({
            where: { id: validSubjectIds }
            });

            const creditMap = {};
            for (const ss of selected_subjects) {
            const subject = subjects.find(s => s.id === ss.subject_id);
            const ct = ss.course_type_id;

            if (!creditMap[ct]) creditMap[ct] = 0;
            creditMap[ct] += subject.credit_value;
            }

            for (const ct of Object.keys(courseTypeRules)) {
            const rule = courseTypeRules[ct];
            const totalCredits = creditMap[ct] || 0;

            if (rule.is_required && totalCredits === 0) {
                throw new Error(`Required course type missing: ${ct}`);
            }

            if (rule.min_credits && totalCredits < rule.min_credits) {
                throw new Error(
                `Course type ${ct} requires minimum ${rule.min_credits} credits`
                );
            }

            if (rule.max_credits && totalCredits > rule.max_credits) {
                throw new Error(
                `Course type ${ct} exceeds maximum ${rule.max_credits} credits`
                );
            }
            }

            // 1️⃣4️⃣ Delete old selections
            await models.StudentSubjects.destroy({
            where: { user_id: userId },
            transaction: t
            });

            // 1️⃣5️⃣ Save new selections
            const rowsToInsert = selected_subjects.map(ss => ({
            user_id: userId,
            subject_id: ss.subject_id,
            course_type_id: ss.course_type_id,
            semester_id: ss.semester_id,
            is_active: 1
            }));

            await models.StudentSubjects.bulkCreate(rowsToInsert, { transaction: t });

            // 1️⃣6️⃣ Update workflow
            await models.StudentApplicationStatus.update(
            { subjects_selected: 1 },
            { where: { application_id: application.id }, transaction: t }
            );

            await t.commit();

            return { success: true };

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
    async getClassForSemester(
        programId: number,
        semesterId: number,
        tenantId: string
        ) {
        const models = getTenantModels(tenantId);

        const cls = await models.Class.findOne({
            where: {
            program_id: programId,
            semester_id: semesterId
            }
        });

        if (!cls) {
            throw new Error(
            `No class found for program ${programId} and semester ${semesterId}`
            );
        }

        return cls.id;
    }
 
}