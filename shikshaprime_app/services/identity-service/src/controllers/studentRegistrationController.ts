import { Request, Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { config } from "../config";

import { PhonePeService } from '../services/phonePeService';
import { registerPendingPhonePeOrder } from "../workers/phonepeReconciliationScheduler";

import { sendRegistrationEmail } from "../utils/emailService";
import { sendPaymentSuccessEmail, sendRegistrationPaymentSuccessEmail } from "../utils/emailService";
import { sendSelectionEmail } from "../utils/emailService";
import { sendAdmissionCompletedEmail } from "../utils/emailService";

import nodemailer from 'nodemailer';
import axios from 'axios';
import Razorpay from 'razorpay';
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { mapListRegistrationsToDb, mapRegisterStudentToDb } from "../utils/mappers";
import { getTenantSequelize } from "../server";
import { buildFrontendUrl } from "../utils/tenantUrlBuilder";

async function generateReceiptPdf(payment: PaymentRow, registration: RegistrationRow): Promise<string> {
    const storageDir = path.resolve(process.cwd(), "storage", "receipts");
    await fs.promises.mkdir(storageDir, { recursive: true });

    const filename = `${payment.receipt_no || `receipt_${payment.id}`}.pdf`;
    const filePath = path.join(storageDir, filename);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(18).text("Payment Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt No: ${payment.receipt_no || "N/A"}`);
    doc.text(`Paid At: ${payment.paid_at || "N/A"}`);
    doc.text(`Gateway Ref: ${payment.gateway_transaction_id || "N/A"}`);
    doc.moveDown();
    doc.text(`Student: ${registration.first_name} ${registration.last_name}`);
    doc.text(`Registration ID: ${registration.registration_id}`);
    doc.moveDown();
    doc.text(`Fee Type: ${payment.fee_type}`);
    doc.text(`Amount: ${payment.amount} ${payment.currency || "INR"}`);
    doc.text(`Payment Mode: ${payment.payment_mode}`);

    doc.end();

    await new Promise<void>((resolve) => stream.on("finish", () => resolve()));

    const publicUrl = `/api/identity/files/receipts/${filename}`;
    return publicUrl;
}

interface AcademicYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: number;
}

interface ClassItem {
    id: number;
    code: string;
    name: string;
}

interface Department {
    id: number;
    parent_id: number;
    code: string;
    name: string;
    level: number;
}

interface Program {
    id: number;
    department_id: number;
    code: string;
    name: string;
    degree_type: string;
    duration_years: number;
}

interface Semester {
    id: number;    
    semester_number: number;
    name: string;    
}

interface RegistrationRow {
    id: number;
    registration_id: string;
    mode: string;
    first_name: string;
    last_name: string;
    gender: string;
    date_of_birth: string;
    class_id: number;
    department_id: number;
    program_id: number;
    academic_year_id: number;
    father_name: string;
    mother_name: string | null;
    mobile: string;
    email: string;
    guardian_mobile: string | null;
    guardian_email: string | null;
    address_line: string | null;
    city: string | null;
    state: string | null;
    pin_code: string | null;
    previous_school_name: string | null;
    last_class_passed: string | null;
    board_university_10th: string | null;
    ten_percentage: number | null;
    year_of_passing_10th: string | null;
    board_university_12th: string | null;
    twelve_percentage: number | null;
    year_of_passing_12th: string | null;
    status: string;
    remarks: string | null;
    entered_by_user_id: number | null;
    entered_by_name: string | null;
    created_at: string;
    updated_at: string;
}

interface AdminSelectionRow {
    id: number;
    registration_id: string;
    student_name: string;
    parent_name: string;
    class_name: string;
    department_name: string | null;
    mobile: string;
    email: string;
    status: string;
    remarks: string | null;
    academic_year: string;
}

interface PaymentRow {
    id: number;
    registration_id: number;
    fee_type: string;
    amount: number;
    currency: string;
    payment_mode: string;
    gateway_transaction_id: string | null;
    status: string;
    receipt_no: string | null;
    receipt_pdf_url: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
}

interface InsertResult {
    insertId: number;
}
export const getAcademicYears = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const results = await sequelize.query<AcademicYear>(
            `SELECT id, name, start_date, end_date, is_active 
       FROM academic_years 
       WHERE is_active = 1 
       ORDER BY start_date DESC`,
            { type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 1,
            data: results,
            message: "Academic years fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getClasses = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const results = await sequelize.query<ClassItem>(
            `SELECT id, code, name FROM classes ORDER BY id`,
            { type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 1,
            data: results,
            message: "Classes fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const getDepartments = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const results = await sequelize.query<Department>(
            `SELECT id, parent_id, code, name, level FROM departments ORDER BY name`,
            { type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 1,
            data: results,
            message: "Departments fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getDepartmentsLevelTwo = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const results = await sequelize.query<Department>(
            `SELECT id, code, name FROM departments WHERE level=1 ORDER BY name`,
            { type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 1,
            data: results,
            message: "Level 2 departments fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getPrograms = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const results = await sequelize.query<Program>(
            `SELECT id, department_id, code, name, degree_type, duration_years FROM programs ORDER BY id`,
            { type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 1,
            data: results,
            message: "Programs fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getProgramSubjects = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const results = await sequelize.query(
            `SELECT s.id AS subject_id, 
            s.name AS subject_name 
            FROM subjects s 
            INNER JOIN program_departments ps ON ps.subject_id = s.id 
            WHERE ps.program_id = :programId AND ps.department_id = :departmentId;`,
            {
                replacements: { programId: req.body.programId, departmentId: req.body.parentDepartmentId },
                type: QueryTypes.SELECT
            }
        );

        res.status(200).json({
            status: 1,
            data: results,
            message: "Program subjects fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getSemesters = async (req, res, next: NextFunction) => {    
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const results = await sequelize.query<Semester>(
            `SELECT id, semester_number, name FROM semesters 
             WHERE program_id = :programId AND class_id = :classId ORDER BY id;`,
            { 
                replacements: { programId: req.query.programId, classId: req.query.classId },
                type: QueryTypes.SELECT 
            }
        );

        res.status(200).json({
            status: 1,
            data: results,
            message: "Semesters fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getFeeStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Simple admission fee structure
        const feeStructure = [
            {
                fee_type: 'ADMISSION',
                description: 'Admission Fee',
                amount: 500,
                currency: 'INR'
            },
            {
                fee_type: 'REGISTRATION',
                description: 'Registration Fee',
                amount: 100,
                currency: 'INR'
            }

        ];

        res.status(200).json({
            status: 1,
            data: feeStructure,
            message: "Fee structure fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const registerStudent = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const params = mapRegisterStudentToDb(req.body, req.files);
        console.log('[DEBUG] mapped params:', params);

        const requiredFields = ['first_name', 'last_name', 'date_of_birth', 'class_id', 'academic_year_id', 'program_id', 'department_id', 'father_name', 'mobile', 'email'];
        const missingFields = requiredFields.filter(field => !params[field]);

        if (missingFields.length > 0) {
            throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400);
        }

        const [result] = await sequelize.query(
            `INSERT INTO student_registrations (
            registration_id, mode, first_name, last_name, gender, date_of_birth,
            class_id, department_id, program_id, academic_year_id,
            father_name, mother_name, mobile, email, religion, is_physically_challenged, guardian_name, guardian_mobile, guardian_email,
            address_line, city, state, pin_code,
            previous_school_name, last_class_passed, board_university_10th, ten_percentage, year_of_passing_10th, 
            board_university_12th, twelve_percentage, year_of_passing_12th,
            board_university_graduation, graduation_percentage, year_of_passing_graduation,
            caste, degree, id_proof_type, id_proof_number, nationality,
            aadhar_doc, birth_certificate_doc, ten_marksheet_doc, twelve_marksheet_doc, graduation_doc, caste_certificate_doc, 
            physically_challenged_certificate, profile_img,
            status
            ) VALUES (
            :registration_id, 'ONLINE', :first_name, :last_name, :gender, :date_of_birth,
            :class_id, :department_id, :program_id, :academic_year_id,
            :father_name, :mother_name, :mobile, :email, :religion, :is_physically_challenged, :guardian_name, :guardian_mobile, :guardian_email,
            :address_line, :city, :state, :pin_code,
            :previous_school_name, :last_class_passed, :board_university_10th, :ten_percentage, :year_of_passing_10th, 
            :board_university_12th, :twelve_percentage, :year_of_passing_12th,
            :board_university_graduation, :graduation_percentage, :year_of_passing_graduation,
            :caste, :degree, :id_proof_type, :id_proof_number, :nationality,
            :aadhar_doc, :birth_certificate_doc, :ten_marksheet_doc, :twelve_marksheet_doc, :graduation_doc, :caste_certificate_doc, 
            :physically_challenged_certificate, :profile_img, 'REGISTRATION_PENDING'
            )`,
            {
                replacements: params,
                type: QueryTypes.INSERT
            }
        );

        console.log('[DEBUG] INSERT result:', result);

        const insertId = result;

        let [registration] = await sequelize.query<RegistrationRow>(
            `SELECT * FROM student_registrations WHERE id = :id`,
            { replacements: { id: insertId }, type: QueryTypes.SELECT }
        );

        const paymentUrl = buildFrontendUrl(req.tenant, `/student-payment?regId=${registration.registration_id}`);
        // =========================
        // EXISTING QUEUE (unchanged)
        // =========================
        await queueNotification(insertId, 'EMAIL', params.email, 'REGISTRATION_ACKNOWLEDGMENT', req.tenant, {
            student_name: `${params.first_name} ${params.last_name}`,
            registration_id: registration?.registration_id,
            payment_url: paymentUrl
        });

        await queueNotification(insertId, 'SMS', params.mobile, 'REGISTRATION_ACKNOWLEDGMENT', req.tenant,{
            student_name: `${params.first_name} ${params.last_name}`,
            registration_id: registration?.registration_id,
            payment_url: paymentUrl
        });

        // =========================
        // NEW: Direct SMTP Email
        // =========================
        try {
            await sendRegistrationEmail(
                params.email,
                `${params.first_name} ${params.last_name}`,
                registration?.registration_id,
                paymentUrl
            );

            console.log("Sending email to:", params.email);

        } catch (err) {
            console.error("SMTP failed:", err);
        }


        res.status(201).json({
            status: 1,
            data: {
                id: insertId,
                registration_id: registration?.registration_id,
                status: 'REGISTRATION_PENDING'
            },
            message: "Registration submitted successfully. Please complete the registration fee payment via the link sent to your email/SMS."
        });

    } catch (error) {
        console.error('[ERROR] registerStudent failed:', error);
        next(error);
    }
};

export const adminRegisterStudent = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const params = mapRegisterStudentToDb(req.body);
        const [result] = await sequelize.query(
            `INSERT INTO student_registrations (
            registration_id, mode, first_name, last_name, gender, date_of_birth,
            class_id, department_id, academic_year_id,
            father_name, mother_name, mobile, email, guardian_mobile, guardian_email,
            address_line, city, state, pin_code,
            previous_school_name, last_class_passed, board_university_10th, ten_percentage, year_of_passing_10th, 
            board_university_12th, twelve_percentage, year_of_passing_12th,
            aadhar_doc, birth_certificate_doc, ten_marksheet_doc, twelve_marksheet_doc, profile_img,
            status, entered_by_user_id, entered_by_name
      ) VALUES (
        :registration_id, 'OFFLINE', :first_name, :last_name, :gender, :date_of_birth,
        :class_id, :department_id, :academic_year_id,
        :father_name, :mother_name, :mobile, :email, :guardian_mobile, :guardian_email,
        :address_line, :city, :state, :pin_code,
        :previous_school_name, :last_class_passed, :board_university_10th, :ten_percentage, :year_of_passing_10th, 
        :board_university_12th, :twelve_percentage, :year_of_passing_12th,
        :aadhar_doc, :birth_certificate_doc, :ten_marksheet_doc, :twelve_marksheet_doc, :profile_img,
        'SUBMITTED', :entered_by_user_id, :entered_by_name
      )`,
            {
                replacements: {
                    ...params,
                    entered_by_user_id: (req as any).user?.id || null,
                    entered_by_name: (req as any).user?.email || null
                },
                type: QueryTypes.INSERT
            }
        );

        console.log('[DEBUG] Admin INSERT result:', result);
        const insertId = result[0];
        console.log('[DEBUG] Admin Extracted insertId:', insertId);

        let [registration] = await sequelize.query<RegistrationRow>(
            `SELECT * FROM student_registrations WHERE id = :id`,
            { replacements: { id: insertId }, type: QueryTypes.SELECT }
        );

        // =========================
        // SMTP EMAIL (added block)
        // =========================
        try {
            const studentId = registration?.registration_id; // use real student_id if available
            console.log('[DEBUG] Sending email to:', registration?.email);

            await sendAdmissionCompletedEmail(
                registration?.email,
                `${registration?.first_name} ${registration?.last_name}`,
                studentId
            );

            console.log('[INFO] Admission completed email sent');
        } catch (smtpError) {
            console.error('[WARN] Admission SMTP email failed:', smtpError);
        }

        res.status(201).json({
            status: 1,
            data: {
                id: insertId,
                registration_id: registration?.registration_id,
                mode: 'OFFLINE',
                status: 'SUBMITTED'
            },
            message: "Offline registration created successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const listRegistrations = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const params = mapListRegistrationsToDb(req.query);
        let whereClause = "WHERE 1=1";
        const replacements: Record<string, unknown> = {};

        if (params?.search_text) {
            whereClause += ` AND ( CONCAT_WS(' ', r.first_name, r.last_name) LIKE :search_text OR r.registration_id LIKE :search_text )`;
            replacements.search_text = `%${params.search_text}%`;
        }

        if (params?.class_id) {
            whereClause += " AND c.id = :class_id";
            replacements.class_id = params.class_id;
        }

        if (params?.academic_year_id) {
            whereClause += " AND ay.id = :academic_year_id";
            replacements.academic_year_id = params.academic_year_id;
        }

        if (params?.status) {
            whereClause += " AND r.status = :status";
            replacements.status = params.status;
        }

        const offset = (Number(params.page) - 1) * Number(params.limit);
        replacements.limit = Number(params.limit);
        replacements.offset = offset;
        const results = await sequelize.query<AdminSelectionRow>(
            `SELECT 
        r.id,
        r.registration_id,
        CONCAT_WS(' ', r.first_name, r.last_name) AS student_name,
        r.father_name AS parent_name,
        c.name AS class_name,
        d.name AS department_name,
        r.mobile,
        r.email,
        r.status,
        r.remarks,
        ay.name AS academic_year
      FROM student_registrations r
      LEFT JOIN classes c ON c.id = r.class_id
      LEFT JOIN departments d ON d.id = r.department_id
      LEFT JOIN academic_years ay ON ay.id = r.academic_year_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT :limit OFFSET :offset`,
            { replacements, type: QueryTypes.SELECT }
        );
        const [countResult] = await sequelize.query<{ total: number }>(
            `SELECT COUNT(*) as total
       FROM student_registrations r
       LEFT JOIN classes c ON c.id = r.class_id
       LEFT JOIN departments d ON d.id = r.department_id
       LEFT JOIN academic_years ay ON ay.id = r.academic_year_id
       ${whereClause}`,
            { replacements, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 1,
            data: {
                registrations: results,
                pagination: {
                    page: Number(params?.page),
                    limit: Number(params?.limit),
                    total: countResult?.total || 0,
                    totalPages: Math.ceil((countResult?.total || 0) / Number(params?.limit))
                }
            },
            message: "Registrations fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};
export const getRegistrationById = async (req, res, next: NextFunction) => {
    try {
        const sequelize = getTenantSequelize(req.tenant);
        const { id } = req.params;
        const [registration] = await sequelize.query<RegistrationRow & { program_name: string; class_name: string; department_name: string; academic_year: string }>(
            `SELECT r.*, p.name as program_name, c.name as class_name, d.name as department_name, ay.name as academic_year
       FROM student_registrations r
       JOIN classes c ON c.id = r.class_id
       JOIN departments d ON d.id = r.department_id
       JOIN academic_years ay ON ay.id = r.academic_year_id 
       JOIN programs p ON p.id = r.program_id
       WHERE r.id = :id`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );

        if (!registration) {
            throw new AppError("Registration not found", 404);
        }

        // Build absolute document URLs for UI consumption
        const toAbsoluteUrl = (p?: string | null) => {
            if (!p) return null;
            return p.startsWith('/') ? `${req.protocol}://${req.get('host')}${p}` : p;
        };

        const documents = {
            profile_img: toAbsoluteUrl((registration as any).profile_img),
            aadhar: toAbsoluteUrl((registration as any).aadhar_doc),
            birth_certificate: toAbsoluteUrl((registration as any).birth_certificate_doc),
            ten_marksheet: toAbsoluteUrl((registration as any).ten_marksheet_doc),
            twelve_marksheet: toAbsoluteUrl((registration as any).twelve_marksheet_doc),
            graduation_doc: toAbsoluteUrl((registration as any).graduation_doc),
            caste_certificate_doc: toAbsoluteUrl((registration as any).caste_certificate_doc),
            physically_challenged_certificate: toAbsoluteUrl((registration as any).physically_challenged_certificate)
        };

        res.status(200).json({
            status: 1,
            data: {
                ...registration,
                documents
            },
            message: "Registration fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};
export const updateRegistrationStatus = async (req, res, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const sequelize = getTenantSequelize(req.tenant);

        const validStatuses = [
            'REGISTRATION_PENDING',
            'REGISTRATION_COMPLETED',
            'SUBMITTED',
            'PENDING',
            'SELECTED',
            'REJECTED',
            'PAYMENT_PENDING',
            'PAYMENT_COMPLETED'
        ];
        if (status && !validStatuses.includes(status)) {
            throw new AppError(`Invalid status. Valid values: ${validStatuses.join(', ')}`, 400);
        }
        const updates: string[] = [];
        const replacements: Record<string, unknown> = { id };

        if (status) {
            updates.push("status = :status");
            replacements.status = status;
        }

        if (remarks !== undefined) {
            updates.push("remarks = :remarks");
            replacements.remarks = remarks;
        }

        if (updates.length === 0) {
            throw new AppError("No fields to update", 400);
        }

        await sequelize.query(
            `UPDATE student_registrations SET ${updates.join(', ')} WHERE id = :id`,
            { replacements, type: QueryTypes.UPDATE }
        );
        const [registration] = await sequelize.query<RegistrationRow>(
            `SELECT * FROM student_registrations WHERE id = :id`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );

        if (!registration) {
            throw new AppError("Registration not found", 404);
        }
        if (status === 'SELECTED') {
            const paymentUrl = buildFrontendUrl(req.tenant, `/student-payment?regId=${registration.registration_id}`);
            await queueNotification(
                Number(id),
                'EMAIL',
                registration.email,
                'SELECTION_PAYMENT_LINK',
                req.tenant,
                {
                    student_name: `${registration.first_name} ${registration.last_name}`,
                    registration_id: registration.registration_id,
                    payment_url: paymentUrl
                }
            );

            await queueNotification(
                Number(id),
                'SMS',
                registration.mobile,
                'SELECTION_PAYMENT_LINK',
                req.tenant,
                {
                    student_name: `${registration.first_name} ${registration.last_name}`,
                    registration_id: registration.registration_id,
                    payment_url: paymentUrl
                }
            );
            await sequelize.query(
                `UPDATE student_registrations SET status = 'PAYMENT_PENDING' WHERE id = :id`,
                { replacements: { id }, type: QueryTypes.UPDATE }
            );
        }

        res.status(200).json({
            status: 1,
            data: {
                id: registration.id,
                registration_id: registration.registration_id,
                status: status === 'SELECTED' ? 'PAYMENT_PENDING' : registration.status,
                remarks: registration.remarks
            },
            message: status === 'SELECTED'
                ? "Student selected. Payment link sent via email and SMS."
                : "Registration status updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const resendPaymentNotification = async (req, res, next: NextFunction) => {
    try {
        // support either :id or :registrationId path params
        const idParam = (req.params as any).registrationId || (req.params as any).id;
        const id = idParam;
        const sequelize = getTenantSequelize(req.tenant);

        const [registration] = await sequelize.query<RegistrationRow>(
            `SELECT * FROM student_registrations WHERE registration_id = :id`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );

        if (!registration) {
            throw new AppError("Registration not found", 404);
        }
        if (registration.status === 'PAYMENT_PENDING') {
            const paymentUrl = buildFrontendUrl(req.tenant, `/student-payment?regId=${registration.registration_id}`);

            await queueNotification(
                Number(registration.id),
                'EMAIL',
                registration.email,
                'SELECTION_PAYMENT_LINK',
                req.tenant,
                {
                    student_name: `${registration.first_name} ${registration.last_name}`,
                    registration_id: registration.registration_id,
                    payment_url: paymentUrl
                }
            );

            await queueNotification(
                Number(registration.id),
                'SMS',
                registration.mobile,
                'SELECTION_PAYMENT_LINK',
                req.tenant,
                {
                    student_name: `${registration.first_name} ${registration.last_name}`,
                    registration_id: registration.registration_id,
                    payment_url: paymentUrl
                }
            );
        }

        res.status(200).json({
            status: 1,
            data: {},
            message: "Payment link has been re-sent via email and SMS."
        });
    } catch (error) {
        next(error);
    }
};

export const bulkUpdateRegistrationStatus = async (req, res, next: NextFunction) => {
    try {
        const { registrationIds, status, remarks } = req.body;
        if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
            throw new AppError("registrationIds must be a non-empty array of registration ID strings (e.g., REG-20260118014723-9511)", 400);
        }

        if (!status) {
            throw new AppError("status is required", 400);
        }

        const validStatuses = [
            'REGISTRATION_PENDING',
            'REGISTRATION_COMPLETED',
            'SUBMITTED',
            'PENDING',
            'SELECTED',
            'REJECTED',
            'PAYMENT_PENDING',
            'PAYMENT_COMPLETED'
        ];

        if (!validStatuses.includes(status)) {
            throw new AppError(`Invalid status. Valid values: ${validStatuses.join(', ')}`, 400);
        }

        const results: Array<{
            id: number;
            registration_id: string;
            status: string;
            success: boolean;
            message: string;
        }> = [];

        let successCount = 0;
        let failedCount = 0;
        for (const regId of registrationIds) {
            try {
                const sequelize = getTenantSequelize(req.tenant);
                // First, find the registration by registration_id string
                const [registration] = await sequelize.query<RegistrationRow>(
                    `SELECT * FROM student_registrations WHERE registration_id = :regId`,
                    { replacements: { regId }, type: QueryTypes.SELECT }
                );

                if (!registration) {
                    results.push({
                        id: 0,
                        registration_id: regId,
                        status: 'FAILED',
                        success: false,
                        message: 'Registration not found'
                    });
                    failedCount++;
                    continue;
                }

                const updates: string[] = ["status = :status"];
                const replacements: Record<string, unknown> = { id: registration.id, status };

                if (remarks !== undefined) {
                    updates.push("remarks = :remarks");
                    replacements.remarks = remarks;
                }

                await sequelize.query(
                    `UPDATE student_registrations SET ${updates.join(', ')} WHERE id = :id`,
                    { replacements, type: QueryTypes.UPDATE }
                );

                if (status === 'SELECTED') {
                    const paymentUrl = buildFrontendUrl(req.tenant, `/student-payment?regId=${registration.registration_id}`);
                    
                    // Send selection email via ZeptoMail
                    await sendSelectionEmail(
                        registration.email,
                        `${registration.first_name} ${registration.last_name}`,
                        registration.registration_id,
                        paymentUrl
                    );

                    // Optional: keep SMS if required
                    await queueNotification(
                        registration.id,
                        'SMS',
                        registration.mobile,
                        'SELECTION_PAYMENT_LINK',
                        req.tenant,
                        {
                            student_name: `${registration.first_name} ${registration.last_name}`,
                            registration_id: registration.registration_id,
                            payment_url: paymentUrl
                        }
                    );

                    // Update status to PAYMENT_PENDING
                    await sequelize.query(
                        `UPDATE student_registrations SET status = 'PAYMENT_PENDING' WHERE id = :id`,
                        { replacements: { id: registration.id }, type: QueryTypes.UPDATE }
                    );
                }


                results.push({
                    id: registration.id,
                    registration_id: registration.registration_id,
                    status: status === 'SELECTED' ? 'PAYMENT_PENDING' : status,
                    success: true,
                    message: status === 'SELECTED'
                        ? 'Selected and payment link sent'
                        : 'Status updated successfully'
                });
                successCount++;

            } catch (err) {
                results.push({
                    id: 0,
                    registration_id: regId,
                    status: 'FAILED',
                    success: false,
                    message: err instanceof Error ? err.message : 'Unknown error'
                });
                failedCount++;
            }
        }

        res.status(200).json({
            status: 1,
            data: {
                total: registrationIds.length,
                success: successCount,
                failed: failedCount,
                results: results
            },
            message: status === 'SELECTED'
                ? `${successCount} student(s) selected. Payment links sent via email and SMS.`
                : `${successCount} registration(s) updated successfully.`
        });
    } catch (error) {
        next(error);
    }
};


export const getRegistrationByRegId = async (req, res, next: NextFunction) => {
    try {
        const { regId } = req.params;
        const sequelize = getTenantSequelize(req.tenant);

        const [registration] = await sequelize.query<
            RegistrationRow & {
                program_name: string;
                class_name: string;
                department_name: string;
                academic_year: string;
                sections: string;
                subjects: string;
                semesters: string;
            }
        >(
            `SELECT r.*, 
                p.name AS program_name, 
                c.name AS class_name, 
                d.name AS department_name, 
                ay.name AS academic_year, 
                JSON_ARRAYAGG(
                    JSON_OBJECT('code', sec.id, 'name', sec.name)
                ) AS sections,
                (
                    SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                            'subject_id', d2.id,
                            'subject_name', d2.name,
                            'is_core', ps.is_core
                            )
                        )
                    FROM subjects d2
                    INNER JOIN program_departments ps 
                    ON d2.id = ps.subject_id
                    WHERE ps.program_id = r.program_id
                    AND ps.department_id = r.department_id
                ) AS subjects,
                (
                    SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                            'semester_id', sem.id,
                            'semester_name', sem.name
                            )
                        )
                    FROM semesters sem
                    WHERE sem.program_id = r.program_id
                    AND sem.class_id = r.class_id
                ) AS semesters
        FROM student_registrations r
        JOIN classes c ON c.id = r.class_id
        JOIN departments d ON d.id = r.department_id
        JOIN academic_years ay ON ay.id = r.academic_year_id
        JOIN programs p ON p.id = r.program_id
        LEFT JOIN sections sec 
            ON sec.program_id = r.program_id 
            AND sec.class_id = r.class_id
        WHERE r.registration_id = :regId
        GROUP BY r.registration_id, p.name, c.name, d.name, ay.name;`,
            {
                replacements: { regId },
                type: QueryTypes.SELECT
            }
        );



        if (!registration) {
            throw new AppError("Registration not found", 404);
        }

        const paymentAllowed = ['REGISTRATION_PENDING', 'PAYMENT_PENDING'].includes(registration.status);

        // Build absolute document URLs
        const toAbsoluteUrl = (p?: string | null) => {
            if (!p) return null;
            return p.startsWith('/') ? `${req.protocol}://${req.get('host')}${p}` : p;
        };

        const documents = {
            aadhar: toAbsoluteUrl((registration as any).aadhar_doc),
            birth_certificate: toAbsoluteUrl((registration as any).birth_certificate_doc),
            ten_marksheet: toAbsoluteUrl((registration as any).ten_marksheet_doc),
            twelve_marksheet: toAbsoluteUrl((registration as any).twelve_marksheet_doc),
            graduation: toAbsoluteUrl((registration as any).graduation_doc),
            caste_certificate: toAbsoluteUrl((registration as any).caste_certificate_doc),
            physically_challenged_certificate: toAbsoluteUrl((registration as any).physically_challenged_certificate),
            profile_img: toAbsoluteUrl((registration as any).profile_img)
        };

        let feeType: string | null = null;
        let feeDescription: string | null = null;
        let amount = 0;

        if (registration.status === 'REGISTRATION_PENDING') {
            feeType = 'REGISTRATION';
            feeDescription = 'Registration Fee';
            amount = 100;
        } else if (registration.status === 'PAYMENT_PENDING') {
            feeType = 'ADMISSION';
            feeDescription = 'Admission Fee';
            amount = 500;
        }

        res.status(200).json({
            status: 1,
            data: {
                ...registration,
                student_name: `${registration.first_name} ${registration.last_name}`,
                program_name: registration.program_name,
                class_name: registration.class_name,
                department_name: registration.department_name,
                academic_year: registration.academic_year,
                sections: registration.sections ? JSON.parse(registration.sections) : [],
                subjects: registration.subjects ? JSON.parse(registration.subjects) : [],
                semesters: registration.semesters ? JSON.parse(registration.semesters) : [],
                documents,
                payment_allowed: paymentAllowed,
                payment_details: paymentAllowed ? {
                    fee_type: feeType,
                    description: feeDescription,
                    amount: amount,
                    currency: 'INR'
                } : null,
                message: paymentAllowed
                    ? 'Payment can be processed'
                    : `Payment not allowed. Current status: ${registration.status}`
            },
            message: "Registration details fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};
// export const initiatePayment = async (req: Request, res: Response, next: NextFunction) => {

//     try {
//         const { registration_id, fee_type, amount, payment_mode } = req.body;
//         if (!registration_id || !fee_type || !amount || !payment_mode) {
//             throw new AppError("Missing required fields: registration_id, fee_type, amount, payment_mode", 400);
//         }


//         const feeStructure: Record<string, number> = {
//             'REGISTRATION': 100,
//             'ADMISSION': 500
//         };

//         const validFeeTypes = ['REGISTRATION', 'ADMISSION'];
//         if (!validFeeTypes.includes(fee_type)) {
//             throw new AppError(`Invalid fee_type. Valid values: ${validFeeTypes.join(', ')}`, 400);
//         }

//         const expectedAmount = feeStructure[fee_type];
//         if (Number(amount) !== expectedAmount) {
//             throw new AppError(`Invalid amount for ${fee_type}. Expected: ₹${expectedAmount}, Received: ₹${amount}`, 400);
//         }

//         const validPaymentModes = ['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING'];
//         if (!validPaymentModes.includes(payment_mode)) {
//             throw new AppError(`Invalid payment_mode. Valid values: ${validPaymentModes.join(', ')}`, 400);
//         }
//         const [registration] = await sequelize.query<RegistrationRow>(
//             `SELECT * FROM student_registrations WHERE id = :registration_id`,
//             { replacements: { registration_id }, type: QueryTypes.SELECT }
//         );

//         if (!registration) {
//             throw new AppError("Registration not found", 404);
//         }

//         // Validate status based on fee type
//         if (fee_type === 'REGISTRATION' && registration.status !== 'REGISTRATION_PENDING') {
//             throw new AppError(`Cannot pay registration fee. Current status: ${registration.status}. Expected: REGISTRATION_PENDING`, 400);
//         }
//         if (fee_type === 'ADMISSION' && registration.status !== 'PAYMENT_PENDING') {
//             throw new AppError(`Cannot pay admission fee. Current status: ${registration.status}. Expected: PAYMENT_PENDING`, 400);
//         }


//         const [result] = await sequelize.query(
//             `INSERT INTO payments (registration_id, fee_type, amount, currency, payment_mode, status)
//        VALUES (:registration_id, :fee_type, :amount, 'INR', :payment_mode, 'INITIATED')`,
//             {
//                 replacements: { registration_id, fee_type, amount, payment_mode },
//                 type: QueryTypes.INSERT
//             }
//         );

//         const paymentId = (result as unknown as number);


//         const studentData = {
//             first_name: registration.first_name,
//             last_name: registration.last_name,
//             registration_id: registration.registration_id,
//             email: registration.email,
//             mobile: registration.mobile
//         };

//         const razorpayOrder = await createRazorpayOrder(Number(amount), studentData);


//         await sequelize.query(
//             `UPDATE payments SET gateway_transaction_id = :orderId WHERE id = :payment_id`,
//             { replacements: { orderId: razorpayOrder.orderId, payment_id: paymentId }, type: QueryTypes.UPDATE }
//         );

//         res.status(201).json({
//             status: 1,
//             data: {
//                 payment_id: paymentId,
//                 registration_id: registration.registration_id,
//                 amount: Number(amount),
//                 fee_type,
//                 payment_mode,
//                 status: 'INITIATED',
//                 razorpay_order_id: razorpayOrder.orderId,
//                 razorpay_key_id: config.razorpay.keyId,
//                 student_details: {
//                     name: `${registration.first_name} ${registration.last_name}`,
//                     email: registration.email,
//                     mobile: registration.mobile
//                 }
//             },
//             msg: "Payment order created successfully. Proceed with Razorpay payment."
//         });
//     } catch (error) {
//         next(error);
//     }
// };

export const initiatePayment = async (req, res, next: NextFunction) => {
    try {
        const { registration_id, fee_type, amount, payment_mode } = req.body;
        const sequelize = getTenantSequelize(req.tenant);
        if (!registration_id || !fee_type || !amount || !payment_mode) {
            throw new AppError("Missing required fields: registration_id, fee_type, amount, payment_mode", 400);
        }


        const feeStructure: Record<string, number> = {
            'REGISTRATION': 100,
            'ADMISSION': 500
        };

        const validFeeTypes = ['REGISTRATION', 'ADMISSION'];
        if (!validFeeTypes.includes(fee_type)) {
            throw new AppError(`Invalid fee_type. Valid values: ${validFeeTypes.join(', ')}`, 400);
        }

        const expectedAmount = feeStructure[fee_type];
        if (Number(amount) !== expectedAmount) {
            throw new AppError(`Invalid amount for ${fee_type}. Expected: ₹${expectedAmount}, Received: ₹${amount}`, 400);
        }

        const validPaymentModes = ['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING'];
        if (!validPaymentModes.includes(payment_mode)) {
            throw new AppError(`Invalid payment_mode. Valid values: ${validPaymentModes.join(', ')}`, 400);
        }
        const [registration] = await sequelize.query<RegistrationRow>(
            `SELECT * FROM student_registrations WHERE id = :registration_id`,
            { replacements: { registration_id }, type: QueryTypes.SELECT }
        );

        if (!registration) {
            throw new AppError("Registration not found", 404);
        }

        // Validate status based on fee type
        if (fee_type === 'REGISTRATION' && registration.status !== 'REGISTRATION_PENDING') {
            throw new AppError(`Cannot pay registration fee. Current status: ${registration.status}. Expected: REGISTRATION_PENDING`, 400);
        }
        if (fee_type === 'ADMISSION' && registration.status !== 'PAYMENT_PENDING') {
            throw new AppError(`Cannot pay admission fee. Current status: ${registration.status}. Expected: PAYMENT_PENDING`, 400);
        }


        // Initialize PhonePe v2 payment
        const phonePeService = new PhonePeService();
        const paymentId = registration.id; // Keep compatibility with frontend field
        const merchantOrderId = `REG-${registration.id}-${Date.now()}`;
        await sequelize.query(
            `INSERT INTO payments 
            (registration_id, merchant_id, fee_type, amount, currency, payment_mode, status, gateway_transaction_id)
            VALUES (:registration_id, :merchant_id, :fee_type, :amount, 'INR', :payment_mode, 'INITIATED', :gateway_transaction_id)`,
            {
                replacements: {
                registration_id,
                merchant_id: config.phonepe.merchantId || 'RETECHUAT',
                fee_type,
                amount,
                payment_mode,
                gateway_transaction_id: merchantOrderId
                },
                type: QueryTypes.INSERT
            }
        );

        // Generate PhonePe v2 checkout URL
        const paymentLink = await phonePeService.generatePaymentLink(
            req.tenant,
            Number(amount),
            registration.id,
            merchantOrderId
        );

        registerPendingPhonePeOrder({
            merchantOrderId,
            createdAt: new Date(),
            expireAt: paymentLink.expireAt
        });

        res.status(201).json({
            status: 1,
            data: {
                payment_id: paymentId,
                registration_id: registration.registration_id,
                amount: Number(amount),
                fee_type,
                payment_mode,
                status: 'INITIATED',
                // Keep Razorpay-like structure for frontend compatibility
                razorpay_order_id: merchantOrderId,
                razorpay_key_id: config.phonepe.merchantId, // Use PhonePe merchant ID
                phonepe_payment_url: paymentLink.paymentUrl,
                phonepe_merchant_transaction_id: merchantOrderId,
                phonepe_merchant_order_id: merchantOrderId,
                phonepe_expire_at: paymentLink.expireAt || null,
                student_details: {
                    name: `${registration.first_name} ${registration.last_name}`,
                    email: registration.email,
                    mobile: registration.mobile
                }
            },
            message: "Payment order created successfully. Proceed with PhonePe payment."
        });
    } catch (error) {
        next(error);
    }
};
// export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = req.body;

//         if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !payment_id) {
//             throw new AppError("Missing required fields for payment verification", 400);
//         }

//         const isValidPayment = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

//         if (!isValidPayment) {
//             throw new AppError("Payment verification failed. Invalid signature.", 400);
//         }

//         const [payment] = await sequelize.query<PaymentRow>(
//             `SELECT * FROM payments WHERE id = :payment_id AND gateway_transaction_id = :razorpay_order_id`,
//             {
//                 replacements: { payment_id, razorpay_order_id },
//                 type: QueryTypes.SELECT
//             }
//         );

//         if (!payment) {
//             throw new AppError("Payment record not found or order ID mismatch", 404);
//         }

//         if (payment.status === 'SUCCESS') {
//             return res.status(200).json({
//                 status: 1,
//                 data: {
//                     payment_id: payment.id,
//                     status: payment.status,
//                     receipt_no: payment.receipt_no,
//                     message: "Payment already verified"
//                 },
//                 msg: "Payment verification successful"
//             });
//         }

//         const receiptNo = `RCPT-${payment_id}-${Date.now()}`;
//         const paidAt = new Date();
//         const paidAtSql = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}-${String(paidAt.getDate()).padStart(2, '0')} ${String(paidAt.getHours()).padStart(2, '0')}:${String(paidAt.getMinutes()).padStart(2, '0')}:${String(paidAt.getSeconds()).padStart(2, '0')}`;

//         await sequelize.query(
//             `UPDATE payments 
//              SET status = 'SUCCESS', receipt_no = :receipt_no, paid_at = :paid_at, gateway_transaction_id = :razorpay_payment_id
//              WHERE id = :payment_id`,
//             {
//                 replacements: {
//                     payment_id,
//                     receipt_no: receiptNo,
//                     paid_at: paidAtSql,
//                     razorpay_payment_id
//                 },
//                 type: QueryTypes.UPDATE
//             }
//         );

//         const [paymentRecord] = await sequelize.query<PaymentRow>(
//             `SELECT fee_type FROM payments WHERE id = :payment_id`,
//             { replacements: { payment_id }, type: QueryTypes.SELECT }
//         );

//         let newStatus = 'PAYMENT_COMPLETED';
//         if (paymentRecord?.fee_type === 'REGISTRATION') {
//             newStatus = 'REGISTRATION_COMPLETED';
//         }

//         await sequelize.query(
//             `UPDATE student_registrations SET status = :newStatus WHERE id = :registration_id`,
//             {
//                 replacements: { registration_id: payment.registration_id, newStatus },
//                 type: QueryTypes.UPDATE
//             }
//         );

//         const [registration] = await sequelize.query<RegistrationRow>(
//             `SELECT * FROM student_registrations WHERE id = :registration_id`,
//             { replacements: { registration_id: payment.registration_id }, type: QueryTypes.SELECT }
//         );

//         if (registration) {

//             // ===============================
//             // EXISTING QUEUE (UNCHANGED)
//             // ===============================
//             await queueNotification(
//                 payment.registration_id,
//                 'EMAIL',
//                 registration.email,
//                 'PAYMENT_SUCCESS',
//                 {
//                     student_name: `${registration.first_name} ${registration.last_name}`,
//                     registration_id: registration.registration_id,
//                     amount: payment.amount,
//                     transaction_id: razorpay_payment_id
//                 }
//             );

//             await queueNotification(
//                 payment.registration_id,
//                 'SMS',
//                 registration.mobile,
//                 'PAYMENT_SUCCESS',
//                 {
//                     student_name: `${registration.first_name} ${registration.last_name}`,
//                     registration_id: registration.registration_id,
//                     amount: payment.amount,
//                     transaction_id: razorpay_payment_id
//                 }
//             );

//             // ===============================
//             // NEW: DIRECT SMTP EMAIL
//             // ===============================
//             // ===============================
//             // DIRECT SMTP EMAIL (BASED ON FEE TYPE)
//             // ===============================
//             try {
//                 const studentName = `${registration.first_name} ${registration.last_name}`;
//                 const receiptUrl = `${config.frontendUrl}/payment-receipt?paymentId=${payment.id}`;

//                 if (paymentRecord?.fee_type === 'REGISTRATION') {
//                     // Registration fee email
//                     await sendRegistrationPaymentSuccessEmail(
//                         registration.email,
//                         studentName,
//                         registration.registration_id,
//                         payment.amount,
//                         razorpay_payment_id
//                     );

//                     console.log("[EMAIL] Registration payment success sent to:", registration.email);

//                 } else if (paymentRecord?.fee_type === 'ADMISSION') {
//                     // Admission fee email
//                     await sendPaymentSuccessEmail(
//                         registration.email,
//                         studentName,
//                         registration.registration_id,
//                         payment.amount,
//                         razorpay_payment_id,
//                         receiptNo,
//                         receiptUrl
//                     );

//                     console.log("[EMAIL] Admission payment success sent to:", registration.email);
//                 }

//             } catch (smtpError) {
//                 console.error("[EMAIL ERROR] SMTP failed:", smtpError);
//             }

//         }

//         res.status(200).json({
//             status: 1,
//             data: {
//                 payment_id: payment.id,
//                 status: 'SUCCESS',
//                 receipt_no: receiptNo,
//                 transaction_id: razorpay_payment_id
//             },
//             msg: "Payment verified and processed successfully. Confirmation sent via email and SMS."
//         });

//     } catch (error) {
//         next(error);
//     }
// };

export const verifyPayment = async (req, res, next: NextFunction) => {
    try {
        console.log('Payment verification request received:', req.body);
        const sequelize = getTenantSequelize(req.tenant);

        // Accept legacy and PhonePe v2 fields for backward compatibility
        const {
            razorpay_order_id, razorpay_payment_id, razorpay_signature, // Razorpay-style (from existing frontend)
            phonepe_merchant_transaction_id, // PhonePe-style
            phonepe_merchant_order_id, // PhonePe v2-style
            payment_id,
            registration_id
        } = req.body;

        console.log('Payment verification parameters:', {
            payment_id,
            registration_id,
            razorpay_order_id,
            phonepe_merchant_transaction_id,
            phonepe_merchant_order_id
        });

        const [payment] = payment_id
            ? await sequelize.query<PaymentRow>(
                `SELECT * FROM payments WHERE id = :payment_id`,
                {
                    replacements: { payment_id },
                    type: QueryTypes.SELECT
                }
            )
            : [null as unknown as PaymentRow];

        // Prefer explicit merchant order id, else fallback to existing DB value
        const merchantOrderId =
            phonepe_merchant_order_id ||
            phonepe_merchant_transaction_id ||
            razorpay_order_id ||
            payment?.gateway_transaction_id;

        if (!merchantOrderId) {
            throw new AppError("Missing required field for payment verification: merchantOrderId", 400);
        }

        const parsedRegistrationId = (() => {
            const match = String(merchantOrderId).match(/^REG-(\d+)-/i);
            return match ? Number(match[1]) : null;
        })();

        const registrationDbId =
            Number(registration_id) ||
            payment?.registration_id ||
            parsedRegistrationId;

        if (!registrationDbId || Number.isNaN(Number(registrationDbId))) {
            throw new AppError("Unable to resolve registration_id for payment verification", 400);
        }

        console.log('Calling PhonePe API to check payment status for:', merchantOrderId);

        // Check payment status with PhonePe v2 order status API
        const phonePeService = new PhonePeService();
        const statusResponse = await phonePeService.checkPaymentStatus(merchantOrderId);

        console.log('PhonePe API response:', {
            success: statusResponse.success,
            state: statusResponse.data.state,
            transactionId: statusResponse.data.transactionId
        });

        const paymentState = String(statusResponse.data.state || "").toUpperCase();

        if (!statusResponse.success || paymentState !== 'COMPLETED') {
            console.log('Payment verification failed - state is not COMPLETED:', paymentState);
            throw new AppError(`Payment verification failed. Current state: ${paymentState || "UNKNOWN"}`, 400);
        }

        console.log('payment success : true');

        if (payment && payment.status === 'SUCCESS') {
            console.log('Payment already verified - returning existing data');
            return res.status(200).json({
                status: 1,
                data: {
                    payment_id: payment.id,
                    status: payment.status,
                    receipt_no: payment.receipt_no,
                    message: "Payment already verified"
                },
                message: "Payment verification successful"
            });
        }

        console.log('Payment needs verification - current status:', payment?.status || 'NO_PAYMENT_ROW');

        const receiptNo = `RCPT-REG-${registrationDbId}-${Date.now()}`;
        const paidAt = new Date();
        const paidAtSql = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}-${String(paidAt.getDate()).padStart(2, '0')} ${String(paidAt.getHours()).padStart(2, '0')}:${String(paidAt.getMinutes()).padStart(2, '0')}:${String(paidAt.getSeconds()).padStart(2, '0')}`;

        console.log('Updating registration status with receipt:', receiptNo);

        if (payment) {
            await sequelize.query(
                `UPDATE payments 
                 SET status = 'SUCCESS', receipt_no = :receipt_no, paid_at = :paid_at, gateway_transaction_id = :phonepe_transaction_id
                 WHERE id = :payment_id`,
                {
                    replacements: {
                        payment_id: payment.id,
                        receipt_no: receiptNo,
                        paid_at: paidAtSql,
                        phonepe_transaction_id: statusResponse.data.transactionId || merchantOrderId
                    },
                    type: QueryTypes.UPDATE
                }
            );
        }

        const [registrationForFee] = await sequelize.query<RegistrationRow>(
            `SELECT * FROM student_registrations WHERE id = :registration_id`,
            { replacements: { registration_id: registrationDbId }, type: QueryTypes.SELECT }
        );
        const inferredFeeType =
            payment?.fee_type ||
            (
                registrationForFee?.status === 'PAYMENT_PENDING' ||
                    registrationForFee?.status === 'PAYMENT_COMPLETED'
                    ? 'ADMISSION'
                    : 'REGISTRATION'
            );

        // Keep status transitions idempotent and avoid downgrading completed admission payments.
        const newStatus =
            registrationForFee?.status === 'PAYMENT_COMPLETED'
                ? 'PAYMENT_COMPLETED'
                : inferredFeeType === 'ADMISSION'
                    ? 'PAYMENT_COMPLETED'
                    : 'REGISTRATION_COMPLETED';

        console.log('Updating registration status to:', newStatus, 'for registration_id:', registrationDbId);

        await sequelize.query(
            `UPDATE student_registrations SET status = :newStatus WHERE id = :registration_id`,
            {
                replacements: { registration_id: registrationDbId, newStatus },
                type: QueryTypes.UPDATE
            }
        );

        console.log('Registration status updated successfully');

        const registration = registrationForFee;

        if (registration) {
            const paidAmount = Number(payment?.amount || 0);

            // ===============================
            // EXISTING QUEUE (UNCHANGED)
            // ===============================
            await queueNotification(
                registrationDbId,
                'EMAIL',
                registration.email,
                'PAYMENT_SUCCESS',
                req.tenant,
                {
                    student_name: `${registration.first_name} ${registration.last_name}`,
                    registration_id: registration.registration_id,
                    amount: paidAmount,
                    transaction_id: statusResponse.data.transactionId || merchantOrderId
                }
            );

            await queueNotification(
                registrationDbId,
                'SMS',
                registration.mobile,
                'PAYMENT_SUCCESS',
                req.tenant,
                {
                    student_name: `${registration.first_name} ${registration.last_name}`,
                    registration_id: registration.registration_id,
                    amount: paidAmount,
                    transaction_id: statusResponse.data.transactionId || merchantOrderId
                }
            );

            // ===============================
            // NEW: DIRECT SMTP EMAIL
            // ===============================
            // ===============================
            // DIRECT SMTP EMAIL (BASED ON FEE TYPE)
            // ===============================
            try {
                const studentName = `${registration.first_name} ${registration.last_name}`;
                const receiptUrl = buildFrontendUrl(req.tenant, `/payment-receipt?paymentId=${payment?.id || registrationDbId}`);
                
                if (inferredFeeType === 'REGISTRATION') {
                    // Registration fee email
                    await sendRegistrationPaymentSuccessEmail(
                        registration.email,
                        studentName,
                        registration.registration_id,
                        paidAmount,
                        statusResponse.data.transactionId || merchantOrderId
                    );

                    console.log("[EMAIL] Registration payment success sent to:", registration.email);

                } else if (inferredFeeType === 'ADMISSION') {
                    // Admission fee email
                    await sendPaymentSuccessEmail(
                        registration.email,
                        studentName,
                        registration.registration_id,
                        paidAmount,
                        statusResponse.data.transactionId || merchantOrderId,
                        receiptNo,
                        receiptUrl
                    );

                    console.log("[EMAIL] Admission payment success sent to:", registration.email);
                }

            } catch (smtpError) {
                console.error("[EMAIL ERROR] SMTP failed:", smtpError);
            }

        }

        res.status(200).json({
            status: 1,
            data: {
                payment_id: payment?.id || null,
                registration_id: registrationDbId,
                status: 'SUCCESS',
                registration_status: newStatus,
                receipt_no: receiptNo,
                transaction_id: statusResponse.data.transactionId || merchantOrderId
            },
            message: "Payment verified and processed successfully. Confirmation sent via email and SMS."
        });

    } catch (error) {
        next(error);
    }
};



// export const paymentCallback = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { payment_id, gateway_transaction_id, status } = req.body;
//         if (!payment_id || !status) {
//             throw new AppError("Missing required fields: payment_id, status", 400);
//         }
//         if (!['SUCCESS', 'FAILED'].includes(status)) {
//             throw new AppError("Invalid status. Valid values: SUCCESS, FAILED", 400);
//         }
//         const [payment] = await sequelize.query<PaymentRow>(
//             `SELECT * FROM payments WHERE id = :payment_id`,
//             { replacements: { payment_id }, type: QueryTypes.SELECT }
//         );

//         if (!payment) {
//             throw new AppError("Payment not found", 404);
//         }


//         if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
//             const [updatedPayment] = await sequelize.query<PaymentRow>(
//                 `SELECT * FROM payments WHERE id = :payment_id`,
//                 { replacements: { payment_id }, type: QueryTypes.SELECT }
//             );
//             return res.status(200).json({
//                 status: 1,
//                 data: {
//                     payment_id: updatedPayment?.id,
//                     status: updatedPayment?.status,
//                     receipt_no: updatedPayment?.receipt_no,
//                     paid_at: updatedPayment?.paid_at
//                 },
//                 msg: "Payment already processed."
//             });
//         }

//         await sequelize.query(
//             `UPDATE payments 
//        SET status = :status, gateway_transaction_id = :gateway_transaction_id
//        WHERE id = :payment_id`,
//             {
//                 replacements: {
//                     payment_id,
//                     status,
//                     gateway_transaction_id: gateway_transaction_id || null
//                 },
//                 type: QueryTypes.UPDATE
//             }
//         );


//         const [registration] = await sequelize.query<RegistrationRow>(
//             `SELECT * FROM student_registrations WHERE id = :registration_id`,
//             { replacements: { registration_id: payment.registration_id }, type: QueryTypes.SELECT }
//         );

//         if (registration) {
//             if (status === 'SUCCESS') {
//                 const receiptNo = `RCPT-${payment_id}-${Date.now()}`;
//                 const paidAt = new Date();
//                 const paidAtSql = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}-${String(paidAt.getDate()).padStart(2, '0')} ${String(paidAt.getHours()).padStart(2, '0')}:${String(paidAt.getMinutes()).padStart(2, '0')}:${String(paidAt.getSeconds()).padStart(2, '0')}`;

//                 await sequelize.query(
//                     `UPDATE payments SET receipt_no = :receipt_no, paid_at = :paid_at WHERE id = :payment_id`,
//                     {
//                         replacements: { payment_id, receipt_no: receiptNo, paid_at: paidAtSql },
//                         type: QueryTypes.UPDATE
//                     }
//                 );


//                 let newStatus = registration.status;
//                 let emailTemplate = 'PAYMENT_SUCCESS';

//                 if (registration.status === 'REGISTRATION_PENDING' && payment.fee_type === 'REGISTRATION') {
//                     newStatus = 'REGISTRATION_COMPLETED';
//                     emailTemplate = 'REGISTRATION_FEE_PAID';
//                 } else if (registration.status === 'PAYMENT_PENDING' && payment.fee_type === 'ADMISSION') {
//                     newStatus = 'PAYMENT_COMPLETED';
//                     emailTemplate = 'ADMISSION_FEE_PAID';
//                 }

//                 await sequelize.query(
//                     `UPDATE student_registrations SET status = :newStatus WHERE id = :registration_id`,
//                     {
//                         replacements: { registration_id: payment.registration_id, newStatus },
//                         type: QueryTypes.UPDATE
//                     }
//                 );


//                 await queueNotification(
//                     payment.registration_id,
//                     'EMAIL',
//                     registration.email,
//                     emailTemplate,
//                     {
//                         student_name: `${registration.first_name} ${registration.last_name}`,
//                         registration_id: registration.registration_id,
//                         amount: payment.amount,
//                         transaction_id: gateway_transaction_id
//                     }
//                 );

//                 await queueNotification(
//                     payment.registration_id,
//                     'SMS',
//                     registration.mobile,
//                     emailTemplate,
//                     {
//                         student_name: `${registration.first_name} ${registration.last_name}`,
//                         registration_id: registration.registration_id,
//                         amount: payment.amount,
//                         transaction_id: gateway_transaction_id
//                     }
//                 );
//             } else {

//                 await queueNotification(
//                     payment.registration_id,
//                     'EMAIL',
//                     registration.email,
//                     'PAYMENT_FAILED',
//                     {
//                         student_name: `${registration.first_name} ${registration.last_name}`,
//                         registration_id: registration.registration_id,
//                         amount: payment.amount
//                     }
//                 );

//                 await queueNotification(
//                     payment.registration_id,
//                     'SMS',
//                     registration.mobile,
//                     'PAYMENT_FAILED',
//                     {
//                         student_name: `${registration.first_name} ${registration.last_name}`,
//                         registration_id: registration.registration_id,
//                         amount: payment.amount
//                     }
//                 );
//             }
//         }

//         const [updatedPayment] = await sequelize.query<PaymentRow>(
//             `SELECT * FROM payments WHERE id = :payment_id`,
//             { replacements: { payment_id }, type: QueryTypes.SELECT }
//         );

//         res.status(200).json({
//             status: 1,
//             data: {
//                 payment_id: updatedPayment?.id,
//                 status: updatedPayment?.status,
//                 receipt_no: updatedPayment?.receipt_no,
//                 paid_at: updatedPayment?.paid_at
//             },
//             msg: status === 'SUCCESS'
//                 ? "Payment successful. Confirmation sent via email and SMS."
//                 : "Payment failed. Notification sent."
//         });
//     } catch (error) {
//         next(error);
//     }
// };

export const paymentCallback = async (req, res, next: NextFunction) => {
    try {
        const { payment_id, gateway_transaction_id, merchantOrderId, status } = req.body;
        const gatewayReference = gateway_transaction_id || merchantOrderId;
        const sequelize = getTenantSequelize(req.tenant);

        if ((!payment_id && !gatewayReference) || !status) {
            throw new AppError("Missing required fields: payment_id or merchantOrderId, and status", 400);
        }
        if (!['SUCCESS', 'FAILED'].includes(status)) {
            throw new AppError("Invalid status. Valid values: SUCCESS, FAILED", 400);
        }
        const [payment] = payment_id
            ? await sequelize.query<PaymentRow>(
                `SELECT * FROM payments WHERE id = :payment_id`,
                { replacements: { payment_id }, type: QueryTypes.SELECT }
            )
            : await sequelize.query<PaymentRow>(
                `SELECT * FROM payments WHERE gateway_transaction_id = :gateway_reference ORDER BY id DESC LIMIT 1`,
                { replacements: { gateway_reference: gatewayReference }, type: QueryTypes.SELECT }
            );

        if (!payment) {
            throw new AppError("Payment not found", 404);
        }


        if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
            const [updatedPayment] = await sequelize.query<PaymentRow>(
                `SELECT * FROM payments WHERE id = :payment_id`,
                { replacements: { payment_id }, type: QueryTypes.SELECT }
            );
            return res.status(200).json({
                status: 1,
                data: {
                    payment_id: updatedPayment?.id,
                    status: updatedPayment?.status,
                    receipt_no: updatedPayment?.receipt_no,
                    paid_at: updatedPayment?.paid_at
                },
                message: "Payment already processed."
            });
        }

        await sequelize.query(
            `UPDATE payments 
       SET status = :status, gateway_transaction_id = :gateway_transaction_id
       WHERE id = :payment_id`,
            {
                replacements: {
                    payment_id: payment.id,
                    status,
                    gateway_transaction_id: gatewayReference || null
                },
                type: QueryTypes.UPDATE
            }
        );


        const [registration] = await sequelize.query<RegistrationRow>(
            `SELECT * FROM student_registrations WHERE id = :registration_id`,
            { replacements: { registration_id: payment.registration_id }, type: QueryTypes.SELECT }
        );

        if (registration) {
            if (status === 'SUCCESS') {
                const receiptNo = `RCPT-${payment_id}-${Date.now()}`;
                const paidAt = new Date();
                const paidAtSql = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}-${String(paidAt.getDate()).padStart(2, '0')} ${String(paidAt.getHours()).padStart(2, '0')}:${String(paidAt.getMinutes()).padStart(2, '0')}:${String(paidAt.getSeconds()).padStart(2, '0')}`;

                await sequelize.query(
                    `UPDATE payments SET receipt_no = :receipt_no, paid_at = :paid_at WHERE id = :payment_id`,
                    {
                        replacements: { payment_id, receipt_no: receiptNo, paid_at: paidAtSql },
                        type: QueryTypes.UPDATE
                    }
                );


                let newStatus = registration.status;
                let emailTemplate = 'PAYMENT_SUCCESS';

                if (registration.status === 'REGISTRATION_PENDING' && payment.fee_type === 'REGISTRATION') {
                    newStatus = 'REGISTRATION_COMPLETED';
                    emailTemplate = 'REGISTRATION_FEE_PAID';
                } else if (registration.status === 'PAYMENT_PENDING' && payment.fee_type === 'ADMISSION') {
                    newStatus = 'PAYMENT_COMPLETED';
                    emailTemplate = 'ADMISSION_FEE_PAID';
                }

                await sequelize.query(
                    `UPDATE student_registrations SET status = :newStatus WHERE id = :registration_id`,
                    {
                        replacements: { registration_id: payment.registration_id, newStatus },
                        type: QueryTypes.UPDATE
                    }
                );


                await queueNotification(
                    payment.registration_id,
                    'EMAIL',
                    registration.email,
                    emailTemplate,
                    req.tenant,
                    {
                        student_name: `${registration.first_name} ${registration.last_name}`,
                        registration_id: registration.registration_id,
                        amount: payment.amount,
                        transaction_id: gatewayReference
                    }
                );

                await queueNotification(
                    payment.registration_id,
                    'SMS',
                    registration.mobile,
                    emailTemplate,
                    req.tenant,
                    {
                        student_name: `${registration.first_name} ${registration.last_name}`,
                        registration_id: registration.registration_id,
                        amount: payment.amount,
                        transaction_id: gatewayReference
                    }
                );
            } else {

                await queueNotification(
                    payment.registration_id,
                    'EMAIL',
                    registration.email,
                    'PAYMENT_FAILED',
                    req.tenant,
                    {
                        student_name: `${registration.first_name} ${registration.last_name}`,
                        registration_id: registration.registration_id,
                        amount: payment.amount
                    }
                );

                await queueNotification(
                    payment.registration_id,
                    'SMS',
                    registration.mobile,
                    'PAYMENT_FAILED',
                    req.tenant,
                    {
                        student_name: `${registration.first_name} ${registration.last_name}`,
                        registration_id: registration.registration_id,
                        amount: payment.amount
                    }
                );
            }
        }

        const [updatedPayment] = await sequelize.query<PaymentRow>(
            `SELECT * FROM payments WHERE id = :payment_id`,
            { replacements: { payment_id: payment.id }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            status: 1,
            data: {
                payment_id: updatedPayment?.id,
                status: updatedPayment?.status,
                receipt_no: updatedPayment?.receipt_no,
                paid_at: updatedPayment?.paid_at
            },
            message: status === 'SUCCESS'
                ? "Payment successful. Confirmation sent via email and SMS."
                : "Payment failed. Notification sent."
        });
    } catch (error) {
        next(error);
    }
};
// export const getPaymentReceipt = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { id } = req.params;

//         const [payment] = await sequelize.query<PaymentRow & {
//             student_name: string;
//             registration_no: string;
//             class_name: string;
//             academic_year: string;
//         }>(
//             `SELECT p.*, 
//               CONCAT_WS(' ', r.first_name, r.last_name) as student_name,
//               r.registration_id as registration_no,
//               c.name as class_name,
//               ay.name as academic_year
//        FROM payments p
//        JOIN student_registrations r ON r.id = p.registration_id
//        JOIN classes c ON c.id = r.class_id
//        JOIN academic_years ay ON ay.id = r.academic_year_id
//        WHERE p.id = :id`,
//             { replacements: { id }, type: QueryTypes.SELECT }
//         );

//         if (!payment) {
//             throw new AppError("Payment not found", 404);
//         }

//         if (payment.status !== 'SUCCESS') {
//             throw new AppError("Receipt not available. Payment status: " + payment.status, 400);
//         }

//         res.status(200).json({
//             status: 1,
//             data: {
//                 receipt_no: payment.receipt_no,
//                 student_name: payment.student_name,
//                 registration_no: payment.registration_no,
//                 class_name: payment.class_name,
//                 academic_year: payment.academic_year,
//                 fee_type: payment.fee_type,
//                 amount: payment.amount,
//                 currency: payment.currency,
//                 payment_mode: payment.payment_mode,
//                 gateway_transaction_id: payment.gateway_transaction_id,
//                 paid_at: payment.paid_at
//             },
//             msg: "Receipt fetched successfully"
//         });
//     } catch (error) {
//         next(error);
//     }
// };

export const getPaymentReceipt = async (req, res, next: NextFunction) => {
    try {
        const { id } = req.params;
        const sequelize = getTenantSequelize(req.tenant);

        const [payment] = await sequelize.query<PaymentRow & {
            student_name: string;
            registration_no: string;
            class_name: string;
            academic_year: string;
        }>(
            `SELECT p.*, 
              CONCAT_WS(' ', r.first_name, r.last_name) as student_name,
              r.registration_id as registration_no,
              c.name as class_name,
              ay.name as academic_year
       FROM payments p
       JOIN student_registrations r ON r.id = p.registration_id
       JOIN classes c ON c.id = r.class_id
       JOIN academic_years ay ON ay.id = r.academic_year_id
       WHERE p.id = :id`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );

        if (!payment) {
            throw new AppError("Payment not found", 404);
        }

        if (payment.status !== 'SUCCESS') {
            throw new AppError("Receipt not available. Payment status: " + payment.status, 400);
        }

        res.status(200).json({
            status: 1,
            data: {
                receipt_no: payment.receipt_no,
                student_name: payment.student_name,
                registration_no: payment.registration_no,
                class_name: payment.class_name,
                academic_year: payment.academic_year,
                fee_type: payment.fee_type,
                amount: payment.amount,
                currency: payment.currency,
                payment_mode: payment.payment_mode,
                gateway_transaction_id: payment.gateway_transaction_id,
                paid_at: payment.paid_at
            },
            message: "Receipt fetched successfully"
        });
    } catch (error) {
        next(error);
    }
};

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
        const transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: false,
            auth: {
                user: config.smtp.username,
                pass: config.smtp.password,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const info = await transporter.sendMail({
            from: '"ShikshaPrime" <noreply@shikshaprime.com>',
            to: to,
            subject: subject,
            html: html,
        });

        console.log(`[Email] Sent to ${to}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`[Email] Failed to send to ${to}:`, error);
        throw error;
    }
}


async function sendSms(to: string, message: string): Promise<void> {
    try {
        const cleanNumber = to.replace(/^\+?91/, '').replace(/\D/g, '');
        if (cleanNumber.length !== 10) {
            throw new Error(`Invalid mobile number: ${to}`);
        }

        const params = {
            UserName: config.sms.user,
            Password: config.sms.password,
            MobileNo: cleanNumber,
            SenderID: config.sms.senderId,
            Message: message,
            PEID: config.sms.peId,
            DLTTemplateId: config.sms.templateId,
            Channel: config.sms.channel,
            Route: config.sms.route
        };

        const response = await axios.get('http://nimbusit.biz/api/SmsApi/SendSingleApi', {
            params,
            timeout: 10000
        });

        console.log(`[SMS] Sent to ${cleanNumber}. Response: ${response.data}`);
    } catch (error) {
        console.error(`[SMS] Failed to send to ${to}:`, error);
        throw error;
    }
}


async function createRazorpayOrder(amount: number, studentData: any): Promise<{ orderId: string }> {
    try {
        const razorpay = new Razorpay({
            key_id: config.razorpay.keyId,
            key_secret: config.razorpay.keySecret,
        });

        const options = {
            amount: amount * 100, // amount in paise
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
                student_name: `${studentData.first_name} ${studentData.last_name}`,
                registration_id: studentData.registration_id,
                email: studentData.email,
                mobile: studentData.mobile
            },
        };

        const order = await razorpay.orders.create(options);
        console.log(`[Razorpay] Order created: ${order.id}, Amount: ${order.amount}`);

        return { orderId: order.id };
    } catch (error) {
        console.error(`[Razorpay] Failed to create order:`, error);
        throw error;
    }
}


// function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string): boolean {
//     try {
//         const body = orderId + '|' + paymentId;
//         const expectedSignature = crypto
//             .createHmac('sha256', config.razorpay.keySecret)
//             .update(body)
//             .digest('hex');

//         return crypto.timingSafeEqual(
//             Buffer.from(expectedSignature, 'hex'),
//             Buffer.from(signature, 'hex')
//         );
//     } catch (error) {
//         console.error(`[Razorpay] Payment verification failed:`, error);
//         return false;
//     }
// }

async function queueNotification(
    registrationId: number,
    channel: 'SMS' | 'EMAIL',
    toAddress: string,
    templateKey: string,
    tenant: string,
    payload: Record<string, unknown>
): Promise<void> {
    const sequelize = getTenantSequelize(tenant);
    try {
        
        await sequelize.query(
            `INSERT INTO notifications (registration_id, channel, to_address, template_key, payload, status)
       VALUES (:registration_id, :channel, :to_address, :template_key, :payload, 'SENT')`,
            {
                replacements: {
                    registration_id: registrationId,
                    channel,
                    to_address: toAddress,
                    template_key: templateKey,
                    payload: JSON.stringify(payload)
                },
                type: QueryTypes.INSERT
            }
        );


        if (channel === 'EMAIL') {
            const subject = getEmailSubject(templateKey);
            const html = getEmailTemplate(templateKey, payload);
            await sendEmail(toAddress, subject, html);
        } else if (channel === 'SMS') {
            const message = getSmsTemplate(templateKey, payload);
            await sendSms(toAddress, message);
        }

    } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);

        await sequelize.query(
            `UPDATE notifications SET status = 'FAILED', error_message = :error 
             WHERE registration_id = :registration_id AND channel = :channel AND to_address = :to_address`,
            {
                replacements: {
                    registration_id: registrationId,
                    channel,
                    to_address: toAddress,
                    error: error instanceof Error ? error.message : 'Unknown error'
                },
                type: QueryTypes.UPDATE
            }
        );
    }
}


function getEmailSubject(templateKey: string): string {
    switch (templateKey) {
        case 'REGISTRATION_ACKNOWLEDGMENT':
            return 'Complete Your Registration - ShikshaPrime';
        case 'REGISTRATION_STATUS_UPDATE':
            return 'Registration Status Update - ShikshaPrime';
        case 'REGISTRATION_FEE_PAID':
            return 'Registration Fee Received - ShikshaPrime';
        case 'ADMISSION_FEE_PAID':
            return 'Admission Fee Received - Admission Confirmed';
        case 'PAYMENT_SUCCESS':
            return 'Payment Successful - ShikshaPrime';
        case 'PAYMENT_FAILED':
            return 'Payment Failed - ShikshaPrime';
        case 'SELECTION_PAYMENT_LINK':
            return 'Congratulations! You have been selected for Admission';
        default:
            return 'Notification - ShikshaPrime';
    }
}

function getEmailTemplate(templateKey: string, payload: any): string {
    switch (templateKey) {
        case 'REGISTRATION_ACKNOWLEDGMENT':
            return `
                <h2>Registration Initiated</h2>
                <p>Dear ${payload.student_name},</p>
                <p>Thank you for registering with ShikshaPrime.</p>
                <p>Your Registration ID is: <strong>${payload.registration_id}</strong></p>
                <p>To complete your registration, please pay the registration fee by clicking the link below:</p>
                <p style="margin: 20px 0;">
                    <a href="${payload.payment_url}" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                       Pay Registration Fee
                    </a>
                </p>
                <p>Or copy this link: ${payload.payment_url}</p>
                <br>
                <p>Best regards,<br>ShikshaPrime Team</p>
            `;
        case 'REGISTRATION_STATUS_UPDATE':
            return `
                <h2>Registration Status Update</h2>
                <p>Dear ${payload.student_name},</p>
                <p>Your registration status has been updated to: <strong>${payload.status}</strong></p>
                <p>Registration ID: ${payload.registration_id}</p>
                ${payload.remarks ? `<p>Remarks: ${payload.remarks}</p>` : ''}
                <br>
                <p>Best regards,<br>ShikshaPrime Team</p>
            `;
        case 'REGISTRATION_FEE_PAID':
            return `
                <h2>Registration Successful</h2>
                <p>Dear ${payload.student_name},</p>
                <p>We have received your registration fee of ₹${payload.amount}.</p>
                <p>Your application is now under review for selection.</p>
                <p>Registration ID: <strong>${payload.registration_id}</strong></p>
                <br>
                <p>Best regards,<br>ShikshaPrime Team</p>
            `;
        case 'SELECTION_PAYMENT_LINK':
            return `
                <h2>Congratulations! You are Selected</h2>
                <p>Dear ${payload.student_name},</p>
                <p>We are pleased to inform you that you have been selected for admission!</p>
                <p>To confirm your admission, please pay the admission fee using the link below:</p>
                <p style="margin: 20px 0;">
                    <a href="${payload.payment_url}" 
                       style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                       Pay Admission Fee
                    </a>
                </p>
                <p>Or copy this link: ${payload.payment_url}</p>
                <br>
                <p>Best regards,<br>ShikshaPrime Team</p>
            `;
        case 'ADMISSION_FEE_PAID':
            return `
                <h2>Admission Confirmed!</h2>
                <p>Dear ${payload.student_name},</p>
                <p>We have received your admission fee of ₹${payload.amount}.</p>
                <p>Congratulations! Your admission process is now complete.</p>
                <p>Registration ID: <strong>${payload.registration_id}</strong></p>
                <br>
                <p>Best regards,<br>ShikshaPrime Team</p>
            `;
        case 'PAYMENT_FAILED':
            return `
                <h2>Payment Failed</h2>
                <p>Dear ${payload.student_name},</p>
                <p>Unfortunately, your payment of ₹${payload.amount} could not be processed.</p>
                <p>Registration ID: ${payload.registration_id}</p>
                <p>Please try again or contact our support team for assistance.</p>
                <br>
                <p>Best regards,<br>ShikshaPrime Team</p>
            `;
        case 'PAYMENT_SUCCESS':
            return `
                <h2>Payment Successful</h2>
                <p>Dear ${payload.student_name},</p>
                <p>Your payment of ₹${payload.amount} has been successfully processed.</p>
                <p>Transaction ID: ${payload.transaction_id}</p>
                <br>
                <p>Best regards,<br>ShikshaPrime Team</p>
            `;
        default:
            return `<p>Notification from ShikshaPrime</p>`;
    }
}


function getSmsTemplate(templateKey: string, payload: any): string {
    switch (templateKey) {
        case 'REGISTRATION_ACKNOWLEDGMENT':
            return `Dear ${payload.student_name}, Registration initiated. ID: ${payload.registration_id}. Pay fee here: ${payload.payment_url}`;
        case 'REGISTRATION_STATUS_UPDATE':
            return `Dear ${payload.student_name}, Status update: ${payload.status}. ID: ${payload.registration_id}.`;
        case 'REGISTRATION_FEE_PAID':
            return `Dear ${payload.student_name}, Registration fee received. App under review. ID: ${payload.registration_id}.`;
        case 'SELECTION_PAYMENT_LINK':
            return `Congrats ${payload.student_name}! Selected for admission. Pay fee: ${payload.payment_url} to confirm.`;
        case 'ADMISSION_FEE_PAID':
            return `Dear ${payload.student_name}, Admission fee received. Admission CONFIRMED. ID: ${payload.registration_id}.`;
        case 'PAYMENT_FAILED':
            return `Dear ${payload.student_name}, Payment failed for ID: ${payload.registration_id}. Please try again.`;
        default:
            return `Notification from ShikshaPrime`;
    }
}

export const getRegistrationByRegIdAdmin = async (req, res, next: NextFunction) => {
    try {
        const { regId } = req.params;
        const sequelize = getTenantSequelize(req.tenant);

        const [registration] = await sequelize.query<RegistrationRow & { program_name: string; class_name: string; department_name: string; academic_year: string; }>(
            `SELECT r.*, p.name AS program_name, c.name AS class_name, d.name AS department_name, ay.name AS academic_year
             FROM student_registrations r 
             JOIN classes c ON c.id = r.class_id 
             JOIN departments d ON d.id = r.department_id 
             JOIN academic_years ay ON ay.id = r.academic_year_id 
             JOIN programs p ON p.id = r.program_id 
             WHERE r.registration_id = :regId`,
            { replacements: { regId }, type: QueryTypes.SELECT });

        if (!registration) {
            throw new AppError("Registration not found", 404);
        }

        console.log(registration);

        const toAbsoluteUrl = (p?: string | null) => {
            if (!p) return null;
            return p.startsWith('/') ? `${req.protocol}://${req.get('host')}${p}` : p;
        };
        const documents = {
            aadhar: toAbsoluteUrl((registration as any).aadhar_doc),
            birth_certificate: toAbsoluteUrl((registration as any).birth_certificate_doc),
            ten_marksheet: toAbsoluteUrl((registration as any).ten_marksheet_doc),
            twelve_marksheet: toAbsoluteUrl((registration as any).twelve_marksheet_doc),
            graduation: toAbsoluteUrl((registration as any).graduation_doc),
            caste_certificate: toAbsoluteUrl((registration as any).caste_certificate_doc),
            physically_challenged_certificate: toAbsoluteUrl((registration as any).physically_challenged_certificate),
            profile_img: toAbsoluteUrl((registration as any).profile_img)
        };

        console.log(documents);

        res.status(200).json({
            status: 1,
            data: { ...registration, documents },
            message: "Registration fetched successfully"
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};
