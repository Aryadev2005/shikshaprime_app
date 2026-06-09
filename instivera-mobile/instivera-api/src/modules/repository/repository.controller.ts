import path from 'path';
import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/appError';
import { RepositoryService } from './repository.service';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { class_id, subject_id } = req.query as Record<string, string>;
  const result = await RepositoryService.getCategories(req.tenant!, { class_id, subject_id });
  sendSuccess(res, result);
});

export const getFilesByCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await RepositoryService.getFilesByCategory(Number(req.params.categoryId), req.tenant!);
  sendSuccess(res, result);
});

export const getFileById = asyncHandler(async (req: Request, res: Response) => {
  const result = await RepositoryService.getFileById(Number(req.params.fileId), req.tenant!);
  sendSuccess(res, result);
});

export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const file = await RepositoryService.getFileById(Number(req.params.fileId), req.tenant!);
  const absPath = RepositoryService.resolveAbsolutePath(file.file_path);
  res.sendFile(absPath, (err) => {
    if (err) throw AppError.internal('File could not be sent');
  });
});
