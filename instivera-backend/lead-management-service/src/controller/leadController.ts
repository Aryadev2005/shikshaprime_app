import { NextFunction } from "express";
import { LeadService } from "../service/leadService";
const XLSX = require("xlsx");
const leadService = new LeadService();
export const createPublicLead = async (req, res, next: NextFunction) => {
  try {
    const lead = await leadService.createLeadFromWebsite(req.tenant, req.body);
    return res.status(201).json({
      status: 1,
      data: lead,
      message: "Lead created successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const createLead = async (req, res, next: NextFunction) => {
  try {
    const lead = await leadService.createLead(req.tenant, req.body);
    return res.status(201).json({
      status: 1,
      data: lead,
      message: "Lead created successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const updateLead = async (req, res, next: NextFunction) => {
  const leadId = Number(req.params.id);
    if (!leadId) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }
  try {
    const lead = await leadService.updateLead(req.tenant, leadId, req.body);
    return res.status(201).json({
      status: 1,
      data: lead,
      message: "Lead updated successfully"
    });

  } catch (error) {
    next(error);
  }
};

export const getLeadList = async (req, res, next: NextFunction) => {
  try {
    const result = await leadService.getLeadList(req.tenant, req.query);
    return res.status(200).json({
      status: 1,
      data: result,
      message: "Leads fetched successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const getLeadDetails = async (req, res, next: NextFunction) => {
  try {
    const leadId = Number(req.params.id);
    if (!leadId) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }

    const result = await leadService.getLeadDetails(req.tenant, leadId);
    return res.status(200).json({
      status: 1,
      data: result,
      message: "Lead details fetched successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const addFollowup = async (req, res, next: NextFunction) => {
  try {
    const leadId = Number(req.params.id);
    if (!leadId) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }

    const followup = await leadService.addFollowup(req.tenant, leadId, req.body);
    return res.status(200).json({
      status: 1,
      data: followup,
      message: "Follow-up added successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const addCommunication = async (req, res, next: NextFunction) => {
  try {
    const leadId = Number(req.params.id);
    if (!leadId) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }

    const communication = await leadService.addCommunication(req.tenant, leadId, req.body);
    return res.status(200).json({
      status: 1,
      data: communication,
      message: "Communication logged successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const assignLead = async (req, res, next: NextFunction) => {
  try {
    const leadId = Number(req.params.id);
    if (!leadId) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }

    const result = await leadService.assignLead(req.tenant, leadId, req.body);
    return res.status(200).json({
      status: 1,
      data: result,
      message: "Lead assigned successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const getCounselorList = async (req, res, next: NextFunction) => {
  try {

    const result = await leadService.getCounselorList(req.tenant);
    return res.status(200).json({
      status: 1,
      data: result,
      message: "Counselors fetched successfully"
    });

  } catch (error) {
    next(error);
  }
};
export async function getEligibleCounsellors(req, res, next: NextFunction) {
  try {
    const leadId = req.params.id;

    const counsellors = await leadService.getEligibleCounsellors(req.tenant, leadId);

    return res.status(200).json({
      status: 1,
      data: counsellors,
      message: "Counselors fetched successfully"
    });
  } catch (err: any) {
    next(err);
  }
}
export const convertLead = async (req, res, next: NextFunction) => {
  try {
    const leadId = Number(req.params.id);
    if (!leadId) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }

    const result = await leadService.convertLead(req.tenant, leadId, req.body);
    return res.status(200).json({
      status: 1,
      data: result,
      message: "Lead converted successfully"
    });
  } catch (error) {
    next(error);
  }
};
export async function bulkLeadUpload(req, res, next: NextFunction) {
  try {
    const summary = await leadService.processLeadBulkUpload(req.tenant, req.body);

    return res.status(200).json({
      status: 1,
      data: summary,
      message: "Leads uploaded successfully"
    });
  } catch (err: any) {
    next(err);
  }
}
export async function qualifyLead(req, res, next: NextFunction) {
  try {
    const leadId = Number(req.params.id);
    const payload = req.body;

    const result = await leadService.qualifyLead(req.tenant, leadId, payload);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Lead qualified successfully"
    });
  } catch (err: any) {
    next(err);
  }
}
export async function leadNurture(req, res, next: NextFunction) {
  try {
    const leadId = Number(req.params.id);
    const payload = req.body;

    const result = await leadService.leadNurture(req.tenant, leadId, payload);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Nurturing message sent successfully"
    });
  } catch (err: any) {
    next(err);
  }
}
export async function campusVisit(req, res, next: NextFunction) {
  try {
    const leadId = Number(req.params.id);
    const payload = req.body;

    const result = await leadService.campusVisit(req.tenant, leadId, payload);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Campus visit scheduled successfully"
    });
  } catch (err: any) {
    next(err);
  }
}