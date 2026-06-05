import { Request, Response, NextFunction } from 'express';
import { registrationService } from '../services/registration.service';
import { ApiError } from '../utils/api-error';
import axios from 'axios';

const getTenant = (req: Request): string => {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const raw = headers['x-tenant'];
  return (Array.isArray(raw) ? raw[0] : raw) ?? 'default';
};

const forward = async (
  res: Response,
  next: NextFunction,
  fn: () => Promise<{ data: unknown; status: number }>,
): Promise<void> => {
  try {
    const result = await fn();
    res.status(result.status).json(result.data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      next(err instanceof ApiError ? err : new ApiError(502, 'Upstream service error'));
    }
  }
};

export const getAcademicYears = async (req: Request, res: Response, next: NextFunction) =>
  forward(res, next, () => registrationService.getAcademicYears(getTenant(req)));

export const getPrograms = async (req: Request, res: Response, next: NextFunction) =>
  forward(res, next, () => registrationService.getPrograms(getTenant(req)));

export const getDepartments = async (req: Request, res: Response, next: NextFunction) =>
  forward(res, next, () => registrationService.getDepartments(getTenant(req)));

export const getClasses = async (req: Request, res: Response, next: NextFunction) =>
  forward(res, next, () => registrationService.getClasses(getTenant(req)));

export const getFeeStructure = async (req: Request, res: Response, next: NextFunction) =>
  forward(res, next, () => registrationService.getFeeStructure(getTenant(req)));

export const submitRegistration = async (req: Request, res: Response, next: NextFunction) =>
  forward(res, next, () =>
    registrationService.submitRegistration(
      req.body as Record<string, unknown>,
      getTenant(req),
    ),
  );

export const getRegistrationStatus = async (req: Request, res: Response, next: NextFunction) =>
  forward(res, next, () =>
    registrationService.getRegistrationStatus(req.params['regId'] ?? '', getTenant(req)),
  );
