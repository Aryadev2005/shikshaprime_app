import { Request, Response } from "express";
import { getTenantModels } from "../models";
import { normalizeFileFields } from "../utils/fileUrl";

const getEnrichedPayload = (req: any) => {
  const payload = { ...req.body };
  if (req?.params?.id && !payload.id) {
    payload.id = req.params.id;
  }
  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === 'null' || payload[key] === 'undefined') {
      payload[key] = null;
    }
  });
  if (req?.tenant_id && !payload.tenant_id) {
    payload.tenant_id = req.tenant_id;
  }
  if (req?.params?.id) {
    payload.id = req.params.id;
  }
  return payload;
};

const upsertSingletonRecord = async (model: any, payload: any) => {
  if (payload.id && payload.id !== "undefined" && payload.id !== "null") {
    const existing = await model.findByPk(payload.id);
    if (existing) {
      await existing.update(payload);
      return existing;
    }
  }
  const existing = await model.findOne();

  if (existing) {
    await existing.update(payload);
    return existing;
  }

  return model.create(payload);
};

//upsert infrastructure items data 2
const handleUpsert = async (model: any, payload: any) => {
  // 1. If an ID is provided, update that specific record
  if (payload.id && payload.id !== "undefined" && payload.id !== "null") {
    const existing = await model.findByPk(payload.id);
    if (existing) {
      await existing.update(payload);
      return existing;
    }
  }

  // 2. Check by Name + Institution to prevent duplicate names but allow multiple hostels
  if (payload.institution_id && (payload.hostel_name || payload.item_name)) {
    const nameField = payload.hostel_name ? 'hostel_name' : 'item_name';
    const existing = await model.findOne({
      where: {
        institution_id: payload.institution_id,
        [nameField]: payload[nameField]
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

// ─── INFRASTRUCTURE ITEMS ───────────────────────────────────────────────────

export const createNaacInfrastructureItems = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacInfrastructureItem } = getTenantModels((req as any).tenant);
    const payload = getEnrichedPayload(req);

    // Handle photo_url (binary)
    const files = (req as any).files as any[];
    if (files && files.length > 0) {
      const photoFile = files.find(f => f.fieldname === 'photo_url');
      if (photoFile) {
        payload.photo_url = `/api/accreditation/uploads/files/${photoFile.filename}`;
      }
    }

    const data = await handleUpsert(NaacInfrastructureItem, payload);
    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: normalizeFileFields(data, ["photo_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNaacInfrastructureItems = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacInfrastructureItem } = getTenantModels((req as any).tenant);
    const data = await NaacInfrastructureItem.findAll();
    return res.status(200).json({
      success: true,
      data: normalizeFileFields(data, ["photo_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── LIBRARY RESOURCES ─────────────────────────────────────────────────────

export const createNaacLibraryResources = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacLibraryResource } = getTenantModels((req as any).tenant);
    const payload = getEnrichedPayload(req);
    const data = await upsertSingletonRecord(NaacLibraryResource, payload);
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

export const getNaacLibraryResources = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacLibraryResource } = getTenantModels((req as any).tenant);
    const data = await NaacLibraryResource.findAll();
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

// ─── IT INFRASTRUCTURE ─────────────────────────────────────────────────────

export const createNaacItInfrastructure = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { NaacItInfrastructure } = getTenantModels(
      (req as any).tenant
    );
    const payload = getEnrichedPayload(req);

    const data = await upsertSingletonRecord(
      NaacItInfrastructure,
      payload
    );

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
export const getNaacItInfrastructure = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacItInfrastructure } = getTenantModels((req as any).tenant);
    const data = await NaacItInfrastructure.findAll();
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

// ─── HOSTEL ───────────────────────────────────────────────────────────────

export const createNaacHostel = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacHostel } = getTenantModels((req as any).tenant);
    const payload = getEnrichedPayload(req);

    // Handle photo_url (binary)
    const files = (req as any).files as any[];
    if (files && files.length > 0) {
      const photoFile = files.find(f => f.fieldname === 'photo_url');
      if (photoFile) {
        payload.photo_url = `/api/accreditation/uploads/files/${photoFile.filename}`;
      }
    }

    const data = await handleUpsert(NaacHostel, payload);
    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      data: normalizeFileFields(data, ["photo_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNaacHostel = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { NaacHostel } = getTenantModels((req as any).tenant);
    const data = await NaacHostel.findAll();
    return res.status(200).json({
      success: true,
      data: normalizeFileFields(data, ["photo_url"]),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
