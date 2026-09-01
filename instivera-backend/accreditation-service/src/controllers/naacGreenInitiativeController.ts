import { Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { normalizeFileFields } from "../utils/fileUrl";
import { File as MulterFile } from "multer";
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

export async function createGreenInitiative(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacGreenInitiative } =
      getTenantModels(req.tenant);

    const body = bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

    const uploadedPhoto =
      files.find(
        (file) =>
          file.fieldname === "photo_url"
      );

    console.log(
      "UPLOADED PHOTO:",
      uploadedPhoto
    );

    const payload = {
      tenant_id: req.tenant_id || 1,

      academic_year_id:
        await resolveAcademicYearId(
          req,
          bodyValue(
            body,
            "academic_year_id",
            "academicYear"
          )
        ),

      initiative_name:
        requiredString(
          bodyValue(
            body,
            "initiative_name",
            "initiativeName"
          ),
          "initiative_name"
        ),

      initiative_type:
        cleanString(
          bodyValue(
            body,
            "initiative_type",
            "initiativeType"
          )
        ),

      description:
        cleanString(
          bodyValue(
            body,
            "description"
          )
        ),

      investment_amount:
        numberOrNull(
          bodyValue(
            body,
            "investment_amount",
            "investmentAmount"
          )
        ),

      impact_metrics:
        cleanString(
          bodyValue(
            body,
            "impact_metrics",
            "impactMetrics"
          )
        ),
        status: ((): 'SAVED' | 'FINAL' => {
          const value = cleanString(bodyValue(body, "status"));
          return value === 'FINAL' ? 'FINAL' : 'SAVED';
        })(),

      photo_url:
        uploadedPhoto ? `/api/accreditation/uploads/files/${uploadedPhoto.filename}` : null,

      naac_metric_ref:
        cleanString(
          bodyValue(
            body,
            "naac_metric_ref",
            "naacMetricRef"
          )
        ),
    };

    console.log(
      "FINAL PAYLOAD:",
      payload
    );

    const data =
      await NaacGreenInitiative.create(
        payload
      );

    return res.status(201).json({
      status: "success",
      message:
        "Green initiative created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getGreenInitiatives(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacGreenInitiative } =
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

    const initiativeType = cleanString(
      req.query.initiative_type
    );

    if (initiativeType) {
      where.initiative_type = initiativeType;
    }

    if (id) {
      const record =
        await NaacGreenInitiative.findOne({
          where,
        });

      if (!record) {
        throw new AppError(
          "Green initiative not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: normalizeFileFields(record, ["photo_url"]),
      });
    }

    const records =
      await NaacGreenInitiative.findAll({
        where,
        order: [["id", "DESC"]],
      });

    return res.status(200).json({
      status: "success",
      data: normalizeFileFields(records, ["photo_url"]),
    });

  } catch (error) {
    next(error);
  }
}

export async function 
updateGreenInitiative(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacGreenInitiative } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Green initiative id is required",
        400
      );
    }

    const greenInitiative =
      await NaacGreenInitiative.findByPk(
        id
      );

    if (!greenInitiative) {
      throw new AppError(
        "Green initiative not found",
        404
      );
    }

    const body = bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

    const uploadedPhoto =
      files.find(
        (file) =>
          file.fieldname === "photo_url"
      );

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
          : greenInitiative.academic_year_id,

      initiative_name:
        bodyValue(
          body,
          "initiative_name",
          "initiativeName"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "initiative_name",
                "initiativeName"
              ),
              "initiative_name"
            )
          : greenInitiative.initiative_name,

      initiative_type:
        bodyValue(
          body,
          "initiative_type",
          "initiativeType"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "initiative_type",
                "initiativeType"
              )
            )
          : greenInitiative.initiative_type,

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
          : greenInitiative.description,

      investment_amount:
        bodyValue(
          body,
          "investment_amount",
          "investmentAmount"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "investment_amount",
                "investmentAmount"
              )
            )
          : greenInitiative.investment_amount,
          status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : greenInitiative.status,

      impact_metrics:
        bodyValue(
          body,
          "impact_metrics",
          "impactMetrics"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "impact_metrics",
                "impactMetrics"
              )
            )
          : greenInitiative.impact_metrics,

      photo_url:
        uploadedPhoto ? `/api/accreditation/uploads/files/${uploadedPhoto.filename}` : greenInitiative.photo_url,

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
          : greenInitiative.naac_metric_ref,
    };

    await greenInitiative.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Green initiative updated successfully",
      data: normalizeFileFields(greenInitiative, ["photo_url"]),
    });

  } catch (error) {
    next(error);
  }
}
