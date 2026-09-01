import { NextFunction, Request, Response } from 'express';
import { RegistrationService } from '../services/registrationService';

const registrationService = new RegistrationService();

export const registerApplicant = async (req, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];

    // HS Registration Certificate is required
    // Required
    const hs_certificate_path =
      files?.find((f) => f.fieldname === "hs_registration_certificate")?.path;

    if (!hs_certificate_path) {
      return res.status(400).json({
        status: 0,
        message: "HS Registration Certificate is required",
      });
    }

    // Cast Certificate is optional
    const cast_certificate_path =
      files?.find(
        (f) => f.fieldname === "catagory_certificate_path"
      )?.path || null;

    const result = await registrationService.registerApplicant(
      req.body,
      hs_certificate_path,
      cast_certificate_path,
      req.tenant
    );
    return res.status(201).json({
      status: 1,
      data: result,
      message: "Applicant registered successfully."
    });
  } catch (error) {
    next(error);
  }
};