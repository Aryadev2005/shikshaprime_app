// controllers/naacProgram.controller.ts

import { Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";
import { QueryTypes } from "sequelize";

// Reuse SAME helpers pattern
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
  return !Number.isNaN(num) ? num : null;
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
  return values.find(v => v !== undefined && v !== null && v !== "");
}

function bodySource(req: any): Record<string, any> {
  return req.body?.data || req.body?.payload || req.body || {};
}

function bodyValue(body: Record<string, any>, ...keys: string[]): unknown {
  return firstValue(...keys.map(k => body?.[k]));
}

// 🔥 IMPORTANT: same resolver reuse

async function resolveAcademicYearId(req: any, raw: unknown): Promise<number | null> {
  const cleaned = cleanString(raw);
  if (!cleaned) return null;

  const { sequelize } = getTenantModels(req.tenant);

  const byId = await sequelize.query<{ id: number }>(
    `SELECT id FROM academic_years WHERE id = :id LIMIT 1`,
    { replacements: { id: Number(cleaned) }, type: QueryTypes.SELECT }
  );

  if (byId.length) return Number(byId[0].id);

  const byName = await sequelize.query<{ id: number }>(
    `SELECT id FROM academic_years WHERE name = :name LIMIT 1`,
    { replacements: { name: cleaned }, type: QueryTypes.SELECT }
  );

  if (byName.length) return Number(byName[0].id);

  return null;
}


// 🚀 MAIN CONTROLLER
export async function createProgram(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacProgram } = getTenantModels(req.tenant);
    const body = bodySource(req);

    
    

    // ⚠️ normalize level (frontend mismatch)
    let level = cleanString(bodyValue(body, "level"));
    if (level === "Ph.D.") level = "PhD";

    const payload: any = {
      tenant_id: req.tenant_id || 1,

      program_name: requiredString(
        bodyValue(body, "program_name", "programName"),
        "program_name"
      ),

      short_name: cleanString(bodyValue(body, "short_name", "shortName")),

      level: requiredString(level, "level"),

      department: cleanString(bodyValue(body, "department")),

      duration_years: numberOrNull(bodyValue(body, "duration_years", "duration")),

      intake: numberOrNull(bodyValue(body, "intake")),

      fee_per_year: numberOrNull(bodyValue(body, "fee_per_year", "fee")),

      affiliation_status: cleanString(
        bodyValue(body, "affiliation_status", "affiliationStatus")
      ),

      eligibility: cleanString(bodyValue(body, "eligibility")),

      is_active: booleanValue(bodyValue(body, "is_active"), true),

      // 🔥 fix naming mismatch
      naac_metric_reference: cleanString(
        bodyValue(body, "naac_metric_ref", "naac_metric_reference")
      ) || "C1.1",

      academic_year_id: await resolveAcademicYearId(
        req,
        bodyValue(body, "academic_year_id", "academicYear")
      ),

      status: statusValue(bodyValue(body, "status")),
      is_deleted: false,
    };

    const program = await NaacProgram.create(payload);

    return res.status(201).json({
      status: "success",
      message:
        payload.status === "FINAL"
          ? "Program finalized successfully"
          : "Program draft saved successfully",
      data: program,
    });

  } catch (error) {
    next(error);
  }
}

export async function getPrograms(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacProgram } = getTenantModels(req.tenant);
    const id = numberOrNull(req.query.id);
    

    const where: Record<string, any> = { is_deleted: false, tenant_id: req.tenant_id || 1 };

    if (id) where.id = id;

     else {
      
    }

    const academicYearId = numberOrNull(req.query.academic_year_id);
    if (academicYearId) where.academic_year_id = academicYearId;

    const status = cleanString(req.query.status)?.toUpperCase();
    if (status && VALID_STATUS.has(status)) {
      where.status = status;
    }

    if (req.query.is_active !== undefined) {
      where.is_active = booleanValue(req.query.is_active);
    }

    if (id) {
      const record = await NaacProgram.findOne({ where });
      if (!record) throw new AppError("Program not found", 404);

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records = await NaacProgram.findAll({
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


export async function updateProgram(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacProgram } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Program id is required",
        400
      );
    }

    const program =
      await NaacProgram.findByPk(id);

    if (!program) {
      throw new AppError(
        "Program not found",
        404
      );
    }

    const body =
      bodySource(req);

    let level =
      cleanString(
        bodyValue(body, "level")
      ) || program.level;

    if (level === "Ph.D.") {
      level = "PhD";
    }

    const payload: any = {
      tenant_id: req.tenant_id || 1,

      program_name:
        bodyValue(
          body,
          "program_name",
          "programName"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "program_name",
                "programName"
              ),
              "program_name"
            )
          : program.program_name,

      short_name:
        bodyValue(
          body,
          "short_name",
          "shortName"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "short_name",
                "shortName"
              )
            )
          : program.short_name,

      level:
        bodyValue(
          body,
          "level"
        ) !== undefined
          ? requiredString(
              level,
              "level"
            )
          : program.level,

      department:
        bodyValue(
          body,
          "department"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "department"
              )
            )
          : program.department,

      duration_years:
        bodyValue(
          body,
          "duration_years",
          "duration"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "duration_years",
                "duration"
              )
            )
          : program.duration_years,

      intake:
        bodyValue(
          body,
          "intake"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "intake"
              )
            )
          : program.intake,

      fee_per_year:
        bodyValue(
          body,
          "fee_per_year",
          "fee"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "fee_per_year",
                "fee"
              )
            )
          : program.fee_per_year,

      affiliation_status:
        bodyValue(
          body,
          "affiliation_status",
          "affiliationStatus"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "affiliation_status",
                "affiliationStatus"
              )
            )
          : program.affiliation_status,

      eligibility:
        bodyValue(
          body,
          "eligibility"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "eligibility"
              )
            )
          : program.eligibility,

      is_active:
        bodyValue(
          body,
          "is_active"
        ) !== undefined
          ? booleanValue(
              bodyValue(
                body,
                "is_active"
              ),
              true
            )
          : program.is_active,

      naac_metric_reference:
        bodyValue(
          body,
          "naac_metric_ref",
          "naac_metric_reference"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "naac_metric_ref",
                "naac_metric_reference"
              )
            ) || "C1.1"
          : program.naac_metric_reference,

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
          : program.academic_year_id,

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
          : program.status,
    };

    await program.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        payload.status === "FINAL"
          ? "Program finalized successfully"
          : "Program updated successfully",
      data: program,
    });

  } catch (error) {
    next(error);
  }
}