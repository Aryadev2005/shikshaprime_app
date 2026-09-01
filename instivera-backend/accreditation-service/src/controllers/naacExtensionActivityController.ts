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

export async function createExtensionActivity(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacExtensionActivity } =
      getTenantModels(req.tenant);

    const body = bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

    const uploadedReport =
      files.find(
        (file) =>
          file.fieldname === "report_url"
      );

    console.log(
      "UPLOADED REPORT:",
      uploadedReport
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

      activity_name:
        requiredString(
          bodyValue(
            body,
            "activity_name",
            "activityName"
          ),
          "activity_name"
        ),

      activity_type:
        cleanString(
          bodyValue(
            body,
            "activity_type",
            "activityType"
          )
        ),

      organizing_unit:
        cleanString(
          bodyValue(
            body,
            "organizing_unit",
            "organizingUnit"
          )
        ),

      description:
        cleanString(
          bodyValue(
            body,
            "description"
          )
        ),

      beneficiary_count:
        numberOrNull(
          bodyValue(
            body,
            "beneficiary_count",
            "beneficiaryCount"
          )
        ),

      activity_date: bodyValue(
        body,
        "activity_date",
        "activityDate"
      )
        ? new Date(
            String(
              bodyValue(
                body,
                "activity_date",
                "activityDate"
              )
            )
          )
        : null,

      location:
        cleanString(
          bodyValue(
            body,
            "location"
          )
        ),

      report_url:
        // uploadedReport ? `/uploads/files/${uploadedReport.filename}` : null,
        uploadedReport?
        `/api/accreditation/uploads/files/${uploadedReport.filename}`:
        null,

      naac_metric_ref:
        cleanString(
          bodyValue(
            body,
            "naac_metric_ref",
            "naacMetricRef"
          )
        ),
        status: ((): 'SAVED' | 'FINAL' => {
          const value = cleanString(bodyValue(body, "status"));
          return value === 'FINAL' ? 'FINAL' : 'SAVED';
        })(),
    };

    console.log(
      "FINAL PAYLOAD:",
      payload
    );

    const data =
      await NaacExtensionActivity.create(
        payload
      );

    return res.status(201).json({
      status: "success",
      message:
        "Extension activity created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getExtensionActivities(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacExtensionActivity } =
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

    const activityType = cleanString(
      req.query.activity_type
    );

    if (activityType) {
      where.activity_type = activityType;
    }

    if (id) {
      const record =
        await NaacExtensionActivity.findOne({
          where,
        });

      if (!record) {
        throw new AppError(
          "Extension activity not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: normalizeFileFields(record, ["report_url"]),
      });
    }

    const records =
      await NaacExtensionActivity.findAll({
        where,
        order: [["id", "DESC"]],
      });

    return res.status(200).json({
      status: "success",
      data: normalizeFileFields(records, ["report_url"]),
    });

  } catch (error) {
    next(error);
  }
}

export async function updateExtensionActivity(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacExtensionActivity } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Extension activity id is required",
        400
      );
    }

    const extensionActivity =
      await NaacExtensionActivity.findByPk(
        id
      );

    if (!extensionActivity) {
      throw new AppError(
        "Extension activity not found",
        404
      );
    }

    const body = bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

    const uploadedReport =
      files.find(
        (file) =>
          file.fieldname === "report_url"
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
          : extensionActivity.academic_year_id,

      activity_name:
        bodyValue(
          body,
          "activity_name",
          "activityName"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "activity_name",
                "activityName"
              ),
              "activity_name"
            )
          : extensionActivity.activity_name,

      activity_type:
        bodyValue(
          body,
          "activity_type",
          "activityType"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "activity_type",
                "activityType"
              )
            )
          : extensionActivity.activity_type,

      organizing_unit:
        bodyValue(
          body,
          "organizing_unit",
          "organizingUnit"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "organizing_unit",
                "organizingUnit"
              )
            )
          : extensionActivity.organizing_unit,

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
          : extensionActivity.description,

      beneficiary_count:
        bodyValue(
          body,
          "beneficiary_count",
          "beneficiaryCount"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "beneficiary_count",
                "beneficiaryCount"
              )
            )
          : extensionActivity.beneficiary_count,

      activity_date:
        bodyValue(
          body,
          "activity_date",
          "activityDate"
        ) !== undefined
          ? bodyValue(
              body,
              "activity_date",
              "activityDate"
            )
            ? new Date(
                String(
                  bodyValue(
                    body,
                    "activity_date",
                    "activityDate"
                  )
                )
              )
            : null
          : extensionActivity.activity_date,

          status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : extensionActivity.status,

      location:
        bodyValue(
          body,
          "location"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "location"
              )
            )
          : extensionActivity.location,

      report_url:
        // uploadedReport ? `/uploads/files/${uploadedReport.filename}` : extensionActivity.report_url,
        uploadedReport?
        `/api/accreditation/uploads/files/${uploadedReport.filename}`:
        extensionActivity.report_url,

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
          : extensionActivity.naac_metric_ref,
    };

    await extensionActivity.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Extension activity updated successfully",
      data: normalizeFileFields(extensionActivity, ["report_url"]),
    });

  } catch (error) {
    next(error);
  }
}
