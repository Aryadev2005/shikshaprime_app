import { NextFunction, Response } from "express";
import { ApplicationService } from "../services/applicationService";
import { getTenantSequelize } from "../server";
import { QueryTypes } from "sequelize";
import { SubjectSelectionService } from "../services/subjectSelectionService";

const applicationService = new ApplicationService();
const subSelectionService = new SubjectSelectionService();

export const getProgramSelection = async (req, res, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await subSelectionService.getProgramSelectionData(userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Program selection data fetched successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getProgram = async (req, res: Response, next: NextFunction) => {
  try {

    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.fetchProgram(userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Program details fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
};

export const getDepertment = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const deprtId = req.params.departmentId;
    const result = await applicationService.fetchDepartment(userId, req.tenant, deprtId);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Department details fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
}

export const saveSubject = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.saveSubject(req, userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Department details fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
}

export const getSubject = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.getSubject(req, userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Department details fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
}

export const savePersonalDetails = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.savePersonalDetails(req, userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Personal details saved successfully"
    });

  } catch (error: any) {
    next(error);
  }
};

export const saveAddress = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.saveAddressDetails(req, userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Address details saved successfully"
    });

  } catch (error: any) {
    next(error);
  }
};

export const saveGuardianDetails = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.saveGuardianDetails(req, userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Guardian details saved successfully"
    });

  } catch (error: any) {
    next(error);
  }
};

export const saveSecondaryResult = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.saveSecondaryResult(req, userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "10th standard result saved successfully"
    });

  } catch (error: any) {
    next(error);
  }
};

export const saveHigherSecondaryResult = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.saveHigherSecondaryResult(req, userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "12th standard result saved successfully"
    });

  } catch (error: any) {
    next(error);
  }
};

export const saveDocuments = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.saveDocuments(req, userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Documents uploaded successfully",
    });

  } catch (error: any) {
    next(error);
  }
};

export const getPersonalDetails = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.fetchPersonalDetails(userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Personal details fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
};

export const getAddressDetails = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.fetchAddressDetails(userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Address details fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
};

export const getGuardianDetails = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.fetchGuardianDetails(userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Guardian details fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
};

export const getTenthResultDetails = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.fetchTenthResult(userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Tenth result fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
};

export const getTwelfthResultDetails = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.fetchTwelfthResult(userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Twelfth result fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
};

export const getDocuments = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.fetchDocuments(userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Documents fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
};

export const getPreview = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.getPreview(userId, req.tenant);
    return res.status(200).json({
      status: 1,
      data: result,
      message: "Preview data fetched successfully",
    });

  } catch (error: any) {
    next(error);
  }
};

export const saveSubjectSelectionController = async (req, res, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await subSelectionService.saveSubjectSelection({
      userId,
      payload: req.body
    }, req.tenant);
    return res.status(200).json({
      status: 1,
      data: result,
      message: "Subject selection saved successfully",
    });
  } catch (error) {
    next(error)
  }
};

export const previewConfirm = async (req, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserId(req.user.email, req.tenant);
    const result = await applicationService.confirmPreview(userId, req.tenant);

    return res.status(200).json({
      status: 1,
      data: result,
      message: "Preview confirmed successfully. Please log out and log in again to access your subject selection",
    });
  } catch (error: any) {
    next(error);
  }
};

export const getUserId = async (email: string, tenant: string) => {
  const user: any = await getTenantSequelize(tenant).query(
    `SELECT user_id
        FROM users 
        WHERE email = :email LIMIT 1`,
    {
      replacements: { email: email },
      type: QueryTypes.SELECT
    }
  );
  console.log(user);
  return user[0]?.user_id;
}