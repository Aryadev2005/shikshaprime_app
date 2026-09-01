import { Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";
import { QueryTypes } from "sequelize";
import { File as MulterFile } from "multer";
import { normalizeFileFields } from "../utils/fileUrl";

const VALID_STATUS = new Set(["SAVED", "FINAL"]);

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown, fieldName: string): string {
  const cleaned = cleanString(value);
  if (!cleaned) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  return cleaned;
}

function numberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isNaN(numberValue)) {
    return numberValue;
  }

  const numberMatch = String(value).match(/\d+(\.\d+)?/);
  return numberMatch ? Number(numberMatch[0]) : null;
}

function booleanValue(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function statusValue(value: unknown): "SAVED" | "FINAL" {
  const status = cleanString(value)?.toUpperCase() || "SAVED";
  return VALID_STATUS.has(status) ? (status as "SAVED" | "FINAL") : "SAVED";
}

function dateOrNull(value: unknown): string | null {
  return cleanString(value);
}

async function getUploaderId(req: any, body?: Record<string, any>): Promise<number | null> {
  const source = body || bodySource(req);
  const rawUploadedBy = bodyValue(source, "uploaded_by", "uploadedBy");
  const directId = numberOrNull(rawUploadedBy);
  if (directId) {
    return directId;
  }

  const tokenId = numberOrNull(req.user?.id);
  if (tokenId) {
    return tokenId;
  }

  const candidates = [
    cleanString(rawUploadedBy),
    cleanString(req.user?.username),
    cleanString(req.user?.email),
  ].filter((value): value is string => Boolean(value));

  if (candidates.length === 0) {
    return null;
  }

  try {
    const { sequelize } = getTenantModels(req.tenant);
    for (const candidate of candidates) {
      const userByUsernameOrEmail = await sequelize.query<{ id: number }>(
        `SELECT id
         FROM users
         WHERE username = :candidate
            OR email = :candidate
            OR first_name = :candidate
            OR CONCAT_WS(' ', first_name, last_name) = :candidate
         LIMIT 1`,
        {
          replacements: { candidate },
          type: QueryTypes.SELECT,
        }
      );

      if (userByUsernameOrEmail.length > 0) {
        return Number(userByUsernameOrEmail[0].id);
      }
    }
  } catch {
    // If users table is unavailable in this tenant DB, keep nullable behavior.
    return null;
  }

  return null;
}

function firstValue(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function bodySource(req: any): Record<string, any> {
  return req.body?.data || req.body?.payload || req.body || {};
}

function bodyValue(body: Record<string, any>, ...keys: string[]): unknown {
  return firstValue(...keys.map((key) => body?.[key]));
}

function decimalOrNull(value: unknown): string | null {
  const numericValue = numberOrNull(value);
  return numericValue === null ? null : String(numericValue);
}

function uploaderName(body: Record<string, any>, req: any): string | null {
  return (
    cleanString(bodyValue(body, "uploaded_by", "uploadedBy")) ||
    cleanString(req?.body?.uploaded_by) ||
    cleanString(req?.body?.uploadedBy) ||
    null
  );
}

function commonInstitutionPayload(body: any, requireName = true): any {
  const computedName = requireName
    ? (cleanString(body.name) || `Institution ${Date.now()}`)
    : cleanString(body.name) || `Institution ${Date.now()}`;
  return {
    name: computedName,
    short_name: cleanString(body.short_name),
    logo_url: cleanString(body.logo_url),
    address: cleanString(body.address),
    city: cleanString(body.city),
    state: cleanString(body.state),
    pincode: cleanString(body.pincode),
    phone: cleanString(body.phone),
    email: cleanString(body.email),
    website_url: cleanString(body.website_url),
    year_established: numberOrNull(body.year_established),
    university_affiliation: cleanString(body.university_affiliation),
    affiliation_number: cleanString(body.affiliation_number),
    naac_grade: cleanString(body.naac_grade),
    naac_cgpa: decimalOrNull(body.naac_cgpa),
    naac_cycle: numberOrNull(body.naac_cycle),
    naac_last_visit_date: dateOrNull(body.naac_last_visit_date),
    ugc_2f_status: booleanValue(body.ugc_2f_status),
    ugc_12b_status: booleanValue(body.ugc_12b_status),
    vision: cleanString(body.vision),
    mission: cleanString(body.mission),
    history: cleanString(body.history),
    org_chart_path: cleanString(body.org_chart_path),
    status: statusValue(body.status),
  };
}

async function createInstitutionRecord(
  req: any,
  res: Response,
  next: NextFunction,
  message: string,
  requireName = true
) {
  try {
    const { NaacInstitution } = getTenantModels(req.tenant);
    const body = bodySource(req);
    const payload = commonInstitutionPayload(body, requireName);
    payload.org_chart_path = normalizeFileFields(
      { org_chart_path: payload.org_chart_path },
      ["org_chart_path"]
    ).org_chart_path;
    
    const filesArray: MulterFile[] = Array.isArray(req.files) ? req.files : [];
    const orgChartFile = filesArray.find((f: any) => f.fieldname === "org_chart_path");
    
    if (orgChartFile) {
      payload.org_chart_path = `/api/accreditation/uploads/files/${orgChartFile.filename}`;
    } else if (req.file) {
      payload.org_chart_path = `/api/accreditation/uploads/files/${req.file.filename}`;
    }

    let institution = await NaacInstitution.findOne({
      order: [["id", "DESC"]],
    });

    if (institution) {
      await institution.update(payload);
      return res.status(200).json({
        status: "success",
        message: "Institution updated successfully",
        data: normalizeFileFields(institution, ["org_chart_path"]),
      });
    } else {
      institution = await NaacInstitution.create(payload);
      return res.status(201).json({
        status: "success",
        message,
        data: normalizeFileFields(institution, ["org_chart_path"]),
      });
    }
  } catch (error) {
    next(error);
  }
}


async function resolveLatestInstitutionIdForRead(req: any): Promise<number | null> {
  const { NaacInstitution } = getTenantModels(req.tenant);

  const latestInstitution = await NaacInstitution.findOne({
    order: [["id", "DESC"]],
  });

  return latestInstitution ? Number(latestInstitution.id) : null;
}

function noDataFoundResponse(res: Response, data: any = []) {
  return res.status(200).json({
    status: "success",
    message: "No data found",
    data,
  });
}

async function resolveAcademicYearId(req: any, rawAcademicYear: unknown): Promise<number | null> {
  const cleanedAcademicYear = cleanString(rawAcademicYear);
  if (!cleanedAcademicYear) {
    return null;
  }

  const { sequelize } = getTenantModels(req.tenant);
  const numericAcademicYearId = Number(cleanedAcademicYear);
  let resolvedId: number | null = null;

  if (!Number.isNaN(numericAcademicYearId)) {
    const academicYearById = await sequelize.query<{ id: number }>(
      `SELECT id FROM academic_years WHERE id = :id LIMIT 1`,
      {
        replacements: { id: numericAcademicYearId },
        type: QueryTypes.SELECT,
      }
    );

    if (academicYearById.length > 0) {
      resolvedId = Number(academicYearById[0].id);
    }
  }

  if (resolvedId === null) {
    const academicYearByName = await sequelize.query<{ id: number }>(
      `SELECT id FROM academic_years WHERE name = :name LIMIT 1`,
      {
        replacements: { name: cleanedAcademicYear },
        type: QueryTypes.SELECT,
      }
    );

    if (academicYearByName.length > 0) {
      resolvedId = Number(academicYearByName[0].id);
    }
  }

  if (resolvedId === null) {
    // Fallback: Use the active academic year if the provided one is invalid
    const activeYear = await sequelize.query<{ id: number }>(
      `SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`,
      { type: QueryTypes.SELECT }
    );
    if (activeYear.length > 0) {
      resolvedId = Number(activeYear[0].id);
    }
  }

  if (resolvedId !== null) {
    try {
      await sequelize.query(
        `INSERT IGNORE INTO naac_academic_years (id, year_label, start_date, end_date, is_current, created_at) SELECT id, name, start_date, end_date, is_active, created_at FROM academic_years WHERE id = :id`,
        { replacements: { id: resolvedId } }
      );
    } catch (e) {
      // Ignore fallback error
    }
  }

  return resolvedId;
}

export async function createVisionMission(req: any, res: Response, next: NextFunction) {
  return createInstitutionRecord(req, res, next, "Vision & Mission inserted successfully", false);
}

export async function createInstitutionalHistory(req: any, res: Response, next: NextFunction) {
  return createInstitutionRecord(req, res, next, "Institutional History inserted successfully", false);
}

export async function createInstitution(req: any, res: Response, next: NextFunction) {
  return createInstitutionRecord(req, res, next, "Institution inserted successfully", false);
}

export async function updateInstitution(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacInstitution } = getTenantModels(req.tenant);
    const body = bodySource(req);
    const payload = commonInstitutionPayload(body, false);
    payload.org_chart_path = normalizeFileFields(
      { org_chart_path: payload.org_chart_path },
      ["org_chart_path"]
    ).org_chart_path;
    
    const filesArray: MulterFile[] = Array.isArray(req.files) ? req.files : [];
    const orgChartFile = filesArray.find((f: any) => f.fieldname === "org_chart_path");
    
    if (orgChartFile) {
      payload.org_chart_path = `/api/accreditation/uploads/files/${orgChartFile.filename}`;
    } else if (req.file) {
      payload.org_chart_path = `/api/accreditation/uploads/files/${req.file.filename}`;
    }

    const id = numberOrNull(req.params.id || req.body.id);
    let institution = null;
    if (id) {
      institution = await NaacInstitution.findByPk(id);
    }
    if (!institution) {
      institution = await NaacInstitution.findOne({
        order: [["id", "DESC"]],
      });
    }

    if (institution) {
      await institution.update(payload);
      return res.status(200).json({
        status: "success",
        message: "Institution updated successfully",
        data: normalizeFileFields(institution, ["org_chart_path"]),
      });
    } else {
      institution = await NaacInstitution.create(payload);
      return res.status(201).json({
        status: "success",
        message: "Institution created successfully",
        data: normalizeFileFields(institution, ["org_chart_path"]),
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function createGoverningBody(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacGoverningBody } = getTenantModels(req.tenant);
    const body = bodySource(req);

    // Always resolve institution_id — frontend does not need to send it
    

    // upload.any() populates req.files[], not req.file — pick by field name
    const filesArray: MulterFile[] = Array.isArray(req.files) ? req.files : [];
    const photoFile = filesArray.find((f) => f.fieldname === "photo_url" || f.fieldname === "photo");

    const payload: any = {
      tenant_id: req.tenant_id || 1,
      academic_year_id: await resolveAcademicYearId(
        req,
        bodyValue(body, "academic_year_id", "academicYearId", "academic_year")
      ),
      member_name: requiredString(
        bodyValue(body, "member_name", "memberName", "name", "full_name", "fullName"),
        "member_name"
      ),
      designation: requiredString(bodyValue(body, "designation", "role"), "designation"),
      category: cleanString(bodyValue(body, "category", "member_category", "memberCategory")),
      appointment_date: dateOrNull(bodyValue(body, "appointment_date", "appointmentDate")),
      tenure_end_date: dateOrNull(bodyValue(body, "tenure_end_date", "tenureEndDate")),
      qualification: cleanString(bodyValue(body, "qualification")),
      status: statusValue(bodyValue(body, "status")),
      // Use the matched file from req.files, fall back to any single req.file, then to body string
      photo_url: photoFile
        ? `/api/accreditation/uploads/files/${photoFile.filename}`
        : req.file
          ? `/api/accreditation/uploads/files/${req.file.filename}`
          : cleanString(bodyValue(body, "photo_url", "photoUrl")),
      sort_order: numberOrNull(bodyValue(body, "sort_order", "sortOrder")) || 0,
    };

    payload.photo_url = normalizeFileFields(
      { photo_url: payload.photo_url },
      ["photo_url"]
    ).photo_url;

    // findOne by institution_id (always resolved above)
    const existingData = await NaacGoverningBody.findOne({
      where: { tenant_id: req.tenant_id || 1,},
    });

    if (existingData) {
      await existingData.update(payload);
      return res.status(200).json({
        status: "success",
        message: "Governing Body updated successfully",
        data: normalizeFileFields(existingData, ["photo_url"]),
      });
    } else {
      const created = await NaacGoverningBody.create(payload);
      return res.status(201).json({
        status: "success",
        message: "Governing Body inserted successfully",
        data: normalizeFileFields(created, ["photo_url"]),
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function createCommittee(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacCommittee } = getTenantModels(req.tenant);

    // Always resolve institution_id — frontend does not need to send it
    

    // upload.any() populates req.files[], not req.file — pick by field name
    const filesArray: MulterFile[] = Array.isArray(req.files) ? req.files : [];
    const docFile = filesArray.find((f) => f.fieldname === "document_path" || f.fieldname === "document");

    const payload: any = {
      tenant_id: req.tenant_id || 1,
      academic_year_id: await resolveAcademicYearId(req, numberOrNull(req.body.academic_year_id)),
      committee_name: requiredString(req.body.committee_name, "committee_name"),
      committee_type: cleanString(req.body.committee_type) || "OTHER",
      description: cleanString(req.body.description),
      order_no: cleanString(req.body.order_no),
      order_date: dateOrNull(req.body.order_date),
      tenure_start_date: dateOrNull(req.body.tenure_start_date),
      tenure_end_date: dateOrNull(req.body.tenure_end_date),
      // Use matched file from req.files, fall back to req.file, then to existing body string
      document_path: docFile
        ? `/uploads/files/${docFile.filename}`
        : req.file
          ? `/uploads/files/${req.file.filename}`
          : cleanString(req.body.document_path),
      status: statusValue(req.body.status),
      is_deleted: booleanValue(req.body.is_deleted),
    };

    // findOne by institution_id (always resolved above)
    const existingData = await NaacCommittee.findOne({
      where: { tenant_id: req.tenant_id || 1,},
    });

    if (existingData) {
      await existingData.update(payload);
      return res.status(200).json({
        status: "success",
        message: "Committee updated successfully",
        data: existingData,
      });
    } else {
      const created = await NaacCommittee.create(payload);
      return res.status(201).json({
        status: "success",
        message: "Committee inserted successfully",
        data: created,
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function createAccreditation(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacAccreditation } = getTenantModels(req.tenant);
    const body = bodySource(req);

    // Always resolve institution_id — frontend does not need to send it
    

    // upload.any() populates req.files[], not req.file — pick by field name
    const filesArray: MulterFile[] = Array.isArray(req.files) ? req.files : [];
    const evidenceFile = filesArray.find((f) => f.fieldname === "evidence_document_path" || f.fieldname === "evidence_file" || f.fieldname === "evidence");

    const payload: any = {
      tenant_id: req.tenant_id || 1,
      academic_year_id: await resolveAcademicYearId(req, bodyValue(body, "academic_year_id")),
      accreditation_type: cleanString(bodyValue(body, "accreditation_type")) || "OTHER",
      authority_name: requiredString(bodyValue(body, "authority_name"), "authority_name"),
      affiliation_number: cleanString(bodyValue(body, "affiliation_number")),
      naac_grade: cleanString(bodyValue(body, "naac_grade")),
      naac_cgpa: decimalOrNull(bodyValue(body, "naac_cgpa")),
      nirf_rank: numberOrNull(bodyValue(body, "nirf_rank")),
      nirf_year: numberOrNull(bodyValue(body, "nirf_year")),
      approval_status: cleanString(bodyValue(body, "approval_status")),
      valid_from: dateOrNull(bodyValue(body, "valid_from")),
      valid_to: dateOrNull(bodyValue(body, "valid_to")),
      remarks: cleanString(bodyValue(body, "remarks")),
      // Use matched file from req.files, fall back to req.file, then to existing body string
      evidence_document_path: evidenceFile
        ? `/uploads/files/${evidenceFile.filename}`
        : req.file
          ? `/uploads/files/${req.file.filename}`
          : cleanString(bodyValue(body, "evidence_document_path")),
      status: statusValue(bodyValue(body, "status")),
      is_deleted: booleanValue(bodyValue(body, "is_deleted")),
    };

    // findOne by institution_id (always resolved above)
    const existingData = await NaacAccreditation.findOne({
      where: { tenant_id: req.tenant_id || 1,},
    });

    if (existingData) {
      await existingData.update(payload);
      return res.status(200).json({
        status: "success",
        message: "Affiliation & Recognition updated successfully",
        data: existingData,
      });
    } else {
      const created = await NaacAccreditation.create(payload);
      return res.status(201).json({
        status: "success",
        message: "Affiliation & Recognition inserted successfully",
        data: created,
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacDocument } = getTenantModels(req.tenant);
    const body = bodySource(req);
    
    const documents = Array.isArray(body.documents) ? body.documents : null;

    if (documents && documents.length > 0) {
      const createdDocuments = await Promise.all(
        documents.map(async (documentItem: any) => {
          const filePath =
            cleanString(documentItem.file_path) ||
            cleanString(documentItem.file_url) ||
            cleanString(documentItem.path) ||
            cleanString(body.file_path);

          if (!filePath) {
            throw new AppError("file_path is required for each document", 400);
          }

          const payload: any = {
            tenant_id: req.tenant_id || 1,
            academic_year_id: await resolveAcademicYearId(req, body.academic_year_id),
            title: requiredString(documentItem.title || body.title, "title"),
            description: cleanString(documentItem.description || body.description),
            doc_type: cleanString(documentItem.doc_type || body.doc_type) || "OTHER",
            file_path: filePath,
            file_size_kb: numberOrNull(documentItem.file_size_kb || body.file_size_kb),
            file_format: cleanString(documentItem.file_format || body.file_format),
            is_public: booleanValue(body.is_public, true),
            uploaded_by: uploaderName(body, req),
            status: statusValue(body.status),
            is_deleted: booleanValue(body.is_deleted),
          };

          return NaacDocument.create(payload);
        })
      );

      return res.status(201).json({
        status: "success",
        message: "Annual Reports inserted successfully",
        data: createdDocuments,
      });
    }

    const payload: any = {
      tenant_id: req.tenant_id || 1,
      academic_year_id: await resolveAcademicYearId(req, body.academic_year_id),
      title: requiredString(body.title, "title"),
      description: cleanString(body.description),
      doc_type: cleanString(body.doc_type) || "OTHER",
      file_path: req.file ? `/uploads/files/${req.file.filename}` : requiredString(body.file_path, "file_path"),
      file_size_kb: numberOrNull(body.file_size_kb),
      file_format: cleanString(body.file_format),
      is_public: booleanValue(body.is_public, true),
      uploaded_by: uploaderName(body, req),
      status: statusValue(body.status),
      is_deleted: booleanValue(body.is_deleted),
    };

    const document = await NaacDocument.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Annual Report inserted successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
}

export async function upsertNaacDocumentTitle(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacDocument } = getTenantModels(req.tenant);

    /**
     * Institution Code
     */
    


    /**
     * Title
     */
    const documentTitle = requiredString(
      req.body.title,
      "title"
    );

    /**
     * Uploaded File Handling
     */
    let filePath: string | null = null;

    if (req.file) {
      filePath = `/uploads/files/${req.file.filename}`;
    } else if (
      cleanString(req.body.file_path)
    ) {
      filePath = cleanString(
        req.body.file_path
      );
    }

    /**
     * Check Existing Document
     */
    const existingDoc =
      await NaacDocument.findOne({
        where: { tenant_id: req.tenant_id || 1,
          title: documentTitle,
          is_deleted: false,
        },
      });

    /**
     * CASE 1: UPDATE
     */
    if (existingDoc) {
      let isUpdated = false;

      /**
       * Description
       */
      if (
        req.body.description !==
        undefined
      ) {
        existingDoc.description =
          cleanString(
            req.body.description
          );

        isUpdated = true;
      }

      /**
       * File Path
       */
      if (filePath) {
        existingDoc.file_path =
          filePath;

        isUpdated = true;
      }

      /**
       * Doc Type
       */
      if (
        req.body.doc_type !==
        undefined
      ) {
        existingDoc.doc_type =
          cleanString(
            req.body.doc_type
          ) || "OTHER";

        isUpdated = true;
      }

      /**
       * Status
       */
      if (
        req.body.status !==
        undefined
      ) {
        existingDoc.status =
          statusValue(
            req.body.status
          );

        isUpdated = true;
      }

      /**
       * File Metadata
       */
      if (req.file?.size) {
        existingDoc.file_size_kb =
          Math.ceil(
            req.file.size / 1024
          );

        isUpdated = true;
      }

      if (req.file?.mimetype) {
        existingDoc.file_format =
          req.file.mimetype;

        isUpdated = true;
      }

      /**
       * Save Changes
       */
      if (isUpdated) {
        existingDoc.updated_at =
          new Date();

        await existingDoc.save();
      }

      return res.status(200).json({
        status: "success",
        message:
          isUpdated
            ? "Document updated successfully"
            : "No changes detected",
        data: existingDoc,
      });
    }

    /**
     * CASE 2: CREATE
     */

    if (!filePath) {
      throw new AppError(
        "file_path is required",
        400
      );
    }

    const payload: any = {
      tenant_id: req.tenant_id || 1,

      academic_year_id:
        await resolveAcademicYearId(
          req,
          req.body
            .academic_year_id
        ),

      title: documentTitle,

      description: cleanString(
        req.body.description
      ),

      doc_type:
        cleanString(
          req.body.doc_type
        ) || "OTHER",

      file_path: filePath,

      file_size_kb:
        req.file?.size
          ? Math.ceil(
              req.file.size /
                1024
            )
          : numberOrNull(
              req.body
                .file_size_kb
            ),

      file_format:
        req.file?.mimetype ||
        cleanString(
          req.body.file_format
        ),

      is_public:
        booleanValue(
          req.body.is_public,
          true
        ),

      uploaded_by:
        uploaderName(
          req.body || {},
          req
        ),

      status: statusValue(
        req.body.status
      ),

      is_deleted: false,
    };

    const document =
      await NaacDocument.create(
        payload
      );

    return res.status(201).json({
      status: "success",
      message:
        "Document inserted successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET HANDLERS ────────────────────────────────────────────────────────────

export async function getInstitution(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacInstitution } = getTenantModels(req.tenant);
    const code = cleanString(req.query.institution_id);

    if (code) {
      const record = await NaacInstitution.findOne({ where: { short_name: code } });
      if (!record) return noDataFoundResponse(res);
      return res.status(200).json({ status: "success", data: normalizeFileFields(record, ["org_chart_path"]) });
    }

    const records = await NaacInstitution.findAll({ order: [["id", "DESC"]] });
    if (!records.length) return noDataFoundResponse(res);
    return res.status(200).json({ status: "success", data: normalizeFileFields(records, ["org_chart_path"]) });
  } catch (error) {
    next(error);
  }
}

export async function getVisionMission(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacInstitution } = getTenantModels(req.tenant);
    let institutionId = numberOrNull(req.query.institution_id);
    if (!institutionId) {
      institutionId = await resolveLatestInstitutionIdForRead(req);
    }

    if (!institutionId) {
      return noDataFoundResponse(res);
    }

    const record = await NaacInstitution.findOne({
      where: { id: institutionId },
      attributes: [
        "id",
        "name",
        "short_name",
        "logo_url",
        "address",
        "city",
        "state",
        "pincode",
        "phone",
        "email",
        "website_url",
        "year_established",
        "university_affiliation",
        "affiliation_number",
        "naac_grade",
        "naac_cgpa",
        "naac_cycle",
        "naac_last_visit_date",
        "ugc_2f_status",
        "ugc_12b_status",
        "vision",
        "mission",
        "history",
        "org_chart_path",
        "status",
        "updated_at"
      ]
    });
    if (!record) return noDataFoundResponse(res);
    // Return as array so frontend data[0] access is always safe
    return res.status(200).json({ status: "success", data: record ? normalizeFileFields([record], ["org_chart_path"]) : [] });
  } catch (error) {
    next(error);
  }
}

export async function getInstitutionalHistory(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacInstitution } = getTenantModels(req.tenant);
    let institutionId = numberOrNull(req.query.institution_id);
    if (!institutionId) {
      institutionId = await resolveLatestInstitutionIdForRead(req);
    }

    if (!institutionId) {
      return noDataFoundResponse(res);
    }

    const record = await NaacInstitution.findOne({
      where: { id: institutionId },
      attributes: [
        "name",
        "short_name",
        "logo_url",
        "address",
        "city",
        "state",
        "pincode",
        "phone",
        "email",
        "website_url",
        "year_established",
        "university_affiliation",
        "affiliation_number",
        "naac_grade",
        "naac_cgpa",
        "naac_cycle",
        "naac_last_visit_date",
        "ugc_2f_status",
        "ugc_12b_status",
        "vision",
        "mission",
        "history",
        "org_chart_path",
      ]
    });
    if (!record) return noDataFoundResponse(res);
    // Return as array so frontend data[0] access is always safe
    return res.status(200).json({ status: "success", data: record ? normalizeFileFields([record], ["org_chart_path"]) : [] });
  } catch (error) {
    next(error);
  }
}


export async function getGoverningBody(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacGoverningBody } = getTenantModels(req.tenant);
    let institutionId = numberOrNull(req.query.institution_id);
    if (!institutionId) {
      institutionId = await resolveLatestInstitutionIdForRead(req);
    }

    if (!institutionId) {
      return noDataFoundResponse(res);
    }

    const where: any = { tenant_id: req.tenant_id || 1,};
    if (req.query.academic_year_id) where.academic_year_id = numberOrNull(req.query.academic_year_id);

    const record = await NaacGoverningBody.findOne({ where, order: [["sort_order", "ASC"]] });
    if (!record) return noDataFoundResponse(res);
    // Return as array so frontend data[0] access is always safe
    return res.status(200).json({ status: "success", data: record ? normalizeFileFields([record], ["photo_url"]) : [] });
  } catch (error) {
    next(error);
  }
}

export async function getCommittees(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacCommittee } = getTenantModels(req.tenant);
    let institutionId = numberOrNull(req.query.institution_id);
    if (!institutionId) {
      institutionId = await resolveLatestInstitutionIdForRead(req);
    }

    if (!institutionId) {
      return noDataFoundResponse(res);
    }

    const where: any = { tenant_id: req.tenant_id || 1, is_deleted: false };
    if (req.query.academic_year_id) where.academic_year_id = numberOrNull(req.query.academic_year_id);
    if (req.query.committee_type) where.committee_type = cleanString(req.query.committee_type);

    const record = await NaacCommittee.findOne({ where, order: [["created_at", "DESC"]] });
    if (!record) return noDataFoundResponse(res);
    // Return as array so frontend data[0] access is always safe
    return res.status(200).json({ status: "success", data: record ? [record] : [] });
  } catch (error) {
    next(error);
  }
}

export async function getAccreditations(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacAccreditation } = getTenantModels(req.tenant);
    let institutionId = numberOrNull(req.query.institution_id);
    if (!institutionId) {
      institutionId = await resolveLatestInstitutionIdForRead(req);
    }

    if (!institutionId) {
      return noDataFoundResponse(res);
    }

    const where: any = { tenant_id: req.tenant_id || 1, is_deleted: false };
    if (req.query.academic_year_id) where.academic_year_id = numberOrNull(req.query.academic_year_id);
    if (req.query.accreditation_type) where.accreditation_type = cleanString(req.query.accreditation_type);

    const record = await NaacAccreditation.findOne({ where, order: [["created_at", "DESC"]] });
    if (!record) return noDataFoundResponse(res);
    // Return as array so frontend data[0] access is always safe
    return res.status(200).json({ status: "success", data: record ? [record] : [] });
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacDocument } = getTenantModels(req.tenant);
    
    const title = cleanString(req.query.title);

    const where: any = { tenant_id: req.tenant_id || 1, is_deleted: false };
    if (title) where.title = title;
    if (req.query.academic_year_id) where.academic_year_id = numberOrNull(req.query.academic_year_id);
    if (req.query.doc_type) where.doc_type = cleanString(req.query.doc_type);

    const records = await NaacDocument.findAll({ where, order: [["created_at", "DESC"]] });
    if (!records.length) return noDataFoundResponse(res);
    return res.status(200).json({ status: "success", data: records });
  } catch (error) {
    next(error);
  }
}


export async function getDocumentByTitleandinstitutionCode(req: any, res: Response, next: NextFunction) {
  try {
    const { NaacDocument } = getTenantModels(req.tenant);
    
    const title = cleanString(req.query.title);

    if (!title) throw new AppError("title query param is required", 400);

    const record = await NaacDocument.findOne({
      where: {
        tenant_id: req.tenant_id || 1,
        title: title,
        is_deleted: false
      },
      order: [["created_at", "DESC"]]
    });

    if (!record) {
      return noDataFoundResponse(res, null);
    }

    return res.status(200).json({ status: "success", data: record });
  } catch (error) {
    next(error);
  }
}

