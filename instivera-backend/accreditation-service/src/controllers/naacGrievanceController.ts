import { Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();

  return trimmed.length > 0 ? trimmed : null;
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

export async function createGrievance(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacGrievance } = getTenantModels(req.tenant);

    const body = bodySource(req);

    const payload = {
      tenant_id: req.tenant_id || 1,

      academic_year_id: await resolveAcademicYearId(
        req,
        bodyValue(body, "academic_year_id", "academicYear")
      ),

      grievance_type: cleanString(
        bodyValue(body, "grievance_type", "grievanceType")
      ),

      total_received: numberOrNull(
        bodyValue(body, "total_received", "totalReceived")
      ) || 0,

      total_resolved: numberOrNull(
        bodyValue(body, "total_resolved", "totalResolved")
      ) || 0,

      total_pending: numberOrNull(
        bodyValue(body, "total_pending", "totalPending")
      ) || 0,

      avg_resolution_days: numberOrNull(
        bodyValue(body, "avg_resolution_days", "avgResolutionDays")
      ),

      committee_name: cleanString(
        bodyValue(body, "committee_name", "committeeName")
      ),

      portal_link: cleanString(
        bodyValue(body, "portal_link", "portalLink")
      ),

      naac_metric_ref: cleanString(
        bodyValue(body, "naac_metric_ref", "naacMetricRef")
      ),
      status: ((): 'SAVED' | 'FINAL' => {
          const value = cleanString(bodyValue(body, "status"));
          return value === 'FINAL' ? 'FINAL' : 'SAVED';
        })(),
    };

    const data = await NaacGrievance.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Grievance data created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getGrievances(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacGrievance } = getTenantModels(req.tenant);

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

    const grievanceType = cleanString(
      req.query.grievance_type
    );

    if (grievanceType) {
      where.grievance_type = grievanceType;
    }

    if (id) {
      const record = await NaacGrievance.findOne({
        where,
      });

      if (!record) {
        throw new AppError(
          "Grievance record not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records = await NaacGrievance.findAll({
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

export async function updateGrievance(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacGrievance } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Grievance id is required",
        400
      );
    }

    const grievance =
      await NaacGrievance.findByPk(id);

    if (!grievance) {
      throw new AppError(
        "Grievance record not found",
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
          : grievance.academic_year_id,

      grievance_type:
        bodyValue(
          body,
          "grievance_type",
          "grievanceType"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "grievance_type",
                "grievanceType"
              )
            )
          : grievance.grievance_type,

      total_received:
        bodyValue(
          body,
          "total_received",
          "totalReceived"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "total_received",
                "totalReceived"
              )
            ) || 0
          : grievance.total_received,

      total_resolved:
        bodyValue(
          body,
          "total_resolved",
          "totalResolved"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "total_resolved",
                "totalResolved"
              )
            ) || 0
          : grievance.total_resolved,

      total_pending:
        bodyValue(
          body,
          "total_pending",
          "totalPending"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "total_pending",
                "totalPending"
              )
            ) || 0
          : grievance.total_pending,

      avg_resolution_days:
        bodyValue(
          body,
          "avg_resolution_days",
          "avgResolutionDays"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "avg_resolution_days",
                "avgResolutionDays"
              )
            )
          : grievance.avg_resolution_days,

      committee_name:
        bodyValue(
          body,
          "committee_name",
          "committeeName"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "committee_name",
                "committeeName"
              )
            )
          : grievance.committee_name,

      portal_link:
        bodyValue(
          body,
          "portal_link",
          "portalLink"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "portal_link",
                "portalLink"
              )
            )
          : grievance.portal_link,

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
          : grievance.naac_metric_ref,

                    status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : grievance.status,
    };

    await grievance.update(payload);

    return res.status(200).json({
      status: "success",
      message:
        "Grievance updated successfully",
      data: grievance,
    });

  } catch (error) {
    next(error);
  }
}