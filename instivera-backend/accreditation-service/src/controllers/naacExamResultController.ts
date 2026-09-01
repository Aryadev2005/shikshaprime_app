import { Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { File as MulterFile } from "multer";
import { getTenantModels } from "../models";

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function requiredString(
  value: unknown,
  field: string
): string {
  const cleaned = cleanString(value);

  if (!cleaned) {
    throw new AppError(
      `${field} is required`,
      400
    );
  }

  return cleaned;
}

function numberOrNull(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const num = Number(value);

  return Number.isNaN(num)
    ? null
    : num;
}

function firstValue(
  ...values: unknown[]
): unknown {
  return values.find(
    (v) =>
      v !== undefined &&
      v !== null &&
      v !== ""
  );
}

function bodySource(
  req: any
): Record<string, any> {
  return (
    req.body?.data ||
    req.body?.payload ||
    req.body ||
    {}
  );
}

function bodyValue(
  body: Record<string, any>,
  ...keys: string[]
) {
  return firstValue(
    ...keys.map((k) => body?.[k])
  );
}

async function resolveAcademicYearId(
  req: any,
  raw: unknown
): Promise<number | null> {
  const cleaned =
    cleanString(raw);

  if (!cleaned) {
    return null;
  }

  const { sequelize } =
    getTenantModels(req.tenant);

  const byId =
    await sequelize.query<{
      id: number;
    }>(
      `SELECT id FROM academic_years WHERE id = :id LIMIT 1`,
      {
        replacements: {
          id: Number(cleaned),
        },
        type: QueryTypes.SELECT,
      }
    );

  if (byId.length) {
    return Number(byId[0].id);
  }

  return null;
}

export async function createExamResult(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacExamResult } =
      getTenantModels(req.tenant);

    const body =
      bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

    const resultDocumentFile =
      files.find(
        (file) =>
          file.fieldname ===
          "result_document_url"
      );

    console.log(
      "RESULT DOCUMENT FILE:",
      resultDocumentFile
    );

    const payload = {
      program_id:
        numberOrNull(
          bodyValue(
            body,
            "program_id",
            "programId"
          )
        ),

      academic_year_id:
        await resolveAcademicYearId(
          req,
          bodyValue(
            body,
            "academic_year_id",
            "academicYear"
          )
        ),

      exam_name:
        requiredString(
          bodyValue(
            body,
            "exam_name",
            "examName"
          ),
          "exam_name"
        ),

      exam_type: (
        cleanString(
          bodyValue(
            body,
            "exam_type",
            "examType"
          )
        ) || null
      ) as
        | "internal"
        | "external"
        | "semester"
        | "annual"
        | null,

      total_students:
        numberOrNull(
          bodyValue(
            body,
            "total_students",
            "totalStudents"
          )
        ),

      students_appeared:
        numberOrNull(
          bodyValue(
            body,
            "students_appeared",
            "studentsAppeared"
          )
        ),

      students_passed:
        numberOrNull(
          bodyValue(
            body,
            "students_passed",
            "studentsPassed"
          )
        ),

      students_failed:
        numberOrNull(
          bodyValue(
            body,
            "students_failed",
            "studentsFailed"
          )
        ),

      pass_percentage:
        numberOrNull(
          bodyValue(
            body,
            "pass_percentage",
            "passPercentage"
          )
        ),

      failed_percentage:
        numberOrNull(
          bodyValue(
            body,
            "failed_percentage",
            "failedPercentage"
          )
        ),

      university_avg_pass_percentage:
        numberOrNull(
          bodyValue(
            body,
            "university_avg_pass_percentage",
            "universityAvgPassPercentage"
          )
        ),

      distinction_count:
        numberOrNull(
          bodyValue(
            body,
            "distinction_count",
            "distinctionCount"
          )
        ),

      result_document_url: resultDocumentFile
        ? `/uploads/files/${resultDocumentFile.filename}`
        : (cleanString(bodyValue(body, "result_document_url", "resultDocumentUrl"))?.replace(/.*(?:\\|\/)uploads(?:\\|\/)files(?:\\|\/)/, '/uploads/files/') || null),

      status: (
        cleanString(
          bodyValue(
            body,
            "status"
          )
        ) || "SAVED"
      ) as "SAVED" | "FINAL",
    };

    console.log(
      "FINAL PAYLOAD:",
      payload
    );

    const data =
      await NaacExamResult.create(
        payload
      );

    return res.status(201).json({
      status: "success",
      message:
        "Exam result created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getExamResults(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacExamResult } =
      getTenantModels(req.tenant);

    const where: Record<
      string,
      any
    > = {};

    const id =
      numberOrNull(
        req.query.id
      );

    if (id) {
      where.id = id;
    }

    const programId =
      numberOrNull(
        req.query.program_id
      );

    if (programId) {
      where.program_id =
        programId;
    }

    const academicYearId =
      numberOrNull(
        req.query.academic_year_id
      );

    if (academicYearId) {
      where.academic_year_id =
        academicYearId;
    }

    if (id) {
      const record =
        await NaacExamResult.findOne(
          {
            where,
          }
        );

      if (!record) {
        throw new AppError(
          "Exam result not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records =
      await NaacExamResult.findAll(
        {
          where,
          order: [
            ["id", "DESC"],
          ],
        }
      );

    return res.status(200).json({
      status: "success",
      data: records,
    });

  } catch (error) {
    next(error);
  }
}

export async function updateExamResult(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacExamResult } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Exam result id is required",
        400
      );
    }

    const examResult =
      await NaacExamResult.findByPk(
        id
      );

    if (!examResult) {
      throw new AppError(
        "Exam result not found",
        404
      );
    }

    const body =
      bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

    const resultDocumentFile =
      files.find(
        (file) =>
          file.fieldname ===
          "result_document_url"
      );

    const payload = {
      program_id:
        bodyValue(
          body,
          "program_id",
          "programId"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "program_id",
                "programId"
              )
            )
          : examResult.program_id,

      academic_year_id:
        bodyValue(
          body,
          "academic_year_id",
          "academicYear"
        ) !== undefined
          ? await resolveAcademicYearId(
              req,
              bodyValue(
                body,
                "academic_year_id",
                "academicYear"
              )
            )
          : examResult.academic_year_id,

      exam_name:
        bodyValue(
          body,
          "exam_name",
          "examName"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "exam_name",
                "examName"
              ),
              "exam_name"
            )
          : examResult.exam_name,

      exam_type:
        bodyValue(
          body,
          "exam_type",
          "examType"
        ) !== undefined
          ? (cleanString(
              bodyValue(
                body,
                "exam_type",
                "examType"
              )
            ) as
              | "internal"
              | "external"
              | "semester"
              | "annual"
              | null)
          : examResult.exam_type,

      total_students:
        bodyValue(
          body,
          "total_students",
          "totalStudents"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "total_students",
                "totalStudents"
              )
            )
          : examResult.total_students,

      students_appeared:
        bodyValue(
          body,
          "students_appeared",
          "studentsAppeared"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "students_appeared",
                "studentsAppeared"
              )
            )
          : examResult.students_appeared,

      students_passed:
        bodyValue(
          body,
          "students_passed",
          "studentsPassed"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "students_passed",
                "studentsPassed"
              )
            )
          : examResult.students_passed,

      students_failed:
        bodyValue(
          body,
          "students_failed",
          "studentsFailed"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "students_failed",
                "studentsFailed"
              )
            )
          : examResult.students_failed,

      pass_percentage:
        bodyValue(
          body,
          "pass_percentage",
          "passPercentage"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "pass_percentage",
                "passPercentage"
              )
            )
          : examResult.pass_percentage,

      failed_percentage:
        bodyValue(
          body,
          "failed_percentage",
          "failedPercentage"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "failed_percentage",
                "failedPercentage"
              )
            )
          : examResult.failed_percentage,

      university_avg_pass_percentage:
        bodyValue(
          body,
          "university_avg_pass_percentage",
          "universityAvgPassPercentage"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "university_avg_pass_percentage",
                "universityAvgPassPercentage"
              )
            )
          : examResult.university_avg_pass_percentage,

      distinction_count:
        bodyValue(
          body,
          "distinction_count",
          "distinctionCount"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "distinction_count",
                "distinctionCount"
              )
            )
          : examResult.distinction_count,

      result_document_url: resultDocumentFile
        ? `/uploads/files/${resultDocumentFile.filename}`
        : (cleanString(bodyValue(body, "result_document_url", "resultDocumentUrl"))?.replace(/.*(?:\\|\/)uploads(?:\\|\/)files(?:\\|\/)/, '/uploads/files/') || examResult.result_document_url),

      status:
        bodyValue(
          body,
          "status"
        ) !== undefined
          ? (cleanString(
              bodyValue(
                body,
                "status"
              )
            ) as
              | "SAVED"
              | "FINAL")
          : examResult.status,
    };

    await examResult.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Exam result updated successfully",
      data: examResult,
    });

  } catch (error) {
    next(error);
  }
}
