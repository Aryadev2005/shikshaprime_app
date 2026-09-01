import { Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";

const VALID_STATUS = new Set(["SAVED", "FINAL"]);

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

function booleanValue(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function statusValue(value: unknown): "SAVED" | "FINAL" {
  const status = cleanString(value)?.toUpperCase() || "SAVED";
  return VALID_STATUS.has(status) ? (status as "SAVED" | "FINAL") : "SAVED";
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

function dateValue(value: unknown, fieldName: string): string {
  const cleaned = requiredString(value, fieldName);
  const date = new Date(cleaned);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }
  return cleaned;
}

function uploadedFilePath(req: any, fieldName: string = "file_url"): string | null {
  let file = req.file;
  if (!file && req.files && Array.isArray(req.files)) {
    file = req.files.find((f: any) => f.fieldname === fieldName) || req.files[0];
  }
  if (!file) return null;
  return `/uploads/files/${file.filename}`;
}



async function resolveAcademicYearId(req: any, raw: unknown): Promise<number | null> {
  const cleaned = cleanString(raw);
  if (!cleaned) return null;

  const { sequelize } = getTenantModels(req.tenant);

  const byId = await sequelize.query<{ id: number }>(
    `SELECT id FROM academic_years WHERE id = :id LIMIT 1`,
    {
      replacements: { id: Number(cleaned) },
      type: QueryTypes.SELECT,
    }
  );

  if (byId.length) return Number(byId[0].id);

  const byName = await sequelize.query<{ id: number }>(
    `SELECT id FROM academic_years WHERE name = :name LIMIT 1`,
    {
      replacements: { name: cleaned },
      type: QueryTypes.SELECT,
    }
  );

  if (byName.length) return Number(byName[0].id);

  const byYearLabel = await sequelize.query<{ id: number }>(
    `SELECT id FROM naac_academic_years WHERE year_label = :label LIMIT 1`,
    {
      replacements: { label: cleaned },
      type: QueryTypes.SELECT,
    }
  );

  if (byYearLabel.length) return Number(byYearLabel[0].id);

  return null;
}

export async function createAcademicCalendar(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacAcademicCalendar } = getTenantModels(req.tenant);
    const body = bodySource(req);

    const academicYearText = requiredString(
      bodyValue(body, "academic_year_text", "academicYearText", "year_label", "yearLabel"),
      "academic_year_text"
    );

    const title =
      cleanString(bodyValue(body, "title")) || `Academic Calendar ${academicYearText}`;

    const startDate = dateValue(bodyValue(body, "start_date", "startDate"), "start_date");
    const endDate = dateValue(bodyValue(body, "end_date", "endDate"), "end_date");

    if (new Date(startDate) > new Date(endDate)) {
      throw new AppError("end_date must be after or equal to start_date", 400);
    }

    

    const payload = {
      tenant_id: req.tenant_id || 1,
      title,
      description: cleanString(bodyValue(body, "description")),
      file_url:
        uploadedFilePath(req) || cleanString(bodyValue(body, "file_url", "fileUrl")),
      academic_year_id: await resolveAcademicYearId(
        req,
        bodyValue(body, "academic_year_id", "academicYearId", "year_label", "yearLabel")
      ),
      academic_year_text: academicYearText,
      start_date: startDate,
      end_date: endDate,
      is_current_year: booleanValue(
        bodyValue(body, "is_current_year", "isCurrentYear", "is_current", "isCurrent"),
        false
      ),
      status: statusValue(bodyValue(body, "status")),
    };

    const record = await NaacAcademicCalendar.create(payload);

    return res.status(201).json({
      status: "success",
      message:
        payload.status === "FINAL"
          ? "Academic calendar finalized successfully"
          : "Academic calendar draft saved successfully",
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAcademicCalendars(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacAcademicCalendar } = getTenantModels(req.tenant);
    const id = numberOrNull(req.query.id);
    

    const where: Record<string, any> = { tenant_id: req.tenant_id || 1 };

    if (id !== null) {
      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("id must be a valid id", 400);
      }
      where.id = id;
    }


    const academicYearId = numberOrNull(req.query.academic_year_id);
    if (academicYearId !== null) {
      if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
        throw new AppError("academic_year_id must be a valid id", 400);
      }
      where.academic_year_id = academicYearId;
    }

    const academicYearText = cleanString(req.query.academic_year_text || req.query.year_label);
    if (academicYearText) where.academic_year_text = academicYearText;

    const status = cleanString(req.query.status)?.toUpperCase();
    if (status && VALID_STATUS.has(status)) {
      where.status = status;
    }

    if (req.query.is_current_year !== undefined || req.query.is_current !== undefined) {
      where.is_current_year = booleanValue(
        firstValue(req.query.is_current_year, req.query.is_current),
        false
      );
    }

    if (id !== null) {
      const record = await NaacAcademicCalendar.findOne({ where });
      if (!record) throw new AppError("Academic calendar not found", 404);

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records = await NaacAcademicCalendar.findAll({
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


export async function updateAcademicCalendar(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacAcademicCalendar } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Academic calendar id is required",
        400
      );
    }

    const academicCalendar =
      await NaacAcademicCalendar.findByPk(
        id
      );

    if (!academicCalendar) {
      throw new AppError(
        "Academic calendar not found",
        404
      );
    }

    const body = bodySource(req);

    const payload = {
      tenant_id: req.tenant_id || 1,

      title:
        bodyValue(
          body,
          "title"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "title"
              ),
              "title"
            )
          : academicCalendar.title,

      description:
        bodyValue(
          body,
          "description"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "description"
              )
            )
          : academicCalendar.description,

      file_url:
        uploadedFilePath(req) ||
        (bodyValue(
          body,
          "file_url",
          "fileUrl"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "file_url",
                "fileUrl"
              )
            )
          : academicCalendar.file_url),

      academic_year_id:
        bodyValue(
          body,
          "academic_year_id",
          "academicYearId",
          "year_label",
          "yearLabel"
        ) !== undefined
          ? await resolveAcademicYearId(
              req,
              bodyValue(
                body,
                "academic_year_id",
                "academicYearId",
                "year_label",
                "yearLabel"
              )
            )
          : academicCalendar.academic_year_id,

      academic_year_text:
        bodyValue(
          body,
          "academic_year_text",
          "academicYearText",
          "year_label",
          "yearLabel"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "academic_year_text",
                "academicYearText",
                "year_label",
                "yearLabel"
              ),
              "academic_year_text"
            )
          : academicCalendar.academic_year_text,

      start_date:
        bodyValue(
          body,
          "start_date",
          "startDate"
        ) !== undefined
          ? dateValue(
              bodyValue(
                body,
                "start_date",
                "startDate"
              ),
              "start_date"
            )
          : academicCalendar.start_date,

      end_date:
        bodyValue(
          body,
          "end_date",
          "endDate"
        ) !== undefined
          ? dateValue(
              bodyValue(
                body,
                "end_date",
                "endDate"
              ),
              "end_date"
            )
          : academicCalendar.end_date,

      is_current_year:
        bodyValue(
          body,
          "is_current_year",
          "isCurrentYear",
          "is_current",
          "isCurrent"
        ) !== undefined
          ? booleanValue(
              bodyValue(
                body,
                "is_current_year",
                "isCurrentYear",
                "is_current",
                "isCurrent"
              ),
              false
            )
          : academicCalendar.is_current_year,

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
          : academicCalendar.status,
    };

    if (
      new Date(
        String(payload.start_date)
      ) >
      new Date(
        String(payload.end_date)
      )
    ) {
      throw new AppError(
        "end_date must be after or equal to start_date",
        400
      );
    }

    await academicCalendar.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Academic calendar updated successfully",
      data: academicCalendar,
    });

  } catch (error) {
    next(error);
  }
}
