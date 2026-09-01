import { Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();

  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown, field: string): string {
  const cleaned = cleanString(value);

  if (!cleaned) {
    throw new AppError(`${field} is required`, 400);
  }

  return cleaned;
}

function numberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const num = Number(value);

  return Number.isNaN(num) ? null : num;
}

function firstValue(...values: unknown[]): unknown {
  return values.find(
    (v) => v !== undefined && v !== null && v !== ""
  );
}

function bodySource(req: any): Record<string, any> {
  return req.body?.data || req.body?.payload || req.body || {};
}

function bodyValue(body: Record<string, any>, ...keys: string[]) {
  return firstValue(...keys.map((k) => body?.[k]));
}


async function resolveAcademicYearId(
  req: any,
  raw: unknown
): Promise<number | null> {
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

  if (byId.length) {
    return Number(byId[0].id);
  }

  return null;
}

export async function createInstitutionalDistinctiveness(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacInstitutionalDistinctiveness } =
      getTenantModels(req.tenant);

    const body = bodySource(req);

    const payload = {
      tenant_id: req.tenant_id || 1,

      academic_year_id: await resolveAcademicYearId(
        req,
        bodyValue(body, "academic_year_id", "academicYear")
      ),

      title: requiredString(
        bodyValue(body, "title"),
        "title"
      ),

      description: cleanString(
        bodyValue(body, "description")
      ),

      naac_metric_ref: cleanString(
        bodyValue(body, "naac_metric_ref", "naacMetricRef")
      ),
      status: ((): 'SAVED' | 'FINAL' => {
          const value = cleanString(bodyValue(body, "status"));
          return value === 'FINAL' ? 'FINAL' : 'SAVED';
        })(),
    };

    const data =
      await NaacInstitutionalDistinctiveness.create(
        payload
      );

    return res.status(201).json({
      status: "success",
      message:
        "Institutional distinctiveness created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getInstitutionalDistinctiveness(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacInstitutionalDistinctiveness } =
      getTenantModels(req.tenant);

    const where: Record<string, any> = { tenant_id: req.tenant_id || 1 };

    const id = numberOrNull(req.query.id);

    if (id) {
      where.id = id;
    }

    

    const academicYearId = numberOrNull(
      req.query.academic_year_id
    );

    if (academicYearId) {
      where.academic_year_id = academicYearId;
    }

    if (id) {
      const record =
        await NaacInstitutionalDistinctiveness.findOne({
          where,
        });

      if (!record) {
        throw new AppError(
          "Institutional distinctiveness record not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records =
      await NaacInstitutionalDistinctiveness.findAll({
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

export async function updateInstitutionalDistinctiveness(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacInstitutionalDistinctiveness } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Institutional distinctiveness id is required",
        400
      );
    }

    const institutionalDistinctiveness =
      await NaacInstitutionalDistinctiveness.findByPk(
        id
      );

    if (!institutionalDistinctiveness) {
      throw new AppError(
        "Institutional distinctiveness record not found",
        404
      );
    }

    const body = bodySource(req);

    const payload = {
      tenant_id: req.tenant_id || 1,

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
          : institutionalDistinctiveness.academic_year_id,

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
          : institutionalDistinctiveness.title,

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
          : institutionalDistinctiveness.description,

      naac_metric_ref:
        bodyValue(
          body,
          "naac_metric_ref",
          "naacMetricRef"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "naac_metric_ref",
                "naacMetricRef"
              )
            )
          : institutionalDistinctiveness.naac_metric_ref,

          status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : institutionalDistinctiveness.status,
    };

    await institutionalDistinctiveness.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Institutional distinctiveness updated successfully",
      data: institutionalDistinctiveness,
    });

  } catch (error) {
    next(error);
  }
}