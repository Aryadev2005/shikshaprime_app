import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import crypto from 'crypto';
import { getTenantSequelize } from '../db';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { AppError } from '../utils/appError';

const tenant = (req: Request): string =>
  (req as unknown as { tenant?: string }).tenant ?? 'default';

const generateRegId = (): string => {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes(),
  ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `REG-${ts}-${rand}`;
};

// ─── GET /sr/academic-years ──────────────────────────────────────────────────

export const getAcademicYears = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const seq = getTenantSequelize(tenant(req));
    const rows = await seq.query<{ id: number; name: string; year: string }>(
      `SELECT id, name, CONCAT(EXTRACT(YEAR FROM start_date), '-', EXTRACT(YEAR FROM end_date)) AS year
       FROM academic_years
       WHERE is_active = true
       ORDER BY start_date DESC`,
      { type: QueryTypes.SELECT },
    );
    sendSuccess(res, rows, 'Academic years fetched');
  } catch (err) {
    next(err);
  }
};

// ─── GET /sr/programs ────────────────────────────────────────────────────────

export const getPrograms = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const seq = getTenantSequelize(tenant(req));
    const rows = await seq.query<{ id: number; name: string }>(
      `SELECT id, name FROM programs ORDER BY name`,
      { type: QueryTypes.SELECT },
    );
    sendSuccess(res, rows, 'Programs fetched');
  } catch (err) {
    next(err);
  }
};

// ─── GET /sr/departments ─────────────────────────────────────────────────────

export const getDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const seq = getTenantSequelize(tenant(req));
    const rows = await seq.query<{ id: number; name: string; parent_id?: number }>(
      `SELECT id, name, parent_id FROM departments ORDER BY name`,
      { type: QueryTypes.SELECT },
    );
    sendSuccess(res, rows, 'Departments fetched');
  } catch (err) {
    next(err);
  }
};

// ─── GET /sr/classes ─────────────────────────────────────────────────────────

export const getClasses = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const seq = getTenantSequelize(tenant(req));
    const rows = await seq.query<{ id: number; name: string }>(
      `SELECT id, name FROM classes ORDER BY id`,
      { type: QueryTypes.SELECT },
    );
    sendSuccess(res, rows, 'Classes fetched');
  } catch (err) {
    next(err);
  }
};

// ─── GET /sr/fee-structure ───────────────────────────────────────────────────

export const getFeeStructure = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    sendSuccess(
      res,
      [
        { fee_type: 'REGISTRATION', description: 'Registration Fee', amount: 100, currency: 'INR' },
        { fee_type: 'ADMISSION', description: 'Admission Fee', amount: 500, currency: 'INR' },
      ],
      'Fee structure fetched',
    );
  } catch (err) {
    next(err);
  }
};

// ─── POST /sr/register ───────────────────────────────────────────────────────

export const registerStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;
    const required = [
      'first_name',
      'last_name',
      'date_of_birth',
      'class_id',
      'academic_year_id',
      'father_name',
      'mobile',
      'email',
    ];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
    }

    const seq = getTenantSequelize(tenant(req));
    const regId = generateRegId();

    const insertResult = await seq.query(
      `INSERT INTO student_registrations (
        registration_id, mode,
        first_name, last_name, gender, date_of_birth,
        class_id, department_id, program_id, academic_year_id,
        father_name, mother_name, mobile, email,
        guardian_mobile, guardian_email,
        address_line, city, state, pin_code,
        previous_school_name, last_class_passed,
        board_university_10th, ten_percentage, year_of_passing_10th,
        status
      ) VALUES (
        :registration_id, 'ONLINE',
        :first_name, :last_name, :gender, :date_of_birth,
        :class_id, :department_id, :program_id, :academic_year_id,
        :father_name, :mother_name, :mobile, :email,
        :guardian_mobile, :guardian_email,
        :address_line, :city, :state, :pin_code,
        :previous_school_name, :last_class_passed,
        :board_university_10th, :ten_percentage, :year_of_passing_10th,
        'SUBMITTED'
      )`,
      {
        replacements: {
          registration_id: regId,
          first_name: body['first_name'] ?? null,
          last_name: body['last_name'] ?? null,
          gender: body['gender'] ?? null,
          date_of_birth: body['date_of_birth'] ?? null,
          class_id: body['class_id'] ?? null,
          department_id: body['department_id'] ?? null,
          program_id: body['program_id'] ?? null,
          academic_year_id: body['academic_year_id'] ?? null,
          father_name: body['father_name'] ?? null,
          mother_name: body['mother_name'] ?? null,
          mobile: body['mobile'] ?? null,
          email: body['email'] ?? null,
          guardian_mobile: body['guardian_mobile'] ?? null,
          guardian_email: body['guardian_email'] ?? null,
          address_line: body['address_line'] ?? null,
          city: body['city'] ?? null,
          state: body['state'] ?? null,
          pin_code: body['pin_code'] ?? null,
          previous_school_name: body['previous_school_name'] ?? null,
          last_class_passed: body['last_class_passed'] ?? null,
          board_university_10th: body['board_university_10th'] ?? null,
          ten_percentage: body['ten_percentage'] ?? null,
          year_of_passing_10th: body['year_of_passing_10th'] ?? null,
        },
        type: QueryTypes.INSERT,
      },
    ) as unknown as [number, number];

    const insertedId = insertResult[0];

    res.status(201).json({
      status: 1,
      data: {
        id: insertedId,
        registration_id: regId,
        status: 'SUBMITTED',
      },
      message:
        'Registration submitted successfully. You will be notified via email once reviewed.',
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /sr/registration/:regId ─────────────────────────────────────────────

interface RegRow {
  registration_id: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: string;
  program_name: string;
  class_name: string;
  department_name: string;
  academic_year: string;
}

export const getRegistrationByRegId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { regId } = req.params;
    if (!regId) {
      sendError(res, 400, 'Registration ID is required');
      return;
    }

    const seq = getTenantSequelize(tenant(req));

    const rows = await seq.query<RegRow>(
      `SELECT
        r.registration_id,
        r.first_name,
        r.last_name,
        r.status,
        r.created_at,
        COALESCE(p.name, '') AS program_name,
        COALESCE(c.name, '') AS class_name,
        COALESCE(d.name, '') AS department_name,
        COALESCE(ay.name, '') AS academic_year
       FROM student_registrations r
       LEFT JOIN programs p ON p.id = r.program_id
       LEFT JOIN classes c ON c.id = r.class_id
       LEFT JOIN departments d ON d.id = r.department_id
       LEFT JOIN academic_years ay ON ay.id = r.academic_year_id
       WHERE r.registration_id = :regId
       LIMIT 1`,
      { replacements: { regId }, type: QueryTypes.SELECT },
    );

    if (!rows.length) {
      throw new AppError('Registration not found', 404);
    }

    sendSuccess(res, rows[0], 'Registration fetched');
  } catch (err) {
    next(err);
  }
};

// Suppress unused import
void crypto;
