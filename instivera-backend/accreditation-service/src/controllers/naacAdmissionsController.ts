import { Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
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

function booleanValue(
  value: unknown,
  defaultValue = true
): boolean {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes"].includes(
    String(value).toLowerCase()
  );
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

export async function createAdmission(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacAdmission } =
      getTenantModels(req.tenant);

    const body = bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

const applicationFile = files.find(
  (file) =>
    file.fieldname === "application_url"
);

const guidelineFile = files.find(
  (file) =>
    file.fieldname ===
    "admission_guidelines_url"
);

    console.log("APPLICATION FILE:", applicationFile);
    console.log("GUIDELINE FILE:", guidelineFile);

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

      program_id: numberOrNull(
        bodyValue(
          body,
          "program_id",
          "programId"
        )
      ),

      admission_title: requiredString(
        bodyValue(
          body,
          "admission_title",
          "admissionTitle"
        ),
        "admission_title"
      ),

      admission_process: requiredString(
        bodyValue(
          body,
          "admission_process",
          "admissionProcess"
        ),
        "admission_process"
      ),

      eligibility_criteria: cleanString(
        bodyValue(
          body,
          "eligibility_criteria",
          "eligibilityCriteria"
        )
      ),

      selection_criteria: cleanString(
        bodyValue(
          body,
          "selection_criteria",
          "selectionCriteria"
        )
      ),

      entrance_exam_name: cleanString(
        bodyValue(
          body,
          "entrance_exam_name",
          "entranceExamName"
        )
      ),

      application_start_date: bodyValue(
        body,
        "application_start_date",
        "applicationStartDate"
      )
        ? new Date(
            String(
              bodyValue(
                body,
                "application_start_date",
                "applicationStartDate"
              )
            )
          )
        : null,

      application_end_date: bodyValue(
        body,
        "application_end_date",
        "applicationEndDate"
      )
        ? new Date(
            String(
              bodyValue(
                body,
                "application_end_date",
                "applicationEndDate"
              )
            )
          )
        : null,

      application_mode: (
        cleanString(
          bodyValue(
            body,
            "application_mode",
            "applicationMode"
          )
        ) || null
      ) as "online" | "offline" | "both" | null,

      reservation_policy: cleanString(
        bodyValue(
          body,
          "reservation_policy",
          "reservationPolicy"
        )
      ),

      total_seats: numberOrNull(
        bodyValue(
          body,
          "total_seats",
          "totalSeats"
        )
      ),

      application_url:
        applicationFile?.path ||
        (applicationFile as any)?.location ||
        applicationFile?.filename ||
        applicationFile?.originalname ||
        null,

      admission_guidelines_url:
        guidelineFile?.path ||
        (guidelineFile as any)?.location ||
        guidelineFile?.filename ||
        guidelineFile?.originalname ||
        null,

      naac_metric_ref: cleanString(
        bodyValue(
          body,
          "naac_metric_ref",
          "naacMetricRef"
        )
      ),

      is_active: booleanValue(
        bodyValue(
          body,
          "is_active",
          "isActive"
        ),
        true
      ),

      status: (
        cleanString(
          bodyValue(body, "status")
        ) || "SAVED"
      ) as "SAVED" | "FINAL",
    };

    console.log("FINAL PAYLOAD:", payload);

    const data =
      await NaacAdmission.create(payload);

    return res.status(201).json({
      status: "success",
      message:
        "Admission created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getAdmissions(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacAdmission } = getTenantModels(req.tenant);

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

    const programId = numberOrNull(
      req.query.program_id
    );

    if (programId) {
      where.program_id = programId;
    }

    if (id) {
      const record = await NaacAdmission.findOne({
        where,
      });

      if (!record) {
        throw new AppError(
          "Admission not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records = await NaacAdmission.findAll({
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

export async function updateAdmission(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacAdmission } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Admission id is required",
        400
      );
    }

    const admission =
      await NaacAdmission.findByPk(id);

    if (!admission) {
      throw new AppError(
        "Admission not found",
        404
      );
    }

    const body =
      bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

    const applicationFile =
      files.find(
        (file) =>
          file.fieldname ===
          "application_url"
      );

    const guidelineFile =
      files.find(
        (file) =>
          file.fieldname ===
          "admission_guidelines_url"
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
          : admission.academic_year_id,

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
          : admission.program_id,

      admission_title:
        bodyValue(
          body,
          "admission_title",
          "admissionTitle"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "admission_title",
                "admissionTitle"
              ),
              "admission_title"
            )
          : admission.admission_title,

      admission_process:
        bodyValue(
          body,
          "admission_process",
          "admissionProcess"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "admission_process",
                "admissionProcess"
              ),
              "admission_process"
            )
          : admission.admission_process,

      eligibility_criteria:
        bodyValue(
          body,
          "eligibility_criteria",
          "eligibilityCriteria"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "eligibility_criteria",
                "eligibilityCriteria"
              )
            )
          : admission.eligibility_criteria,

      selection_criteria:
        bodyValue(
          body,
          "selection_criteria",
          "selectionCriteria"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "selection_criteria",
                "selectionCriteria"
              )
            )
          : admission.selection_criteria,

      entrance_exam_name:
        bodyValue(
          body,
          "entrance_exam_name",
          "entranceExamName"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "entrance_exam_name",
                "entranceExamName"
              )
            )
          : admission.entrance_exam_name,

      application_start_date:
        bodyValue(
          body,
          "application_start_date",
          "applicationStartDate"
        ) !== undefined
          ? bodyValue(
              body,
              "application_start_date",
              "applicationStartDate"
            )
            ? new Date(
                String(
                  bodyValue(
                    body,
                    "application_start_date",
                    "applicationStartDate"
                  )
                )
              )
            : null
          : admission.application_start_date,

      application_end_date:
        bodyValue(
          body,
          "application_end_date",
          "applicationEndDate"
        ) !== undefined
          ? bodyValue(
              body,
              "application_end_date",
              "applicationEndDate"
            )
            ? new Date(
                String(
                  bodyValue(
                    body,
                    "application_end_date",
                    "applicationEndDate"
                  )
                )
              )
            : null
          : admission.application_end_date,

      application_mode:
        bodyValue(
          body,
          "application_mode",
          "applicationMode"
        ) !== undefined
          ? (cleanString(
              bodyValue(
                body,
                "application_mode",
                "applicationMode"
              )
            ) as
              | "online"
              | "offline"
              | "both"
              | null)
          : admission.application_mode,

      reservation_policy:
        bodyValue(
          body,
          "reservation_policy",
          "reservationPolicy"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "reservation_policy",
                "reservationPolicy"
              )
            )
          : admission.reservation_policy,

      total_seats:
        bodyValue(
          body,
          "total_seats",
          "totalSeats"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "total_seats",
                "totalSeats"
              )
            )
          : admission.total_seats,

      application_url:
        applicationFile?.path ||
        (applicationFile as any)
          ?.location ||
        applicationFile?.filename ||
        applicationFile?.originalname ||
        admission.application_url,

      admission_guidelines_url:
        guidelineFile?.path ||
        (guidelineFile as any)
          ?.location ||
        guidelineFile?.filename ||
        guidelineFile?.originalname ||
        admission.admission_guidelines_url,

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
          : admission.naac_metric_ref,

      is_active:
        bodyValue(
          body,
          "is_active",
          "isActive"
        ) !== undefined
          ? booleanValue(
              bodyValue(
                body,
                "is_active",
                "isActive"
              ),
              true
            )
          : admission.is_active,

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
          : admission.status,
    };

    await admission.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Admission updated successfully",
      data: admission,
    });

  } catch (error) {
    next(error);
  }
}
