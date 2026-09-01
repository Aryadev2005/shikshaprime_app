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

export async function createPlacement(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacPlacement } = getTenantModels(req.tenant);

    const body = bodySource(req);

    const payload = {
      tenant_id: req.tenant_id || 1,

      academic_year_id: await resolveAcademicYearId(
        req,
        bodyValue(body, "academic_year_id", "academicYear")
      ),

      student_id: numberOrNull(
        bodyValue(body, "student_id", "studentId")
      ),

      company_name: requiredString(
        bodyValue(body, "company_name", "companyName"),
        "company_name"
      ),

      job_role: cleanString(
        bodyValue(body, "job_role", "jobRole")
      ),

      package_lpa: numberOrNull(
        bodyValue(body, "package_lpa", "packageLpa")
      ),

      placement_type: cleanString(
        bodyValue(body, "placement_type", "placementType")
      ),

      higher_studies_institution: cleanString(
        bodyValue(
          body,
          "higher_studies_institution",
          "higherStudiesInstitution"
        )
      ),

      naac_metric_ref: cleanString(
        bodyValue(body, "naac_metric_ref", "naacMetricRef")
      ),
        status: ((): 'SAVED' | 'FINAL' => {
          const value = cleanString(bodyValue(body, "status"));
          return value === 'FINAL' ? 'FINAL' : 'SAVED';
        })(),
    };

    const data = await NaacPlacement.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Placement data created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getPlacements(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacPlacement } = getTenantModels(req.tenant);

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

    const studentId = numberOrNull(
      req.query.student_id
    );

    if (studentId) {
      where.student_id = studentId;
    }

    const placementType = cleanString(
      req.query.placement_type
    );

    if (placementType) {
      where.placement_type = placementType;
    }

    if (id) {
      const record = await NaacPlacement.findOne({
        where,
      });

      if (!record) {
        throw new AppError(
          "Placement record not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records = await NaacPlacement.findAll({
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

export async function updatePlacement(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacPlacement } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Placement id is required",
        400
      );
    }

    const placement =
      await NaacPlacement.findByPk(id);

    if (!placement) {
      throw new AppError(
        "Placement record not found",
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
          : placement.academic_year_id,

      student_id:
        bodyValue(
          body,
          "student_id",
          "studentId"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "student_id",
                "studentId"
              )
            )
          : placement.student_id,

      company_name:
        bodyValue(
          body,
          "company_name",
          "companyName"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "company_name",
                "companyName"
              ),
              "company_name"
            )
          : placement.company_name,

      job_role:
        bodyValue(
          body,
          "job_role",
          "jobRole"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "job_role",
                "jobRole"
              )
            )
          : placement.job_role,

      package_lpa:
        bodyValue(
          body,
          "package_lpa",
          "packageLpa"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "package_lpa",
                "packageLpa"
              )
            )
          : placement.package_lpa,

      placement_type:
        bodyValue(
          body,
          "placement_type",
          "placementType"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "placement_type",
                "placementType"
              )
            )
          : placement.placement_type,

      higher_studies_institution:
        bodyValue(
          body,
          "higher_studies_institution",
          "higherStudiesInstitution"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "higher_studies_institution",
                "higherStudiesInstitution"
              )
            )
          : placement.higher_studies_institution,

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
          : placement.naac_metric_ref,
      
      status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : placement.status,
    };

    await placement.update(payload);

    return res.status(200).json({
      status: "success",
      message:
        "Placement updated successfully",
      data: placement,
    });

  } catch (error) {
    next(error);
  }
}