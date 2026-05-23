// controllers/studentController.ts
import { NextFunction, Request, Response } from "express";
import { QueryTypes } from "sequelize";
import { StudentService } from "../services/studentService";
import { AppError } from "../utils/appError";
import { validateStudentCreation, validateStudentUpdate, mapStudentFromDb } from "../utils/mappers";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
 
const studentService = new StudentService();
 
function formatSubjectNames(subjectNames: unknown): string[] {
  if (!subjectNames) return [];
  if (Array.isArray(subjectNames)) return subjectNames.filter(Boolean).map(String);
  return String(subjectNames)
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);
}
 
function mapStudentCoreProfile(bundle: any) {
  return {
    id: bundle.student_id || bundle.id,
    name: bundle.student_name || "",
    dob: bundle.dob || null,
    gender: bundle.sex || null,
    nationality: bundle.nationality || null,
    religion: bundle.religion || null,
    caste: bundle.caste || null,
    profileImage: bundle.profile_img || null,
    admissionDate: bundle.admission_date || null,
  };
}
 
function mapStudentContact(bundle: any) {
  const addressParts = [
    bundle.address_line,
    bundle.city,
    bundle.state,
    bundle.pin_code,
  ].filter(Boolean);
 
  return {
    email: bundle.email || null,
    phone: bundle.mobile || null,
    address: addressParts.join(", "),
    parent: {
      fatherName: bundle.father_name || null,
      fatherEmail: bundle.guardian_email || null,
      parentPhone: bundle.guardian_mobile || null,
    },
  };
}
 
function mapStudentAcademics(bundle: any) {
  return {
    degree: bundle.degree || null,
    stream: bundle.degree || null,
    program: bundle.program_name || null,
    department: bundle.department_name || null,
    subjects: formatSubjectNames(bundle.subject_names),
  };
}
 
async function getAuthorizedStudentTarget(req: any, requestedStudentId?: number) {
  const userRole = String(req.user?.role || "").toLowerCase();
  const userEmail = String(req.user?.email || "").trim();
 
  if (userRole === "student") {
    if (!userEmail) {
      throw new AppError("Student email is missing from the auth token", 401);
    }
 
    const student = await studentService.getStudentByEmail(userEmail, req.tenant);
    if (requestedStudentId && Number(student.id) !== Number(requestedStudentId)) {
      throw new AppError("Forbidden: you can only access your own profile", 403);
    }
 
    return {
      id: Number(student.id),
      email: student.email,
    };
  }
 
  if (!requestedStudentId) {
    throw new AppError("Student ID is required", 400);
  }
 
  const student = await studentService.getStudentById(requestedStudentId, req.tenant);
  return {
    id: Number(student.id),
    email: student.email,
  };
}
 
export async function createStudent(req, res: Response, next: NextFunction) {
  const { StudentSubject } = getTenantModels(req.tenant);
  const sequelize = getTenantSequelize(req.tenant);
  const transaction = await sequelize.transaction();
  try {
    // Validate request data
    const validation = validateStudentCreation(req.body);
    if (!validation.isValid) {
      throw new AppError(`Validation failed: ${validation.errors.join(', ')}`, 400);
    }
 
    const { registration_id, section, semester, subjects } = req.body;
    const token = req.headers.authorization;
 
    if (!token) {
      throw new AppError('Authorization token is missing', 401);
    }
   
    const student: any = await studentService.createStudentFromRegistration(registration_id, section, semester, token, req.tenant, transaction);
 
    await Promise.all(
      subjects.map(async (subject: any) => {
        return StudentSubject.create({
          student_id: student.id,
          semester_id: student.semester_id,
          subject_id: subject.subject_id,
          is_core: subject.is_core,
        }, {transaction});
      })
    );
 
    await transaction.commit();
 
    return res.status(201).json({
      status: "success",
      data: mapStudentFromDb(student),
      message: "Student created successfully from registration",
    });
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    next(error);
  }
}
 
export async function getStudents(req, res: Response, next: NextFunction) {
  try {
    const students = await studentService.getAllStudents(req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: students.map(student => mapStudentFromDb(student)),
      count: students.length,
      message: "Students fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getStudentById(req, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const studentId = parseInt(id as string);
 
    // Validate that ID is a valid number
    if (isNaN(studentId) || studentId <= 0) {
      throw new AppError('Invalid student ID provided', 400);
    }
 
    const target = await getAuthorizedStudentTarget(req, studentId);
    const student = await studentService.getStudentById(target.id, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: mapStudentFromDb(student),
      message: "Student fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getMyStudentDetails(req: any, res: Response, next: NextFunction) {
  try {
    const target = await getAuthorizedStudentTarget(req);
    const student = await studentService.getStudentById(target.id, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: mapStudentFromDb(student),
      message: "Student fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getMyStudentDashboard(req: any, res: Response, next: NextFunction) {
  try {
    const target = await getAuthorizedStudentTarget(req);
    const dashboard = await studentService.getStudentDashboardData(target.id, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: dashboard,
      message: "Student dashboard fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getMyStudentProfile(req, res: Response, next: NextFunction) {
  try {
    const target = await getAuthorizedStudentTarget(req);
    const bundle = await studentService.getStudentProfileBundleById(target.id, req.tenant);
 
    // Return complete student data instead of just core profile
    return res.status(200).json({
      status: "success",
      data: bundle,
      message: "Complete student profile fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getStudentCoreProfile(req, res: Response, next: NextFunction) {
  try {
    const studentId = parseInt(req.params.id as string);
    if (isNaN(studentId) || studentId <= 0) {
      throw new AppError("Invalid student ID provided", 400);
    }
 
    const target = await getAuthorizedStudentTarget(req, studentId);
    const bundle = await studentService.getStudentProfileBundleById(target.id, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: mapStudentCoreProfile(bundle),
      message: "Student core profile fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getMyStudentContact(req, res: Response, next: NextFunction) {
  try {
    const target = await getAuthorizedStudentTarget(req);
    const bundle = await studentService.getStudentProfileBundleById(target.id, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: mapStudentContact(bundle),
      message: "Student contact information fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getStudentContact(req, res: Response, next: NextFunction) {
  try {
    const studentId = parseInt(req.params.id as string);
    if (isNaN(studentId) || studentId <= 0) {
      throw new AppError("Invalid student ID provided", 400);
    }
 
    const target = await getAuthorizedStudentTarget(req, studentId);
    const bundle = await studentService.getStudentProfileBundleById(target.id, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: mapStudentContact(bundle),
      message: "Student contact information fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getMyStudentAcademics(req, res: Response, next: NextFunction) {
  try {
    const target = await getAuthorizedStudentTarget(req);
    const bundle = await studentService.getStudentProfileBundleById(target.id, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: mapStudentAcademics(bundle),
      message: "Student academic information fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getStudentAcademics(req, res: Response, next: NextFunction) {
  try {
    const studentId = parseInt(req.params.id as string);
    if (isNaN(studentId) || studentId <= 0) {
      throw new AppError("Invalid student ID provided", 400);
    }
 
    const target = await getAuthorizedStudentTarget(req, studentId);
    const bundle = await studentService.getStudentProfileBundleById(target.id, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: mapStudentAcademics(bundle),
      message: "Student academic information fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getStudentByStudentId(req, res: Response, next: NextFunction) {
  try {
    const { student_id } = req.params;
    const student = await studentService.getStudentByStudentId(student_id as string, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: mapStudentFromDb(student),
      message: "Student fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function updateStudent(req, res: Response, next: NextFunction) {
  try {
    // Validate request data
    const validation = validateStudentUpdate(req.body);
    if (!validation.isValid) {
      throw new AppError(`Validation failed: ${validation.errors.join(', ')}`, 400);
    }
 
    const { id } = req.params;
    const student = await studentService.updateStudent(parseInt(id as string), req.body, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: mapStudentFromDb(student),
      message: "Student updated successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function deleteStudent(req, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await studentService.deleteStudent(parseInt(id as string), req.tenant);
 
    return res.status(200).json({
      status: "success",
      message: "Student deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getStudentsByDepartment(req, res: Response, next: NextFunction) {
  try {
    const { department_id } = req.params;
    const students = await studentService.getStudentsByDepartment(parseInt(department_id as string), req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: students.map(student => mapStudentFromDb(student)),
      count: students.length,
      message: "Students fetched successfully by department"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getStudentsByClass(req, res, next: NextFunction) {
  try {
    const { programId, departmentId, academicYearId, classId } = req.query;  
    const students = await studentService.getStudentsByClass(programId, departmentId, academicYearId, classId, req.tenant);
 
    return res.status(200).json({
      status: 1,
      data: students.map(student => mapStudentFromDb(student)),
      count: students.length,
      message: "Students fetched successfully by class"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getStudentsByAcademicYear(req, res: Response, next: NextFunction) {
  try {
    const { academic_year_id } = req.params;
    const students = await studentService.getStudentsByAcademicYear(parseInt(academic_year_id as string), req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: students.map(student => mapStudentFromDb(student)),
      count: students.length,
      message: "Students fetched successfully by academic year"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function searchStudents(req, res: Response, next: NextFunction) {
  try {
    const {
      roll_number,
      student_name,
      email,
      dept_name,
      academic_year,
      query,
      department_id,
      class_id,
      status
    } = req.query as any;
 
    const filters: any = {};
 
    // Text-based filters
    if (roll_number) filters.roll_number = roll_number as string;
    if (student_name) filters.student_name = student_name as string;
    if (email) filters.email = email as string;
    if (dept_name) filters.dept_name = dept_name as string;
    if (academic_year) filters.academic_year = academic_year as string;
    if (query) filters.query = query as string;
    if (status) filters.status = status as string;
 
    // Numeric filters with validation
    if (department_id && !isNaN(parseInt(department_id as string))) {
      filters.department_id = parseInt(department_id as string);
    }
    if (class_id && !isNaN(parseInt(class_id as string))) {
      filters.class_id = parseInt(class_id as string);
    }
 
    const students = await studentService.searchStudents(filters, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: students.map(student => mapStudentFromDb(student)),
      count: students.length,
      message: "Students search completed successfully"
    });
  } catch (error) {
    next(error);
  }
}
 
export async function getStudentStats(req, res: Response, next: NextFunction) {
  try {
    const stats = await studentService.getStudentStatistics(req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: stats,
      message: "Student statistics fetched successfully"
    });
  } catch (error) {
    next(error);
  }
}
export async function getStudentDetailsByEmail(req, res, next: NextFunction) {
  console.log(req.query);
  try {
    const { email } = req.query;
   
    // Validate that ID is a valid number
    if (!email) {
      throw new AppError('Email not provided', 400);
    }
 
    const student = await studentService.getStudentDetailsByEmail(email, req.tenant);
 
    return res.status(200).json({
      status: "success",
      data: student,
      message: "Student details fetched successfully"
    });
  } catch (error) {
    next(error);
  }
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
 
export async function lookupStudentForPayment(req: any, res: Response, next: NextFunction) {
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
 
    const sequelize = getTenantSequelize(tenant);
    const normalizedLookupType = lookupType === "registration" ? "registration" : "student_id";
    const lookupColumn =
      normalizedLookupType === "registration" ? "s.university_registration_number" : "s.student_id";
    const includeAmount = await hasPaymentTypeAmountColumn(tenant);
    const amountSelect = includeAmount ? "pt.amount" : "0 AS amount";
 
    const [paymentType] = await sequelize.query<any>(
      `SELECT pt.id, pt.name, pt.description, pt.is_active, ${amountSelect}
       FROM payment_types pt
       WHERE pt.id = :paymentTypeId
       LIMIT 1`,
      {
        replacements: { paymentTypeId: Number(paymentTypeId) },
        type: QueryTypes.SELECT,
      }
    );
 
    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }
 
    const [student] = await sequelize.query<any>(
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
       LEFT JOIN classes c
         ON s.class_id = c.id
       LEFT JOIN semesters sem
         ON s.semester_id = sem.id
       LEFT JOIN programs p
         ON s.program_id = p.id
       LEFT JOIN departments d
         ON s.department_id = d.id
       LEFT JOIN academic_years ac
         ON s.academic_year_id = ac.id
       WHERE LOWER(TRIM(COALESCE(${lookupColumn}, ''))) = LOWER(TRIM(:identifier))
       LIMIT 1`,
      {
        replacements: { identifier: String(identifier || "").trim() },
        type: QueryTypes.SELECT,
      }
    );
 
    if (!student) {
      throw new AppError("Student not found", 404);
    }
 
    let [payment] = await sequelize.query<any>(
      `SELECT
         sp.id AS payment_id,
         sp.amount,
         sp.paid_amount,
         sp.status,
         sp.due_date,
         sp.gateway_transaction_id
       FROM student_payments sp
       WHERE sp.student_id = :studentId
         AND sp.payment_type_id = :paymentTypeId
       ORDER BY COALESCE(sp.updated_at, sp.created_at) DESC, sp.id DESC
       LIMIT 1`,
      {
        replacements: {
          studentId: student.id,
          paymentTypeId: Number(paymentTypeId),
        },
        type: QueryTypes.SELECT,
      }
    );
 
    const paymentTypeAmount = Number(paymentType.amount || 0);
 
    if (!payment && paymentTypeAmount > 0) {
      await sequelize.query(
        `INSERT INTO student_payments
           (student_id, payment_type_id, amount, due_date, status, paid_amount, created_at, updated_at)
         VALUES
           (:studentId, :paymentTypeId, :amount, CURDATE(), 'pending', 0, NOW(), NOW())`,
        {
          replacements: {
            studentId: student.id,
            paymentTypeId: Number(paymentTypeId),
            amount: paymentTypeAmount,
          },
          type: QueryTypes.INSERT,
        }
      );
 
      [payment] = await sequelize.query<any>(
        `SELECT
           sp.id AS payment_id,
           sp.amount,
           sp.paid_amount,
           sp.status,
           sp.due_date,
           sp.gateway_transaction_id
         FROM student_payments sp
         WHERE sp.student_id = :studentId
           AND sp.payment_type_id = :paymentTypeId
         ORDER BY COALESCE(sp.updated_at, sp.created_at) DESC, sp.id DESC
         LIMIT 1`,
        {
          replacements: {
            studentId: student.id,
            paymentTypeId: Number(paymentTypeId),
          },
          type: QueryTypes.SELECT,
        }
      );
    }
 
    return res.status(200).json({
      status: 1,
      message: "Student payment details fetched successfully",
      data: {
        student,
        payment: payment || null,
        paymentType,
      },
    });
  } catch (error) {
    next(error);
  }
}
 