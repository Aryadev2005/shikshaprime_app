import * as XLSX from "xlsx";
import { getTenantSequelize } from "../server";
import { getTenantModels } from "../models";
import { normalizeEnum } from "../utils/util";
import { StudentIdGenerator } from "../utils/studentIdGenerator";

interface BulkUploadInput {
  filePath: string;
  tenantId: number;
  academicYearId: number;
}

interface RowDTO {
  systemId: string;
  collegeRoll: string;
  studentName: string;
  dob: string;
  gender: string;
  appliedFor: string;      // UG / PG
  ugType: string;          // HONOURS / GENERAL
  subjectApplied: string;  // BACHELOR OF ARTS / SCIENCE etc.

  hsBoardName: string;
  hsRoll: string;
  hsYear: string;
  hsDivision: string;
  hsStream: string;

  hsSubjects: {
    name: string;
    fm: number;
    om: number;
  }[];

  assessedTotalFM: number;
  assessedTotalOM: number;

  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianQualification: string;

  familyMembers: number;
  religion: string;
  reservation: string;
  admittedCategory: string;
  annualIncome: number;
  aadharNo: string;
  mobileNo: string;
  bloodGroup: string;

  presentAddressRaw: string;
  permanentAddressRaw: string;

  nationality: string;
  mediumOfInstruction: string;

  aec: { sem1?: string; sem2?: string; sem3?: string };
  mdc: { sem1?: string; sem2?: string; sem3?: string };
  sec: { sem1?: string; sem3?: string };
  vac: { sem1?: string; sem2?: string };
}

export class BulkUploadService {
  async processBulkJson(data: any, tenant: string) {
    const models = getTenantModels(tenant);

    const {
      students = [],
      personal_details = [],
      student_address = [],
      student_guardians = [],
      tenthAcademic = [],
      twelfthAcademic = [],
      // student_document = [],  // API call not needed for now
      student_subjects = []
    } = data;

    // console.log("All student data=====>", data);

    // Validate: all required sections must have data
    const requiredSections: { key: string; arr: any[] }[] = [
      { key: "students", arr: students },
      { key: "personal_details", arr: personal_details },
      { key: "student_address", arr: student_address },
      { key: "student_guardians", arr: student_guardians },
      { key: "tenthAcademic", arr: tenthAcademic },
      { key: "twelfthAcademic", arr: twelfthAcademic },
      // { key: "student_document", arr: student_document },  // API call not needed for now
      { key: "student_subjects", arr: student_subjects }
    ];

    const emptySections = requiredSections
      .filter(({ arr }) => !Array.isArray(arr) || arr.length === 0)
      .map(({ key }) => key);

    if (emptySections.length > 0) {
      return {
        success: false,
        message: `The following required sections are empty or missing: ${emptySections.join(", ")}`,
        missing_sections: emptySections
      };
    }

    let successful = 0;
    let failed = 0;
    const errors: any[] = [];
    const createdStudentIds: number[] = [];

    const count = Math.max(
      students.length,
      personal_details.length,
      student_address.length,
      student_guardians.length,
      tenthAcademic.length,
      twelfthAcademic.length,
      // student_document.length,  // API call not needed for now
      student_subjects.length
    );
    for (let i = 0; i < count; i++) {

      // Generate application_id
      // let maxId = await models.StudentPreRegistration.max('id', { transaction: t }) as number | null;
      // if (typeof maxId !== 'number' || isNaN(maxId)) {
      //   maxId = 0;
      // }
      // const nextId = maxId + 1;
      // const application_id = `APP${nextId.toString().padStart(6, '0')}`;

      try {
        await models.sequelize.transaction(async (t) => {
          const studentPayload = students[i] || {};

          // 1. User
          const email = studentPayload.email_address || `student_${Date.now()}_${i}@example.com`;
          const user = await models.User.create({
            username: email,
            email: email,
            password_hash: "password@1234", // Placeholder hash
            first_name: studentPayload.first_name || "",
            last_name: studentPayload.last_name || "",
            role: "student",
            user_type: "student",
            is_active: 1
          }, { transaction: t });

          const userId = user.user_id;
          // 3. Generate a unique student_id
          const generatedStudentId = await StudentIdGenerator.generateStudentId(
            "INS",
            models.Student
          );
          // 2. Student
          const student = await models.Student.create(
            {
              user_id: userId,
              student_id: generatedStudentId,
              semester_id: 1,

              // Base mapping using the provided payload format
              application_id: studentPayload.application_id || `APP${Date.now()}${i}`,
              // application_id: application_id,
              first_name: studentPayload.first_name || "",
              middle_name: studentPayload.middle_name || null,
              last_name: studentPayload.last_name || "",
              gender: studentPayload.gender ? studentPayload.gender.toUpperCase() : "",
              dob: studentPayload.dob ? new Date(studentPayload.dob) : new Date(),
              nationality: studentPayload.nationality || "",
              state: studentPayload.state || "",
              district: studentPayload.district || "",
              social_category: studentPayload.social_category ? studentPayload.social_category.toUpperCase() : "UNRESERVED",
              sub_catagory: studentPayload.sub_category,
              catagory_certificate_number: studentPayload.category_certificate_number,
              catagory_certificate_issue_authority: studentPayload.category_certificate_issue_authority,
              catagory_certificate_issue_date: studentPayload.category_certificate_issue_date,
              mobile: studentPayload.mobile_number || "",
              email: studentPayload.email_address || "",
              hs_year_of_passing: studentPayload.hs_year_of_passing || "",
              hs_board: studentPayload.hs_board || "",
              hs_registration_number: studentPayload.hs_registration_number || "",
              hs_roll_number: studentPayload.hs_roll_number || "",
              hs_registration_certificate_path: studentPayload.hs_registration_certificate_path || "",
            },
            { transaction: t }
          );

          const studentId = student.id;
          createdStudentIds.push(studentId);

          // 3. Personal Details
          const pdPayload = personal_details[i];
          if (pdPayload) {
            await models.StudentPersonalDetails.create(
              {
                ...pdPayload,
                student_id: studentId,
                user_id: userId,
                academic_year_id: pdPayload.academic_years_id || pdPayload.academic_year_id,
                is_sports_person: pdPayload.sports_person == 1 || pdPayload.is_sports_person == 1,
                is_banglar_shikha_id_present: pdPayload.banglar_shikha_id_present == 1 || pdPayload.is_banglar_shikha_id_present == 1,
                is_physically_challenged: pdPayload.is_physically_challenged == 1
              },
              { transaction: t }
            );
          }

          // 4. Address
          const addressPayload = student_address[i];
          if (addressPayload) {
            const presentData = {
              student_id: studentId,
              user_id: userId,
              address_type: "PRESENT" as const,
              address_line: addressPayload.present_address_line,
              village: addressPayload.present_village,
              post_office: addressPayload.present_post_office,
              police_station: addressPayload.present_police_station,
              district: addressPayload.present_district,
              state: addressPayload.present_state,
              pincode: addressPayload.present_pin_code,
              municipality_block: addressPayload.present_municipality_block
            };

            const permanentData = {
              student_id: studentId,
              user_id: userId,
              address_type: "PERMANENT" as const,
              address_line: addressPayload.permanent_address_line,
              village: addressPayload.permanent_village,
              post_office: addressPayload.permanent_post_office,
              police_station: addressPayload.permanent_police_station,
              district: addressPayload.permanent_district,
              state: addressPayload.permanent_state,
              pincode: addressPayload.permanent_pin_code,
              municipality_block: addressPayload.permanent_municipality_block
            };

            await models.StudentAddress.bulkCreate([presentData, permanentData], { transaction: t });
          }


          // 5. Guardians — mirrors saveGuardianDetails pattern exactly
          const guardianPayload = student_guardians[i];
          if (guardianPayload) {
            const primaryGuardian = String(
              guardianPayload.is_primary_guardian || guardianPayload.primary_guardian || ""
            ).toUpperCase();

            const guardiansToInsert: any[] = [];

            // FATHER
            guardiansToInsert.push({
              user_id: userId,
              student_id: studentId,
              relationship: "FATHER",
              name: guardianPayload.father_name || null,
              qualification: guardianPayload.father_qualification || null,
              email: guardianPayload.father_email || null,
              mobile: guardianPayload.father_mobile || null,
              is_primary_guardian: primaryGuardian === "FATHER" ? 1 : 0
            });

            // MOTHER
            guardiansToInsert.push({
              user_id: userId,
              student_id: studentId,
              relationship: "MOTHER",
              name: guardianPayload.mother_name || null,
              qualification: guardianPayload.mother_qualification || null,
              email: guardianPayload.mother_email || null,
              mobile: guardianPayload.mother_mobile || null,
              is_primary_guardian: primaryGuardian === "MOTHER" ? 1 : 0
            });

            // GUARDIAN — only if guardian_name is present
            if (guardianPayload.guardian_name) {
              guardiansToInsert.push({
                user_id: userId,
                student_id: studentId,
                relationship: "GUARDIAN",
                name: guardianPayload.guardian_name,
                qualification: guardianPayload.guardian_qualification || null,
                email: guardianPayload.guardian_email || null,
                mobile: guardianPayload.guardian_mobile || null,
                is_primary_guardian: primaryGuardian === "GUARDIAN" ? 1 : 0
              });
            }
            console.log("Guardians to insert: ", guardiansToInsert);
            // Delete existing rows for this user (clean replace — matches saveGuardianDetails)
            await models.StudentGuardians.destroy({
              where: { user_id: userId },
              transaction: t
            });

            await models.StudentGuardians.bulkCreate(guardiansToInsert, { transaction: t });
          }

          // 6. 10th Academic (matches saveSecondaryResult pattern)
          const tenthPayload = tenthAcademic[i];
          if (tenthPayload) {
            const board_name = tenthPayload.board_name || tenthPayload["10th_board_name"];
            const year_of_passing = tenthPayload.year_of_passing || tenthPayload["10th_year_of_passing"];
            const division = tenthPayload.division || tenthPayload["10th_division_grade"];
            const stream = tenthPayload.stream;
            const total_full_marks = tenthPayload.total_full_marks ? Number(tenthPayload.total_full_marks) : null;
            const total_obtained_marks = tenthPayload.total_obtained_marks ? Number(tenthPayload.total_obtained_marks) : null;
            const percentage = tenthPayload.percentage ? Number(tenthPayload.percentage) : null;

            let subjects: any[] = [];
            if (Array.isArray(tenthPayload.subjects)) {
              subjects = tenthPayload.subjects;
            } else {
              for (let j = 1; j <= 10; j++) {
                if (tenthPayload[`10th_subject_${j}`]) {
                  subjects.push({
                    subject_name: tenthPayload[`10th_subject_${j}`],
                    full_marks: tenthPayload[`10th_full_mark_${j}`],
                    obtained_marks: tenthPayload[`10th_obtained_mark_${j}`]
                  });
                }
              }
            }

            const rowsToInsert: any[] = [];
            subjects.forEach((sub: any) => {
              rowsToInsert.push({
                user_id: userId,
                student_id: studentId,
                exam_name: "10TH",
                board_name,
                year_of_passing,
                division,
                // stream: stream || null,
                subject_name: sub.subject_name,
                full_marks: sub.full_marks ? Number(sub.full_marks) : null,
                obtained_marks: sub.obtained_marks ? Number(sub.obtained_marks) : null,
                // total_full_marks,
                // total_obtained_marks,
                // percentage
              });
            });

            if (rowsToInsert.length > 0) {
              await models.StudentAcademicHistory.bulkCreate(rowsToInsert, { transaction: t });
            }
          }

          // 7. 12th Academic (matches saveHigherSecondaryResult pattern)
          const twelfthPayload = twelfthAcademic[i];
          if (twelfthPayload) {
            const board_name = twelfthPayload.board_name || twelfthPayload["12th_board_name"];
            const year_of_passing = twelfthPayload.year_of_passing || twelfthPayload["12th_year_of_passing"];
            const division = twelfthPayload.division || twelfthPayload["12th_division_grade"];
            const stream = twelfthPayload.stream || twelfthPayload["12th_stream"];
            const total_full_marks = twelfthPayload.total_full_marks ? Number(twelfthPayload.total_full_marks) : null;
            const total_obtained_marks = twelfthPayload.total_obtained_marks ? Number(twelfthPayload.total_obtained_marks) : null;
            const percentage = twelfthPayload.percentage ? Number(twelfthPayload.percentage) : null;

            let subjects: any[] = [];
            if (Array.isArray(twelfthPayload.subjects)) {
              subjects = twelfthPayload.subjects;
            } else {
              for (let j = 1; j <= 10; j++) {
                if (twelfthPayload[`12th_subject_${j}`]) {
                  subjects.push({
                    subject_name: twelfthPayload[`12th_subject_${j}`],
                    full_marks: twelfthPayload[`12th_full_mark_${j}`],
                    obtained_marks: twelfthPayload[`12th_obtained_mark_${j}`]
                  });
                }
              }
            }

            const rowsToInsert: any[] = [];
            subjects.forEach((sub: any) => {
              rowsToInsert.push({
                user_id: userId,
                student_id: studentId,
                exam_name: "12TH",
                board_name,
                year_of_passing,
                division,
                stream: stream || null,
                subject_name: sub.subject_name,
                full_marks: sub.full_marks ? Number(sub.full_marks) : null,
                obtained_marks: sub.obtained_marks ? Number(sub.obtained_marks) : null,
                // total_full_marks,
                // total_obtained_marks,
                // percentage
              });
            });

            if (rowsToInsert.length > 0) {
              await models.StudentAcademicHistory.bulkCreate(rowsToInsert, { transaction: t });
            }
          }

          // 8. Documents — API call not needed for now
          // const docPayload = student_document[i];
          // if (docPayload) {
          //   const docMap: Record<string, string> = {
          //     identity_proof: "IDENTITY_PROOF",
          //     tenth_marksheet: "TENTH_MARKSHEET",
          //     twelfth_marksheet: "TWELFTH_MARKSHEET",
          //     age_proof: "AGE_PROOF",
          //     bank_proof: "BANK_PROOF",
          //     profile_photo: "PROFILE_PHOTO",
          //     signature: "SIGNATURE",
          //     age_certificate: "BIRTH_CERTIFICATE",
          //     caste_certificate: "CASTE_CERTIFICATE",
          //   };
          //   for (const [key, docPath] of Object.entries(docPayload)) {
          //     const docType = docMap[key];
          //     if (!docType || typeof docPath !== "string" || !docPath.trim()) continue;
          //     await models.StudentDocuments.destroy({
          //       where: { user_id: userId, document_type: docType },
          //       transaction: t
          //     });
          //     await models.StudentDocuments.create(
          //       {
          //         user_id: userId,
          //         student_id: null,
          //         document_type: docType as any,
          //         document_name: key,
          //         document_path: docPath,
          //         is_verified: false
          //       },
          //       { transaction: t }
          //     );
          //   }
          // }

          // 9. Student Subjects / Disciplines
          // disciplines_i/ii/iii = department_id values
          // → find all rows in subjects table WHERE department_id = each discipline value
          // → insert those subjects into student_subjects
          const subjectPayload = student_subjects[i];
          if (subjectPayload) {
            // Map each discipline to a { department_id, is_core } entry
            const disciplineList: { departmentId: number; isCore: number }[] = [];

            if (subjectPayload.disciplines_i) {
              disciplineList.push({ departmentId: Number(subjectPayload.disciplines_i), isCore: 1 }); // major
            }
            if (subjectPayload.disciplines_ii) {
              disciplineList.push({ departmentId: Number(subjectPayload.disciplines_ii), isCore: 0 }); // minor
            }
            if (subjectPayload.disciplines_iii) {
              disciplineList.push({ departmentId: Number(subjectPayload.disciplines_iii), isCore: 0 }); // minor
            }

            const studentSubjectsToInsert: any[] = [];

            for (const discipline of disciplineList) {
              // Find all subject rows in subjects table by department_id
              const subjectRows = await models.Subject.findAll({
                where: { department_id: discipline.departmentId, is_active: 1 },
                transaction: t,
              });

              for (const subjectRow of subjectRows) {
                // Take column data from subjects table and map to student_subjects
                studentSubjectsToInsert.push({
                  student_id: studentId,
                  user_id: userId,
                  subject_id: subjectRow.id,                          // from subjects.id
                  course_type_id: subjectRow.course_type_id,          // from subjects.course_type_id
                  semester_id: subjectPayload.semester_id || 1,       // from payload or default 1
                  is_core: discipline.isCore,
                  is_active: 1,
                  assigned_by: "BULK",
                  status: "ENROLLED",
                });
              }
            }

            if (studentSubjectsToInsert.length > 0) {
              await models.StudentSubjects.bulkCreate(studentSubjectsToInsert, { transaction: t });
            }
          }
          // 3. Generate a unique student_id

          // 10. Student Application Status — mark as fully admitted
          const now = new Date();
          const existingStatus = await models.StudentApplicationStatus.findOne({
            where: { user_id: userId },
            transaction: t
          });

          const statusData: any = {
            user_id: userId,
            application_id: studentPayload.application_id || `APP${Date.now()}${i}`,  // use student.id as the application reference
            preview_confirmed: 1,
            preview_confirmed_at: now,
            subjects_selected: 1,
            subjects_selected_at: now,
            final_submitted: 1,
            final_submitted_at: now,
            status: "ADMITTED"
          };

          if (existingStatus) {
            await existingStatus.update(statusData, { transaction: t });
          } else {
            await models.StudentApplicationStatus.create(statusData, { transaction: t });
          }
        });
        successful++;
      } catch (err: any) {
        failed++;
        console.error("Error creating student record for index", i, err);
        errors.push({
          index: i,
          message: err.message
        });
      }
    }

    return {
      success: failed === 0,
      message: failed === 0
        ? `All ${successful} record(s) saved successfully.`
        : `${successful} record(s) saved successfully, ${failed} record(s) failed.`,
      total_records: count,
      successful,
      failed,
      errors,
      created_student_ids: createdStudentIds
    };
  }

  async processExcel(input: BulkUploadInput, tenant: string) {
    const workbook = XLSX.readFile(input.filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const models = getTenantModels(tenant);

    let successful = 0;
    let failed = 0;
    const errors: any[] = [];
    const createdStudentIds: number[] = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];

      try {
        const dto = this.mapExcelRowToDTO(raw);

        await models.sequelize.transaction(async (t) => {
          // 1️⃣ Resolve program
          const program = await this.resolveProgramFromRow(dto, models.Program);
          if (!program) {
            throw new Error(
              `Program not found for SUBJECT APPLIED="${dto.subjectApplied}", UG TYPE="${dto.ugType}", STREAM="${dto.hsStream}"`
            );
          }

          // 2️⃣ Create student
          const student = await models.Student.create(
            {
              //student_name: dto.studentName,
              dob: this.parseExcelDate(dto.dob),
              //gender: dto.gender,
              mobile: dto.mobileNo,
              email: dto.guardianEmail || null,
              //caste: dto.reservation,
              //admitted_category: dto.admittedCategory,
              nationality: dto.nationality,
              //medium_of_instruction: dto.mediumOfInstruction,
              //annual_income: dto.annualIncome,
              //aadhar_no: dto.aadharNo
            },
            { transaction: t }
          );

          createdStudentIds.push(student.id);

          await models.StudentPersonalDetails.create(
            {
              user_id: null,                 // bulk upload has no user_id
              student_id: student.id,
              academic_year_id: input.academicYearId,
              program_id: program.id,
              aadhaar_number: dto.aadharNo,
              marital_status: "SINGLE",      // Excel does not provide this
              blood_group: normalizeEnum(dto.bloodGroup,
                ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const,
                "B+"
              ) || null,
              mother_tongue: "",             // Excel does not provide this
              religion: dto.religion,
              identity_proof_type: "AADHAAR",
              identity_proof_number: dto.aadharNo,
              is_physically_challenged: false,
              physical_disability_type: null,
              is_sports_person: false,
              //is_banglar_shikha_id_present: dto.banglarShikshaId ? 1 : 0,
              //banglar_shikha_id: dto.banglarShikshaId || null,
              nearest_railway_station: null,
              academic_bank_credit_id: null
            },
            { transaction: t }
          );

          // 3️⃣ Academic history
          await models.StudentAcademicHistory.create(
            {
              student_id: student.id,
              exam_name: "HIGHER SECONDARY",
              board_name: dto.hsBoardName,
              //roll_no: dto.hsRoll,
              year_of_passing: dto.hsYear,
              division: dto.hsDivision,
              stream: normalizeEnum(dto.hsStream,
                ["ARTS", "COMMERCE", "SCIENCE"] as const,
                "ARTS"
              ),
              total_full_marks: dto.assessedTotalFM,
              total_obtained_marks: dto.assessedTotalOM
            },
            { transaction: t }
          );

          // 4️⃣ Addresses
          const present = this.parseAddress(dto.presentAddressRaw);
          const permanent = this.parseAddress(dto.permanentAddressRaw);

          await models.StudentAddress.bulkCreate(
            [
              {
                student_id: student.id,
                address_type: "PRESENT",
                address_line: present.address,
                state: present.state,
                district: present.district,
                post_office: present.po,
                police_station: present.ps,
                pincode: present.pincode
              },
              {
                student_id: student.id,
                address_type: "PERMANENT",
                address_line: permanent.address,
                state: permanent.state,
                district: permanent.district,
                post_office: permanent.po,
                police_station: permanent.ps,
                pincode: permanent.pincode
              }
            ],
            { transaction: t }
          );

          // 5️⃣ Bank details
          if (raw["BANK ACCOUNT NO"] || raw["IFSC"]) {
            await models.StudentBankDetails.create(
              {
                student_id: student.id,
                account_holder_name: dto.studentName,
                account_number: String(raw["BANK ACCOUNT NO"] || ""),
                ifsc_code: String(raw["IFSC"] || "")
              },
              { transaction: t }
            );
          }

          // 6️⃣ Guardian
          await models.StudentGuardians.create(
            {
              student_id: student.id,
              name: dto.guardianName || dto.fatherName,
              relationship: normalizeEnum(dto.guardianRelation,
                ["FATHER", "MOTHER", "GUARDIAN"] as const,
                "FATHER"
              ),
              mobile: dto.guardianPhone,
              email: dto.guardianEmail,
              qualification: dto.guardianQualification
            },
            { transaction: t }
          );

          // 7️⃣ Student subjects (AEC / MDC / SEC / VAC)
          await this.assignStudentSubjectsFromDTO(
            student.id,
            dto,
            program.id,
            models,
            t
          );
        });

        successful++;
      } catch (err: any) {
        failed++;
        errors.push({
          row: i + 1,
          message: err.message
        });
      }
    }

    return {
      total_rows: rows.length,
      successful,
      failed,
      errors,
      created_student_ids: createdStudentIds
    };
  }
  mapExcelRowToDTO(raw: any): RowDTO {
    return {
      systemId: String(raw["SYSTEM ID"] || "").trim(),
      collegeRoll: String(raw["COLLEGE ROLL"] || "").trim(),
      studentName: String(raw["STUDENT NAME"] || "").trim(),
      dob: String(raw["DoB"] || "").trim(),
      gender: String(raw["GENDER"] || "").trim(),

      appliedFor: String(raw["APPLIED FOR"] || "").trim(),   // UG
      ugType: String(raw["UG TYPE"] || "").trim(),           // GENERAL / HONOURS
      subjectApplied: String(raw["SUBJECT APPLIED"] || "").trim(), // BACHELOR OF ARTS / SCIENCE

      hsBoardName: String(raw["BOARD NAME"] || "").trim(),
      hsRoll: String(raw["ROLL"] || "").trim(),
      hsYear: String(raw["YEAR"] || "").trim(),
      hsDivision: String(raw["DIVISION"] || "").trim(),
      hsStream: String(raw["STREAM"] || "").trim(),

      hsSubjects: this.extractHsSubjects(raw),

      assessedTotalFM: Number(raw["ASSESSED TOTAL F.M."] || raw["ASSESSED TOTAL F.M"] || 0),
      assessedTotalOM: Number(raw["ASSESSED TOTAL O.M."] || raw["ASSESSED TOTAL O.M"] || 0),

      fatherName: String(raw["FATHER'S NAME"] || "").trim(),
      motherName: String(raw["MOTHER'S NAME"] || "").trim(),
      guardianName: String(raw["GUARDIAN'S NAME"] || "").trim(),
      guardianRelation: String(raw["RELATIONSHIP"] || "").trim(),
      guardianPhone: String(raw["GUARDIANS PHONE"] || "").trim(),
      guardianEmail: String(raw["GUARDIANS EMAIL ADDRESS"] || "").trim(),
      guardianQualification: String(raw["GUARDIANS QUALIFICATION"] || "").trim(),

      familyMembers: Number(raw["FAMILY MEMBERS"] || 0),
      religion: String(raw["RELIGION"] || "").trim(),
      reservation: String(raw["RESERVATION"] || "").trim(),
      admittedCategory: String(raw["ADMITTED CATEGORY"] || "").trim(),
      annualIncome: Number(raw["ANNUAL INCOME"] || 0),
      aadharNo: String(raw["AADHAR NO"] || "").trim(),
      mobileNo: String(raw["MOBILE NO"] || "").trim(),
      bloodGroup: String(raw["BLOOD GROUP"] || "").trim(),

      presentAddressRaw: String(raw["PRESENT ADDRESS"] || "").trim(),
      permanentAddressRaw: String(raw["PERMANENT ADDRESS"] || "").trim(),

      nationality: String(raw["NATIONALITY"] || "").trim(),
      mediumOfInstruction: String(raw["MEDIUM OF INSTRUCTIONS"] || "").trim(),

      aec: {
        sem1: String(raw["AEC SEM1"] || "").trim(),
        sem2: String(raw["AEC SEM2"] || "").trim(),
        sem3: String(raw["AEC SEM3"] || "").trim()
      },
      mdc: {
        sem1: String(raw["MDC SEM1"] || "").trim(),
        sem2: String(raw["MDC SEM2"] || "").trim(),
        sem3: String(raw["MDC SEM3"] || "").trim()
      },
      sec: {
        sem1: String(raw["SEC SEM1"] || "").trim(),
        sem3: String(raw["SEC SEM3"] || "").trim()
      },
      vac: {
        sem1: String(raw["VAC SEM1"] || "").trim(),
        sem2: String(raw["VAC SEM2"] || "").trim()
      }
    };
  }

  extractHsSubjects(raw: any) {
    const subjects: { name: string; fm: number; om: number }[] = [];

    // Example mapping – adapt indices to your exact layout
    const pairs = [
      { nameCol: "SUBJECT 1", fmCol: "SUBJECT 1 F.M.", omCol: "SUBJECT 1 M.O." },
      { nameCol: "SUBJECT 2", fmCol: "SUBJECT 2 F.M.", omCol: "SUBJECT 2 M.O." },
      { nameCol: "SUBJECT 3", fmCol: "SUBJECT 3 F.M.", omCol: "SUBJECT 3 M.O." },
      { nameCol: "SUBJECT 4", fmCol: "SUBJECT 4 F.M.", omCol: "SUBJECT 4 M.O." },
      { nameCol: "SUBJECT 5", fmCol: "SUBJECT 5 F.M.", omCol: "SUBJECT 5 M.O." }
    ];

    for (const p of pairs) {
      const name = String(raw[p.nameCol] || "").trim();
      if (!name) continue;
      subjects.push({
        name,
        fm: Number(raw[p.fmCol] || 0),
        om: Number(raw[p.omCol] || 0)
      });
    }

    return subjects;
  }

  parseExcelDate(value: string): Date | null {
    if (!value) return null;
    // value like "10/04/2005" → dd/mm/yyyy or mm/dd/yyyy depending on CAP
    const parts = value.split(/[\/\-]/);
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map((p) => parseInt(p, 10));
    return new Date(y, m - 1, d);
  }

  parseAddress(raw: string) {
    // Example: "Address : VILL SINGA PO DIGHALGRAM; State : WEST BENGAL; District: NADIA; PO: DIGHALGRAM; PS: HARINGHATA; Pincode: 741249"
    const result: any = {
      address: raw,
      state: "",
      district: "",
      po: "",
      ps: "",
      pincode: ""
    };

    const parts = raw.split(";");
    for (const p of parts) {
      const [labelRaw, valueRaw] = p.split(":");
      if (!valueRaw) continue;
      const label = labelRaw.toLowerCase();
      const value = valueRaw.trim();

      if (label.includes("state")) result.state = value;
      else if (label.includes("district")) result.district = value;
      else if (label.includes("po")) result.po = value;
      else if (label.includes("ps")) result.ps = value;
      else if (label.includes("pincode")) result.pincode = value;
    }

    return result;
  }

  async resolveProgramFromRow(dto: RowDTO, ProgramsModel) {
    const applied = dto.subjectApplied.toUpperCase().trim(); // "BACHELOR OF ARTS" / "BACHELOR OF SCIENCE" / "BACHELOR OF COMMERCE"
    const ugType = dto.ugType.toUpperCase().trim();          // "HONOURS" / "GENERAL"

    let degreeType: "UG" | "PG" = "UG";
    if (applied.includes("MASTER")) degreeType = "PG";

    // BA / BSc / BCom
    let baseCode = "";
    if (applied.includes("ARTS")) baseCode = "BA";
    else if (applied.includes("SCIENCE")) baseCode = "BSC";
    else if (applied.includes("COMMERCE")) baseCode = "BCOM";

    // Honours vs General
    let programType = "";
    if (ugType === "HONOURS") programType = "H";
    else if (ugType === "GENERAL") programType = "G";

    // Example: BA-ENG-H, BA-ENG-G, BSC-MATH-H, etc.
    // Here we only resolve degree_type + program_type; department is implicit in program row.
    const program = await ProgramsModel.findOne({
      where: {
        degree_type: degreeType,
        program_type: "FYUGP" // or match your actual program_type if needed
      }
    });

    return program;
  }

  async assignStudentSubjectsFromDTO(
    studentId: number,
    dto: RowDTO,
    programId: number,
    models,
    t: any
  ) {
    const entries: { label: string; courseTypeCode: string; semester: number }[] = [];

    // AEC
    if (dto.aec.sem1) entries.push({ label: dto.aec.sem1, courseTypeCode: "AEC", semester: 1 });
    if (dto.aec.sem2) entries.push({ label: dto.aec.sem2, courseTypeCode: "AEC", semester: 2 });
    if (dto.aec.sem3) entries.push({ label: dto.aec.sem3, courseTypeCode: "AEC", semester: 3 });

    // MDC
    if (dto.mdc.sem1) entries.push({ label: dto.mdc.sem1, courseTypeCode: "MDC", semester: 1 });
    if (dto.mdc.sem2) entries.push({ label: dto.mdc.sem2, courseTypeCode: "MDC", semester: 2 });
    if (dto.mdc.sem3) entries.push({ label: dto.mdc.sem3, courseTypeCode: "MDC", semester: 3 });

    // SEC
    if (dto.sec.sem1) entries.push({ label: dto.sec.sem1, courseTypeCode: "SEC", semester: 1 });
    if (dto.sec.sem3) entries.push({ label: dto.sec.sem3, courseTypeCode: "SEC", semester: 3 });

    // VAC
    if (dto.vac.sem1) entries.push({ label: dto.vac.sem1, courseTypeCode: "VAC", semester: 1 });
    if (dto.vac.sem2) entries.push({ label: dto.vac.sem2, courseTypeCode: "VAC", semester: 2 });

    for (const e of entries) {
      const label = e.label.trim().toUpperCase();

      // 1️⃣ Try to resolve as department name
      const department = await models.Departments.findOne({
        where: models.sequelize.where(
          models.sequelize.fn("UPPER", models.sequelize.col("name")),
          label
        ),
        transaction: t
      });

      // 2️⃣ Resolve course type
      const courseType = await models.CourseTypes.findOne({
        where: { code: e.courseTypeCode },
        transaction: t
      });

      if (!courseType) {
        console.warn(`Course type not found: ${e.courseTypeCode}`);
        continue;
      }

      // 3️⃣ Find a subject for this program, semester, course type, and (optionally) department
      const programSubject = await models.ProgramSubjects.findOne({
        where: {
          program_id: programId,
          semester_id: e.semester,
          course_type_id: courseType.id
        },
        include: [
          {
            model: models.Subjects,
            as: "subject",
            required: true,
            where: department
              ? { department_id: department.id }
              : {} // for things like ENVIRONMENTAL STUDIES, you may not have a department match
          }
        ],
        transaction: t
      });

      if (!programSubject) {
        console.warn(
          `No program_subject found for label="${e.label}", courseType=${e.courseTypeCode}, semester=${e.semester}, program=${programId}`
        );
        continue;
      }

      // 4️⃣ Insert into student_subjects
      await models.StudentSubjects.create(
        {
          student_id: studentId,
          subject_id: programSubject.subject_id,
          course_type_id: programSubject.course_type_id,
          semester_id: programSubject.semester_id,
          is_active: 1
        },
        { transaction: t }
      );
    }
  }
}