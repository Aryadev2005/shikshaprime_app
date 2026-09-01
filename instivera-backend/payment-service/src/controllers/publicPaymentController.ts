import { NextFunction, Response } from "express";
import { QueryTypes } from "sequelize";

import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
import { AppError } from "../utils/appError";
import { generateToken } from "../utils/jwt";
import { buildApiUrl, buildFrontendUrl } from "../utils/tenantUrlBuilder";
import { sendPaymentConfirmationEmail, sendPaymentFailureEmail } from "../utils/emailService";
import { notifyAdminsForPayment } from "../utils/notificationService";
import { normalizeEnum } from "../utils/util";

type PaymentTypeRow = {
  id: number;
  name: string;
  description?: string | null;
  is_active: number;
  amount?: number | null;
};

type StudentLookupRow = {
  id: number;
  student_id?: string | null;
  application_id?: string | null;
  student_name?: string | null;
  class_name?: string | null;
  semester?: string | null;
  program?: string | null;
  department?: string | null;
  mobile?: string | null;
  email?: string | null;
  academic_year?: string | null;
};

type PaymentLookupRow = {
  payment_id: number;
  assignment_id: number;
  amount: number;
  paid_amount: number;
  status: string;
  due_date?: string | null;
  gateway_transaction_id?: string | null;
};

type AssignmentLookupRow = {
  assignment_id: number;
  amount: number;
  status: string;
  due_date?: string | null;  
};

function normalizeLookupType(lookupType?: string) {
  return lookupType === "registration" || lookupType === "admission"
    ? "registration"
    : "student_id";
}

async function hasPaymentTypeAmountColumn(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  const [result] = await sequelize.query<{ column_count: number }>(
    `SELECT COUNT(*) AS column_count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'payment_types'
       AND COLUMN_NAME = 'amount'`,
    { type: QueryTypes.SELECT }
  );

  return Number(result?.column_count || 0) > 0;
}

async function getPaymentTypeById(tenant: string, paymentTypeId: number) {
  const sequelize = getTenantSequelize(tenant);
  const includeAmount = await hasPaymentTypeAmountColumn(tenant);
  const amountSelect = includeAmount ? "pt.amount" : "0 AS amount";

  const [paymentType] = await sequelize.query<PaymentTypeRow>(
    `SELECT pt.id, pt.name, pt.description, pt.is_active, ${amountSelect}
     FROM payment_types pt
     WHERE pt.id = :paymentTypeId
     LIMIT 1`,
    {
      replacements: { paymentTypeId },
      type: QueryTypes.SELECT,
    }
  );

  return paymentType || null;
}

function parseMerchantOrderId(merchantOrderId: string) {
  const match = /^SP-(\d+)-(\d+)$/.exec(String(merchantOrderId || "").trim());

  if (!match) {
    throw new AppError("Invalid merchant order ID", 400);
  }

  return {
    paymentId: Number(match[1]),
    timestamp: Number(match[2]),
  };
}

function buildServiceAuthorizationHeader() {
  const token = generateToken({
    username: "public-payment",
    role: "public",
    email: "public-payment@shikshaprime.local",
  });

  return `Bearer ${token}`;
}

async function findStudentByIdentifier(tenant: string, identifier: string, lookupType: "registration" | "student_id") {
  const sequelize = getTenantSequelize(tenant);

  if (lookupType === "registration") {
    const [registration] = await sequelize.query<StudentLookupRow>(
      `SELECT
          spr.id,
          NULL AS student_id,
          spr.application_id AS application_id,
          TRIM(CONCAT(
            spr.first_name, ' ',
            COALESCE(spr.middle_name, ''), ' ',
            spr.last_name
          )) AS student_name,
          c.name AS class_name,
          sem.name AS semester,
          p.name AS program,
          d.name AS department,
          spr.mobile,
          spr.email,
          ac.name AS academic_year
        FROM student_pre_registration spr
        LEFT JOIN student_personal_details spd
          ON spd.user_id = spr.user_id
        LEFT JOIN classes c
          ON c.id = spd.class_id
        LEFT JOIN semesters sem
          ON sem.id = c.semester_id
        LEFT JOIN programs p
          ON p.id = spd.program_id
        LEFT JOIN departments d
          ON d.id = p.department_id
        LEFT JOIN academic_years ac
          ON ac.id = spd.academic_year_id
        WHERE LOWER(TRIM(spr.application_id)) = LOWER(TRIM(:identifier))
        LIMIT 1`,
      {
        replacements: { identifier: String(identifier || "").trim() },
        type: QueryTypes.SELECT
      }
    );
    return registration || null;
  } else {
    // 2. Query students table by student_id
    const [student] = await sequelize.query<StudentLookupRow>(
      `SELECT
          st.id,
          st.student_id,
          st.university_registration_number,

          TRIM(CONCAT(
            st.first_name, ' ',
            COALESCE(st.middle_name, ''), ' ',
            st.last_name
          )) AS student_name,

          c.name AS class_name,
          sem.name AS semester,
          p.name AS program,
          d.name AS department,

          st.mobile,
          st.email,

          ac.name AS academic_year

        FROM students st
        LEFT JOIN student_personal_details spd 
          ON spd.user_id = st.user_id

        LEFT JOIN classes c 
          ON c.id = spd.class_id

        LEFT JOIN semesters sem 
          ON sem.id = st.semester_id

        LEFT JOIN programs p 
          ON p.id = spd.program_id

        LEFT JOIN departments d 
          ON d.id = p.department_id

        LEFT JOIN academic_years ac 
          ON ac.id = spd.academic_year_id

        WHERE LOWER(TRIM(st.student_id)) = LOWER(TRIM(:identifier))
        LIMIT 1`,
      { 
        replacements: { identifier: String(identifier || "").trim() }, 
        type: QueryTypes.SELECT 
      }
    );
    return student || null;
  }
}

async function findLatestStudentFeeAssignment(tenant: string, studentId: number | null, applicationId: string | null, paymentTypeId: number) {
  const sequelize = getTenantSequelize(tenant);

  const whereClause = studentId
    ? `sa.student_id = :studentId`
    : `sa.application_id = :applicationId`;

  const [assignment] = await sequelize.query<AssignmentLookupRow>(
    `SELECT
        sa.id AS assignment_id,
        sa.amount,
        sa.status,
        sa.due_date
      FROM student_fee_assignments sa
      INNER JOIN payment_types pt
        ON pt.fee_head_id = sa.fee_head_id
      WHERE ${whereClause}
        AND pt.id = :paymentTypeId
      ORDER BY sa.updated_at DESC, sa.id DESC
      LIMIT 1`,
    {
      replacements: { studentId, applicationId, paymentTypeId },
      type: QueryTypes.SELECT,
    }
  );
  return assignment || null;
}

async function findLatestStudentPayment(tenant: string, studentId: number | null, applicationId: string | null, paymentTypeId: number) {
  const sequelize = getTenantSequelize(tenant);

  const whereClause = studentId
    ? `sp.student_id = :studentId`
    : `sp.application_id = :applicationId`;

  const [payment] = await sequelize.query<PaymentLookupRow>(
    `SELECT
       sp.id AS payment_id,
       sp.assignment_id AS assignment_id,
       sp.amount,
       sp.paid_amount,
       sp.status,
       sp.due_date,
       sp.gateway_transaction_id
     FROM student_fee_payments sp
     WHERE ${whereClause}
       AND sp.payment_type_id = :paymentTypeId
     ORDER BY COALESCE(sp.updated_at, sp.created_at) DESC, sp.id DESC
     LIMIT 1`,
    {
      replacements: { studentId, applicationId, paymentTypeId },
      type: QueryTypes.SELECT,
    }
  );

  return payment || null;
}

async function ensurePendingStudentPayment(
  tenant: string,
  studentId: number | null,
  applicationId: string | null,
  paymentTypeId: number,
  assignmentId: number | null,
  amount: number
) {
  const sequelize = getTenantSequelize(tenant);

  const column = studentId ? 'student_id' : 'application_id';
  const param = studentId ? ':studentId' : ':applicationId';

  await sequelize.query(
    `INSERT INTO student_fee_payments
       (${column}, assignment_id, payment_type_id, amount, due_date, status, paid_amount, created_at, updated_at)
     VALUES
       (${param}, :assignmentId, :paymentTypeId, :amount, CURDATE(), 'pending', 0, NOW(), NOW())`,
    {
      replacements: {
        studentId,
        applicationId,
        assignmentId,
        paymentTypeId,
        amount,
      },
      type: QueryTypes.INSERT,
    }
  );

  return findLatestStudentPayment(tenant, studentId, applicationId, paymentTypeId);
}

export const getPublicPaymentTypes = async (req: any, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant as string;
    const sequelize = getTenantSequelize(tenant);
    const includeAmount = await hasPaymentTypeAmountColumn(tenant);
    const amountSelect = includeAmount ? "pt.amount" : "0 AS amount";

    const paymentTypes = await sequelize.query<PaymentTypeRow>(
      `SELECT pt.id, pt.name, pt.description, pt.is_active, ${amountSelect}
       FROM payment_types pt
       WHERE pt.is_active = 1
       ORDER BY pt.name ASC`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      status: 1,
      message: "Payment types fetched successfully",
      data: paymentTypes,
    });
  } catch (error) {
    next(error);
  }
};

export const lookupPublicStudentPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant as string;
    const { identifier, lookupType, paymentTypeId } = req.query as {
      identifier?: string;
      lookupType?: string;
      paymentTypeId?: string;
    };

    if (!identifier || !paymentTypeId) {
      throw new AppError("identifier and paymentTypeId are required", 400);
    }

    const normalizedLookupType = normalizeLookupType(lookupType);
    const paymentType = await getPaymentTypeById(tenant, Number(paymentTypeId));

    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }

    const student = await findStudentByIdentifier(tenant, identifier, normalizedLookupType);

    if (!student) {
      const errorMsg = normalizedLookupType === "registration"
        ? "Student not found with the provided Registration Number"
        : "Student not found with the provided Student ID";
      throw new AppError(errorMsg, 404);
    }

    const isRegistrant = normalizedLookupType === "registration";
    const studentId = isRegistrant ? null : student.id;
    const applicationId = isRegistrant ? student.application_id : null;


    let assignment= await findLatestStudentFeeAssignment(tenant, studentId, applicationId, Number(paymentTypeId));
    let payment = await findLatestStudentPayment(tenant, studentId, applicationId, Number(paymentTypeId));
    const paymentAmount = Number(assignment.amount || 0);

    if (!payment && paymentAmount > 0) {
      payment = await ensurePendingStudentPayment(
        tenant,
        studentId,
        applicationId,
        Number(paymentTypeId),
        assignment.assignment_id,
        paymentAmount
      );
    }

    console.log(payment);

    return res.status(200).json({
      status: 1,
      message: "Student payment details fetched successfully",
      data: {
        student,
        payment,
        paymentType,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const initiatePublicStudentPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant as string;
    const { paymentId, route, amount, remarks, provider } = req.body as {
      paymentId?: number;
      route?: string;
      amount?: number;
      remarks?: string;
      provider?: "phonepe" | "razorpay";
    };

    if (!paymentId) {
      throw new AppError("paymentId is required", 400);
    }

    const { StudentPayment } = getTenantModels(tenant);
    const payment = await StudentPayment.findByPk(paymentId);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (Number(payment.amount || 0) <= 0) {
      throw new AppError("Amount not set for selected payment type", 400);
    }

    const remainingAmount = Number(payment.amount || 0) - Number(payment.paid_amount || 0);

    if (payment.status === "paid" || remainingAmount <= 0) {
      throw new AppError("Payment already completed", 400);
    }

    const payableAmount = Number(amount || remainingAmount);

    if (!payableAmount || payableAmount <= 0 || payableAmount > remainingAmount) {
      throw new AppError("Payment setup is not ready for this student. Please try again.", 400);
    }

    const merchantOrderId = `SP-${payment.id}-${Date.now()}`;
    const callbackUrl = buildFrontendUrl(tenant, `/payment/callback?merchantOrderId=${merchantOrderId}&route=${route}`);

    const gatewayEndpoint =
      provider === "razorpay"
        ? buildApiUrl(tenant, "/api/identity/payments/razorpay/order")
        : buildApiUrl(tenant, "/api/identity/payments/phonepe/initiate");

    const gatewayResponse = await fetch(gatewayEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildServiceAuthorizationHeader(),
        "X-Tenant": tenant,
      },
      body: JSON.stringify({
        amount: payableAmount * 100,
        userId: payment.student_id || payment.application_id,
        merchantOrderId,
        redirectUrl: callbackUrl,
        remarks: remarks || "",
      }),
    });

    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text();
      throw new AppError(errorText || "Failed to initiate payment", gatewayResponse.status);
    }

    const gatewayPayload: any = await gatewayResponse.json();
    const redirectUrl =
      gatewayPayload?.data?.paymentUrl ||
      gatewayPayload?.data?.redirectUrl ||
      gatewayPayload?.redirectUrl ||
      gatewayPayload?.paymentUrl ||
      null;

    await payment.update({
      gateway_transaction_id: merchantOrderId,
      gateway_provider: provider,
      last_payment_attempt_date: new Date(),
      payment_attempts_count: (payment.payment_attempts_count || 0) + 1,
      gateway_response: {
        ...(gatewayPayload || {}),
        remarks: remarks || "",
      },
      updated_at: new Date(),
    });

    return res.status(200).json({
      status: 1,
      message: "Payment gateway initiated successfully",
      data: {
        paymentId: payment.id,
        merchantOrderId,
        amount: payableAmount,
        redirectUrl,
        provider,
        merchant_order_id: merchantOrderId,
        razorpay_order_id: gatewayPayload?.data?.razorpay_order_id,
        razorpay_key_id: gatewayPayload?.data?.razorpay_key_id,
        currency: gatewayPayload?.data?.currency || "INR",
        expiresAt: gatewayPayload?.data?.expireAt || gatewayPayload?.data?.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPublicRazorpayPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant as string;
    const {
      paymentId,
      merchantOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body as {
      paymentId?: number;
      merchantOrderId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (!paymentId || !merchantOrderId) {
      throw new AppError("paymentId and merchantOrderId are required", 400);
    }

    const { PaymentTransaction, StudentPayment } = getTenantModels(tenant);
    const payment = await StudentPayment.findByPk(paymentId);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    const verifyResponse = await fetch(
      buildApiUrl(tenant, "/api/identity/payments/razorpay/verify"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: buildServiceAuthorizationHeader(),
          "X-Tenant": tenant,
        },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        }),
      }
    );

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      throw new AppError(errorText || "Failed to verify Razorpay payment", verifyResponse.status);
    }

    const verificationPayload: any = await verifyResponse.json();
    const existingTransaction = await PaymentTransaction.findOne({
      where: { gateway_order_id: merchantOrderId },
    });

    if (!existingTransaction) {
      const remainingAmount = Math.max(
        Number(payment.amount || 0) - Number(payment.paid_amount || 0),
        0
      );

      await PaymentTransaction.create({
        student_payment_id: payment.id,
        amount_paid: remainingAmount || Number(payment.amount || 0),
        payment_method: "card",
        transaction_ref: razorpay_payment_id || merchantOrderId,
        payment_date: new Date(),
        receipt_number: `SPRCPT-${payment.id}-${Date.now()}`,
        notes: "Public student payment via Razorpay",
        gateway_order_id: merchantOrderId,
        gateway_transaction_id: razorpay_payment_id || merchantOrderId,
        gateway_status: "COMPLETED",
        gateway_response: verificationPayload,
      });
    }

    await payment.update({
      paid_amount: Number(payment.amount || 0),
      paid_date: new Date(),
      status: "paid",
      gateway_status: "COMPLETED",
      gateway_transaction_id: merchantOrderId,
      gateway_provider: "razorpay",
      gateway_response: verificationPayload,
      updated_at: new Date(),
    });

    // Send Success Email
    try {
      const sequelize = getTenantSequelize(tenant);
      let studentResult: any[] = [];
      
      if (payment.student_id) {
        studentResult = await sequelize.query(
          `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM students WHERE id = :studentId LIMIT 1`,
          {
            replacements: { studentId: payment.student_id },
            type: QueryTypes.SELECT
          }
        );
      } else if (payment.application_id) {
        studentResult = await sequelize.query(
          `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM student_pre_registration WHERE id = :applicationId LIMIT 1`,
          {
            replacements: { applicationId: payment.application_id },
            type: QueryTypes.SELECT
          }
        );
        await sequelize.query(
          `UPDATE student_application_status sas  INNER JOIN student_pre_registration spr
              ON sas.user_id = spr.user_id
              SET sas.status = :status
              WHERE spr.id = :registration_id`,
          {
            replacements: {
              registration_id: payment.application_id,
              status: 'PAYMENT_COMPLETED',
            },
            type: QueryTypes.UPDATE,
          }
        );
      }

      const { PaymentType } = getTenantModels(tenant);
      const paymentType = await PaymentType.findByPk(payment.payment_type_id);
      const feeTypeName = paymentType ? paymentType.name : "Academic Fee";

      let studentName = 'Student';

      if (studentResult && studentResult.length > 0) {
        const student = studentResult[0];
        studentName = student.name;
        
        if (student.email) {
          try {
            console.log(`[PUBLIC PAYMENT VERIFICATION] Attempting to send success email to ${student.email}...`);
            await sendPaymentConfirmationEmail(
              student.email,
              student.name,
              payment.amount,
              feeTypeName,
              razorpay_payment_id || merchantOrderId
            );
            console.log(`[PUBLIC PAYMENT VERIFICATION] Success email fired for ${student.email}`);
          } catch (emailErr) {
            console.error("[PAYMENT ERROR] Failed to send payment success email:", emailErr);
          }
        }
      }
      
      await notifyAdminsForPayment(sequelize, studentName, payment.amount, feeTypeName);
    } catch (dbErr) {
      console.error("[PAYMENT ERROR] Failed to fetch student details or notify admins:", dbErr);
    }

    return res.status(200).json({
      status: 1,
      message: "Razorpay payment verified successfully",
      data: {
        paymentId: payment.id,
        merchantOrderId,
        state: "COMPLETED",
        studentPaymentStatus: "paid",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const reconcilePublicPaymentCallback = async (req: any, res: Response, next: NextFunction) => {
  try {
    const tenant = (req as any).tenant as string;
    const merchantOrderId = String(req.query.merchantOrderId || "").trim();

    if (!merchantOrderId) {
      throw new AppError("merchantOrderId is required", 400);
    }

    const { paymentId } = parseMerchantOrderId(merchantOrderId);
    const { PaymentTransaction, StudentPayment, StudentFeeAssignment } = getTenantModels(tenant);
    const payment = await StudentPayment.findByPk(paymentId);
    const feeAssignment = await StudentFeeAssignment.findByPk(payment.assignment_id);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    // if (!feeAssignment) {
    //   throw new AppError("Fee Assignment not found", 404);
    // }

    const statusResponse = await fetch(
      buildApiUrl(tenant, `/api/identity/payments/phonepe/status/${merchantOrderId}`),
      {
        method: "GET",
        headers: {
          "X-Tenant": tenant,
        },
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new AppError(errorText || "Failed to verify payment status", statusResponse.status);
    }

    const gatewayPayload: any = await statusResponse.json();
    const gatewayState = String(gatewayPayload?.data?.state || "").toUpperCase();

    if (gatewayState === "COMPLETED") {
      const remainingAmount = Math.max(
        Number(payment.amount || 0) - Number(payment.paid_amount || 0),
        0
      );

      const existingTransaction = await PaymentTransaction.findOne({
        where: { gateway_order_id: merchantOrderId },
      });

      if (!existingTransaction) {
        await PaymentTransaction.create({
          student_payment_id: payment.id,
          amount_paid: remainingAmount || Number(payment.amount || 0),
          payment_method: "upi",
          transaction_ref: gatewayPayload?.data?.transactionId || merchantOrderId,
          payment_date: new Date(),
          receipt_number: `SPRCPT-${payment.id}-${Date.now()}`,
          notes: "Public student payment via PhonePe",
          gateway_order_id: merchantOrderId,
          gateway_transaction_id: gatewayPayload?.data?.transactionId || merchantOrderId,
          gateway_status: gatewayState,
          gateway_response: gatewayPayload,
        });
      }

      await payment.update({
        paid_amount: Number(payment.amount || 0),
        paid_date: new Date(),
        status: "paid",
        gateway_status: gatewayState,
        gateway_transaction_id: merchantOrderId,
        gateway_provider: "phonepe",
        gateway_response: gatewayPayload,
        updated_at: new Date(),
      });

      await feeAssignment.update({paid_at: new Date(),
        status: normalizeEnum("PAID", 
                ["PENDING", "PARTIAL", "PAID", ""] as const, 
                "PAID"
            ), updated_at: new Date()});

      // Send Success Email
      try {
        const sequelize = getTenantSequelize(tenant);
        let studentResult: any[] = [];
        
        if (payment.student_id) {
          studentResult = await sequelize.query(
            `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM students WHERE id = :studentId LIMIT 1`,
            {
              replacements: { studentId: payment.student_id },
              type: QueryTypes.SELECT
            }
          );
        } else if (payment.application_id) {
          studentResult = await sequelize.query(
            `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM student_pre_registration WHERE application_id = :applicationId OR id = :applicationId LIMIT 1`,
            {
              replacements: { applicationId: payment.application_id },
              type: QueryTypes.SELECT
            }
          );
          await sequelize.query(
            `UPDATE student_application_status sas  INNER JOIN student_pre_registration spr
                ON sas.user_id = spr.user_id
                SET sas.status = :status
                WHERE spr.application_id = :registration_id`,
            {
              replacements: {
                registration_id: payment.application_id,
                status: 'PAYMENT_COMPLETED',
              },
              type: QueryTypes.UPDATE,
            }
          );
        }

        const { PaymentType } = getTenantModels(tenant);
        const paymentType = await PaymentType.findByPk(payment.payment_type_id);
        const feeTypeName = paymentType ? paymentType.name : "Academic Fee";

        if (feeTypeName && feeTypeName === 'Re-admission Fee') {
          await sequelize.query(
            `UPDATE readmission_requests rerq
              INNER JOIN students st
                ON rerq.student_id = st.id
            SET rerq.status = 'FEE_PAID', rerq.fee_paid = 1 
            WHERE st.id = :student_id and rerq.status = 'AWAITING_FEE_PAYMENT'`,
            {
              replacements: {
                student_id: payment.student_id
              },
              type: QueryTypes.UPDATE,
            }
          );
        }

        let studentName = 'Student';

        if (studentResult && studentResult.length > 0) {
          const student = studentResult[0];
          studentName = student.name;
          
          if (student.email) {
            try {
              console.log(`[PUBLIC PAYMENT STATUS] Attempting to send success email to ${student.email}...`);
              await sendPaymentConfirmationEmail(
                student.email,
                student.name,
                payment.amount,
                feeTypeName,
                gatewayPayload?.data?.transactionId || merchantOrderId
              );
              console.log(`[PUBLIC PAYMENT STATUS] Success email fired for ${student.email}`);
            } catch (emailErr) {
              console.error("[PAYMENT ERROR] Failed to send payment success email:", emailErr);
            }
          }
        }
        
        await notifyAdminsForPayment(sequelize, studentName, payment.amount, feeTypeName);
      } catch (dbErr) {
        console.error("[PAYMENT ERROR] Failed to fetch student details or notify admins:", dbErr);
      }
    } else {
      const isFailedState = gatewayState === "FAILED" && payment.gateway_status !== "FAILED";
      await payment.update({
        gateway_status: gatewayState || payment.gateway_status,
        gateway_transaction_id: merchantOrderId,
        gateway_provider: "phonepe",
        gateway_response: gatewayPayload,
        updated_at: new Date(),
      });

      if (isFailedState) {
        // Send Failure Email
        try {
          const sequelize = getTenantSequelize(tenant);
          let studentResult: any[] = [];
          
          if (payment.student_id) {
            studentResult = await sequelize.query(
              `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM students WHERE id = :studentId LIMIT 1`,
              {
                replacements: { studentId: payment.student_id },
                type: QueryTypes.SELECT
              }
            );
          } else if (payment.application_id) {
            studentResult = await sequelize.query(
              `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM student_pre_registration WHERE application_id = :applicationId OR id = :applicationId LIMIT 1`,
              {
                replacements: { applicationId: payment.application_id },
                type: QueryTypes.SELECT
              }
            );
          }

          const { PaymentType } = getTenantModels(tenant);
          const paymentType = await PaymentType.findByPk(payment.payment_type_id);
          const feeTypeName = paymentType ? paymentType.name : "Academic Fee";

          if (studentResult && studentResult.length > 0 && studentResult[0].email) {
            const student = studentResult[0];
            console.log(`[PUBLIC PAYMENT STATUS] Attempting to send failure email to ${student.email}...`);
            await sendPaymentFailureEmail(
              student.email,
              student.name,
              payment.amount,
              feeTypeName,
              gatewayPayload?.data?.transactionId || merchantOrderId
            );
            console.log(`[PUBLIC PAYMENT STATUS] Failure email fired for ${student.email}`);
          } else {
             console.warn(`[PUBLIC PAYMENT STATUS] No email found for failure email. student_id: ${payment.student_id} or application_id: ${payment.application_id}`);
          }
        } catch (emailErr) {
          console.error("[PAYMENT ERROR] Failed to send payment failure email:", emailErr);
        }
      }
    }

    await payment.reload();

    return res.status(200).json({
      status: 1,
      message: "Payment status reconciled successfully",
      data: {
        paymentId: payment.id,
        merchantOrderId,
        state: gatewayState,
        studentPaymentStatus: payment.status,
        gatewayResponse: gatewayPayload,
      },
    });
  } catch (error) {
    next(error);
  }
};
