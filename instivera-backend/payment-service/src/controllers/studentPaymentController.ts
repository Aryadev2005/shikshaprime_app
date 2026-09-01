import { Request, Response, NextFunction } from "express";
import { Op, QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
import { sendPaymentConfirmationEmail, sendPaymentAssignmentEmail, sendPaymentFailureEmail } from "../utils/emailService";
import { buildApiUrl, buildFrontendUrl } from "../utils/tenantUrlBuilder";

import { notifyAdminsForPayment } from "../utils/notificationService";

export const assignPayment = async (req, res: Response, next: NextFunction) => {
  try {
    const {
      student_ids,
      payment_type_id,
      fee_head_id,
      academic_year_id,
      amount,
      due_date,
      status
    } = req.body;

    if (!payment_type_id || !amount || !due_date) {
      throw new AppError("Payment type, amount, and due date are required", 400);
    }

    if (!student_ids || student_ids.length === 0) {
      throw new AppError("At least one student must be selected", 400);
    }

    let academic_year;

    if (academic_year_id === null) {
      const rows: any = await getTenantSequelize(req.tenant).query(
        `SELECT id FROM academic_years WHERE start_date <= CURDATE() AND end_date >= CURDATE()
         LIMIT 1`,
        { type: QueryTypes.SELECT }
      );

      if (!rows || rows.length === 0) {
        throw new Error("No active academic year found");
      }
      academic_year = rows[0].id;
    }
    const { PaymentType, StudentPayment, StudentFeeAssignment } = getTenantModels(req.tenant);
    const paymentType = await PaymentType.findByPk(payment_type_id);
    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }
    const feeAssignments = await Promise.all(
      student_ids.map(async (studentId: number) => {
        return StudentFeeAssignment.create({
          student_id: studentId,
          academic_year_id: academic_year_id ? academic_year_id : academic_year,
          fee_head_id,
          amount,
          due_date: new Date(due_date),
          status: status || 'pending',
        });
      })
    );
    const payments = await Promise.all(
      student_ids.map(async (studentId: number) => {
        const payment = await StudentPayment.create({
          student_id: studentId,
          assignment_id: feeAssignments.find(feeAssignment => feeAssignment.student_id === studentId).id,
          payment_type_id,
          amount,
          due_date: new Date(due_date),
          status: status || 'pending',
        });

        try {
          const sequelize = getTenantSequelize(req.tenant);
          const studentResult: any[] = await sequelize.query(
            `SELECT 
               s.email, 
               TRIM(CONCAT(s.first_name, ' ', COALESCE(s.middle_name, ''), ' ', s.last_name)) AS name,
               COALESCE(s.user_id, u.user_id) AS user_id
             FROM students s
             LEFT JOIN users u ON u.email COLLATE utf8mb4_general_ci = s.email COLLATE utf8mb4_general_ci
             WHERE s.id = :studentId LIMIT 1`,
            {
              replacements: { studentId },
              type: QueryTypes.SELECT
            }
          );
          
          if (studentResult && studentResult.length > 0) {
            const student = studentResult[0];
            const paymentLink = buildFrontendUrl(req.tenant, `/student/payment-dashboard?pay=${payment.id}`);
            
            // Send Email Notification
            if (student.email) {
              console.log(`[PAYMENT ASSIGNMENT] Attempting to send email to ${student.email}...`);
              await sendPaymentAssignmentEmail(
                student.email,
                student.name,
                amount,
                paymentType.name,
                due_date,
                paymentLink
              );
              console.log(`[PAYMENT ASSIGNMENT] Email notification successfully fired for ${student.email}`);
            } else {
              console.log(`[PAYMENT ASSIGNMENT] Could not send email for studentId ${studentId}: Email not found in DB`);
            }

            // Send In-App Notification
            if (student.user_id) {
              const notifTitle = "New Fee Assignment";
              const notifMessage = `A new payment of ₹${amount} for ${paymentType.name} is due on ${new Date(due_date).toLocaleDateString('en-GB')}.`;
              
              await sequelize.query(`
                INSERT INTO notifications (
                    user_id, title, message, type, channel, link, is_read, created_at, updated_at
                ) VALUES (?, ?, ?, 'info', 'IN_APP', ?, 0, NOW(), NOW())
              `, {
                replacements: [
                    student.user_id,
                    notifTitle,
                    notifMessage,
                    '/student/payment-dashboard'
                ],
                type: QueryTypes.INSERT
              });
              console.log(`[PAYMENT ASSIGNMENT] In-App notification successfully inserted for userId ${student.user_id}`);
            }
          }
        } catch (emailErr) {
          console.error(`[PAYMENT ERROR] Failed to send assignment notifications for studentId ${studentId}:`, emailErr);
        }
        return payment;
      })
    );
    return res.status(201).json({
      status: 1,
      message: `Payment assigned to ${payments.length} student(s) successfully`,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};
export const getStudentPayments = async (req, res: Response, next: NextFunction) => {
  try {
    const {
      classId,
      programId,
      academicYearId,
      departmentId,
      status,
      paymentTypeId,
      studentId,
      studentIdOrName,
      studentEmail,
    } = req.query as any;

    const authUser = (req as any).user;

    let query = `
      SELECT 
        sp.id AS payment_id,
        sp.amount,
        sp.paid_amount,
        sp.status,
        sp.paid_date,
        sp.due_date,
        sp.created_at,

        pt.id AS payment_type_id,
        pt.name AS payment_type_name,

        st.student_id AS student_id,

        TRIM(CONCAT(
          st.first_name, ' ',
          COALESCE(st.middle_name, ''), ' ',
          st.last_name
        )) AS student_name,

        spd.class_id,
        spd.program_id,
        spd.academic_year_id,
        pr.department_id
      FROM student_fee_payments sp
      INNER JOIN students st ON sp.student_id = st.id
      INNER JOIN student_personal_details spd ON st.user_id = spd.user_id
      INNER JOIN payment_types pt ON sp.payment_type_id = pt.id
      INNER JOIN programs pr ON spd.program_id = pr.id
      WHERE 1 = 1
    `;

    const replacements: any = {};

    // Restrict to a specific student
    if (studentId) {
      query += ` AND sp.student_id = :studentId`;
      replacements.studentId = studentId;
    } else if (authUser?.role === "student" && authUser?.user_id) {
      query += ` AND st.user_id = :userId`;
      replacements.userId = authUser.user_id;
    } else if (authUser?.role === "student" && (studentEmail || authUser?.email)) {
      query += ` AND st.email = :studentEmail`;
      replacements.studentEmail = studentEmail || authUser?.email;
    }

    // Filters now use spd / pr
    if (classId && classId !== "all") {
      query += ` AND spd.class_id = :classId`;
      replacements.classId = classId;
    }
    if (programId && programId !== "all") {
      query += ` AND spd.program_id = :programId`;
      replacements.programId = programId;
    }
    if (academicYearId && academicYearId !== "all") {
      query += ` AND spd.academic_year_id = :academicYearId`;
      replacements.academicYearId = academicYearId;
    }
    if (departmentId && departmentId !== "all") {
      query += ` AND pr.department_id = :departmentId`;
      replacements.departmentId = departmentId;
    }
    if (paymentTypeId) {
      query += ` AND sp.payment_type_id = :paymentTypeId`;
      replacements.paymentTypeId = paymentTypeId;
    }
    if (status) {
      query += ` AND sp.status = :status`;
      replacements.status = status;
    }

    // Search by student ID or name
    if (studentIdOrName) {
      query += `
        AND (
          st.student_id LIKE :studentIdOrName
          OR TRIM(CONCAT(
              st.first_name, ' ',
              COALESCE(st.middle_name, ''), ' ',
              st.last_name
          )) LIKE :studentName
        )
      `;
      replacements.studentIdOrName = `%${studentIdOrName}%`;
      replacements.studentName = `%${studentIdOrName}%`;
    }

    const sequelize = getTenantSequelize(req.tenant);
    const payments = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return res.status(200).json({
      status: 1,
      message: "Student payments fetched successfully",
      data: payments,
      count: payments.length,
    });
  } catch (error) {
    next(error);
  }
};


export const getStudentPaymentsReports = async (req, res: Response, next: NextFunction) => {
  try {
    const {
      classId,
      programId,
      academicYearId,
      departmentId,
      status,
      paymentTypeId,
      feeHeadId,
      studentId,
      studentIdOrName,
      studentEmail,
    } = req.query as any;

    const authUser = (req as any).user;

    let query = `
      SELECT 
        sp.id AS payment_id,
        sp.student_id AS db_student_id,
        sp.fee_head_id AS fee_head_id,
        sp.amount,
        sp.paid_amount,
        sp.status,
        sp.paid_date,
        sp.due_date,
        sp.created_at,
        sp.gateway_transaction_id,
        sp.application_id,

        pt.id AS payment_type_id,
        pt.name AS payment_type_name,
        pt.fee_head_id AS pt_fee_head_id,

        st.student_id AS student_id,
        st.roll_number AS roll_number,

        TRIM(CONCAT(
          st.first_name, ' ',
          COALESCE(st.middle_name, ''), ' ',
          st.last_name
        )) AS student_name,

        spd.class_id,
        spd.program_id,
        spd.academic_year_id,
        pr.department_id
      FROM student_fee_payments sp
      LEFT JOIN students st ON sp.student_id = st.id
      LEFT JOIN student_personal_details spd ON st.user_id = spd.user_id
      LEFT JOIN payment_types pt ON sp.payment_type_id = pt.id
      LEFT JOIN programs pr ON spd.program_id = pr.id
      WHERE 1 = 1
    `;

    const replacements: any = {};

    // Restrict to a specific student
    if (studentId) {
      query += ` AND sp.student_id = :studentId`;
      replacements.studentId = studentId;
    } else if (authUser?.role === "student" && authUser?.user_id) {
      query += ` AND st.user_id = :userId`;
      replacements.userId = authUser.user_id;
    } else if (authUser?.role === "student" && (studentEmail || authUser?.email)) {
      query += ` AND st.email = :studentEmail`;
      replacements.studentEmail = studentEmail || authUser?.email;
    }

    // Filters now use spd / pr
    if (classId && classId !== "all") {
      query += ` AND spd.class_id = :classId`;
      replacements.classId = classId;
    }
    if (programId && programId !== "all") {
      query += ` AND spd.program_id = :programId`;
      replacements.programId = programId;
    }
    if (academicYearId && academicYearId !== "all") {
      query += ` AND spd.academic_year_id = :academicYearId`;
      replacements.academicYearId = academicYearId;
    }
    if (departmentId && departmentId !== "all") {
      query += ` AND pr.department_id = :departmentId`;
      replacements.departmentId = departmentId;
    }
    if (paymentTypeId) {
      query += ` AND sp.payment_type_id = :paymentTypeId`;
      replacements.paymentTypeId = paymentTypeId;
    }
    if (feeHeadId && feeHeadId !== "all") {
      query += ` AND sp.fee_head_id = :feeHeadId AND sp.student_id IS NOT NULL AND sp.fee_head_id IS NOT NULL`;
      replacements.feeHeadId = feeHeadId;
    }
    if (status) {
      query += ` AND sp.status = :status`;
      replacements.status = status;
    }

    // Search by student ID or name
    if (studentIdOrName) {
      query += `
        AND (
          st.student_id LIKE :studentIdOrName
          OR TRIM(CONCAT(
              st.first_name, ' ',
              COALESCE(st.middle_name, ''), ' ',
              st.last_name
          )) LIKE :studentName
        )
      `;
      replacements.studentIdOrName = `%${studentIdOrName}%`;
      replacements.studentName = `%${studentIdOrName}%`;
    }

    const sequelize = getTenantSequelize(req.tenant);
    const payments = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return res.status(200).json({
      status: 1,
      message: "Student payments fetched successfully",
      data: payments,
      count: payments.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentPaymentAssignments = async (req, res: Response, next: NextFunction) => {
  const {
      classId,
      programId,
      academicYearId,
      departmentId,
      status,
      feeHeadId,
      studentId,
      studentIdOrName,
      studentEmail,
    } = req.query as any;

  const authUser = (req as any).user;

  try {
    let query = `
        SELECT 
          sfa.id AS assignment_id,
          sfa.amount,
          sfa.discount_amount,
          sfa.fine_amount,
          sfa.status,
          sfa.due_date,
          sfa.paid_at AS paid_date,
          sfa.created_at,

          fh.id AS fee_head_id,
          fh.name AS fee_head_name,

          st.student_id AS student_id,

          TRIM(CONCAT(
            st.first_name, ' ',
            COALESCE(st.middle_name, ''), ' ',
            st.last_name
          )) AS student_name,

          spd.class_id,
          spd.program_id,
          sfa.academic_year_id,
          pr.department_id
        FROM student_fee_assignments sfa
        INNER JOIN students st ON sfa.student_id = st.id
        INNER JOIN student_personal_details spd ON st.user_id = spd.user_id
        INNER JOIN fee_heads fh ON sfa.fee_head_id = fh.id
        INNER JOIN programs pr ON spd.program_id = pr.id
        WHERE 1 = 1
      `;

      const replacements: any = {};

      // Restrict to a specific student
      if (studentId) {
        query += ` AND sfa.student_id = :studentId`;
        replacements.studentId = studentId;
      } else if (authUser?.role === "student" && authUser?.user_id) {
        query += ` AND st.user_id = :userId`;
        replacements.userId = authUser.user_id;
      } else if (authUser?.role === "student" && (studentEmail || authUser?.email)) {
        query += ` AND st.email = :studentEmail`;
        replacements.studentEmail = studentEmail || authUser?.email;
      }

      // Filters now use sfa / spd / pr
      if (classId && classId !== "all") {
        query += ` AND spd.class_id = :classId`;
        replacements.classId = classId;
      }
      if (programId && programId !== "all") {
        query += ` AND spd.program_id = :programId`;
        replacements.programId = programId;
      }
      if (academicYearId && academicYearId !== "all") {
        query += ` AND sfa.academic_year_id = :academicYearId`;
        replacements.academicYearId = academicYearId;
      }
      if (departmentId && departmentId !== "all") {
        query += ` AND pr.department_id = :departmentId`;
        replacements.departmentId = departmentId;
      }
      if (feeHeadId) {
        query += ` AND sfa.fee_head_id = :feeHeadId`;
        replacements.feeHeadId = feeHeadId;
      }
      if (status) {
        query += ` AND sfa.status = :status`;
        replacements.status = status;
      }

      // Search by student ID or name
      if (studentIdOrName) {
        query += `
          AND (
            st.student_id LIKE :studentIdOrName
            OR TRIM(CONCAT(
                st.first_name, ' ',
                COALESCE(st.middle_name, ''), ' ',
                st.last_name
            )) LIKE :studentName
          )
        `;
        replacements.studentIdOrName = `%${studentIdOrName}%`;
        replacements.studentName = `%${studentIdOrName}%`;
      }

      const sequelize = getTenantSequelize(req.tenant);
      const assignments = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT,
    });
    return res.status(200).json({
      status: 1,
      message: "Student payment assignments fetched successfully",
      data: assignments,
      count: assignments.length,
    });
  } catch (error) {
    next(error);
  }
}

export const getPaymentById = async (req, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { PaymentType, PaymentTransaction, StudentPayment } = getTenantModels(req.tenant);
    const payment = await StudentPayment.findByPk(id, {
      include: [
        { model: PaymentType, as: 'paymentType' },
        { model: PaymentTransaction, as: 'transactions' },
      ],
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    return res.status(200).json({
      status: 1,
      message: "Payment fetched successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
export const recordPayment = async (req, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount_paid, payment_method, transaction_ref, notes, created_by } = req.body;

    const { PaymentTransaction, StudentPayment } = getTenantModels(req.tenant);
    const studentPayment = await StudentPayment.findByPk(id);
    if (!studentPayment) {
      throw new AppError("Student payment not found", 404);
    }

    if (!amount_paid || amount_paid <= 0) {
      throw new AppError("Valid payment amount is required", 400);
    }

    if (!payment_method) {
      throw new AppError("Payment method is required", 400);
    }
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transaction = await PaymentTransaction.create({
      student_payment_id: Number(id),
      amount_paid,
      payment_method,
      transaction_ref: transaction_ref || null,
      receipt_number: receiptNumber,
      notes: notes || null,
      created_by: created_by || null,
    });
    const newPaidAmount = Number(studentPayment.paid_amount) + Number(amount_paid);
    const totalAmount = Number(studentPayment.amount);
    let newStatus: 'pending' | 'paid' | 'partial' | 'overdue' = 'partial';

    if (newPaidAmount >= totalAmount) {
      newStatus = 'paid';
    }

    await studentPayment.update({
      paid_amount: newPaidAmount,
      paid_date: new Date(),
      status: newStatus,
      updated_at: new Date(),
    });

    return res.status(200).json({
      status: 1,
      message: "Payment recorded successfully",
      data: {
        payment: studentPayment,
        transaction,
        receipt_number: receiptNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const deleteStudentPayment = async (req, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { PaymentTransaction, StudentPayment } = getTenantModels(req.tenant);
    const payment = await StudentPayment.findByPk(id);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }
    await PaymentTransaction.destroy({ where: { student_payment_id: id } });
    await payment.destroy();

    return res.status(200).json({
      status: 1,
      message: "Payment deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate payment with PhonePe gateway
 * POST /payment/students/:paymentId/initiate
 */
export const initiatePaymentGateway = async (req, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    const { amount, route, provider = "phonepe" } = req.body;
    const authUser = (req as any).user;
    const { StudentPayment } = getTenantModels(req.tenant);

    let payment = await StudentPayment.findOne({
        where: { assignment_id: assignmentId } 
    });

    if (!payment) {
      const { StudentFeeAssignment } = getTenantModels(req.tenant);
      const assignment: any = await StudentFeeAssignment.findByPk(assignmentId);
      
      if (assignment) {
        payment = await StudentPayment.create({
            student_id: assignment.student_id,
            assignment_id: assignment.id,
            payment_type_id: assignment.fee_head_id || 1, 
            amount: assignment.amount,
            due_date: assignment.due_date,
            status: assignment.status === '' ? 'pending' : (assignment.status || 'pending'),
        });
      }
    }

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }
    const sequelize = getTenantSequelize(req.tenant);
    // Get student ID from email/username or query database
    let studentId = null;
    if (authUser.role === 'student') {
      // Get student ID from students table using email
      const student: any = await sequelize.query(
        `SELECT id FROM students WHERE email = :email LIMIT 1`,
        {
          replacements: { email: authUser.email },
          type: QueryTypes.SELECT,
        }
      );
      studentId = student[0]?.id;
    }

    // Authorization check - student can only pay their own payments
    if (authUser.role === 'student' && payment.student_id !== studentId) {
      throw new AppError("Unauthorized", 403);
    }
    if (authUser.role !== 'admin' && authUser.role !== 'student') {
      throw new AppError("Unauthorized", 403);
    }

    // Validate amount
    const remainingAmount = Number(payment.amount) - Number(payment.paid_amount || 0);
    const payAmount = amount || remainingAmount;

    if (payAmount <= 0 || payAmount > remainingAmount) {
      throw new AppError("Invalid payment amount", 400);
    }

    // Generate merchant order ID
    const merchantOrderId = `SP-${payment.id}-${Date.now()}`;

    // Call identity service to initiate PhonePe payment
    const callbackUrl = buildFrontendUrl(req.tenant, `/payment/callback?merchantOrderId=${merchantOrderId}&route=${route}`);
    //const callbackUrl = `${redirectUrl}/payment/callback?merchantOrderId=${merchantOrderId}`;

    // Extract raw token to forward to identity service
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError("No authorization token provided", 401);
    }

    const gatewayEndpoint =
      provider === "razorpay"
        ? buildApiUrl(req.tenant, "/api/identity/payments/razorpay/order")
        : buildApiUrl(req.tenant, "/api/identity/payments/phonepe/initiate");

    console.log(`[Payment Debug] Payment ID: ${payment.id}, Student ID: ${payment.student_id}, Amount: ${payAmount}`);
    const response = await fetch(gatewayEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'X-Tenant': req.tenant,
      },
      body: JSON.stringify({
        amount: payAmount * 100, // Convert to paise
        userId: payment.student_id,
        merchantOrderId,
        redirectUrl: callbackUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Payment Error] Identity service returned ${response.status}: ${errorText}`);
      throw new AppError(`Failed to initiate payment with gateway: ${response.status} - ${errorText}`, response.status);
    }

    const gatewayResponse: any = await response.json();

    // Update payment with gateway info
    await payment.update({
      gateway_transaction_id: merchantOrderId,
      gateway_provider: provider,
      last_payment_attempt_date: new Date(),
      payment_attempts_count: (payment.payment_attempts_count || 0) + 1,
      gateway_response: gatewayResponse,
    });

    // Extract payment URL from response
    const paymentUrl = gatewayResponse?.data?.paymentUrl ||
      gatewayResponse?.data?.redirectUrl ||
      gatewayResponse?.redirectUrl ||
      gatewayResponse?.paymentUrl || null;

    return res.status(200).json({
      status: 1,
      message: "Payment gateway initiated successfully",
      data: {
        paymentId: payment.id,
        merchantOrderId,
        amount: payAmount,
        redirectUrl: paymentUrl,
        provider,
        merchant_order_id: merchantOrderId,
        razorpay_order_id: gatewayResponse?.data?.razorpay_order_id,
        razorpay_key_id: gatewayResponse?.data?.razorpay_key_id,
        currency: gatewayResponse?.data?.currency || "INR",
        expiresAt: gatewayResponse?.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyStudentGatewayPayment = async (req, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    const {
      merchantOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
    const authUser = (req as any).user;
    const { PaymentTransaction, StudentPayment } = getTenantModels(req.tenant);
    const payment = await StudentPayment.findOne({
        where: { assignment_id: assignmentId } });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    const sequelize = getTenantSequelize(req.tenant);
    let studentId = null;
    if (authUser.role === "student") {
      const student: any = await sequelize.query(
        `SELECT id FROM students WHERE email = :email LIMIT 1`,
        {
          replacements: { email: authUser.email },
          type: QueryTypes.SELECT,
        }
      );
      studentId = student[0]?.id;
    }

    if (authUser.role === "student" && payment.student_id !== studentId) {
      throw new AppError("Unauthorized", 403);
    }

    const verifyResponse = await fetch(
      buildApiUrl(req.tenant, "/api/identity/payments/razorpay/verify"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization || "",
          "X-Tenant": req.tenant,
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
      throw new AppError(errorText || "Failed to verify payment", verifyResponse.status);
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
        notes: "Student dashboard payment via Razorpay",
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

    // Send email confirmation
    try {
      const studentResult: any[] = await sequelize.query(
        `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM students WHERE id = :studentId LIMIT 1`,
        {
          replacements: { studentId: payment.student_id },
          type: QueryTypes.SELECT
        }
      );

      const { PaymentType } = getTenantModels(req.tenant);
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
            console.log(`[PAYMENT VERIFICATION] Attempting to send success email to ${student.email}...`);
            await sendPaymentConfirmationEmail(
              student.email,
              student.name,
              payment.amount,
              feeTypeName,
              razorpay_payment_id || merchantOrderId
            );
            console.log(`[PAYMENT VERIFICATION] Success email fired for ${student.email}`);
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
      message: "Payment verified successfully",
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

/**
 * Check payment status with gateway
 * GET /payment/students/:paymentId/status
 */
export const checkPaymentStatus = async (req, res: Response, next: NextFunction) => {
  try {
    const { paymentId } = req.params;
    const authUser = (req as any).user;
    const { StudentPayment } = getTenantModels(req.tenant);
    const payment = await StudentPayment.findByPk(paymentId);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }
    const sequelize = getTenantSequelize(req.tenant);
    // Get student ID from email/username or query database
    let studentId = null;
    if (authUser.role === 'student') {
      // Get student ID from students table using email
      const student: any = await sequelize.query(
        `SELECT id FROM students WHERE email = :email LIMIT 1`,
        {
          replacements: { email: authUser.email },
          type: QueryTypes.SELECT,
        }
      );
      studentId = student[0]?.id;
    }

    // Authorization check - student can only check their own payments
    if (authUser.role === 'student' && payment.student_id !== studentId) {
      throw new AppError("Unauthorized", 403);
    }
    if (authUser.role !== 'admin' && authUser.role !== 'student') {
      throw new AppError("Unauthorized", 403);
    }

    if (!payment.gateway_transaction_id) {
      return res.status(200).json({
        status: 1,
        message: "Payment status retrieved",
        data: {
          paymentId,
          gatewayStatus: null,
          studentPaymentStatus: payment.status,
        },
      });
    }

    // Call identity service to check payment status    
    const response = await fetch(buildApiUrl(req.tenant, `/api/identity/payments/phonepe/status/${payment.gateway_transaction_id}`),
      {
        headers: {
          'Authorization': `Bearer ${authUser.token}`,
          'X-Tenant': req.tenant
        },
      }
    );

    if (!response.ok) {
      throw new AppError("Failed to check payment status", response.status);
    }

    const statusResponse: any = await response.json();
    const gatewayState = statusResponse?.data?.state;

    let updatedPaymentStatus = payment.status;

    // Reconcile database if status changed and webhook was missed
    if (gatewayState === 'COMPLETED' && payment.status !== 'paid') {
      const remainingAmount = Math.max(
        Number(payment.amount || 0) - Number(payment.paid_amount || 0),
        0
      );

      const { PaymentTransaction } = getTenantModels(req.tenant);
      const existingTransaction = await PaymentTransaction.findOne({
        where: { gateway_order_id: payment.gateway_transaction_id },
      });

      if (!existingTransaction) {
        await PaymentTransaction.create({
          student_payment_id: payment.id,
          amount_paid: remainingAmount || Number(payment.amount || 0),
          payment_method: "upi",
          transaction_ref: statusResponse?.data?.transactionId || payment.gateway_transaction_id,
          payment_date: new Date(),
          receipt_number: `SPRCPT-${payment.id}-${Date.now()}`,
          notes: "Student payment via PhonePe",
          gateway_order_id: payment.gateway_transaction_id,
          gateway_transaction_id: statusResponse?.data?.transactionId || payment.gateway_transaction_id,
          gateway_status: gatewayState,
          gateway_response: statusResponse,
        });
      }

      await payment.update({
        paid_amount: Number(payment.amount || 0),
        paid_date: new Date(),
        status: "paid",
        gateway_status: gatewayState,
        gateway_provider: "phonepe",
        gateway_response: statusResponse,
        updated_at: new Date(),
      });
      
      updatedPaymentStatus = "paid";

      // Send Success Email
      try {
        const studentResult: any[] = await sequelize.query(
          `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM students WHERE id = :studentId LIMIT 1`,
          {
            replacements: { studentId: payment.student_id },
            type: QueryTypes.SELECT
          }
        );

        const { PaymentType } = getTenantModels(req.tenant);
        const paymentType = await PaymentType.findByPk(payment.payment_type_id);
        const feeTypeName = paymentType ? paymentType.name : "Academic Fee";

        let studentName = 'Student';
        
        if (studentResult && studentResult.length > 0) {
          const student = studentResult[0];
          studentName = student.name;
          
          if (student.email) {
            try {
              console.log(`[PAYMENT STATUS] Attempting to send success email to ${student.email}...`);
              await sendPaymentConfirmationEmail(
                student.email,
                student.name,
                payment.amount,
                feeTypeName,
                statusResponse?.data?.transactionId || payment.gateway_transaction_id
              );
              console.log(`[PAYMENT STATUS] Success email fired for ${student.email}`);
            } catch (emailErr) {
              console.error("[PAYMENT ERROR] Failed to send payment success email:", emailErr);
            }
          }
        }
        
        await notifyAdminsForPayment(sequelize, studentName, payment.amount, feeTypeName);
      } catch (dbErr) {
        console.error("[PAYMENT ERROR] Failed to fetch student details or notify admins:", dbErr);
      }
    } else if (gatewayState === 'FAILED' && payment.gateway_status !== 'FAILED') {
      await payment.update({
        gateway_status: gatewayState,
        gateway_provider: "phonepe",
        gateway_response: statusResponse,
        updated_at: new Date(),
      });

      // Send Failure Email
      try {
        const studentResult: any[] = await sequelize.query(
          `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM students WHERE id = :studentId LIMIT 1`,
          {
            replacements: { studentId: payment.student_id },
            type: QueryTypes.SELECT
          }
        );

        const { PaymentType } = getTenantModels(req.tenant);
        const paymentType = await PaymentType.findByPk(payment.payment_type_id);
        const feeTypeName = paymentType ? paymentType.name : "Academic Fee";

        if (studentResult && studentResult.length > 0 && studentResult[0].email) {
          const student = studentResult[0];
          console.log(`[PAYMENT STATUS] Attempting to send failure email to ${student.email}...`);
          await sendPaymentFailureEmail(
            student.email,
            student.name,
            payment.amount,
            feeTypeName,
            statusResponse?.data?.transactionId || payment.gateway_transaction_id
          );
          console.log(`[PAYMENT STATUS] Failure email fired for ${student.email}`);
        }
      } catch (emailErr) {
        console.error("[PAYMENT ERROR] Failed to send payment failure email:", emailErr);
      }
    }

    return res.status(200).json({
      status: 1,
      message: "Payment status retrieved and reconciled",
      data: {
        paymentId,
        gatewayStatus: gatewayState,
        studentPaymentStatus: updatedPaymentStatus,
        gatewayResponse: statusResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update payment status after successful gateway payment
 * PUT /payment/students/:paymentId/update-status
 */
export const updatePaymentStatusAfterGateway = async (
  req,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentId } = req.params;
    const { newStatus, merchantOrderId, amount } = req.body;
    const authUser = (req as any).user;
    const { StudentPayment } = getTenantModels(req.tenant);
    // Get payment
    const payment = await StudentPayment.findByPk(paymentId);
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }
    const sequelize = getTenantSequelize(req.tenant);
    // Get student ID from email/username or query database
    let studentId = null;
    if (authUser.role === 'student') {
      const student: any = await sequelize.query(
        `SELECT id FROM students WHERE email = :email LIMIT 1`,
        {
          replacements: { email: authUser.email },
          type: QueryTypes.SELECT,
        }
      );
      studentId = student[0]?.id;
    }

    // Authorization check - student can only update their own payments
    if (authUser.role === 'student' && payment.student_id !== studentId) {
      throw new AppError("Unauthorized", 403);
    }
    if (authUser.role !== 'admin' && authUser.role !== 'student') {
      throw new AppError("Unauthorized", 403);
    }

    // Validate new status
    const validStatuses = ['pending', 'paid', 'partial', 'overdue'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError(`Invalid status. Valid values: ${validStatuses.join(', ')}`, 400);
    }

    // If newStatus is 'paid', update the paid_amount to match total amount
    let updateData: any = {
      status: newStatus,
      updated_at: new Date(),
    };

    if (newStatus === 'paid') {
      updateData.paid_amount = payment.amount;
      updateData.paid_date = new Date();
      updateData.gateway_status = 'COMPLETED';
    }

    if (merchantOrderId) {
      updateData.gateway_transaction_id = merchantOrderId;
    }

    // Update payment status
    await payment.update(updateData);

    console.log(
      `[UPDATE_STATUS] Payment ${paymentId} status updated from '${payment.status}' to '${newStatus}'`
    );

    // If payment status becomes paid, send success email
    if (newStatus === 'paid') {
      try {
        const studentResult: any[] = await sequelize.query(
          `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM students WHERE id = :studentId LIMIT 1`,
          {
            replacements: { studentId: payment.student_id },
            type: QueryTypes.SELECT
          }
        );

        const { PaymentType } = getTenantModels(req.tenant);
        const paymentType = await PaymentType.findByPk(payment.payment_type_id);
        const feeTypeName = paymentType ? paymentType.name : "Academic Fee";

        if (studentResult && studentResult.length > 0 && studentResult[0].email) {
          const student = studentResult[0];
          console.log(`[UPDATE_STATUS] Attempting to send success email to ${student.email}...`);
          await sendPaymentConfirmationEmail(
            student.email,
            student.name,
            payment.amount,
            feeTypeName,
            merchantOrderId || payment.gateway_transaction_id || `MAN-${payment.id}-${Date.now()}`
          );
          console.log(`[UPDATE_STATUS] Success email fired for ${student.email}`);
        }
      } catch (emailErr) {
        console.error("[PAYMENT ERROR] Failed to send manual payment success email:", emailErr);
      }
    }

    return res.status(200).json({
      status: 1,
      message: `Payment status updated to ${newStatus} successfully`,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
