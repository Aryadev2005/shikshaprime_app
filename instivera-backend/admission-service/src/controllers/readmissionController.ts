import { NextFunction } from "express";
import { ReadmissionService } from "../services/readmissionService";
import { rulesService } from "@shared/rules";
import { tenantsService } from "@shared/tenants";

const readmissionService = new ReadmissionService();

export const checkEligibilityForReadmission = async (req, res, next: NextFunction) => {
  try {
    const studentId = Number(req.params.studentId);
    const result = await readmissionService.checkEligibility(studentId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Eligibility checked successfully"
    });
  } catch (error) {
    next(error);
  }
};
export const autoCreatePendingReadmission = async (req, res, next: NextFunction) => {
  try {
    const result = await readmissionService.autoCreatePendingReadmission(req.body, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Pending readmission requests created successfully"
    });
  } catch (error) {
    next(error);
  }
};
export const getReadmissionDetailsForStudent = async (req, res, next: NextFunction) => {
  try {
    const studentId = Number(req.params.studentId);
    const result = await readmissionService.getReadmissionDetails(studentId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Readmission details fetched successfully"
    });
  } catch (error) {
    next(error);
  }
};
export const readmissionConfirmationByStudent = async (req: any, res: any, next: NextFunction) => {
  try {
    const studentId = Number(req.params.studentId);
    const subjects = req.body?.subjects || req.body;
    const user = req.user;
    const result = await readmissionService.confirmReadmissionRequest(studentId, req.tenant, subjects, user);

    return res.status(200).json({
      status: 1,
      data: result, // {message}
      message: "Readmission confirmed successfully"
    });
  } catch (error) {
    next(error);
  }
};
export const getReadmissionRules = async (req, res, next: NextFunction) => {
  try {
    const tenant = await tenantsService.getTenantByName(req.tenant);
    const rules = await rulesService.getReadmissionRules(null, tenant.id);

    return res.status(200).json({
      status: 1,
      data: rules,
      message: "Readmission rules fetched successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getReadmissionRequest = async (req, res, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const readmission = await readmissionService.getReadmissionRequest(page, pageSize, req.tenant);
    return res.status(200).json({
      status: 1,
      data: readmission,
      message: "Readmission rules fetched successfully"
    })
  } catch (error) {
    next(error);
  }
}

export const approveStudentForReadmission = async (req, res, next: NextFunction) => {
  try {
    const readmissionRequestId = req.body;
    const response = await readmissionService.approveReadmissionRequest(readmissionRequestId, req.tenant);
    return res.status(200).json({
      status: 1,
      data: readmissionRequestId,
      message: response.message
    });
  } catch (error) {
    next(error);
  }
}
