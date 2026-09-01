import { Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { normalizeFileFields } from "../utils/fileUrl";
import { getTenantModels } from "../models";
import { File as MulterFile } from "multer";

function cleanString(value: unknown): string | null {
  if (value === undefined || value ===null) return null;

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

export async function createAchievement(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacAchievement } =
      getTenantModels(req.tenant);

    const body = bodySource(req);

    const files = (req.files as MulterFile[]) || [];

    const uploadedProof =
      files.find(
        (file) =>
          file.fieldname === "proof_url"
      );

    console.log(
      "UPLOADED PROOF:",
      uploadedProof
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

      title: requiredString(
        bodyValue(
          body,
          "title"
        ),
        "title"
      ),

      achievement_type:
        cleanString(
          bodyValue(
            body,
            "achievement_type",
            "achievementType"
          )
        ),

      level:
        cleanString(
          bodyValue(
            body,
            "level"
          )
        ),

      student_name:
        cleanString(
          bodyValue(
            body,
            "student_name",
            "studentName"
          )
        ),

      event_name:
        cleanString(
          bodyValue(
            body,
            "event_name",
            "eventName"
          )
        ),

      position_secured:
        cleanString(
          bodyValue(
            body,
            "position_secured",
            "positionSecured"
          )
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

      proof_url:
        // uploadedProof ? `/uploads/files/${uploadedProof.filename}` : null,
        uploadedProof? `/api/accreditation/uploads/files/${uploadedProof.filename}`: null,

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
      await NaacAchievement.create(
        payload
      );

    return res.status(201).json({
      status: "success",
      message:
        "Achievement created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getAchievements(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacAchievement } =
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

    const achievementType = cleanString(
      req.query.achievement_type
    );

    if (achievementType) {
      where.achievement_type = achievementType;
    }

    if (id) {
      const record =
        await NaacAchievement.findOne({
          where,
        });

      if (!record) {
        throw new AppError(
          "Achievement not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: normalizeFileFields(record, ["proof_url"]),
      });
    }

    const records =
      await NaacAchievement.findAll({
        where,
        order: [["id", "DESC"]],
      });

    return res.status(200).json({
      status: "success",
      data: normalizeFileFields(records, ["proof_url"]),
    });

  } catch (error) {
    next(error);
  }
}
export async function updateAchievement(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacAchievement } = getTenantModels(req.tenant);

    const id = numberOrNull(req.params.id);

    if (!id) {
      throw new AppError("Achievement id is required", 400);
    }

    const achievement = await NaacAchievement.findByPk(id);

    if (!achievement) {
      throw new AppError("Achievement not found", 404);
    }

    const body = bodySource(req);
    const files = (req.files as MulterFile[]) || [];

    const uploadedProof = files.find(
      (file) => file.fieldname === "proof_url"
    );

    const payload = {
      tenant_id: req.tenant_id || 1,

      academic_year_id:
        bodyValue(body, "academic_year_id", "academicYear") !== undefined
          ? await resolveAcademicYearId(
              req,
              bodyValue(body, "academic_year_id", "academicYear")
            )
          : achievement.academic_year_id,

      title:
        bodyValue(body, "title") !== undefined
          ? requiredString(bodyValue(body, "title"), "title")
          : achievement.title,

      achievement_type:
        bodyValue(body, "achievement_type", "achievementType") !== undefined
          ? cleanString(
              bodyValue(body, "achievement_type", "achievementType")
            )
          : achievement.achievement_type,

      level:
        bodyValue(body, "level") !== undefined
          ? cleanString(bodyValue(body, "level"))
          : achievement.level,

      student_name:
        bodyValue(body, "student_name", "studentName") !== undefined
          ? cleanString(
              bodyValue(body, "student_name", "studentName")
            )
          : achievement.student_name,

      event_name:
        bodyValue(body, "event_name", "eventName") !== undefined
          ? cleanString(
              bodyValue(body, "event_name", "eventName")
            )
          : achievement.event_name,

      position_secured:
        bodyValue(body, "position_secured", "positionSecured") !== undefined
          ? cleanString(
              bodyValue(body, "position_secured", "positionSecured")
            )
          : achievement.position_secured,

      event_date:
        bodyValue(body, "event_date", "eventDate") !== undefined
          ? bodyValue(body, "event_date", "eventDate")
            ? new Date(
                String(
                  bodyValue(body, "event_date", "eventDate")
                )
              )
            : null
          : achievement.event_date,

      proof_url: uploadedProof
        ? `/api/accreditation/uploads/files/${uploadedProof.filename}`
        : achievement.proof_url,

      naac_metric_ref:
        bodyValue(body, "naac_metric_ref", "naacMetricRef") !== undefined
          ? cleanString(
              bodyValue(body, "naac_metric_ref", "naacMetricRef")
            )
          : achievement.naac_metric_ref,

      // ✅ FIXED: status handling
      status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : achievement.status,
    };

    console.log("UPDATE PAYLOAD:", payload);

    await achievement.update(payload);

    return res.status(200).json({
      status: "success",
      message: "Achievement updated successfully",
      data: normalizeFileFields(achievement, ["proof_url"]),
    });
  } catch (error) {
    next(error);
  }
}
