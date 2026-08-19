import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/appError';
import { getTenantSequelize } from '../../db';

export const getAcademicYears = asyncHandler(async (req: Request, res: Response) => {
  const seq = getTenantSequelize(req.tenant!);
  const rows = await seq.query('SELECT id, year_name, is_current FROM academic_years WHERE is_active = 1 ORDER BY id DESC', { type: QueryTypes.SELECT });
  sendSuccess(res, rows);
});

export const getPrograms = asyncHandler(async (req: Request, res: Response) => {
  const seq = getTenantSequelize(req.tenant!);
  const rows = await seq.query('SELECT id, name, code, duration_years, department_id FROM programs WHERE is_active = 1 ORDER BY name', { type: QueryTypes.SELECT });
  sendSuccess(res, rows);
});

export const getDepartments = asyncHandler(async (req: Request, res: Response) => {
  const seq = getTenantSequelize(req.tenant!);
  const rows = await seq.query('SELECT id, name, code FROM departments WHERE is_active IS NULL OR is_active = 1 ORDER BY name', { type: QueryTypes.SELECT });
  sendSuccess(res, rows);
});

export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const seq = getTenantSequelize(req.tenant!);
  const rows = await seq.query('SELECT id, name, code FROM classes ORDER BY name', { type: QueryTypes.SELECT });
  sendSuccess(res, rows);
});

export const getFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const { academic_year_id, program_id } = req.query;
  const seq = getTenantSequelize(req.tenant!);
  let sql = 'SELECT id, name, amount, academic_year_id, program_id FROM fee_heads WHERE is_active = 1';
  const replacements: Record<string, any> = {};
  if (academic_year_id) { sql += ' AND academic_year_id = :academic_year_id'; replacements.academic_year_id = academic_year_id; }
  if (program_id) { sql += ' AND program_id = :program_id'; replacements.program_id = program_id; }
  const rows = await seq.query(sql, { type: QueryTypes.SELECT, replacements });
  sendSuccess(res, rows);
});

export const submitRegistration = asyncHandler(async (req: Request, res: Response) => {
  const seq = getTenantSequelize(req.tenant!);
  const {
    first_name, last_name, email, phone, dob, sex,
    program_id, department_id, academic_year_id,
    father_name, mother_name, guardian_name, guardian_email, guardian_mobile,
    address_line, city, state, pin_code,
  } = req.body;

  if (!first_name || !last_name || !email) {
    throw AppError.badRequest('first_name, last_name, and email are required');
  }

  const regId = `REG-${Date.now()}`;
  await seq.query(
    `INSERT INTO student_registrations
      (reg_id, first_name, last_name, email, phone, dob, sex,
       program_id, department_id, academic_year_id,
       father_name, mother_name, guardian_name, guardian_email, guardian_mobile,
       address_line, city, state, pin_code, status, created_at, updated_at)
     VALUES (:reg_id, :first_name, :last_name, :email, :phone, :dob, :sex,
             :program_id, :department_id, :academic_year_id,
             :father_name, :mother_name, :guardian_name, :guardian_email, :guardian_mobile,
             :address_line, :city, :state, :pin_code, 'pending', NOW(), NOW())`,
    {
      type: QueryTypes.INSERT,
      replacements: {
        reg_id: regId, first_name, last_name, email, phone: phone || null, dob: dob || null, sex: sex || null,
        program_id: program_id || null, department_id: department_id || null, academic_year_id: academic_year_id || null,
        father_name: father_name || null, mother_name: mother_name || null,
        guardian_name: guardian_name || null, guardian_email: guardian_email || null, guardian_mobile: guardian_mobile || null,
        address_line: address_line || null, city: city || null, state: state || null, pin_code: pin_code || null,
      },
    },
  );

  sendSuccess(res, { reg_id: regId, status: 'pending' }, 'Registration submitted successfully', 201);
});

export const getRegistrationStatus = asyncHandler(async (req: Request, res: Response) => {
  const seq = getTenantSequelize(req.tenant!);
  const { regId } = req.params;
  const rows = await seq.query(
    'SELECT reg_id, first_name, last_name, email, status, created_at FROM student_registrations WHERE reg_id = :regId LIMIT 1',
    { type: QueryTypes.SELECT, replacements: { regId } },
  ) as any[];
  if (!rows.length) throw AppError.notFound('Registration not found');
  sendSuccess(res, rows[0]);
});
