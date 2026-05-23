import { NextFunction, Response } from "express";
import { QueryTypes } from "sequelize";

import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
import { AppError } from "../utils/appError";
import { generateToken } from "../utils/jwt";
import { buildApiUrl, buildFrontendUrl } from "../utils/tenantUrlBuilder";

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
  university_registration_number?: string | null;
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
  amount: number;
  paid_amount: number;
  status: string;
  due_date?: string | null;
  gateway_transaction_id?: string | null;
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

async function ensureSchemaUpdated(tenant: string) {
  const sequelize = getTenantSequelize(tenant);

  // Check if registration_id column exists
  const [columns] = await sequelize.query<{ column_name: string }>(
    `SELECT COLUMN_NAME as column_name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'student_payments'
       AND COLUMN_NAME = 'registration_id'`,
    { type: QueryTypes.SELECT }
  );

  if (!columns) {
    console.log(`[SchemaUpdate] Adding registration_id and making student_id nullable for tenant: ${tenant}`);
    try {
      // 1. Make student_id nullable (removing strict FK requirement if MySQL allows, or just allowing NULL)
      await sequelize.query(`ALTER TABLE student_payments MODIFY student_id BIGINT(20) UNSIGNED NULL`);
      // 2. Add registration_id
      await sequelize.query(`ALTER TABLE student_payments ADD COLUMN registration_id BIGINT(20) UNSIGNED NULL AFTER student_id`);
    } catch (err: any) {
      // If column already exists (race condition), just ignore
    }
  }
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
         r.id,
         NULL AS student_id,
         r.registration_id AS university_registration_number,
         CONCAT_WS(' ', r.first_name, r.last_name) AS student_name,
         c.name AS class_name,
         NULL AS semester,
         p.name AS program,
         d.name AS department,
         r.mobile,
         r.email,
         ac.name AS academic_year
       FROM student_registrations r
       LEFT JOIN classes c ON r.class_id = c.id
       LEFT JOIN programs p ON r.program_id = p.id
       LEFT JOIN departments d ON r.department_id = d.id
       LEFT JOIN academic_years ac ON r.academic_year_id = ac.id
       WHERE LOWER(TRIM(r.registration_id)) = LOWER(TRIM(:identifier))
       LIMIT 1`,
      { replacements: { identifier: String(identifier || "").trim() }, type: QueryTypes.SELECT }
    );
    return registration || null;
  } else {
    // 2. Query students table by student_id
    const [student] = await sequelize.query<StudentLookupRow>(
      `SELECT
         s.id,
         s.student_id,
         s.university_registration_number,
         s.student_name,
         c.name AS class_name,
         sem.name AS semester,
         p.name AS program,
         d.name AS department,
         s.mobile,
         s.email,
         ac.name AS academic_year
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN semesters sem ON s.semester_id = sem.id
       LEFT JOIN programs p ON s.program_id = p.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN academic_years ac ON s.academic_year_id = ac.id
       WHERE LOWER(TRIM(s.student_id)) = LOWER(TRIM(:identifier))
       LIMIT 1`,
      { replacements: { identifier: String(identifier || "").trim() }, type: QueryTypes.SELECT }
    );
    return student || null;
  }
}

async function findLatestStudentPayment(tenant: string, studentId: number | null, registrationId: number | null, paymentTypeId: number) {
  const sequelize = getTenantSequelize(tenant);

  const whereClause = studentId
    ? `sp.student_id = :studentId`
    : `sp.registration_id = :registrationId`;

  const [payment] = await sequelize.query<PaymentLookupRow>(
    `SELECT
       sp.id AS payment_id,
       sp.amount,
       sp.paid_amount,
       sp.status,
       sp.due_date,
       sp.gateway_transaction_id
     FROM student_payments sp
     WHERE ${whereClause}
       AND sp.payment_type_id = :paymentTypeId
     ORDER BY COALESCE(sp.updated_at, sp.created_at) DESC, sp.id DESC
     LIMIT 1`,
    {
      replacements: { studentId, registrationId, paymentTypeId },
      type: QueryTypes.SELECT,
    }
  );

  return payment || null;
}

async function ensurePendingStudentPayment(
  tenant: string,
  studentId: number | null,
  registrationId: number | null,
  paymentTypeId: number,
  amount: number
) {
  const sequelize = getTenantSequelize(tenant);

  const column = studentId ? 'student_id' : 'registration_id';
  const param = studentId ? ':studentId' : ':registrationId';

  await sequelize.query(
    `INSERT INTO student_payments
       (${column}, payment_type_id, amount, due_date, status, paid_amount, created_at, updated_at)
     VALUES
       (${param}, :paymentTypeId, :amount, CURDATE(), 'pending', 0, NOW(), NOW())`,
    {
      replacements: {
        studentId,
        registrationId,
        paymentTypeId,
        amount,
      },
      type: QueryTypes.INSERT,
    }
  );

  return findLatestStudentPayment(tenant, studentId, registrationId, paymentTypeId);
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

    // Ensure schema is updated for this tenant before proceeding
    await ensureSchemaUpdated(tenant);

    const student = await findStudentByIdentifier(tenant, identifier, normalizedLookupType);

    if (!student) {
      const errorMsg = normalizedLookupType === "registration"
        ? "Student not found with the provided Registration Number"
        : "Student not found with the provided Student ID";
      throw new AppError(errorMsg, 404);
    }

    const isRegistrant = normalizedLookupType === "registration";
    const studentId = isRegistrant ? null : student.id;
    const registrationId = isRegistrant ? student.id : null;

    let payment = await findLatestStudentPayment(tenant, studentId, registrationId, Number(paymentTypeId));
    const paymentTypeAmount = Number(paymentType.amount || 0);

    if (!payment && paymentTypeAmount > 0) {
      payment = await ensurePendingStudentPayment(
        tenant,
        studentId,
        registrationId,
        Number(paymentTypeId),
        paymentTypeAmount
      );
    }

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
    const { paymentId, amount, remarks } = req.body as {
      paymentId?: number;
      amount?: number;
      remarks?: string;
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
    const callbackUrl = buildFrontendUrl(tenant, `/payment/callback?merchantOrderId=${merchantOrderId}`);

    const gatewayResponse = await fetch(buildApiUrl(tenant, "/api/identity/payments/phonepe/initiate"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildServiceAuthorizationHeader(),
        "X-Tenant": tenant,
      },
      body: JSON.stringify({
        amount: payableAmount * 100,
        userId: payment.student_id || payment.registration_id, // Send either ID
        merchantOrderId,
        redirectUrl: callbackUrl,
        remarks: remarks || "",
      }),
    });

    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text();
      throw new AppError(errorText || "Failed to initiate payment", gatewayResponse.status);
    }

    const phonePeResponse: any = await gatewayResponse.json();
    const redirectUrl =
      phonePeResponse?.data?.paymentUrl ||
      phonePeResponse?.data?.redirectUrl ||
      phonePeResponse?.redirectUrl ||
      phonePeResponse?.paymentUrl;

    if (!redirectUrl) {
      throw new AppError("Failed to initiate payment", 500);
    }

    await payment.update({
      gateway_transaction_id: merchantOrderId,
      gateway_provider: "phonepe",
      last_payment_attempt_date: new Date(),
      payment_attempts_count: (payment.payment_attempts_count || 0) + 1,
      gateway_response: {
        ...(phonePeResponse || {}),
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
        expiresAt: phonePeResponse?.data?.expireAt || phonePeResponse?.data?.expiresAt,
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
    const { PaymentTransaction, StudentPayment } = getTenantModels(tenant);
    const payment = await StudentPayment.findByPk(paymentId);

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

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
    } else {
      await payment.update({
        gateway_status: gatewayState || payment.gateway_status,
        gateway_transaction_id: merchantOrderId,
        gateway_provider: "phonepe",
        gateway_response: gatewayPayload,
        updated_at: new Date(),
      });
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
