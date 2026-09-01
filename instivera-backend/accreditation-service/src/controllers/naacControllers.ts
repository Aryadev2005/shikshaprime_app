import { Request, Response } from "express";
import { getTenantModels } from "../models";
import { normalizeFileFields } from "../utils/fileUrl";

const handleUpsert = async (model: any, payload: any, req?: any) => {
  if (req?.params?.id && !payload.id) {
    payload.id = req.params.id;
  }
  if (req?.tenant_id && !payload.tenant_id) {
    payload.tenant_id = req.tenant_id;
  }

  // Sanitize payload: strip out properties not defined in model attributes (e.g. status if not in DB table)
  if (model?.rawAttributes) {
    const validKeys = Object.keys(model.rawAttributes);
    Object.keys(payload).forEach((key) => {
      if (!validKeys.includes(key) && key !== "id") {
        delete payload[key];
      }
    });
  }

  // 1. If an ID is provided, update that specific record
  if (payload.id && payload.id !== "undefined" && payload.id !== "null") {
    const existing = await model.findByPk(payload.id);
    if (existing) {
      await existing.update(payload);
      return existing;
    }
  }

  // 2. Check by Business Key + Tenant/Institution
  const businessKey = payload.employee_code ? "employee_code" 
                    : payload.title ? "title" 
                    : payload.award_title ? "award_title" 
                    : payload.project_title ? "project_title"
                    : payload.patent_title ? "patent_title"
                    : payload.scholar_name ? "scholar_name"
                    : null;

  const scopeId = payload.tenant_id || payload.institution_id;
  const scopeColumn = payload.tenant_id ? "tenant_id" : (payload.institution_id ? "institution_id" : null);

  if (scopeColumn && scopeId && businessKey && payload[businessKey]) {
    const existing = await model.findOne({
      where: {
        [scopeColumn]: scopeId,
        [businessKey]: payload[businessKey]
      }
    });
    if (existing) {
      await existing.update(payload);
      return existing;
    }
  }

  // 3. Otherwise, create a new record
  return model.create(payload);
};

/**
 * Common helper to extract files from request and update payload
 */
const processFiles = (req: Request, payload: any) => {
  if (payload.photo_url && typeof payload.photo_url === 'string') {
    payload.photo_url = normalizeFileFields(
      { photo_url: payload.photo_url },
      ["photo_url"]
    ).photo_url;
  }
  if (payload.proof_url && typeof payload.proof_url === 'string') {
    payload.proof_url = normalizeFileFields(
      { proof_url: payload.proof_url },
      ["proof_url"]
    ).proof_url;
  }
  const files = (req as any).files as any[];
  if (files && files.length > 0) {
    // Handle photo_url
    const photoFile = files.find(f => f.fieldname === 'photo_url' || f.fieldname === 'photo');
    if (photoFile) {
      payload.photo_url = `/api/accreditation/uploads/files/${photoFile.filename}`;
    }

    // Handle proof_url
    const proofFile = files.find(f => f.fieldname === 'proof_url' || f.fieldname === 'proof');
    if (proofFile) {
      payload.proof_url = `/api/accreditation/uploads/files/${proofFile.filename}`;
    }
  }
};

export const createNaacFaculty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacFaculty } = getTenantModels((req as any).tenant);
    const payload = { ...req.body };
    processFiles(req, payload);

    const data = await handleUpsert(NaacFaculty, payload, req);
    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNaacFaculty = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacFaculty } = getTenantModels((_req as any).tenant);
    const data = await NaacFaculty.findAll();
    return res.status(200).json({
      success: true,
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createNaacPublications = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacPublications } = getTenantModels((req as any).tenant);
    const payload = { ...req.body };
    processFiles(req, payload);

    const data = await handleUpsert(NaacPublications, payload, req);
    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNaacPublications = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacPublications } = getTenantModels((_req as any).tenant);
    const data = await NaacPublications.findAll();
    return res.status(200).json({
      success: true,
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createNaacFacultyAwards = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacFacultyAwards } = getTenantModels((req as any).tenant);
    const payload = { ...req.body };
    processFiles(req, payload);

    const data = await handleUpsert(NaacFacultyAwards, payload, req);
    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNaacFacultyAwards = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacFacultyAwards } = getTenantModels((_req as any).tenant);
    const data = await NaacFacultyAwards.findAll();
    return res.status(200).json({
      success: true,
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createNaacPhdScholars = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacPhdScholars } = getTenantModels((req as any).tenant);
    const payload = { ...req.body };
    processFiles(req, payload);

    const data = await handleUpsert(NaacPhdScholars, payload, req);
    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNaacPhdScholars = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacPhdScholars } = getTenantModels((_req as any).tenant);
    const data = await NaacPhdScholars.findAll();
    return res.status(200).json({
      success: true,
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createNaacResearchProjects = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacResearchProjects } = getTenantModels((req as any).tenant);
    const payload = { ...req.body };
    processFiles(req, payload);

    const data = await handleUpsert(NaacResearchProjects, payload, req);
    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNaacResearchProjects = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacResearchProjects } = getTenantModels((_req as any).tenant);
    const data = await NaacResearchProjects.findAll();
    return res.status(200).json({
      success: true,
      data: normalizeFileFields(data, ["photo_url", "proof_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createNaacPatents = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacPatents } = getTenantModels((req as any).tenant);
    const payload = { ...req.body };
    processFiles(req, payload);

    const data = await handleUpsert(NaacPatents, payload, req);
    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNaacPatents = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacPatents } = getTenantModels((_req as any).tenant);
    const data = await NaacPatents.findAll();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
