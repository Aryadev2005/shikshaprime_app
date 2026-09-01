import { getTenantModels } from "../models";
import { AppError } from "../utils/appError";

// Maps each subject block in the payload to its column keys
const SUBJECT_BLOCKS = [
  {
    nameKey: "Major 1",
    intKey: "Major 1 Int",
    extKey: "Major 1 Ext",
    practicalKey: "Major 1 Practical",
    vivaKey: "Major 1 Viva",
    totalKey: "Major 1 Total",
  },
  {
    nameKey: "Minor 1",
    intKey: "MN1 Int",
    extKey: "MN1 Ext",
    practicalKey: "M1 Practical_1",
    vivaKey: "M1 Viva_1",
    totalKey: "MN1 Total",
  },
  {
    nameKey: "Minor 2",
    intKey: "MN2 Int",
    extKey: "MN2 Ext",
    practicalKey: "M2 Practical",
    vivaKey: "M2 Viva",
    totalKey: "MN2 Total",
  },
  {
    nameKey: "Minor 3",
    intKey: "MN3 Int",
    extKey: "MN3 Ext",
    practicalKey: "MN3 Practical",
    vivaKey: "MN3 Viva",
    totalKey: "MN3 Total",
  },
  {
    nameKey: "Minor 4",
    intKey: "MN4 Int",
    extKey: "MN4 Ext",
    practicalKey: "MN4 Practical",
    vivaKey: "MN4 Viva",
    totalKey: "MN4 Total",
  },
  {
    nameKey: "Minor 5",
    intKey: "MN5 Int",
    extKey: "MN5 Ext",
    practicalKey: "MN5 Practical",
    vivaKey: "MN5 Viva",
    totalKey: "MN5 Total",
  },
  {
    nameKey: "Minor 6",
    intKey: "MN6 Int",
    extKey: "MN6 Ext",
    practicalKey: "MN6 Practical",
    vivaKey: "MN6 Viva",
    totalKey: "MN6 Total",
  },
];

export class ResultService {
  async studentResultUpload(body: any[], tenant: string, publishedBy?: number) {
    const models = getTenantModels(tenant);

    // Resolve user ID for published_by column
    let userIdToSave = publishedBy;

    if (!userIdToSave && Array.isArray(body)) {
      for (const row of body) {
        if (row["published_by"] || row["user_id"] || row["user_code"]) {
          const parsed = Number(row["published_by"] || row["user_id"] || row["user_code"]);
          if (!isNaN(parsed) && parsed > 0) {
            userIdToSave = parsed;
            break;
          }
        }
      }
    }
    // console.log("userIdToSave \\\\", userIdToSave);
    if (!userIdToSave) {
      const defaultUser = await models.User.findOne({ attributes: ["id"], raw: true });
      if (defaultUser) {
        userIdToSave = (defaultUser as any).id;
      } else {
        userIdToSave = null;
      }
    }

    return await models.sequelize.transaction(async (transaction) => {
      const results: any[] = [];
      const publicationPairs = new Map<string, { semester_id: number; program_id: number }>();

      for (const row of body) {
        const university_registration_number: string = row["university_registration_number"];
        const resultStatus: "PASS" | "FAIL" = row["Result"] === "PASS" ? "PASS" : "FAIL";

        if (!university_registration_number) {
          throw new AppError("university_registration_number is required", 400);
        }

        // ── 1. Verify student exists & get student_id + semester_id ───────────
        const student = await models.Student.findOne({
          where: { university_registration_number },
          attributes: ["id", "semester_id"],
          raw: true,
          transaction,
        });

        if (!student) {
          throw new AppError(
            `Student with university_registration_number '${university_registration_number}' not found`,
            404
          );
        }

        const studentId = (student as any).id as number;
        const studentSemesterId = (student as any).semester_id as number;

        // ── 2. Resolve program_id from the student's existing semester ────────
        const studentSemester = await models.Semester.findOne({
          where: { id: studentSemesterId },
          attributes: ["id", "program_id"],
          raw: true,
          transaction,
        });

        if (!studentSemester) {
          throw new AppError(`Semester (id: ${studentSemesterId}) not found`, 404);
        }

        const programId = (studentSemester as any).program_id as number;

        // ── 3a. Resolve semesterId using payload "Semester" number + program_id ─
        let semesterId: number;
        if (row["Semester"] != null) {
          const semesterByNumber = await models.Semester.findOne({
            where: { program_id: programId, semester_number: Number(row["Semester"]) },
            attributes: ["id"],
            raw: true,
            transaction,
          });
          if (!semesterByNumber) {
            throw new AppError(
              `Semester number ${row["Semester"]} not found for program_id ${programId}`,
              404
            );
          }
          semesterId = (semesterByNumber as any).id as number;
        } else {
          // fallback: use the student's current semester_id
          semesterId = studentSemesterId;
        }

        // Record unique (semester_id, program_id) pair
        publicationPairs.set(`${semesterId}_${programId}`, {
          semester_id: semesterId,
          program_id: programId,
        });

        // ── 3. Resolve latest academic_year_id ────────────────────────────────
        const academicYear = await models.AcademicYear.findOne({
          order: [["id", "DESC"]],
          attributes: ["id"],
          raw: true,
          transaction,
        });

        if (!academicYear) {
          throw new AppError("No academic year found", 500);
        }

        const academicYearId = (academicYear as any).id as number;

        // ── 4. Upsert each subject row in student_subject_results ─────────────
        const subjectResultIds: number[] = [];
        const failedSubjectIds: number[] = [];

        for (const block of SUBJECT_BLOCKS) {
          const subjectName: string | null = row[block.nameKey] ?? null;

          // Skip if this subject slot is null (e.g. Minor 3 not taken)
          if (!subjectName) continue;

          // Resolve subject_id by name
          const subject = await models.Subject.findOne({
            where: { name: subjectName },
            attributes: ["id"],
            raw: true,
            transaction,
          });

          if (!subject) {
            console.warn(`Subject '${subjectName}' not found in subjects table, skipping.`);
            continue;
          }

          const subjectId = (subject as any).id as number;

          // Track failed subjects: total marks < 35
          const totalMark = row[block.totalKey];
          if (totalMark != null && Number(totalMark) < 35) {
            failedSubjectIds.push(subjectId);
          }

          const [subjectResult, created] = await models.StudentSubjectResults.findOrCreate({
            where: {
              student_id: studentId,
              subject_id: subjectId,
              semester_id: semesterId,
              program_id: programId,
              academic_year_id: academicYearId,
            },
            defaults: {
              internal_marks: row[block.intKey] ?? null,
              external_marks: row[block.extKey] ?? null,
              practical_marks: row[block.practicalKey] ?? null,
              viva_marks: row[block.vivaKey] ?? null,
              attendance_marks: row["Attendance"] ?? null,
              total_marks: row[block.totalKey] ?? null,
              grade: row["Grade"] ?? null,
              grade_point: row["Total Grade Point"] ?? null,
              credit_value: row["Total Credit Value"] ?? null,
              credit_earned: row["Total Credit Earned"] ?? null,
              result_status: resultStatus,
              exam_type: "REGULAR",
              attempt_no: 1,
              is_finalized: 0,
            } as any,
            transaction,
          });

          if (!created) {
            await subjectResult.update(
              {
                internal_marks: row[block.intKey] ?? null,
                external_marks: row[block.extKey] ?? null,
                practical_marks: row[block.practicalKey] ?? null,
                viva_marks: row[block.vivaKey] ?? null,
                attendance_marks: row["Attendance"] ?? null,
                total_marks: row[block.totalKey] ?? null,
                grade: row["Grade"] ?? null,
                grade_point: row["Total Grade Point"] ?? null,
                credit_value: row["Total Credit Value"] ?? null,
                credit_earned: row["Total Credit Earned"] ?? null,
                result_status: resultStatus,
              },
              { transaction }
            );
          }

          subjectResultIds.push(subjectResult.id);
        }

        // ── 5. Upsert one semester_results row ────────────────────────────────
        const [semesterResult, semCreated] = await models.SemesterResults.findOrCreate({
          where: {
            student_id: studentId,
            semester_id: semesterId,
            program_id: programId,
            academic_year_id: academicYearId,
          },
          defaults: {
            sgpa: row["SGPA"] ?? null,
            cgpa: row["CGPA"] ?? null,
            total_credits_earned: row["Total Credit Earned"] ?? null,
            total_marks: row["Total Grade Point"] ?? null,
            result_status: resultStatus,
            failed_subjects_count: JSON.stringify(failedSubjectIds),
            is_finalized: 0,
          } as any,
          transaction,
        });

        if (!semCreated) {
          await semesterResult.update(
            {
              sgpa: row["SGPA"] ?? null,
              cgpa: row["CGPA"] ?? null,
              total_credits_earned: row["Total Credit Earned"] ?? null,
              total_marks: row["Total Grade Point"] ?? null,
              result_status: resultStatus,
              failed_subjects_count: JSON.stringify(failedSubjectIds),
            },
            { transaction }
          );
        }

        results.push({
          university_registration_number,
          student_id: studentId,
          semester_result_id: semesterResult.id,
          semester_result_created: semCreated,
          subject_result_ids: subjectResultIds,
        });
      }

      // ── 6. Ensure result_publications entry exists for each unique (semester_id, program_id) pair ──
      for (const { semester_id, program_id } of publicationPairs.values()) {
        await models.ResultPublications.findOrCreate({
          where: {
            semester_id,
            program_id,
          },
          defaults: {
            semester_id,
            program_id,
            published_by: userIdToSave,
            published_at: new Date(),
            remarks: null,
          } as any,
          transaction,
        });
      }

      return results;
    });
  }

  async studentResult(studentId, tenant: string) {
    const models = getTenantModels(tenant);
    try {
      const studentSubjectData = await models.StudentSubjectResults.findAll({where: {student_id: studentId}});
      const studentSemesterData = await models.SemesterResults.findAll({where: {student_id: studentId}});

      return {
        studentSubjectData: studentSubjectData,
        studentSemesterData: studentSemesterData,
      }
      
    } catch(error) {
      console.log(error);
    }
  }

  async allStudentSubject(programId, studentId, tenant) {
    console.log("Student id, Program Id", programId, studentId)
    const models = getTenantModels(tenant);
    try {

      const studentSubResult = await models.StudentSubjectResults.findAll({where: {student_id: studentId, program_id: programId}});
      const semesterResult = await models.SemesterResults.findAll({where: {student_id: studentId, program_id: programId}});

      return {
        studentSubResult: studentSubResult,
        semesterResult: semesterResult
      }
    } catch(error) {
      console.log(error);
    }
  }
}
