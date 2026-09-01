import { getTenantModels } from "../models";

export const promotionEngine = {

  async promoteStudent(student, personalDetails, ctx) {
    const models = getTenantModels(ctx.tenantId);

    // 3️⃣ Fetch current class → authoritative semester + year
    const currentClass = await models.Class.findOne({
      where: { id: personalDetails.class_id }
    });

    if (!currentClass) {
      throw new Error("Student class not found");
    }

    const currentSemester = await models.Semester.findOne({
      where: { id: currentClass.semester_id }
    });

    // 4️⃣ Fetch program rules
    const programRules = await models.ProgramRules.findOne({
      where: { program_id: personalDetails.program_id }
    });

    if (!programRules) {
      throw new Error("Program rules not configured");
    }

    const rules = JSON.parse(programRules.rules_json);

    // 5️⃣ FYUGP or Basic?
     if (rules.fyugp_enabled) {
       return this.promoteFyugp(student, personalDetails, currentClass, currentSemester, rules, ctx);
     }

    return this.promoteBasic(student, personalDetails, currentClass, currentSemester, rules, ctx);
  },

  /**
   * BASIC PROMOTION (Non‑FYUGP)
   */
  async promoteBasic(student, personalDetails, currentClass, currentSemester, rules, ctx) {
    const models = getTenantModels(ctx.tenantId);  
    const map = rules.promotion_map?.[currentSemester.semester_number];
;
    if (!map || !map.next_semester_id) {
      // No mapping → program completed
      await models.StudentAcademicStatusHistory.create({
         student_id: student.id,
         program_id: personalDetails.program_id,
         class_id: personalDetails.class_id,
         semester_id: currentClass.semester_id,
         academic_year_id: ctx.academic_year_id,
         status: "COMPLETED",
         remarks: "No promotion mapping configured"
      });
      return;
    }

    const nextSemesterNumber = map.next_semester_id;

    const nextSemester = await models.Semester.findOne({
      where: { semester_number: nextSemesterNumber, 
        program_id:  personalDetails.program_id}
    });

    // 1️⃣ Find next class (program + semester)
    const nextClass = await models.Class.findOne({
      where: {
        program_id: personalDetails.program_id,
        semester_id: nextSemester.id,
        section: currentClass.section,
        batch_year: currentClass.batch_year
      }
    });

    if (!nextClass) {
      throw new Error(`Next class not found for semester ${nextSemesterNumber}`);
    }

    // 2️⃣ Update student table
    await student.update({
       semester_id: nextSemester.id
    });

    // 3️⃣ Update personal details (authoritative)
    await personalDetails.update({
       class_id: nextClass.id,
       academic_year_id: ctx.academic_year_id
    });

    // 4️⃣ Assign subjects
    await this.assignSubjects(student, personalDetails.program_id, nextSemester.id, ctx);

    // 5️⃣ Log history
    await models.StudentAcademicStatusHistory.create({
       student_id: student.id,
       program_id: personalDetails.program_id,
       class_id: nextClass.id,
       semester_id: nextSemester.id,
       academic_year_id: ctx.academic_year_id,
       status: "PROMOTED",
       remarks: `Promoted from Sem ${currentSemester.semester_number} → Sem ${nextSemesterNumber}`
    });
  },

  /**
   * FYUGP PROMOTION (Simple, No Multi‑Track)
   */
  async promoteFyugp(student, personalDetails, currentClass, currentSemester, rules, ctx) {
    const models = getTenantModels(ctx.tenantId);

    const currentYear = currentClass.year_number;
    const minCredits = rules.fyugp_min_credits_per_year?.[String(currentYear)] ?? 0;

    // 1️⃣ Credit check
    if ((student.total_credits_earned ?? 0) < minCredits) {
      await models.StudentAcademicStatusHistory.create({
        student_id: student.id,
        program_id: personalDetails.program_id,
        class_id: personalDetails.class_id,
        semester_id: currentClass.semester_id,
        academic_year_id: ctx.academic_year_id,
        status: "NOT_PROMOTED",
        remarks: `FYUGP: insufficient credits for year ${currentYear}`
      });
      return;
    }

    // 2️⃣ Exit check
    if (rules.fyugp_exit_years?.includes(currentYear)) {
      await models.StudentAcademicStatusHistory.create({
        student_id: student.id,
        program_id: personalDetails.program_id,
        class_id: personalDetails.class_id,
        semester_id: currentClass.semester_id,
        academic_year_id: ctx.academic_year_id,
        status: "EXITED_FYUGP",
        remarks: `FYUGP exit at year ${currentYear}`
      });
      return;
    }

    // 3️⃣ Semester mapping
    const map = rules.promotion_map?.[currentSemester.semester_number];

    if (!map || !map.next_semester_id) {
      await models.StudentAcademicStatusHistory.create({
        student_id: student.id,
        program_id: personalDetails.program_id,
        class_id: personalDetails.class_id,
        semester_id: currentSemester.id,
        academic_year_id: ctx.academic_year_id,
        status: "COMPLETED",
        remarks: "No promotion mapping configured (FYUGP)"
      });
      return;
    }

    const nextSemesterNumber = map.next_semester_id;

    const nextSemester = await models.Semester.findOne({
      where: { semester_number: nextSemesterNumber, 
        program_id:  personalDetails.program_id}
    });

    // 4️⃣ Find next class
    const nextClass = await models.Class.findOne({
      where: {
        program_id: personalDetails.program_id,
        semester_id: nextSemester.id,
        section: currentClass.section,
        batch_year: currentClass.batch_year
      }
    });

    if (!nextClass) {
      throw new Error(`Next class not found for semester ${nextSemesterNumber}`);
    }

    // 5️⃣ Update student
    await student.update({
      semester_id: nextSemester.id,
      current_year: currentYear + 1
    });

    // 6️⃣ Update personal details
    await personalDetails.update({
      class_id: nextClass.id,
      academic_year_id: ctx.academic_year_id
    });

    // 7️⃣ Assign subjects
    await this.assignSubjects(student, personalDetails.program_id, nextSemester.id, ctx);

    // 8️⃣ Log history
    await models.StudentAcademicStatusHistory.create({
      student_id: student.id,
      program_id: personalDetails.program_id,
      class_id: nextClass.id,
      semester_id: nextSemester.id,
      academic_year_id: ctx.academic_year_id,
      status: "PROMOTED_FYUGP",
      remarks: `Promoted to FYUGP year ${currentYear + 1}, sem ${nextSemester.semester_number}`
    });
  },

  /**
   * SUBJECT ASSIGNMENT
   */
  async assignSubjects(student, programId, semesterId, ctx) {
    const models = getTenantModels(ctx.tenantId);

    const subjects = await models.ProgramSubject.findAll({
      where: {
        program_id: programId,
        semester_id: semesterId,
        is_active: true
      }
    });

    if (!subjects.length) return;

    const rows = subjects.map(s => ({
      student_id: student.id,
      user_id: student.user_id,
      subject_id: s.subject_id,
      program_id: programId,
      semester_id: semesterId,
      course_type_id: s.course_type_id,
      academic_year_id: ctx.academic_year_id,
      is_core: s.is_core,
      status: 'ENROLLED'
    }));

    await models.StudentSubjects.bulkCreate(rows);
  }
};