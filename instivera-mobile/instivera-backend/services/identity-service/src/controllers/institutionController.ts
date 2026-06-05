import { NextFunction, Request, Response } from 'express';
import { InstitutionService } from '../services/institutionService';
import { sendSuccess, sendError } from '../utils/responseHandler';

const institutionService = new InstitutionService();

/**
 * List all institutions
 * GET /institutions?type=school|college
 * No auth required - public endpoint
 */
export const getInstitutions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query as { type?: 'school' | 'college' };

    const institutions = await institutionService.listInstitutions(type);

    sendSuccess(res, institutions, 'Institutions fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get institution by slug
 * GET /institutions/:slug
 * No auth required - public endpoint
 */
export const getInstitutionBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    const institution = await institutionService.getInstitutionBySlug(slug);

    sendSuccess(res, institution, 'Institution fetched successfully');
  } catch (error) {
    next(error);
  }
};
