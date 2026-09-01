import { Response, NextFunction } from "express";
import { getTenantModels } from "../models";
import { AppError } from "../utils/appError";
import { QueryTypes } from "sequelize";

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

  const byName = await sequelize.query<{ id: number }>(
    `SELECT id FROM academic_years WHERE name = :name LIMIT 1`,
    {
      replacements: { name: cleaned },
      type: QueryTypes.SELECT,
    }
  );

  if (byName.length) {
    return Number(byName[0].id);
  }

  return null;
}

export async function createStudentSupport(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacStudentSupport } = getTenantModels(req.tenant);

    const body = bodySource(req);

    

    const academicYearId = await resolveAcademicYearId(
      req,
      bodyValue(body, "academic_year_id", "academicYear")
    );

    const payload = {
      tenant_id: req.tenant_id || 1,

      academic_year_id: academicYearId,

      scheme_name: requiredString(
        bodyValue(body, "scheme_name", "schemeName"),
        "scheme_name"
      ),

      scheme_type: cleanString(
        bodyValue(body, "scheme_type", "schemeType")
      ),

      provider: cleanString(
        bodyValue(body, "provider")
      ),

      beneficiary_count: numberOrNull(
        bodyValue(body, "beneficiary_count", "beneficiaryCount")
      ),

      amount_per_student: numberOrNull(
        bodyValue(body, "amount_per_student", "amountPerStudent")
      ),

      total_amount_disbursed: numberOrNull(
        bodyValue(
          body,
          "total_amount_disbursed",
          "totalAmountDisbursed"
        )
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

    const data = await NaacStudentSupport.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Student support data created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getStudentSupport(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacStudentSupport } = getTenantModels(req.tenant);

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

    const schemeType = cleanString(
      req.query.scheme_type
    );

    if (schemeType) {
      where.scheme_type = schemeType;
    }

    // SINGLE RECORD
    if (id) {
      const record = await NaacStudentSupport.findOne({
        where,
      });

      if (!record) {
        throw new AppError(
          "Student support record not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    // MULTIPLE RECORDS
    const records = await NaacStudentSupport.findAll({
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

export async function updateStudentSupport(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacStudentSupport } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Student support id is required",
        400
      );
    }

    const studentSupport =
      await NaacStudentSupport.findByPk(
        id
      );

    if (!studentSupport) {
      throw new AppError(
        "Student support record not found",
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
          : studentSupport.academic_year_id,

      scheme_name:
        bodyValue(
          body,
          "scheme_name",
          "schemeName"
        ) !== undefined
          ? requiredString(
              bodyValue(
                body,
                "scheme_name",
                "schemeName"
              ),
              "scheme_name"
            )
          : studentSupport.scheme_name,

      scheme_type:
        bodyValue(
          body,
          "scheme_type",
          "schemeType"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "scheme_type",
                "schemeType"
              )
            )
          : studentSupport.scheme_type,

      provider:
        bodyValue(
          body,
          "provider"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "provider"
              )
            )
          : studentSupport.provider,

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
          : studentSupport.beneficiary_count,

      amount_per_student:
        bodyValue(
          body,
          "amount_per_student",
          "amountPerStudent"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "amount_per_student",
                "amountPerStudent"
              )
            )
          : studentSupport.amount_per_student,

      total_amount_disbursed:
        bodyValue(
          body,
          "total_amount_disbursed",
          "totalAmountDisbursed"
        ) !== undefined
          ? numberOrNull(
              bodyValue(
                body,
                "total_amount_disbursed",
                "totalAmountDisbursed"
              )
            )
          : studentSupport.total_amount_disbursed,

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
          : studentSupport.description,

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
          : studentSupport.naac_metric_ref,

                          status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : studentSupport.status,
    };

    await studentSupport.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Student support updated successfully",
      data: studentSupport,
    });

  } catch (error) {
    next(error);
  }
}