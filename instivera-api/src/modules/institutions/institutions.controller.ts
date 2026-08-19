import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { InstitutionService } from './institutions.service';

export const getInstitutions = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.query;
  const result = await InstitutionService.listInstitutions(type as string | undefined);
  sendSuccess(res, result);
});

export const getInstitutionBySlug = asyncHandler(async (req: Request, res: Response) => {
  const result = await InstitutionService.getBySlug(req.params.slug);
  sendSuccess(res, result);
});
