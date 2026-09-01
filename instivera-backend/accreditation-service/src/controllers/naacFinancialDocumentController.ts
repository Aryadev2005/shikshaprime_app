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

export async function createFinancialDocument(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacFinancialDocument } =
      getTenantModels(req.tenant);

    const body = bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

    const uploadedFile =
      files.find(
        (file) =>
          file.fieldname === "file_url"
      );

    console.log(
      "UPLOADED FILE:",
      uploadedFile
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

      doc_type: cleanString(
        bodyValue(
          body,
          "doc_type",
          "docType"
        )
      ),

      title: requiredString(
        bodyValue(body, "title"),
        "title"
      ),

      status: ((): 'SAVED' | 'FINAL' => {
          const value = cleanString(bodyValue(body, "status"));
          return value === 'FINAL' ? 'FINAL' : 'SAVED';
        })(),

      file_url:
        uploadedFile ? `/uploads/files/${uploadedFile.filename}` : null,

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
      await NaacFinancialDocument.create(
        payload
      );

    return res.status(201).json({
      status: "success",
      message:
        "Financial document created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}
export async function getFinancialDocuments(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacFinancialDocument } =
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

    const docType = cleanString(
      req.query.doc_type
    );

    if (docType) {
      where.doc_type = docType;
    }

    if (id) {
      const record =
        await NaacFinancialDocument.findOne({
          where,
        });

      if (!record) {
        throw new AppError(
          "Financial document not found",
          404
        );
      }

      return res.status(200).json({
        status: "success",
        data: normalizeFileFields(record, ["file_url"]),
      });
    }

    const records =
      await NaacFinancialDocument.findAll({
        where,
        order: [["id", "DESC"]],
      });

    return res.status(200).json({
      status: "success",
      data: normalizeFileFields(records, ["file_url"]),
    });

  } catch (error) {
    next(error);
  }
}

export async function updateFinancialDocument(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacFinancialDocument } =
      getTenantModels(req.tenant);

    const id = numberOrNull(
      req.params.id
    );

    if (!id) {
      throw new AppError(
        "Financial document id is required",
        400
      );
    }

    const financialDocument =
      await NaacFinancialDocument.findByPk(
        id
      );

    if (!financialDocument) {
      throw new AppError(
        "Financial document not found",
        404
      );
    }

    const body = bodySource(req);

    const files =
      (req.files as MulterFile[]) || [];

    const uploadedFile =
      files.find(
        (file) =>
          file.fieldname === "file_url"
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
          : financialDocument.academic_year_id,

          status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : financialDocument.status,

      doc_type:
        bodyValue(
          body,
          "doc_type",
          "docType"
        ) !== undefined
          ? cleanString(
              bodyValue(
                body,
                "doc_type",
                "docType"
              )
            )
          : financialDocument.doc_type,

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
          : financialDocument.title,

      file_url:
        uploadedFile ? `/uploads/files/${uploadedFile.filename}` : financialDocument.file_url,

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
          : financialDocument.naac_metric_ref,
    };

    await financialDocument.update(
      payload
    );

    return res.status(200).json({
      status: "success",
      message:
        "Financial document updated successfully",
      data: normalizeFileFields(financialDocument, ["file_url"]),
    });

  } catch (error) {
    next(error);
  }
}
