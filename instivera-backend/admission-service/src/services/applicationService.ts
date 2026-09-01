import path from "path";
import { getTenantModels } from "../models";
import { tenantsService } from "@shared/tenants";
import { rulesService } from "@shared/rules";
import { buildFileUrl } from "../utils/filePath";
import { QueryTypes } from "sequelize";

export class ApplicationService {
    async savePersonalDetails(req, userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const t = await models.sequelize.transaction();
        try {
            const {
                academic_year_id,
                program_id,
                class_id,
                aadhaar_number,
                marital_status,
                blood_group,
                mother_tongue,
                religion,
                identity_proof_type,
                identity_proof_number,
                is_physically_challenged,
                physical_disability_type,
                is_sports_person,
                is_banglar_shikha_id_present,
                banglar_shikha_id,
                nearest_railway_station,
                academic_bank_credit_id,
                // Bank details
                bank_name,
                branch_name,
                account_number,
                ifsc_code,
                micr_code,
                account_holder_name
            } = req.body;

            // Uploaded files
            const getFile = (fieldName: string) => req.files?.[fieldName]?.[0] || null;
            const profilePhotoFile = getFile("profile_photo");
            const signatureFile = getFile("signature");
            const bankProofFile = getFile("bank_proof_document");

            // 1️⃣ Fetch program metadata (degree_type, program_type, department_id)
            const program = await models.Program.findOne({
                where: { id: program_id }
            });

            if (!program) {
                throw new Error("Invalid program selected");
            }

            // 2️⃣ Upsert into student_applications
            const [application] = await models.StudentApplications.upsert(
                {
                    user_id: userId,
                    academic_year_id,
                    program_id,
                    degree_type: program.degree_type,
                    program_type: program.program_type,
                    department_id: program.department_id,
                    application_status: "IN_PROGRESS",
                },
                { transaction: t }
            );

            // Update personal details if exists, otherwise create
            const personalData = {
                academic_year_id,
                program_id,
                class_id: class_id || null,
                user_id: userId,
                student_id: null,
                aadhaar_number,
                marital_status,
                blood_group,
                mother_tongue,
                religion,
                identity_proof_type,
                identity_proof_number,
                is_physically_challenged,
                physical_disability_type,
                is_sports_person,
                is_banglar_shikha_id_present,
                banglar_shikha_id,
                nearest_railway_station,
                academic_bank_credit_id,
                status: true,
            };
            let personalDetails = await models.StudentPersonalDetails.findOne({
                where: { user_id: userId },
                transaction: t
            });
            if (personalDetails) {
                await personalDetails.update(personalData, { transaction: t });
            } else {
                personalDetails = await models.StudentPersonalDetails.create(personalData, { transaction: t });
            }

            // Update bank details if exists, otherwise create
            const bankData = {
                user_id: userId,
                student_id: null,
                bank_name,
                branch_name,
                account_number,
                ifsc_code,
                micr_code,
                account_holder_name,
                is_primary_account: true,
                is_verified: false
            };
            let bankDetails = await models.StudentBankDetails.findOne({
                where: { user_id: userId },
                transaction: t
            });
            if (bankDetails) {
                await bankDetails.update(bankData, { transaction: t });
            } else {
                bankDetails = await models.StudentBankDetails.create(bankData, { transaction: t });
            }

            // Save documents
            const docsToProcess = [
                { file: profilePhotoFile, type: "PROFILE_PHOTO" },
                { file: signatureFile, type: "SIGNATURE" },
                { file: bankProofFile, type: "BANK_PROOF" }
            ];

            const documentsToSave = [];

            for (const doc of docsToProcess) {
                if (!doc.file) continue;

                // Remove old document of same type
                await models.StudentDocuments.destroy({
                    where: {
                        user_id: userId,
                        document_type: doc.type
                    },
                    transaction: t
                });

                documentsToSave.push({
                    user_id: userId,
                    student_id: null,
                    document_type: doc.type,
                    document_name: doc.file.originalname,
                    // document_path: `/api/admission/uploads/files/${doc.file.filename}`,
                    document_path:
                        buildFileUrl(
                            doc.file.filename
                        ),
                    file_extension: path.extname(doc.file.originalname).replace(".", ""),
                    file_size_kb: Math.round(doc.file.size / 1024),
                    is_verified: false
                });
            }

            if (documentsToSave.length > 0) {
                await models.StudentDocuments.bulkCreate(documentsToSave, { transaction: t });
            }

            await t.commit();
            return { application, personalDetails, bankDetails };

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async saveAddressDetails(req, userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const t = await models.sequelize.transaction();
        try {
            const {
                permanent_address_line,
                permanent_village,
                permanent_post_office,
                permanent_police_station,
                permanent_district,
                permanent_state,
                permanent_pincode,
                permanent_municipality_block,

                present_address_line,
                present_village,
                present_post_office,
                present_police_station,
                present_district,
                present_state,
                present_pincode,
                present_municipality_block
            } = req.body;

            const permanentData = {
                user_id: userId,
                student_id: null,
                address_type: "PERMANENT" as const,
                address_line: permanent_address_line,
                village: permanent_village,
                post_office: permanent_post_office,
                police_station: permanent_police_station,
                district: permanent_district,
                state: permanent_state,
                pincode: permanent_pincode,
                municipality_block: permanent_municipality_block,
                status: true
            };

            const presentData = {
                user_id: userId,
                student_id: null,
                address_type: "PRESENT" as const,
                address_line: present_address_line,
                village: present_village,
                post_office: present_post_office,
                police_station: present_police_station,
                district: present_district,
                state: present_state,
                pincode: present_pincode,
                municipality_block: present_municipality_block,
                status: true,
            };

            // --- Permanent Address: update if exists, otherwise create ---
            let permanentAddress = await models.StudentAddress.findOne({
                where: { user_id: userId, address_type: "PERMANENT" },
                transaction: t
            });
            if (permanentAddress) {
                await permanentAddress.update(permanentData, { transaction: t });
            } else {
                permanentAddress = await models.StudentAddress.create(permanentData, { transaction: t });
            }

            // --- Present Address: update if exists, otherwise create ---
            let presentAddress = await models.StudentAddress.findOne({
                where: { user_id: userId, address_type: "PRESENT" },
                transaction: t
            });
            if (presentAddress) {
                await presentAddress.update(presentData, { transaction: t });
            } else {
                presentAddress = await models.StudentAddress.create(presentData, { transaction: t });
            }

            await t.commit();
            return { permanentAddress, presentAddress };

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async saveGuardianDetails(req, userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const t = await models.sequelize.transaction();

        try {
            const {
                father_name,
                father_qualification,
                father_email,
                father_mobile,

                mother_name,
                mother_qualification,
                mother_email,
                mother_mobile,

                guardian_name,
                guardian_qualification,
                guardian_email,
                guardian_mobile,
                is_primary_guardian
            } = req.body;

            const guardiansToUpsert = [];

            // FATHER
            guardiansToUpsert.push({
                user_id: userId,
                student_id: null,
                relationship: "FATHER",
                name: father_name,
                qualification: father_qualification,
                email: father_email,
                mobile: father_mobile,
                is_primary_guardian: is_primary_guardian === "FATHER" ? 1 : 0,
                status: true
            });

            // MOTHER
            guardiansToUpsert.push({
                user_id: userId,
                student_id: null,
                relationship: "MOTHER",
                name: mother_name,
                qualification: mother_qualification,
                email: mother_email,
                mobile: mother_mobile,
                is_primary_guardian: is_primary_guardian === "MOTHER" ? 1 : 0,
                status: true
            });

            // GUARDIAN (optional)
            if (guardian_name) {
                guardiansToUpsert.push({
                    user_id: userId,
                    student_id: null,
                    relationship: "GUARDIAN",
                    name: guardian_name,
                    qualification: guardian_qualification,
                    email: guardian_email,
                    mobile: guardian_mobile,
                    is_primary_guardian: is_primary_guardian === "GUARDIAN" ? 1 : 0,
                    status: true
                });
            }

            // Delete existing rows for this user (clean replace)
            await models.StudentGuardians.destroy({
                where: { user_id: userId }
            });

            // Insert new rows
            const savedRows = await models.StudentGuardians.bulkCreate(guardiansToUpsert, {
                transaction: t
            });

            await t.commit();
            return savedRows;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async saveSecondaryResult(req, userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const t = await models.sequelize.transaction();
        try {
            const {
                board_name,
                year_of_passing,
                division,
                // total_full_marks,
                // total_obtained_marks,
                // percentage,
                subjects // array of { subject_name, full_marks, obtained_marks }
            } = req.body;

            // Remove old 10th exam rows
            await models.StudentAcademicHistory.destroy({
                where: {
                    user_id: userId,
                    exam_name: "10TH"
                }
            });

            const rowsToInsert: any[] = [];

            if (Array.isArray(subjects)) {
                subjects.forEach((sub: any) => {
                    rowsToInsert.push({
                        user_id: userId,
                        student_id: null,
                        exam_name: "10TH",
                        board_name,
                        year_of_passing,
                        division,
                        subject_name: sub.subject_name,
                        full_marks: sub.full_marks,
                        obtained_marks: sub.obtained_marks,
                        status: true,
                        // total_full_marks,
                        // total_obtained_marks,
                        // percentage
                    });
                });
            }

            // Insert subject-wise rows
            const savedRows = await models.StudentAcademicHistory.bulkCreate(rowsToInsert, {
                transaction: t
            });
            await t.commit();
            return savedRows;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async saveHigherSecondaryResult(req, userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const t = await models.sequelize.transaction();
        try {
            const {
                board_name,
                year_of_passing,
                division,
                stream,
                total_full_marks,
                total_obtained_marks,
                percentage,
                subjects // array of { subject_name, full_marks, obtained_marks }
            } = req.body;

            // Remove old 10th exam rows
            await models.StudentAcademicHistory.destroy({
                where: {
                    user_id: userId,
                    exam_name: "12TH"
                }
            });

            const rowsToInsert: any[] = [];

            if (Array.isArray(subjects)) {
                subjects.forEach((sub: any) => {
                    rowsToInsert.push({
                        user_id: userId,
                        student_id: null,
                        exam_name: "12TH",
                        board_name,
                        year_of_passing,
                        division,
                        stream,
                        subject_name: sub.subject_name,
                        full_marks: sub.full_marks,
                        obtained_marks: sub.obtained_marks,
                        total_full_marks,
                        total_obtained_marks,
                        percentage,
                        status: true
                    });
                });
            }

            // Insert subject-wise rows
            const savedRows = await models.StudentAcademicHistory.bulkCreate(rowsToInsert, {
                transaction: t
            });
            await t.commit();
            return savedRows;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async saveDocuments(req, userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const t = await models.sequelize.transaction();
        try {
            const identityProof = req.files?.["identity_proof"]?.[0] || null;
            const tenthMarksheet = req.files?.["tenth_marksheet"]?.[0] || null;
            const twelfthMarksheet = req.files?.["twelfth_marksheet"]?.[0] || null;
            const ageProof = req.files?.["age_proof"]?.[0] || null;

            const docsToProcess = [
                { file: identityProof, type: "IDENTITY_PROOF" },
                { file: tenthMarksheet, type: "TENTH_MARKSHEET" },
                { file: twelfthMarksheet, type: "TWELFTH_MARKSHEET" },
                { file: ageProof, type: "AGE_PROOF" }
            ];

            const savedDocs: any[] = [];

            for (const doc of docsToProcess) {
                if (!doc.file) continue;

                const file = doc.file;

                // Remove old document of same type
                await models.StudentDocuments.destroy({
                    where: {
                        user_id: userId,
                        document_type: doc.type
                    },
                    transaction: t
                });

                const saved = await models.StudentDocuments.create(
                    {
                        user_id: userId,
                        student_id: null,
                        document_type: doc.type as any,
                        document_name: file.originalname,
                        // document_path: `/api/admission/files/documents/${file.filename}`,
                        document_path:
                            buildFileUrl(
                                file.filename
                            ),
                        file_extension: path.extname(file.originalname).replace(".", ""),
                        file_size_kb: Math.round(file.size / 1024),
                        is_verified: false,
                        status: true,
                    },
                    { transaction: t }
                );
                savedDocs.push(saved);
            }
            await t.commit();
            return savedDocs;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async fetchPersonalDetails(userId: number, tenantName: string) {
        const models = getTenantModels(tenantName);

        // 1️⃣ Convert tenantName → tenantId
        const tenant = await tenantsService.getTenantByName(tenantName);

        // 2️⃣ Fetch rule: admission_document_requirements
        const documentRequirements = await rulesService.getJson(tenant.university_id,
            tenant.id,
            "admission_document_requirements"
        );

        // 3️⃣ Fetch pre-registration data
        const preReg = await models.StudentPreRegistration.findOne({
            where: { user_id: userId }
        });

        // 4️⃣ Fetch personal details
        const personal = await models.StudentPersonalDetails.findOne({
            where: { user_id: userId }
        });

        // 5️⃣ Fetch bank details
        const bank = await models.StudentBankDetails.findOne({
            where: { user_id: userId }
        });

        // 6️⃣ Fetch uploaded documents
        const docs = await models.StudentDocuments.findAll({
            where: { user_id: userId }
        });

        const profilePhoto = docs.find(d => d.document_type === "PROFILE_PHOTO") || null;
        const signature = docs.find(d => d.document_type === "SIGNATURE") || null;
        const identityProof = docs.find(d => d.document_type === "IDENTITY_PROOF") || null;
        const bankProof = docs.find(d => d.document_type === "BANK_PROOF") || null;
        const applicationStatus = await models.StudentApplicationStatus.findOne({ where: { user_id: userId } });

        // 7️⃣ Return everything together
        return {
            // PRE-REGISTRATION DATA
            user_id: preReg?.user_id || null,
            application_id: preReg?.application_id || null,
            first_name: preReg?.first_name || null,
            middle_name: preReg?.middle_name || null,
            last_name: preReg?.last_name || null,
            dob: preReg?.dob || null,
            gender: preReg?.gender || null,
            mobile: preReg?.mobile || null,
            email: preReg?.email || null,
            nationality: preReg?.nationality || null,
            category: preReg?.social_category || null,
            class_id: personal?.class_id || null,
            // PERSONAL DETAILS DATA
            id: personal?.id || null,
            academic_year_id: personal?.academic_year_id || null,
            program_id: personal?.program_id || null,
            religion: personal?.religion || null,
            aadhaar_number: personal?.aadhaar_number || null,
            marital_status: personal?.marital_status || null,
            blood_group: personal?.blood_group || null,
            mother_tongue: personal?.mother_tongue || null,
            identity_proof_type: personal?.identity_proof_type || null,
            identity_proof_number: personal?.identity_proof_number || null,
            is_physically_challenged: personal?.is_physically_challenged || 0,
            physical_disability_type: personal?.physical_disability_type || null,
            is_sports_person: personal?.is_sports_person || 0,
            is_banglar_shikha_id_present: personal?.is_banglar_shikha_id_present || 0,
            banglar_shikha_id: personal?.banglar_shikha_id || null,
            nearest_railway_station: personal?.nearest_railway_station || null,
            academic_bank_credit_id: personal?.academic_bank_credit_id || null,

            // BANK DETAILS
            bank_details: bank
                ? {
                    bank_name: bank.bank_name,
                    branch_name: bank.branch_name,
                    account_number: bank.account_number,
                    ifsc_code: bank.ifsc_code,
                    micr_code: bank.micr_code,
                    account_holder_name: bank.account_holder_name,
                    is_primary_account: bank.is_primary_account
                }
                : null,

            // DOCUMENTS
            documents: {
                profile_photo: profilePhoto,
                signature: signature,
                identity_proof: identityProof,
                bank_proof: bankProof
            },
            preview_confirmed: applicationStatus?.preview_confirmed ?? 0,

            // ⭐ RULE-DRIVEN DOCUMENT REQUIREMENTS
            document_requirements: documentRequirements,
            status: personal?.status ?? 0
        };
    }

    async fetchAddressDetails(userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const preReg = await models.StudentPreRegistration.findOne({ where: { user_id: userId } });
        const rows = await models.StudentAddress.findAll({ where: { user_id: userId } });
        const personal = await models.StudentAddress.findOne({ where: { user_id: userId } });
        const applicationStatus = await models.StudentApplicationStatus.findOne({ where: { user_id: userId } });
        return {
            user_id: preReg?.user_id || null,
            id: personal?.id || null,
            permanent: rows.find(r => r.address_type === "PERMANENT") || null,
            present: rows.find(r => r.address_type === "PRESENT") || null,
            preview_confirmed: applicationStatus?.preview_confirmed ?? 0,
            status: personal?.status ?? 0,
        };
    }

    async fetchGuardianDetails(userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const rows = await models.StudentGuardians.findAll({ where: { user_id: userId } });
        const preReg = await models.StudentPreRegistration.findOne({ where: { user_id: userId } });
        const personal = await models.StudentGuardians.findOne({ where: { user_id: userId } });
        const applicationStatus = await models.StudentApplicationStatus.findOne({ where: { user_id: userId } });
        return {
            id: personal?.id || null,
            user_id: preReg?.user_id || null,
            application_id: preReg?.application_id || null,
            father: rows.find(r => r.relationship === "FATHER") || null,
            mother: rows.find(r => r.relationship === "MOTHER") || null,
            guardian: rows.find(r => r.relationship === "GUARDIAN") || null,
            preview_confirmed: applicationStatus?.preview_confirmed ?? 0,
            status: personal?.status ?? 0,
        };
    }

    async fetchTenthResult(userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const rows = await models.StudentAcademicHistory.findAll({
            where: { user_id: userId, exam_name: "10TH" }
        });
        const preReg = await models.StudentPreRegistration.findOne({ where: { user_id: userId }, raw: true });
        const personal = await models.StudentAcademicHistory.findOne({ where: { user_id: userId, exam_name: "10TH" } });
        const applicationStatus = await models.StudentApplicationStatus.findOne({ where: { user_id: userId } });
        return {
            id: personal?.id || null,
            user_id: preReg?.user_id || null,
            application_id: preReg?.application_id || null,
            meta: rows[0] || null,
            subjects: rows,
            preview_confirmed: applicationStatus?.preview_confirmed ?? 0,
            status: personal?.status ?? 0,
        };
    }

    async fetchTwelfthResult(userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        const rows = await models.StudentAcademicHistory.findAll({
            where: { user_id: userId, exam_name: "12TH" }
        });
        const preReg = await models.StudentPreRegistration.findOne({ where: { user_id: userId }, raw: true });
        const personal = await models.StudentAcademicHistory.findOne({ where: { user_id: userId, exam_name: "12TH", } });
        const applicationStatus = await models.StudentApplicationStatus.findOne({ where: { user_id: userId } });
        return {
            id: personal?.id || null,
            user_id: preReg?.user_id || null,
            application_id: preReg?.application_id || null,
            hs_board: preReg?.hs_board || '',
            hs_registration_number: preReg?.hs_registration_number || '',
            hs_year_of_passing: preReg?.hs_year_of_passing || '',
            meta: rows[0] || null,
            subjects: rows,
            preview_confirmed: applicationStatus?.preview_confirmed ?? 0,
            status: personal?.status ?? 0,
        };
    }

    async fetchDocuments(userId: number, tenantName: string) {
        const models = getTenantModels(tenantName);

        // 1️⃣ Convert tenantName → tenantId
        const tenant = await tenantsService.getTenantByName(tenantName);

        // 2️⃣ Fetch uploaded documents
        const uploadedDocs = await models.StudentDocuments.findAll({
            where: { user_id: userId }
        });

        // 3️⃣ Fetch rule: admission_document_requirements
        const documentRequirements = await rulesService.getJson(tenant.university_id,
            tenant.id,
            "admission_document_requirements"
        );

        const preReg = await models.StudentPreRegistration.findOne({ where: { user_id: userId } });
        const personal = await models.StudentDocuments.findOne({ where: { user_id: userId } });
        const applicationStatus = await models.StudentApplicationStatus.findOne({ where: { user_id: userId } });
        // 4️⃣ Return both to frontend
        return {
            id: personal?.id || null,
            user_id: preReg?.user_id || null,
            application_id: preReg?.application_id || null,
            uploaded: uploadedDocs,
            requirements: documentRequirements,
            preview_confirmed: applicationStatus?.preview_confirmed ?? 0,
            status: personal?.status ?? 0
        };
    }

    async fetchProgram(userId: number, tenantName: string) {
        const models = getTenantModels(tenantName);
        const personalDetails = await models.StudentPersonalDetails.findOne({ where: { user_id: userId } });
        return {
            program_id: personalDetails?.program_id || null,
        }
    }

    async fetchDepartment(
        userId: number,
        tenantName: string, deprtId: number | string
    ) {
        const models = getTenantModels(tenantName);
        const deptIdNum = Number(deprtId); // req.params values are strings at runtime
        const personalDetails = await this.fetchPersonalDetails(userId, tenantName);
        // Selected department
        const selectedDepartment = await models.Department.findByPk(deptIdNum);

        if (!selectedDepartment) {
            throw new Error("Department not found");
        }

        let major = null;
        let minor: any[] = [];

        if (selectedDepartment.parent_id === null || selectedDepartment.parent_id === undefined) {
            major = null;
            minor = await models.Department.findAll({
                where: {
                    parent_id: selectedDepartment.id,
                },
                order: [["name", "ASC"]],
            });
        } else {
            // Get all departments having same parent_id (siblings of selected)
            const relatedDepartments = await models.Department.findAll({
                where: {
                    parent_id: selectedDepartment.parent_id,
                },
                order: [["name", "ASC"]],
            });
            major = relatedDepartments.find(
                dept => Number(dept.id) === deptIdNum
            ) || null;
            minor = relatedDepartments.filter(
                dept => Number(dept.id) !== deptIdNum
            );
        }

        const preReg = await models.StudentPreRegistration.findOne({
            where: { user_id: userId }
        });

        const applicationStatus = await models.StudentApplicationStatus.findOne({
            where: { user_id: userId }
        });


        return {
            id: selectedDepartment.id,
            application_id: preReg?.application_id || null,
            major,
            minor,
            personal_details: personalDetails,
            preview_confirmed:
                applicationStatus?.preview_confirmed ?? 0,
        };
    }

    async getPreview(userId: number, tenant: string) {
        const personal = await this.fetchPersonalDetails(userId, tenant);
        const address = await this.fetchAddressDetails(userId, tenant);
        const guardians = await this.fetchGuardianDetails(userId, tenant);
        const tenth = await this.fetchTenthResult(userId, tenant);
        const twelfth = await this.fetchTwelfthResult(userId, tenant);
        const documents = await this.fetchDocuments(userId, tenant);

        return {
            personal_details: personal,
            permanent_address: address.permanent,
            present_address: address.present,
            father_details: guardians.father,
            mother_details: guardians.mother,
            guardian_details: guardians.guardian,
            tenth_result: tenth,
            twelfth_result: twelfth,
            documents
        };
    }

    async confirmPreview(userId: number, tenant: string) {
        // 1. Fetch all data
        const personal = await this.fetchPersonalDetails(userId, tenant);
        const address = await this.fetchAddressDetails(userId, tenant);
        const guardians = await this.fetchGuardianDetails(userId, tenant);
        const tenth = await this.fetchTenthResult(userId, tenant);
        const twelfth = await this.fetchTwelfthResult(userId, tenant);
        const documents: any = await this.fetchDocuments(userId, tenant);

        // 2. Validate required sections
        if (!personal?.first_name || !personal?.last_name || !personal?.dob || !personal?.gender) {
            throw new Error("Personal details are incomplete");
        }

        if (!address.permanent || !address.present) {
            throw new Error("Address details are incomplete");
        }

        if ((!guardians.father && !guardians.mother) || !guardians.guardian) {
            throw new Error("Guardian details are incomplete");
        }

        if (!tenth.meta || tenth.subjects.length === 0) {
            throw new Error("10th result is incomplete");
        }

        if (!twelfth.meta || twelfth.subjects.length === 0) {
            throw new Error("12th result is incomplete");
        }

        const requiredDocs = [
            "IDENTITY_PROOF",
            "TENTH_MARKSHEET",
            "TWELFTH_MARKSHEET",
            "AGE_PROOF",
            "BANK_PROOF"
        ];

        for (const docType of requiredDocs) {
            const exists = documents.uploaded.find(d => d.document_type === docType);
            if (!exists) {
                throw new Error(`Missing required document: ${docType}`);
            }
        }

        if (!personal.status || !address.status || !guardians.status || !tenth.status || !twelfth.status || !documents.status) {
            throw new Error("All sections must have a status of 1 before confirming preview.");
        }

        const models = getTenantModels(tenant);
        // 3. Update or create status row
        const existing = await models.StudentApplicationStatus.findOne({
            where: { user_id: userId }
        });

        if (existing) {
            await existing.update({
                preview_confirmed: 1,
                preview_confirmed_at: new Date()
            });
        } else {
            await models.StudentApplicationStatus.create({
                user_id: userId,
                application_id: documents.application_id,
                preview_confirmed: 1,
                preview_confirmed_at: new Date()
            });
        }

        return {
            preview_confirmed: true,
            preview_confirmed_at: new Date()
        };
    }

    async finalSubmit(userId: number, tenantName: string) {
        const models = getTenantModels(tenantName);
        const t = await models.sequelize.transaction();

        try {
            // 1️⃣ Convert tenantName → tenantId
            const tenant = await tenantsService.getTenantByName(tenantName);

            // 2️⃣ Fetch rules
            const documentRequirements = await rulesService.getJson(tenant.university_id,
                tenant.id,
                "admission_document_requirements"
            );

            const academicFramework = await rulesService.getString(tenant.university_id, tenant.id, "academic_framework");
            const totalSemesters = await rulesService.getInt(tenant.university_id, tenant.id, "total_semesters");
            const multiExitEnabled = await rulesService.getBool(tenant.university_id, tenant.id, "multi_exit_enabled");

            // 3️⃣ Load application
            const application = await models.StudentApplications.findOne({
                where: { user_id: userId }
            });

            if (!application) {
                throw { status: 400, message: "Application not found" };
            }

            if (application.is_locked === 1) {
                throw { status: 400, message: "Application already submitted" };
            }

            // 4️⃣ Load workflow status
            const status = await models.StudentApplicationStatus.findOne({
                where: { application_id: application.id }
            });

            if (!status) {
                throw { status: 400, message: "Workflow not initialized" };
            }

            // 5️⃣ Validate workflow steps
            if (!status.preview_confirmed)
                throw { status: 400, message: "Preview not confirmed" };

            if (!status.subjects_selected)
                throw { status: 400, message: "Subject selection incomplete" };

            // 6️⃣ Validate required documents
            const uploadedDocs = await models.StudentDocuments.findAll({
                where: { user_id: userId }
            });

            const uploadedTypes: any = uploadedDocs.map(d => d.document_type);

            for (const [docType, isRequired] of Object.entries(documentRequirements)) {
                if (isRequired && !uploadedTypes.includes(docType)) {
                    throw {
                        status: 400,
                        message: `Missing required document: ${docType}`
                    };
                }
            }

            // 7️⃣ Validate subject selection rules
            const selectedSubjects = await models.StudentSubjects.findAll({
                where: { user_id: userId, is_active: 1 }
            });

            // Rule: total_semesters
            for (const ss of selectedSubjects) {
                if (ss.semester_id < 1 || ss.semester_id > totalSemesters) {
                    throw {
                        status: 400,
                        message: `Invalid semester in subject selection: ${ss.semester_id}`
                    };
                }
            }

            // Rule: multi_exit_enabled
            if (!multiExitEnabled) {
                const exitYearSubjects = selectedSubjects.filter(s => s.semester_id > 6);
                if (exitYearSubjects.length > 0) {
                    throw {
                        status: 400,
                        message: "Exit-year subjects not allowed when multi-exit is disabled"
                    };
                }
            }

            // Rule: academic_framework
            if (academicFramework === "CBCS") {
                // CBCS does not allow Minor/MDC
                if (application.program_type === "MAJOR-MINOR") {
                    throw {
                        status: 400,
                        message: "Minor/MDC not allowed under CBCS framework"
                    };
                }
            }

            // 8️⃣ Lock application
            await models.StudentApplications.update(
                {
                    application_status: "SUBMITTED",
                    is_locked: 1
                },
                { where: { id: application.id }, transaction: t }
            );

            // 9️⃣ Update workflow
            await models.StudentApplicationStatus.update(
                { final_submitted: 1 },
                { where: { application_id: application.id }, transaction: t }
            );

            await t.commit();
            try {
                const adminQuery = `SELECT user_id FROM users WHERE role IS NOT NULL AND LOWER(role) LIKE '%admin%'`;
                const admins: any[] = await models.sequelize.query(adminQuery, {
                    type: QueryTypes.SELECT,
                });
                if (admins && admins.length > 0) {
                    const title = "Application Finalized";
                    const message = `Student application ${(application as any).application_no || application.id} has been submitted and confirmed.`;
                    const insertQuery = `
                        INSERT INTO notifications (
                            user_id, student_id, registration_id, channel, to_address, template_key, title, message, payload, type, link, is_read, status, created_at, updated_at
                        ) VALUES ${admins.map(() => '(?, NULL, NULL, "IN_APP", "", "APPLICATION_NOTIF", ?, ?, "{}", ?, ?, 0, "SENT", NOW(), NOW())').join(', ')}
                    `;
                    const replacements = admins.flatMap((admin: any) => [
                        admin.user_id,
                        title,
                        message,
                        'info',
                        '/admin/student-selection',
                    ]);
                    await models.sequelize.query(insertQuery, {
                        replacements,
                        type: QueryTypes.INSERT,
                    });
                }
            } catch (notifErr) {
                console.error("[APPLICATION NOTIFICATION ERROR] Failed to notify admins:", notifErr);
            }
            return { success: true, message: "Application submitted successfully" };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async saveSubject(req, userId: number, tenant: string) {
        const models = getTenantModels(tenant);

        // Ensure database column allows NULL for major_department_id
        try {
            await models.sequelize.query(
                "ALTER TABLE student_program_choices MODIFY COLUMN major_department_id BIGINT UNSIGNED NULL;"
            );
        } catch (e) {
            // Ignore if already nullable or permission issue
        }

        const t = await models.sequelize.transaction();

        try {
            const {
                major_department_id,
                minor_department_id,
                mdc_department_id
            } = req.body;

            // Accept both a real JSON array and a stringified array "[5,6]"
            let minorIds = minor_department_id;
            if (typeof minorIds === "string") {
                try {
                    minorIds = JSON.parse(minorIds);
                } catch {
                    minorIds = [];
                }
            }

            if (!minorIds || !Array.isArray(minorIds) || minorIds.length === 0) {
                throw new Error("minor_department_id is required");
            }


            const subjectData = {
                user_id: userId,
                // student_id: null,
                major_department_id: major_department_id ? Number(major_department_id) : null,
                minor_department_id: JSON.stringify(minorIds),
                mdc_department_id: mdc_department_id ? Number(mdc_department_id) : null,
            };

            console.log("Subject Data ====?/", subjectData);

            // Update if exists, otherwise create
            let subjectChoice = await models.StudentProgramChoices.findOne({
                where: { user_id: userId },
                transaction: t,
            });

            if (subjectChoice) {
                await subjectChoice.update(subjectData, {
                    transaction: t,
                });
            } else {
                subjectChoice = await models.StudentProgramChoices.create(
                    subjectData,
                    { transaction: t }
                );
            }

            // Update application status
            let applicationStatus = await models.StudentApplicationStatus.findOne({
                where: { user_id: userId },
                transaction: t,
            });
            if (applicationStatus) {
                await applicationStatus.update({
                    final_submitted: 1,
                    final_submitted_at: new Date()
                });
            }

            if (applicationStatus) {
                await applicationStatus.update(
                    { subjects_selected: 1, subjects_selected_at: new Date() } as any,
                    { transaction: t }
                );
            }
            if (applicationStatus) {
                await applicationStatus.update(
                    { status: 'REGISTRATION_COMPLETED' } as any,
                    { transaction: t }
                )
            }

            await t.commit();

            return subjectChoice;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async getSubject(req, userId: number, tenant: string) {
        const models = getTenantModels(tenant);
        try {
            const subjects = await models.StudentProgramChoices.findOne({
                where: { user_id: userId },
            });
            return subjects;
        } catch (error) {
            throw error;
        }
    }
}