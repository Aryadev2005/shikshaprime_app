import { Request, Response, NextFunction } from "express";
import { Op, QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
import { config } from "../config";
import { buildApiUrl, buildFrontendUrl, buildTenantUrl } from "../utils/tenantUrlBuilder";

export const assignPayment = async (req, res: Response, next: NextFunction) => {
  try {
    const {
      student_ids,
      payment_type_id,
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
    const { PaymentType, StudentPayment } = getTenantModels(req.tenant);
    const paymentType = await PaymentType.findByPk(payment_type_id);
    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }
    const payments = await Promise.all(
      student_ids.map(async (studentId: number) => {
        return StudentPayment.create({
          student_id: studentId,
          payment_type_id,
          amount,
          due_date: new Date(due_date),
          status: status || 'pending',
        });
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

    let query = ` SELECT sp.id AS payment_id, sp.amount, sp.paid_amount, 
    sp.status, sp.paid_date, sp.due_date, sp.created_at, 
    pt.id AS payment_type_id, pt.name AS payment_type_name,
    st.student_id AS student_id, st.student_name, st.class_id, 
    st.program_id, st.department_id, st.academic_year_id 
    FROM student_payments sp INNER JOIN students st 
    ON sp.student_id = st.id INNER JOIN payment_types pt 
    ON sp.payment_type_id = pt.id WHERE 1=1 `;

    const replacements: any = {};

    // Restrict to a specific student when provided (used by student dashboard)
    if (studentId) {
      query += ` AND sp.student_id = :studentId`;
      replacements.studentId = studentId;
    } else if (authUser?.role === "student" && authUser?.user_id) {
      // Fallback: if a student is calling without an explicit filter, lock to their id
      query += ` AND sp.student_id = :studentId`;
      replacements.studentId = authUser.user_id;
    } else if (authUser?.role === "student" && (studentEmail || authUser?.email)) {
      // Fallback to email mapping when studentId is not provided/known
      query += ` AND st.email = :studentEmail`;
      replacements.studentEmail = studentEmail || authUser?.email;
    }

    // Apply filters dynamically
    if (classId && classId !== "all") {
      query += ` AND st.class_id = :classId`;
      replacements.classId = classId;
    }
    if (programId && programId !== "all") {
      query += ` AND st.program_id = :programId`;
      replacements.programId = programId;
    }
    if (departmentId && departmentId !== "all") {
      query += ` AND st.department_id = :departmentId`;
      replacements.departmentId = departmentId;
    }
    if (academicYearId && academicYearId !== "all") {
      query += ` AND st.academic_year_id = :academicYearId`;
      replacements.academicYearId = academicYearId;
    }
    if (paymentTypeId) {
      query += ` AND sp.payment_type_id = :paymentTypeId`;
      replacements.paymentTypeId = paymentTypeId;
    }
    if (status) {
      query += ` AND sp.status = :status`;
      replacements.status = status;
    }
    if (studentIdOrName) {
      query += ` AND (st.student_id LIKE :studentIdOrName OR st.student_name LIKE :studentName)`;
      replacements.studentIdOrName = `%${studentIdOrName}%`;
      replacements.studentName = `%${studentIdOrName}%`;
    }
    const sequelize = getTenantSequelize(req.tenant);
    const payments = await sequelize.query(query, {
      replacements, type:
        QueryTypes.SELECT,
    });
    return res.status(200).json({
      status: 1,
      message: "Student payments fetched successfully",
      data: payments,
      count: payments.length,
    });
  }
  catch (error) {
    next(error);
  }
};
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
    const { paymentId } = req.params;
    const { amount } = req.body;
    const authUser = (req as any).user;
    const { StudentPayment } = getTenantModels(req.tenant);

    // Fetch payment record
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
    const callbackUrl = buildFrontendUrl(req.tenant, `/payment/callback?merchantOrderId=${merchantOrderId}`);
    //const callbackUrl = `${redirectUrl}/payment/callback?merchantOrderId=${merchantOrderId}`;

    // Extract raw token to forward to identity service
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError("No authorization token provided", 401);
    }

    // Make HTTP call to identity service to initiate payment
    console.log(`[Payment Debug] Payment ID: ${paymentId}, Student ID: ${payment.student_id}, Amount: ${payAmount}`);
    const response = await fetch(buildApiUrl(req.tenant, "/api/identity/payments/phonepe/initiate"), {
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

    const phonePeResponse: any = await response.json();

    // Update payment with gateway info
    await payment.update({
      gateway_transaction_id: merchantOrderId,
      gateway_provider: 'phonepe',
      last_payment_attempt_date: new Date(),
      payment_attempts_count: (payment.payment_attempts_count || 0) + 1,
      gateway_response: phonePeResponse,
    });

    // Extract payment URL from response
    const paymentUrl = phonePeResponse?.data?.paymentUrl ||
      phonePeResponse?.data?.redirectUrl ||
      phonePeResponse?.redirectUrl ||
      phonePeResponse?.paymentUrl;

    if (!paymentUrl) {
      console.error("[Payment Error] Missing payment link in response", JSON.stringify(phonePeResponse));
      throw new AppError("Could not generate payment link", 500);
    }

    return res.status(200).json({
      status: 1,
      message: "Payment gateway initiated successfully",
      data: {
        paymentId,
        merchantOrderId,
        amount: payAmount,
        redirectUrl: paymentUrl,
        expiresAt: phonePeResponse?.expiresAt,
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

    return res.status(200).json({
      status: 1,
      message: "Payment status retrieved",
      data: {
        paymentId,
        gatewayStatus: statusResponse?.data?.state,
        studentPaymentStatus: payment.status,
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

    return res.status(200).json({
      status: 1,
      message: `Payment status updated to ${newStatus} successfully`,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
