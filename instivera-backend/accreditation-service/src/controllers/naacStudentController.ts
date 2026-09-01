import { Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown, fieldName: string): string {
  const cleaned = cleanString(value);
  if (!cleaned) throw new AppError(`${fieldName} is required`, 400);
  return cleaned;
}

function numberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function positiveIntegerOrNull(value: unknown, fieldName: string): number | null {
  const num = numberOrNull(value);
  if (num === null) return null;
  if (!Number.isInteger(num) || num <= 0) {
    throw new AppError(`${fieldName} must be a valid id`, 400);
  }
  return num;
}

function booleanValue(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function firstValue(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function bodySource(req: any): Record<string, any> {
  return req.body?.data || req.body?.payload || req.body || {};
}

function bodyValue(body: Record<string, any>, ...keys: string[]): unknown {
  return firstValue(...keys.map((key) => body?.[key]));
}

async function validateOptionalId(model: any, id: number | null, fieldName: string) {
  if (!id) return;
  const exists = await model.findByPk(id);
  if (!exists) throw new AppError(`Invalid ${fieldName}`, 400);
}


export async function createStudent(req: any, res: Response, next: NextFunction) {
  try {
    const {
      NaacStudent,
      NaacAcademicYear,
      NaacProgram,
    } = getTenantModels(req.tenant);
    const body = bodySource(req);

    
    const academicYearId = positiveIntegerOrNull(
      bodyValue(body, "academic_year_id", "academicYearId", "academic_year"),
      "academic_year_id"
    );
    const programId = positiveIntegerOrNull(
      bodyValue(body, "program_id", "programId"),
      "program_id"
    );

    await validateOptionalId(NaacAcademicYear, academicYearId, "academic_year_id");
    await validateOptionalId(NaacProgram, programId, "program_id");

    const payload = {
      tenant_id: req.tenant_id || 1,
      academic_year_id: academicYearId,
      program_id: programId,
      name: requiredString(bodyValue(body, "name", "student_name", "studentName"), "name"),
      enrollment_no: requiredString(
        bodyValue(body, "enrollment_no", "enrollmentNo"),
        "enrollment_no"
      ),
      dob: cleanString(bodyValue(body, "dob", "date_of_birth", "dateOfBirth")),
      gender: cleanString(bodyValue(body, "gender")),
      category: cleanString(bodyValue(body, "category")),
      state_of_origin: cleanString(bodyValue(body, "state_of_origin", "stateOfOrigin")),
            status: ((): 'SAVED' | 'FINAL' => {
          const value = cleanString(bodyValue(body, "status"));
          return value === 'FINAL' ? 'FINAL' : 'SAVED';
        })(),
      is_differently_abled: booleanValue(
        bodyValue(body, "is_differently_abled", "isDifferentlyAbled"),
        false
      ),
      is_active: booleanValue(bodyValue(body, "is_active", "isActive"), true),
    };

    const student = await NaacStudent.create(payload);

    return res.status(201).json({
      status: "success",
      message:
        cleanString(bodyValue(body, "status"))?.toUpperCase() === "FINAL"
          ? "Student finalized successfully"
          : "Student draft saved successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudents(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacStudent } = getTenantModels(req.tenant);
    const id = positiveIntegerOrNull(req.query.id, "id");
    const enrollmentNo = cleanString(req.query.enrollment_no);
    

    const where: Record<string, any> = { tenant_id: req.tenant_id || 1 };

    if (id) where.id = id;
    if (enrollmentNo) where.enrollment_no = enrollmentNo;

     else {
      
      
    }

    const academicYearId = positiveIntegerOrNull(req.query.academic_year_id, "academic_year_id");
    if (academicYearId) where.academic_year_id = academicYearId;

    const programId = positiveIntegerOrNull(req.query.program_id, "program_id");
    if (programId) where.program_id = programId;

    const gender = cleanString(req.query.gender);
    if (gender) where.gender = gender;

    const category = cleanString(req.query.category);
    if (category) where.category = category;

    if (req.query.is_active !== undefined) {
      where.is_active = booleanValue(req.query.is_active);
    }

    if (req.query.is_differently_abled !== undefined) {
      where.is_differently_abled = booleanValue(req.query.is_differently_abled);
    }

    if (id || enrollmentNo) {
      const record = await NaacStudent.findOne({ where });
      if (!record) throw new AppError("Student not found", 404);

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records = await NaacStudent.findAll({
      where,
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      data: records,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStudent(req: any, res: Response, next: NextFunction) {
  try {
    const {
      NaacStudent,
      NaacAcademicYear,
      NaacProgram,
    } = getTenantModels(req.tenant);

    const id = positiveIntegerOrNull(req.params.id, "id");

    if (!id) {
      throw new AppError("Student id is required", 400);
    }

    const student = await NaacStudent.findByPk(id);

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const body = bodySource(req);

    // Extract possible IDs
    

    const academicYearId = positiveIntegerOrNull(
      bodyValue(body, "academic_year_id", "academicYearId", "academic_year"),
      "academic_year_id"
    );

    const programId = positiveIntegerOrNull(
      bodyValue(body, "program_id", "programId"),
      "program_id"
    );

    // Validate only if provided

    if (academicYearId !== null) {
      await validateOptionalId(NaacAcademicYear, academicYearId, "academic_year_id");
    }

    if (programId !== null) {
      await validateOptionalId(NaacProgram, programId, "program_id");
    }

    const payload = {
      tenant_id: req.tenant_id || 1,

      academic_year_id:
        bodyValue(body, "academic_year_id", "academicYearId", "academic_year") !== undefined
          ? academicYearId
          : student.academic_year_id,

      program_id:
        bodyValue(body, "program_id", "programId") !== undefined
          ? programId
          : student.program_id,

      name:
        bodyValue(body, "name", "student_name", "studentName") !== undefined
          ? requiredString(
              bodyValue(body, "name", "student_name", "studentName"),
              "name"
            )
          : student.name,

      enrollment_no:
        bodyValue(body, "enrollment_no", "enrollmentNo") !== undefined
          ? requiredString(
              bodyValue(body, "enrollment_no", "enrollmentNo"),
              "enrollment_no"
            )
          : student.enrollment_no,

      dob:
        bodyValue(body, "dob", "date_of_birth", "dateOfBirth") !== undefined
          ? cleanString(
              bodyValue(body, "dob", "date_of_birth", "dateOfBirth")
            )
          : student.dob,

      gender:
        bodyValue(body, "gender") !== undefined
          ? cleanString(bodyValue(body, "gender"))
          : student.gender,

      category:
        bodyValue(body, "category") !== undefined
          ? cleanString(bodyValue(body, "category"))
          : student.category,

      state_of_origin:
        bodyValue(body, "state_of_origin", "stateOfOrigin") !== undefined
          ? cleanString(
              bodyValue(body, "state_of_origin", "stateOfOrigin")
            )
          : student.state_of_origin,

      status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : student.status,

      is_differently_abled:
        bodyValue(body, "is_differently_abled", "isDifferentlyAbled") !== undefined
          ? booleanValue(
              bodyValue(body, "is_differently_abled", "isDifferentlyAbled")
            )
          : student.is_differently_abled,

      is_active:
        bodyValue(body, "is_active", "isActive") !== undefined
          ? booleanValue(bodyValue(body, "is_active", "isActive"))
          : student.is_active,
    };

    await student.update(payload);

    return res.status(200).json({
      status: "success",
      message: "Student updated successfully",
      data: student,
    });

  } catch (error) {
    next(error);
  }
}
