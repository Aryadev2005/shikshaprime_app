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

export async function createStudentActivity(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacStudentActivity } = getTenantModels(req.tenant);

    const body = bodySource(req);
    
    const files = (req.files as MulterFile[]) || [];
    const uploadedPhoto = files.find((file) => file.fieldname === "photo_url");

    const payload = {
  tenant_id: req.tenant_id || 1,

  academic_year_id: await resolveAcademicYearId(
    req,
    bodyValue(body, "academic_year_id", "academicYear")
  ),

  activity_name: requiredString(
    bodyValue(body, "activity_name", "activityName"),
    "activity_name"
  ),

  activity_type: cleanString(
    bodyValue(body, "activity_type", "activityType")
  ),

  description: cleanString(
    bodyValue(body, "description")
  ),

  participant_count: numberOrNull(
    bodyValue(
      body,
      "participant_count",
      "participantCount"
    )
  ),

  achievement: cleanString(
    bodyValue(body, "achievement")
  ),

  event_date: bodyValue(
    body,
    "event_date",
    "eventDate"
  )
    ? new Date(
        String(
          bodyValue(
            body,
            "event_date",
            "eventDate"
          )
        )
      )
    : null,

  photo_url: uploadedPhoto 
    ? `/uploads/files/${uploadedPhoto.filename}`
    : (cleanString(bodyValue(body, "photo_url", "photoUrl"))?.replace(/.*(?:\\|\/)uploads(?:\\|\/)files(?:\\|\/)/, '/uploads/files/') || null),

  naac_metric_ref: cleanString(
    bodyValue(body, "naac_metric_ref", "naacMetricRef")
  ),

          status: ((): 'SAVED' | 'FINAL' => {
          const value = cleanString(bodyValue(body, "status"));
          return value === 'FINAL' ? 'FINAL' : 'SAVED';
        })(),
};

    const data = await NaacStudentActivity.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Student activity created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getStudentActivities(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacStudentActivity } = getTenantModels(req.tenant);

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
      const record = await NaacStudentActivity.findOne({
        where,
      });

      if (!record) {
        throw new AppError(
          "Student activity not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records = await NaacStudentActivity.findAll({
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

export async function updateStudentActivity(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacStudentActivity } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Student activity id is required",
        400
      );
    }

    const studentActivity =
      await NaacStudentActivity.findByPk(
        id
      );

    if (!studentActivity) {
      throw new AppError(
        "Student activity not found",
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
          : studentActivity.academic_year_id,

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
          : studentActivity.activity_name,

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
          : studentActivity.activity_type,

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
          : studentActivity.description,

      participant_count:
        bodyValue(
          body,
          "participant_count",
          "participantCount"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "participant_count",
                "participantCount"
              )
            )
          : studentActivity.participant_count,

      achievement:
        bodyValue(
          body,
          "achievement"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "achievement"
              )
            )
          : studentActivity.achievement,

      event_date:
        bodyValue(
          body,
          "event_date",
          "eventDate"
        ) !== undefined
          ? bodyValue(
              body,
              "event_date",
              "eventDate"
            )
            ? new Date(
                String(
                  bodyValue(
                    body,
                    "event_date",
                    "eventDate"
                  )
                )
              )
            : null
          : studentActivity.event_date,

      photo_url: uploadedPhoto 
        ? `/uploads/files/${uploadedPhoto.filename}` 
        : bodyValue(body, "photo_url", "photoUrl") !== undefined
          ? (cleanString(bodyValue(body, "photo_url", "photoUrl"))?.replace(/.*(?:\\|\/)uploads(?:\\|\/)files(?:\\|\/)/, '/uploads/files/') || null)
          : studentActivity.photo_url,

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
          : studentActivity.naac_metric_ref,

                status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : studentActivity.status,
    };

    await studentActivity.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Student activity updated successfully",
      data: studentActivity,
    });

  } catch (error) {
    next(error);
  }
}
