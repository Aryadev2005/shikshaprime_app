import { Op, QueryTypes } from "sequelize";
import { getTenantModels } from "../models";
import { AppError } from "../utils/appError";
import { sendSelectionEmail, sendRegistrationEmail, sendAdmissionCompletedEmail } from "../utils/emailService";
import { buildFrontendUrl } from "../utils/tenantUrlBuilder";
import { StudentIdGenerator } from "../utils/studentIdGenerator";
import { getTenantSequelize } from "../server";
import { normalizeEnum } from "../utils/util";

export class StudentDetailsService {
    // GET STUDENT LIST STUDENT SELECTION SCREEN
    async studentApplication(userId: any, classId: string | undefined, academicYearId: string | undefined, status: string | undefined, searchText: string | undefined, page: string | undefined, limit: string | undefined, tenant: string) {
        const models = getTenantModels(tenant);
        const pageNo = Number(page);
        const pageSize = Number(limit);
        const offset = (pageNo - 1) * pageSize;

        try {
            const studentApplicationStatus = await models.StudentApplicationStatus.findAll({
                where: { final_submitted: 1 },
                raw: true
            });
            if (studentApplicationStatus) {
                const finalData = await Promise.all(
                    studentApplicationStatus.map(async (item) => {
                        const registrationData = await models.StudentPreRegistration.findOne({
                            where: { user_id: item?.user_id },
                            attributes: ['application_id', 'first_name', 'middle_name', 'last_name', 'mobile', 'email'],
                            raw: true,
                        });
                        const gardianDetails = await models.StudentGuardians.findOne({
                            where: { user_id: item?.user_id },
                            attributes: ['name'],
                            raw: true,
                        })
                        const personalData = await models.StudentPersonalDetails.findOne({
                            where: { user_id: item?.user_id },
                            attributes: ['academic_year_id', 'program_id', 'class_id'],
                            raw: true,
                        })
                        const subject = await models.StudentProgramChoices.findOne({
                            where: { user_id: item?.user_id },
                            attributes: ['major_department_id', 'minor_department_id'],
                            raw: true,
                        })
                        // Include `status` from StudentApplicationStatus so status-based filtering works
                        return {
                            user_id: item?.user_id,
                            status: (item as any)?.status,
                            student_name: `${registrationData?.first_name} ${registrationData?.middle_name} ${registrationData?.last_name}`,
                            ...registrationData,
                            ...personalData,
                            ...subject,
                            parent_name: gardianDetails?.name ?? null,
                        };
                    })
                );

                // Filtering
                let filtered = finalData;

                if (status) {
                    filtered = filtered.filter(r => (r as any).status === status);
                }

                if (academicYearId) {
                    // Guard: if personalData was null, academic_year_id will be undefined — don't match against "undefined"
                    filtered = filtered.filter(
                        r => (r as any).academic_year_id != null && String((r as any).academic_year_id) === academicYearId
                    );
                }

                if (classId) {
                    // Guard: if personalData was null, program_id will be undefined
                    filtered = filtered.filter(
                        r => (r as any).program_id != null && String((r as any).program_id) === classId
                    );
                }

                if (searchText) {
                    const search = searchText.toLowerCase();
                    filtered = filtered.filter(r =>
                        (r as any).first_name?.toLowerCase().includes(search) ||
                        (r as any).middle_name?.toLowerCase().includes(search) ||
                        (r as any).last_name?.toLowerCase().includes(search)
                    );
                }
                // In-memory pagination applied after filtering
                const total = filtered.length;
                const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;
                const registrations = pageSize > 0 ? filtered.slice(offset, offset + pageSize) : filtered;
                return {
                    registrations,
                    pagination: {
                        page: pageNo,
                        limit: pageSize,
                        total,
                        totalPages,
                    },
                };
            }
            else {
                return null;
            }
        } catch (error) {
            console.error("Error in studentApplication service:", error);
            throw error;
        }
    }

    // GET ONE STUDENT BY ID
    async getStudentById(studentId: any, tenant: string) {
        const models = getTenantModels(tenant);
        try {
            const registrationData = await models.StudentPreRegistration.findOne({
                where: { user_id: studentId },
                attributes: ['application_id', 'first_name', 'middle_name', 'last_name', 'mobile', 'email', 'gender', 'dob', 'nationality', 'social_category', 'sub_catagory', 'catagory_certificate_number', 'catagory_certificate_issue_authority', 'catagory_certificate_issue_date', 'hs_year_of_passing', 'hs_board', 'hs_registration_number', 'hs_roll_number', 'hs_registration_certificate_path'],
                raw: true,
            });
            const personalData = await models.StudentPersonalDetails.findOne({
                where: { user_id: studentId },
                attributes: ['user_id', 'class_id', 'academic_year_id', 'program_id', 'aadhaar_number', 'marital_status', 'blood_group', 'mother_tongue', 'religion', 'identity_proof_type', 'identity_proof_number', 'is_physically_challenged', 'physical_disability_type', 'is_sports_person', 'is_banglar_shikha_id_present', 'banglar_shikha_id', 'nearest_railway_station', 'academic_bank_credit_id'],
                raw: true,
            })
            const fathergardianDetails = await models.StudentGuardians.findOne({
                where: { user_id: studentId, relationship: 'FATHER' },
                attributes: ['user_id', 'relationship', 'name', 'qualification', 'email', 'mobile', 'is_primary_guardian'],
                raw: true,
            })
            const mothergardianDetails = await models.StudentGuardians.findOne({
                where: { user_id: studentId, relationship: 'MOTHER' },
                attributes: ['user_id', 'relationship', 'name', 'qualification', 'email', 'mobile', 'is_primary_guardian'],
                raw: true,
            })
            const gardiagardianDetails = await models.StudentGuardians.findOne({
                where: { user_id: studentId, relationship: 'GUARDIAN' },
                attributes: ['user_id', 'relationship', 'name', 'qualification', 'email', 'mobile', 'is_primary_guardian'],
                raw: true,
            })
            const addressData = await models.StudentAddress.findOne({
                where: { user_id: studentId },
                attributes: ['user_id', 'address_type', 'address_line', 'village', 'post_office', 'police_station', 'district', 'state', 'pincode', 'municipality_block'],
                raw: true,
            })

            const SecondaryResultData = await models.StudentAcademicHistory.findOne({
                where: { user_id: studentId, exam_name: '10TH' },
                attributes: ['user_id', 'exam_name', 'year_of_passing', 'board_name', 'division', 'stream', 'subject_name', 'full_marks', 'obtained_marks'],
                raw: true,
            })
            const higherSecondaryResultData = await models.StudentAcademicHistory.findOne({
                where: { user_id: studentId, exam_name: '12TH' },
                attributes: ['user_id', 'exam_name', 'year_of_passing', 'board_name', 'division', 'stream', 'subject_name', 'full_marks', 'obtained_marks'],
                raw: true,
            })
            const documentsData = await models.StudentDocuments.findAll({
                where: { user_id: studentId },
                attributes: ['user_id', 'document_type', 'document_name', 'document_path', 'file_extension', 'file_size_kb', 'is_verified', 'verified_by', 'verified_at'],
                raw: true,
            })

            const students = await models.Student.findOne({
                where: { user_id: studentId },
                attributes: ['university_registration_number', 'scholarship'],
                raw: true
            });

            const programId = personalData?.program_id;
            const semesterId = personalData?.class_id;
            const userId = personalData?.user_id;
            console.log("Program id, Semester id ======?/", programId, semesterId);

            // Student will select subject start
            const programIdUseSemesterId = await models.Semester.findAll({ where: { program_id: programId, id: semesterId }, attributes: ['id', 'semester_number'], raw: true });
            console.log("user id, semester id ======?/", userId, programIdUseSemesterId[0]?.id);

            const subjectIdList = await models.StudentSubjects.findAll({where: {user_id: userId, semester_id: programIdUseSemesterId[0]?.id}, raw: true });
            const subjectListId = subjectIdList.map((item)=> item?.subject_id);
            const subjectData = await models.Subject.findAll({where: {id: subjectListId}, raw: true});
            //// ---------END--------- /////

            // Student Subjects start
            // const selectedSemesterId = programIdUseSemesterId.map(item => item.id);
            // const programSubjects = await models.ProgramSubject.findAll({
            //     where: { semester_id: selectedSemesterId, program_id: programId},
            //     attributes: ['subject_id', "semester_id", "course_type_id", "is_core", "is_active", "elective_group"],
            //     raw: true,
            // });
            // const subjectIds = programSubjects?.map(item => item.subject_id);
            // const subjects = await models.Subject.findAll({ where: { id: subjectIds } });
            // const allSubjectData = subjects.map(subject => {
            //     const ps = programSubjects.find(
            //         item => item.subject_id === subject.id
            //     );
            //     return {
            //         ...subject.toJSON(),
            //         is_core: ps?.is_core,
            //         semester_id: ps?.semester_id,
            //         course_type_id: ps?.course_type_id,
            //         elective_group: ps?.elective_group,
            //         is_active: ps?.is_active,
            //     };
            // });
            const programSubjectsList = await models.ProgramSubject.findAll({
                where: { program_id: programId, semester_id: semesterId },
                attributes: ['subject_id', "semester_id", "course_type_id", "is_core", "is_active", "elective_group"],
                raw: true,
            });
            const subjectIds = programSubjectsList?.map((item: any) => item.subject_id);
            const allSubjectData = await models.Subject.findAll({
                where: {
                    id: subjectIds,
                },
            });
            //// ---------END--------- /////
            

            const semesterIds = await models.Class.findOne({
                where: { id: semesterId },
                attributes: ['semester_id']
            })

            const program = await models.Program.findOne({
                where: { id: programId },
                attributes: ["department_id"],
                raw: true,
            });
            const department = await models.Department.findByPk(program?.department_id);
            let relatedDepartments = [];
            if (department) {
                if (department.parent_id === null) {
                    // Top-level department (Arts/Science)
                    relatedDepartments = await models.Department.findAll({
                        where: {
                            parent_id: department.id,
                        },
                        order: [["name", "ASC"]],
                    });
                } else {
                    // Child department (English, Mathematics, etc.)
                    relatedDepartments = await models.Department.findAll({
                        where: {
                            parent_id: department.parent_id,
                        },
                        order: [["name", "ASC"]],
                    });
                }
            }
            // console.log("relatedDepartments=====>", relatedDepartments.map(item => item.toJSON()));

            return {
                address_data: addressData,
                documents: documentsData,
                father_data: fathergardianDetails,
                guardian_data: gardiagardianDetails,
                higher_secondary_result_data: higherSecondaryResultData,
                mother_data: mothergardianDetails,
                personal_data: { ...personalData, semester_id: semesterIds?.semester_id ?? null, departments: relatedDepartments.map(item => item.toJSON()) },
                registration_data: registrationData,
                secondary_result_data: SecondaryResultData,
                students: students,
                allSubjectData: allSubjectData,
                subjects: subjectData,
            };
        } catch (error) {
            console.error("Error in getStudentById service:", error);
            throw error;
        }
    }

    // SELECTED STUDENT SEND TO THE SERVICE
    async bulkUpdateRegistrationStatus(
        registrationIds: { application_id: string; user_id: number }[],
        status: string,
        remarks: string,
        tenant: string
    ) {
        const models = getTenantModels(tenant);
        try {

            const validStatuses = [
                "REGISTRATION_COMPLETED",
                "PAYMENT_PENDING",
                "PAYMENT_COMPLETED",
            ];

            if (!validStatuses.includes(status)) {
                throw new AppError("Invalid status.", 400);
            }

            const results: any[] = [];
            let success = 0;
            let failed = 0;

            for (const item of registrationIds) {
                try {

                    // Find the record in student_application_status
                    const record = await models.StudentApplicationStatus.findOne({
                        where: {
                            application_id: item.application_id,
                            user_id: item.user_id,
                        },
                    });

                    const personalRecord = await models.StudentPersonalDetails.findOne({
                        where: {
                            user_id: item.user_id,
                        },
                    });

                    if (!record) {
                        results.push({
                            application_id: item.application_id,
                            user_id: item.user_id,
                            success: false,
                            status: "FAILED",
                            message: "Application status record not found",
                        });
                        failed++;
                        continue;
                    }

                    // Update status in student_application_status
                    await models.StudentApplicationStatus.update(
                        { status: status as any },
                        {
                            where: {
                                // application_id: item.application_id,
                                user_id: item.user_id,
                            },
                        }
                    );
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 7);
                    const admissionFeeAmount = await this.getAdmissionFeeAmount(getTenantSequelize(tenant), { programId: personalRecord.program_id, academicYearId: personalRecord.academic_year_id, semesterId: null });                    
                    const admissionFeeAssignment = await models.StudentFeeAssignment.findOne({ where: { application_id: item.application_id } });
                    if (!admissionFeeAssignment && admissionFeeAmount) {
                        await models.StudentFeeAssignment.create({
                            application_id: item.application_id,
                            academic_year_id: personalRecord.academic_year_id,
                            fee_head_id: admissionFeeAmount.fee_head_id,
                            amount: admissionFeeAmount.amount,
                            status: normalizeEnum("PENDING",
                                ["PENDING", "PARTIAL", "PAID", ""] as const,
                                "PENDING"
                            ),
                            due_date: dueDate
                        });
                    }
                    /**
                     * Handle sending emails based on the updated status
                     */
                    if (status === "PAYMENT_PENDING") {
                        // Send selection/payment link email
                        const preReg = await models.StudentPreRegistration.findOne({
                            where: { user_id: item.user_id },
                            attributes: ["email", "first_name", "last_name", "application_id"],
                            raw: true,
                        });

                        if (preReg) {
                            const paymentUrl = buildFrontendUrl(
                                tenant,
                                `/student-payment?appId=${item.application_id}`
                            );

                            await sendSelectionEmail(
                                preReg.email,
                                `${preReg.first_name} ${preReg.last_name}`,
                                preReg.application_id as unknown as string,
                                paymentUrl
                            );
                        }
                    } else if (status === "REGISTRATION_COMPLETED") {
                        // Send registration confirmation email
                        const preReg = await models.StudentPreRegistration.findOne({
                            where: { user_id: item.user_id },
                            attributes: ["email", "first_name", "last_name", "application_id"],
                            raw: true,
                        });

                        if (preReg) {
                            const paymentUrl = buildFrontendUrl(
                                tenant,
                                `/student-payment?appId=${item.application_id}`
                            );

                            await sendRegistrationEmail(
                                preReg.email,
                                `${preReg.first_name} ${preReg.last_name}`,
                                preReg.application_id as unknown as string,
                                paymentUrl
                            );
                        }
                    } else if (status === "PAYMENT_COMPLETED") {
                        // Send admission confirmed email
                        const preReg = await models.StudentPreRegistration.findOne({
                            where: { user_id: item.user_id },
                            attributes: ["email", "first_name", "last_name"],
                            raw: true,
                        });

                        const student = await models.Student.findOne({
                            where: { user_id: item.user_id },
                            attributes: ["student_id"],
                            raw: true,
                        });

                        if (preReg) {
                            const studentIdVal = student ? student.student_id : "N/A";
                            await sendAdmissionCompletedEmail(
                                preReg.email,
                                `${preReg.first_name} ${preReg.last_name}`,
                                studentIdVal
                            );
                        }
                    }

                    results.push({
                        application_id: item.application_id,
                        user_id: item.user_id,
                        success: true,
                        status: status,
                        message: "Status updated successfully.",
                    });

                    success++;

                } catch (err: any) {
                    results.push({
                        application_id: item.application_id,
                        user_id: item.user_id,
                        success: false,
                        status: "FAILED",
                        message: err.message,
                    });
                    failed++;
                }
            }

            return {
                total: registrationIds.length,
                success,
                failed,
                results,
            };

        } catch (error) {
            throw error;
        }
    }

    // GET SEMESTER DATA
    async semestersService(classId: any, programId: any, tenant: string) {
        const models = getTenantModels(tenant);
        try {
            const semesterFilterData = await models.Semester.findAll({ where: { program_id: programId } });
            return {
                semester_data: semesterFilterData
            }
        } catch (error: any) {
            throw error
        }
    }

    // CREATE / UPDATE STUDENT (upsert by user_id)
    async submitStudentData(adminId: any, studentData: any, tenant: string) {
        const models = getTenantModels(tenant);
        const { user_id, semester_id, subjects } = studentData;
        try {
            // status change
            await models.StudentApplicationStatus.update(
                { status: 'ADMITTED' },
                { where: { user_id: user_id } }
            );
            // Update user role to 'student' in the users table (different service, same tenant DB)
            await models.sequelize.query(
                `UPDATE users SET role = 'student' WHERE user_id = :user_id`,
                {
                    replacements: { user_id },
                    type: QueryTypes.UPDATE,
                }
            );

            let dbStudentId: number | null = null;
            let finalStudentId: string = "";
            let isUpdated = false;

            // 1. Check if a Student record already exists for this user_id
            const existingStudent = await models.Student.findOne({
                where: { user_id },
                raw: true,
            });

            if (existingStudent) {
                // ── UPDATE path ──────────────────────────────────────────────
                // Reuse existing student_id; only update mutable fields
                await models.Student.update(
                    { semester_id } as any,
                    { where: { user_id } }
                );

                finalStudentId = (existingStudent as any).student_id;
                dbStudentId = (existingStudent as any).id;
                isUpdated = true;
            } else {
                // ── CREATE path ───────────────────────────────────────────────
                // 2. Fetch pre-registration data to populate the Student record
                const preReg = await models.StudentPreRegistration.findOne({
                    where: { user_id },
                    raw: true,
                });

                if (!preReg) {
                    throw new Error(`No pre-registration record found for user_id: ${user_id}`);
                }

                // 3. Generate a unique student_id
                const generatedStudentId = await StudentIdGenerator.generateStudentId(
                    "INS",
                    models.Student
                );

                // 4. Create the Student record
                const createdStudent = await models.Student.create({
                    student_id: generatedStudentId,
                    user_id: preReg.user_id,
                    application_id: preReg.application_id,
                    first_name: preReg.first_name,
                    middle_name: preReg.middle_name ?? null,
                    last_name: preReg.last_name,
                    gender: preReg.gender,
                    dob: preReg.dob,
                    nationality: preReg.nationality,
                    state: preReg.state,
                    district: preReg.district,
                    social_category: preReg.social_category as any,
                    sub_catagory: preReg.sub_catagory || null,
                    catagory_certificate_number: preReg.catagory_certificate_number || null,
                    catagory_certificate_issue_authority: (preReg.catagory_certificate_issue_authority as any) || null,
                    catagory_certificate_issue_date: preReg.catagory_certificate_issue_date
                        ? String(preReg.catagory_certificate_issue_date)
                        : null,
                    mobile: preReg.mobile,
                    email: preReg.email,
                    hs_year_of_passing: preReg.hs_year_of_passing,
                    hs_board: preReg.hs_board,
                    hs_registration_number: preReg.hs_registration_number,
                    hs_roll_number: preReg.hs_roll_number,
                    hs_registration_certificate_path: preReg.hs_registration_certificate_path,
                    semester_id,
                } as any);

                dbStudentId = (createdStudent as any).id;
                if (!dbStudentId) {
                    const studentRecord = await models.Student.findOne({
                        where: { user_id: user_id },
                        attributes: ['id'],
                        raw: true,
                    });
                    dbStudentId = studentRecord ? (studentRecord as any).id : null;
                }

                finalStudentId = generatedStudentId;
                isUpdated = false;

                // 5. Backfill student_id on all related tables in parallel
                const updateWhere = { where: { user_id } };
                const updatePayload = { student_id: dbStudentId };
                await Promise.all([
                    models.StudentPersonalDetails.update(updatePayload as any, updateWhere),
                    models.StudentGuardians.update(updatePayload as any, updateWhere),
                    models.StudentAddress.update(updatePayload as any, updateWhere),
                    models.StudentAcademicHistory.update(updatePayload as any, updateWhere),
                    models.StudentDocuments.update(updatePayload as any, updateWhere),
                    models.StudentProgramChoices.update(updatePayload as any, updateWhere),
                    models.StudentSubjects.update(updatePayload as any, updateWhere),
                ]);
            }

            // 6. Save subjects for student using dbStudentId
            const saveSubjectForStudent = async (semesterId: any, targetStudentId: any) => {
                const programSubjects = await models.ProgramSubject.findAll({
                    where: { semester_id: semesterId },
                    raw: true,
                });

                if (programSubjects.length === 0) return;

                // Remove any existing enrollments for this user + semester (idempotent)
                await models.StudentSubjects.destroy({
                    where: { user_id: user_id, semester_id: semesterId },
                });

                // Build one row per program subject
                const rowsToInsert = subjects?.map((ps: any) => ({
                    user_id: Number(user_id),
                    student_id: targetStudentId ? Number(targetStudentId) : null,
                    semester_id: Number(ps.semester_id),
                    subject_id: Number(ps.id),
                    course_type_id: Number(ps.course_type_id),
                    is_core: 1,
                    is_active: 1,
                    status: 'ENROLLED',
                    assigned_by: String(adminId),
                }));
                if (rowsToInsert && rowsToInsert.length > 0) {
                    await models.StudentSubjects.bulkCreate(rowsToInsert as any);
                }
            };

            await saveSubjectForStudent(semester_id, dbStudentId);

            return { success: true, student_id: finalStudentId, updated: isUpdated };

        } catch (error: any) {
            throw error;
        }
    }



    // GET ALL STUDENT (paginated)
    async getAllStudent(tenant: string, roll_number?: string, student_name?: string, email?: string, page: number = 1, limit: number = 50) {
        const models = getTenantModels(tenant);
        const offset = (page - 1) * limit;

        // Build dynamic WHERE clause
        const where: any = {};

        if (roll_number) {
            where.student_id = { [Op.like]: `%${roll_number}%` };
        }

        if (student_name) {
            where[Op.or] = [
                { first_name: { [Op.like]: `%${student_name}%` } },
                { middle_name: { [Op.like]: `%${student_name}%` } },
                { last_name: { [Op.like]: `%${student_name}%` } },
            ];
        }

        if (email) {
            where.email = { [Op.like]: `%${email}%` };
        }

        try {

            const { count: total, rows: students } = await models.Student.findAndCountAll({
                where,
                attributes: [
                    'id', 'user_id', 'student_id', 'application_id',
                    'first_name', 'middle_name', 'last_name',
                    'mobile', 'email', 'dob', 'semester_id',
                ],
                limit,
                offset,
                raw: true,
            });
            const userIds = students.map(s => s.user_id);

            const [personalDetails, programChoices] = await Promise.all([
                models.StudentPersonalDetails.findAll({
                    where: {
                        user_id: {
                            [Op.in]: userIds
                        }
                    },
                    attributes: ["user_id", "program_id", "class_id", "academic_year_id"],
                    raw: true
                }),
                models.StudentProgramChoices.findAll({
                    where: {
                        user_id: {
                            [Op.in]: userIds
                        }
                    },
                    attributes: ["user_id", "major_department_id"],
                    raw: true
                })
            ]);

            const classIds = [...new Set(personalDetails.map(p => p.class_id).filter(id => id !== null && id !== undefined))];

            const classesList = classIds.length > 0 ? await models.Class.findAll({
                where: {
                    id: {
                        [Op.in]: classIds
                    }
                },
                attributes: ["id", "name"],
                raw: true
            }) : [];

            const personalMap = new Map(
                personalDetails.map(p => [p.user_id, p])
            );
            const choiceMap = new Map(
                programChoices.map(c => [c.user_id, c.major_department_id])
            );
            const classMap = new Map(
                classesList.map(c => [c.id, c.name])
            );

            const result = students.map(student => {
                const personal = personalMap.get(student.user_id);
                return {
                    ...student,
                    program_id: personal?.program_id ?? null,
                    class_id: personal?.class_id ?? null,
                    academic_year_id: personal?.academic_year_id ?? null,
                    department_id: choiceMap.get(student.user_id) ?? null,
                    class_name: personal?.class_id ? classMap.get(personal.class_id) : null
                };
            });
            return {
                students: result,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            throw error;
        }
    }

    // GET ALL STUDENT (paginated)
    async getAllStudentReports(tenant: string, roll_number?: string, student_name?: string, email?: string, page: number = 1, limit: number = 50) {
        const models = getTenantModels(tenant);
        const offset = (page - 1) * limit;

        // Build dynamic WHERE clause
        const where: any = {};

        if (roll_number) {
            where.student_id = { [Op.like]: `%${roll_number}%` };
        }

        if (student_name) {
            where[Op.or] = [
                { first_name: { [Op.like]: `%${student_name}%` } },
                { middle_name: { [Op.like]: `%${student_name}%` } },
                { last_name: { [Op.like]: `%${student_name}%` } },
            ];
        }

        if (email) {
            where.email = { [Op.like]: `%${email}%` };
        }

        try {

            const { count: total, rows: students } = await models.Student.findAndCountAll({
                where,
                attributes: [
                    'id', 'user_id', 'student_id', 'application_id', 'roll_number',
                    'first_name', 'middle_name', 'last_name',
                    'mobile', 'email', 'dob', 'semester_id',
                ],
                order: [["id", "DESC"]],
                limit,
                offset,
                raw: true,
            });
            const userIds = students.map(s => s.user_id);

            const [personalDetails, programChoices] = await Promise.all([
                models.StudentPersonalDetails.findAll({
                    where: {
                        user_id: {
                            [Op.in]: userIds
                        }
                    },
                    attributes: ["user_id", "program_id", "class_id", "academic_year_id"],
                    raw: true
                }),
                models.StudentProgramChoices.findAll({
                    where: {
                        user_id: {
                            [Op.in]: userIds
                        }
                    },
                    attributes: ["user_id", "major_department_id"],
                    raw: true
                })
            ]);

            const classIds = [...new Set(personalDetails.map(p => p.class_id).filter(id => id !== null && id !== undefined))];

            const classesList = classIds.length > 0 ? await models.Class.findAll({
                where: {
                    id: {
                        [Op.in]: classIds
                    }
                },
                attributes: ["id", "name"],
                raw: true
            }) : [];

            const personalMap = new Map(
                personalDetails.map(p => [p.user_id, p])
            );
            const choiceMap = new Map(
                programChoices.map(c => [c.user_id, c.major_department_id])
            );
            const classMap = new Map(
                classesList.map(c => [c.id, c.name])
            );

            const result = students.map(student => {
                const personal = personalMap.get(student.user_id);
                return {
                    ...student,
                    program_id: personal?.program_id ?? null,
                    class_id: personal?.class_id ?? null,
                    academic_year_id: personal?.academic_year_id ?? null,
                    department_id: choiceMap.get(student.user_id) ?? null,
                    class_name: personal?.class_id ? classMap.get(personal.class_id) : null
                };
            });
            return {
                students: result,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            throw error;
        }
    }

    async updateStudent(tenant: string, userId: any, studentData: any) {
        const models = getTenantModels(tenant);
        try {
            await models.StudentGuardians.update(
                {
                    mobile: studentData.guardian_mobile,
                    email: studentData.guardian_email,
                },
                { where: { user_id: userId, relationship: 'GUARDIAN' } }
            );
            await models.Student.update(
                {
                    university_registration_number: studentData.university_registration_number,
                    scholarship: studentData.scholarship,
                }, { where: { user_id: userId } }
            )
            return {
                success: true,
                message: "Guardian updated successfully",
            };

        } catch (error) {
            throw error;
        }
    }
    async getAdmissionFeeAmount(sequelize, {
        programId,
        academicYearId,
        semesterId // nullable
    }) {
        let query = `
            SELECT 
            fp.id AS fee_particular_id,
            fp.amount,
            fh.id AS fee_head_id,
            fh.name AS fee_head_name
            FROM fee_particulars fp
            INNER JOIN fee_heads fh 
            ON fh.id = fp.fee_head_id
            WHERE fh.name = 'Admission Fee'
            AND fp.program_id = :programId
            AND fp.academic_year_id = :academicYearId
        `;

        const replacements: any = {
            programId,
            academicYearId
        };

        // semesterId is optional
        if (semesterId) {
            query += ` AND fp.semester_id = :semesterId`;
            replacements.semesterId = semesterId;
        }

        query += ` LIMIT 1`;

        const [result] = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT,
        });

        return result;
    }
}
