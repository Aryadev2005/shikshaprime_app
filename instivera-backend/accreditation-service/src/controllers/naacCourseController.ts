import { Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";

const VALID_STATUS = new Set(["SAVED", "FINAL"]);
const VALID_COURSE_TYPES = new Set(["core", "elective", "lab", "project"]);
type CourseType = "core" | "elective" | "lab" | "project";

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

function requiredPositiveInteger(value: unknown, fieldName: string): number {
  const num = numberOrNull(value);
  if (!num || !Number.isInteger(num) || num <= 0) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  return num;
}

function statusValue(value: unknown): "SAVED" | "FINAL" {
  const status = cleanString(value)?.toUpperCase() || "SAVED";
  return VALID_STATUS.has(status) ? (status as "SAVED" | "FINAL") : "SAVED";
}

function bodySource(req: any): Record<string, any> {
  return req.body?.data || req.body?.payload || req.body || {};
}

function firstValue(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function bodyValue(body: Record<string, any>, ...keys: string[]): unknown {
  return firstValue(...keys.map((key) => body?.[key]));
}

function uploadedFilePath(req: any, fieldName: string = "syllabus_url"): string | null {
  let file = req.file;
  if (!file && req.files && Array.isArray(req.files)) {
    file = req.files.find((f: any) => f.fieldname === fieldName) || req.files[0];
  }
  if (!file) return null;
  return `/uploads/files/${file.filename}`;
}

async function resolveProgramId(req: any, value: unknown): Promise<number | null> {
  const programId = numberOrNull(value);
  if (programId === null || !Number.isInteger(programId) || programId <= 0) {
    return null;
  }

  const { NaacProgram } = getTenantModels(req.tenant);
  const program = await NaacProgram.findByPk(programId);
  if (!program) {
    throw new AppError("Invalid program_id", 400);
  }

  return programId;
}

export async function createCourse(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacCourse, NaacProgram } = getTenantModels(req.tenant);
    const body = bodySource(req);

    const programId = requiredPositiveInteger(
      bodyValue(body, "program_id", "programId"),
      "program_id"
    );

    const program = await NaacProgram.findByPk(programId);
    if (!program) {
      throw new AppError("Invalid program_id", 400);
    }

    const rawCourseType = cleanString(bodyValue(body, "course_type", "courseType"));
    const courseType = rawCourseType && VALID_COURSE_TYPES.has(rawCourseType)
      ? (rawCourseType as CourseType)
      : null;

    const payload = {
      program_id: programId,
      course_code: requiredString(bodyValue(body, "course_code", "courseCode"), "course_code"),
      course_name: requiredString(bodyValue(body, "course_name", "courseName"), "course_name"),
      semester: numberOrNull(bodyValue(body, "semester")),
      credits: numberOrNull(bodyValue(body, "credits")),
      course_type: courseType,
      syllabus_url: uploadedFilePath(req) || cleanString(bodyValue(body, "syllabus_url", "syllabusUrl")),
      status: statusValue(bodyValue(body, "status")),
      is_deleted: false,
    };

    const course = await NaacCourse.create(payload);

    return res.status(201).json({
      status: "success",
      message:
        payload.status === "FINAL"
          ? "Course finalized successfully"
          : "Course draft saved successfully",
      data: course,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCourses(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacCourse } = getTenantModels(req.tenant);
    const id = numberOrNull(req.query.id);
    const courseCode = cleanString(req.query.course_code);

    const where: Record<string, any> = { is_deleted: false };

    if (id !== null) {
      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("id must be a valid id", 400);
      }
      where.id = id;
    }

    if (courseCode) where.course_code = courseCode;

    const programId = await resolveProgramId(req, req.query.program_id);
    if (programId) where.program_id = programId;

    const semester = numberOrNull(req.query.semester);
    if (semester !== null) where.semester = semester;

    const credits = numberOrNull(req.query.credits);
    if (credits !== null) where.credits = credits;

    const courseType = cleanString(req.query.course_type);
    if (courseType && VALID_COURSE_TYPES.has(courseType)) {
      where.course_type = courseType;
    }

    const status = cleanString(req.query.status)?.toUpperCase();
    if (status && VALID_STATUS.has(status)) {
      where.status = status;
    }

    if (id !== null || courseCode) {
      const record = await NaacCourse.findOne({ where });
      if (!record) throw new AppError("Course not found", 404);

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records = await NaacCourse.findAll({
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


export async function updateCourse(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacCourse, NaacProgram } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id || !Number.isInteger(id) || id <= 0) {
      throw new AppError(
        "Course id is required",
        400
      );
    }

    const course =
      await NaacCourse.findByPk(id);

    if (!course) {
      throw new AppError(
        "Course not found",
        404
      );
    }

    const body =
      bodySource(req);

    let programId =
      course.program_id;

    if (
      bodyValue(
        body,
        "program_id",
        "programId"
      ) !== undefined
    ) {
      const updatedProgramId =
        requiredPositiveInteger(
          bodyValue(
            body,
            "program_id",
            "programId"
          ),
          "program_id"
        );

      const program =
        await NaacProgram.findByPk(
          updatedProgramId
        );

      if (!program) {
        throw new AppError(
          "Invalid program_id",
          400
        );
      }

      programId =
        updatedProgramId;
    }

    let courseType =
      course.course_type;

    if (
      bodyValue(
        body,
        "course_type",
        "courseType"
      ) !== undefined
    ) {
      const rawCourseType =
        cleanString(
          bodyValue(
            body,
            "course_type",
            "courseType"
          )
        );

      courseType =
        rawCourseType &&
        VALID_COURSE_TYPES.has(
          rawCourseType
        )
          ? (rawCourseType as CourseType)
          : null;
    }

    const payload = {
      program_id: programId,

      course_code:
        bodyValue(
          body,
          "course_code",
          "courseCode"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "course_code",
                "courseCode"
              ),
              "course_code"
            )
          : course.course_code,

      course_name:
        bodyValue(
          body,
          "course_name",
          "courseName"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "course_name",
                "courseName"
              ),
              "course_name"
            )
          : course.course_name,

      semester:
        bodyValue(
          body,
          "semester"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "semester"
              )
            )
          : course.semester,

      credits:
        bodyValue(
          body,
          "credits"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "credits"
              )
            )
          : course.credits,

      course_type:
        courseType,

      syllabus_url:
        uploadedFilePath(req) ||
        (bodyValue(
          body,
          "syllabus_url",
          "syllabusUrl"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "syllabus_url",
                "syllabusUrl"
              )
            )
          : course.syllabus_url),

      status:
        bodyValue(
          body,
          "status"
        ) !== undefined
          ? statusValue(
              bodyValue(
                body,
                "status"
              )
            )
          : course.status,
    };

    await course.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Course updated successfully",
      data: course,
    });

  } catch (error) {
    next(error);
  }
}