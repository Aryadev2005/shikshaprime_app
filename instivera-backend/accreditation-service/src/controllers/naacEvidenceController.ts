import { Response, NextFunction } from "express";
import { QueryTypes } from "sequelize";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();

  return trimmed.length > 0 ? trimmed : null;
}

function numberOrNull(value: unknown): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const num = Number(value);

  return Number.isNaN(num) ? null : num;
}

function firstValue(...values: unknown[]): unknown {
  return values.find(
    (v) =>
      v !== undefined &&
      v !== null &&
      v !== ""
  );
}

function bodySource(req: any): Record<string, any> {
  return (
    req.body?.data ||
    req.body?.payload ||
    req.body ||
    {}
  );
}

function bodyValue(
  body: Record<string, any>,
  ...keys: string[]
) {
  return firstValue(
    ...keys.map((k) => body?.[k])
  );
}

async function resolveAcademicYearId(
  req: any,
  raw: unknown
): Promise<number | null> {
  const cleaned = cleanString(raw);

  if (!cleaned) {
    return null;
  }

  const { sequelize } =
    getTenantModels(req.tenant);

  const byId = await sequelize.query<{
    id: number;
  }>(
    `SELECT id FROM academic_years WHERE id = :id LIMIT 1`,
    {
      replacements: {
        id: Number(cleaned),
      },
      type: QueryTypes.SELECT,
    }
  );

  if (byId.length) {
    return Number(byId[0].id);
  }

  return null;
}

export async function createEvidence(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacEvidence } =
      getTenantModels(req.tenant);

    const body = bodySource(req);

    const payload = {
      metric_id: numberOrNull(
        bodyValue(body, "metric_id", "metricId")
      ),

      document_id: numberOrNull(
        bodyValue(
          body,
          "document_id",
          "documentId"
        )
      ),

      academic_year_id:
        await resolveAcademicYearId(
          req,
          bodyValue(
            body,
            "academic_year_id",
            "academicYear"
          )
        ),

      notes: cleanString(
        bodyValue(body, "notes")
      ),

      sort_order:
        numberOrNull(
          bodyValue(
            body,
            "sort_order",
            "sortOrder"
          )
        ) || 0,
    };

    const data =
      await NaacEvidence.create(payload);

    return res.status(201).json({
      status: "success",
      message:
        "Evidence created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getEvidence(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacEvidence } =
      getTenantModels(req.tenant);

    const where: Record<string, any> = { tenant_id: req.tenant_id || 1 };

    const id = numberOrNull(
      req.query.id
    );

    if (id) {
      where.id = id;
    }

    const metricId = numberOrNull(
      req.query.metric_id
    );

    if (metricId) {
      where.metric_id = metricId;
    }

    const documentId = numberOrNull(
      req.query.document_id
    );

    if (documentId) {
      where.document_id = documentId;
    }

    const academicYearId =
      numberOrNull(
        req.query.academic_year_id
      );

    if (academicYearId) {
      where.academic_year_id =
        academicYearId;
    }

    if (id) {
      const record =
        await NaacEvidence.findOne({
          where,
        });

      if (!record) {
        throw new AppError(
          "Evidence not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: record,
      });
    }

    const records =
      await NaacEvidence.findAll({
        where,
        order: [
          ["sort_order", "ASC"],
          ["id", "DESC"],
        ],
      });

    return res.status(200).json({
      status: "success",
      data: records,
    });

  } catch (error) {
    next(error);
  }
}