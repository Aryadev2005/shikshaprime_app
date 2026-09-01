import { Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { File as MulterFile } from "multer";
import { getTenantModels } from "../models";
import { normalizeFileFields } from "../utils/fileUrl";

/* -------------------- HELPERS -------------------- */

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
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function firstValue(...values: unknown[]): unknown {
  return values.find((v) => v !== undefined && v !== null && v !== "");
}

function bodySource(req: any): Record<string, any> {
  return req.body?.data || req.body?.payload || req.body || {};
}

function bodyValue(body: Record<string, any>, ...keys: string[]) {
  return firstValue(...keys.map((k) => body?.[k]));
}


/* -------------------- CREATE -------------------- */

export async function createAlumni(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacAlumni } = getTenantModels(req.tenant);
    const body = bodySource(req);

    const files = (req.files as MulterFile[]) || [];

    const uploadedPhoto = files.find(f => f.fieldname === "photo_url" || f.fieldname === "photoUrl" || f.fieldname === "photo");
    const uploadedDocument = files.find(f => f.fieldname === "proof_document_url" || f.fieldname === "proof_url" || f.fieldname === "proofUrl" || f.fieldname === "proof");

    const payload = {
      tenant_id: req.tenant_id || 1,

      name: requiredString(bodyValue(body, "name"), "name"),

      graduation_year: numberOrNull(
        bodyValue(body, "graduation_year", "graduationYear")
      ),

      program: cleanString(bodyValue(body, "program")),

      current_designation: cleanString(
        bodyValue(body, "current_designation", "currentDesignation")
      ),

      current_organization: cleanString(
        bodyValue(body, "current_organization", "currentOrganization")
      ),

      notable_achievement: cleanString(
        bodyValue(body, "notable_achievement", "notableAchievement")
      ),

      contribution_to_college: cleanString(
        bodyValue(body, "contribution_to_college", "contributionToCollege")
      ),

      photo_url: uploadedPhoto
        ? `/api/accreditation/uploads/files/${uploadedPhoto.filename}`
        : cleanString(bodyValue(body, "photo_url", "photoUrl", "photo")) || null,

      proof_document_url: uploadedDocument
        ? `/api/accreditation/uploads/files/${uploadedDocument.filename}`
        : cleanString(
            bodyValue(body, "proof_document_url", "proofDocumentUrl", "proof_url", "proofUrl", "proof")
          ) || null,

      status: ((): 'SAVED' | 'FINAL' => {
          const value = cleanString(bodyValue(body, "status"));
          return value === 'FINAL' ? 'FINAL' : 'SAVED';
      })(),

      naac_metric_ref: cleanString(
        bodyValue(body, "naac_metric_ref", "naacMetricRef")
      ),
    };

    const data = await NaacAlumni.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Alumni created successfully",
      data: normalizeFileFields(data, ["photo_url", "proof_document_url"]),
    });

  } catch (error) {
    next(error);
  }
}

/* -------------------- GET -------------------- */

export async function getAlumni(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacAlumni } = getTenantModels(req.tenant);

    const where: any = {};

    const id = numberOrNull(req.query.id);
    if (id) where.id = id;

    

    const graduationYear = numberOrNull(req.query.graduation_year);
    if (graduationYear) where.graduation_year = graduationYear;

    const program = cleanString(req.query.program);
    if (program) where.program = program;

    if (id) {
      const record = await NaacAlumni.findOne({ where });

      if (!record) {
        throw new AppError("Alumni record not found", 404);
      }

      return res.status(200).json({
        status: "success",
        data: normalizeFileFields(record, ["photo_url", "proof_document_url"]),
      });
    }

    const records = await NaacAlumni.findAll({
      where,
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      data: normalizeFileFields(records, ["photo_url", "proof_document_url"]),
    });

  } catch (error) {
    next(error);
  }
}

/* -------------------- UPDATE -------------------- */

export async function updateAlumni(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacAlumni } = getTenantModels(req.tenant);

    const id = numberOrNull(req.params.id);
    if (!id) throw new AppError("Alumni id is required", 400);

    const alumni = await NaacAlumni.findByPk(id);
    if (!alumni) throw new AppError("Alumni record not found", 404);

    const body = bodySource(req);
    const files = (req.files as MulterFile[]) || [];

    const uploadedPhoto = files.find(f => f.fieldname === "photo_url" || f.fieldname === "photoUrl" || f.fieldname === "photo");
    const uploadedDocument = files.find(f => f.fieldname === "proof_document_url" || f.fieldname === "proof_url" || f.fieldname === "proofUrl" || f.fieldname === "proof");

    const payload = {
      tenant_id: req.tenant_id || 1,

      name:
        bodyValue(body, "name") !== undefined
          ? requiredString(bodyValue(body, "name"), "name")
          : alumni.name,

      graduation_year:
        bodyValue(body, "graduation_year", "graduationYear") !== undefined
          ? numberOrNull(
              bodyValue(body, "graduation_year", "graduationYear")
            )
          : alumni.graduation_year,

      program:
        bodyValue(body, "program") !== undefined
          ? cleanString(bodyValue(body, "program"))
          : alumni.program,

      current_designation:
        bodyValue(body, "current_designation", "currentDesignation") !== undefined
          ? cleanString(
              bodyValue(body, "current_designation", "currentDesignation")
            )
          : alumni.current_designation,

      current_organization:
        bodyValue(body, "current_organization", "currentOrganization") !== undefined
          ? cleanString(
              bodyValue(body, "current_organization", "currentOrganization")
            )
          : alumni.current_organization,

      notable_achievement:
        bodyValue(body, "notable_achievement", "notableAchievement") !== undefined
          ? cleanString(
              bodyValue(body, "notable_achievement", "notableAchievement")
            )
          : alumni.notable_achievement,

      contribution_to_college:
        bodyValue(body, "contribution_to_college", "contributionToCollege") !== undefined
          ? cleanString(
              bodyValue(body, "contribution_to_college", "contributionToCollege")
            )
          : alumni.contribution_to_college,

      photo_url: uploadedPhoto
        ? `/api/accreditation/uploads/files/${uploadedPhoto.filename}`
        : bodyValue(body, "photo_url", "photoUrl", "photo") !== undefined
        ? cleanString(bodyValue(body, "photo_url", "photoUrl", "photo"))
        : alumni.photo_url,

      proof_document_url: uploadedDocument
        ? `/api/accreditation/uploads/files/${uploadedDocument.filename}`
        : bodyValue(body, "proof_document_url", "proofDocumentUrl", "proof_url", "proofUrl", "proof") !== undefined
        ? cleanString(
            bodyValue(body, "proof_document_url", "proofDocumentUrl", "proof_url", "proofUrl", "proof")
          )
        : alumni.proof_document_url,

      naac_metric_ref:
        bodyValue(body, "naac_metric_ref", "naacMetricRef") !== undefined
          ? cleanString(
              bodyValue(body, "naac_metric_ref", "naacMetricRef")
            )
          : alumni.naac_metric_ref,

                          status:
        bodyValue(body, "status") !== undefined
          ? ((): 'SAVED' | 'FINAL' => {
              const value = cleanString(bodyValue(body, "status"));
              return value === 'FINAL' ? 'FINAL' : 'SAVED';
            })()
          : alumni.status,
    };

    await alumni.update(payload);

    return res.status(200).json({
      status: "success",
      message: "Alumni updated successfully",
      data: normalizeFileFields(alumni, ["photo_url", "proof_document_url"]),
    });

  } catch (error) {
    next(error);
  }
}
