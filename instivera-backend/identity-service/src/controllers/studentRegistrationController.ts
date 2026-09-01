import { Request, Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { config } from "../config";

import { RazorpayService } from "../services/razorpayService";
import nodemailer from 'nodemailer';
import axios from 'axios';
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { getTenantSequelize } from "../server";
import { AppError } from "../utils/appError";
import { buildFrontendUrl } from "../utils/tenantUrlBuilder";

const razorpayService = new RazorpayService();

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
    program_id: number;
    semester_id: number;
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
            `SELECT id, program_id, semester_id, year_number, code, name FROM classes ORDER BY id`,
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
            `SELECT id, code, name FROM departments WHERE level=2 ORDER BY name`,
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

    const results = await sequelize.query(
      `
      SELECT 
        sem.id,
        sem.semester_number,
        sem.name
      FROM classes c
      INNER JOIN semesters sem
        ON sem.id = c.semester_id
      WHERE 
        c.program_id = :programId
        AND c.id = :classId
      ORDER BY sem.id;
      `,
      {
        replacements: {
          programId: req.query.programId,
          classId: req.query.classId
        },
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

export const getProgramSemesters = async (req, res, next: NextFunction) => {
  try {
    const { programId } = req.query;
    const sequelize = getTenantSequelize(req.tenant);

    const results = await sequelize.query(
      `
      SELECT 
        sem.id,
        sem.semester_number,
        sem.name
      FROM semesters sem        
      WHERE 
        sem.program_id = :programId        
      ORDER BY sem.id;
      `,
      {
        replacements: {
          programId: programId         
        },
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
        const order = await razorpayService.createOrder({
            amountInPaise: amount * 100,
            receipt: `order_${Date.now()}`,
            notes: {
                student_name: `${studentData.first_name} ${studentData.last_name}`,
                registration_id: String(studentData.registration_id || ""),
                email: String(studentData.email || ""),
                mobile: String(studentData.mobile || "")
            },
        });
        console.log(`[Razorpay] Order created: ${order.id}, Amount: ${order.amount}`);

        return { orderId: order.id };
    } catch (error) {
        console.error(`[Razorpay] Failed to create order:`, error);
        throw error;
    }
}

function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string): boolean {
    try {
        return razorpayService.verifyPaymentSignature(orderId, paymentId, signature);
    } catch (error) {
        console.error(`[Razorpay] Payment verification failed:`, error);
        return false;
    }
}

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

export const resendPaymentNotification = async (req, res, next: NextFunction) => {
    try {
        const idParam = (req.params as any).registrationId;
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