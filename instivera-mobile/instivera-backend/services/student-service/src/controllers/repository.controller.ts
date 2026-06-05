import path from 'path';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';
import repositoryService from '../services/repository.service';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { class_id, subject_id } = req.query;

  const categories = await repositoryService.getCategories(tenant, {
    class_id: class_id ? Number(class_id) : undefined,
    subject_id: subject_id ? Number(subject_id) : undefined,
  });

  sendSuccess(res, categories, 'Categories retrieved successfully');
});

export const getFilesByCategory = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const categoryId = Number(req.params.categoryId);

  if (isNaN(categoryId)) return sendError(res, 400, 'Invalid categoryId');

  const files = await repositoryService.getFilesByCategory(categoryId, tenant);
  sendSuccess(res, files, 'Files retrieved successfully');
});

export const getFileById = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const fileId = Number(req.params.fileId);

  if (isNaN(fileId)) return sendError(res, 400, 'Invalid fileId');

  const file = await repositoryService.getFileById(fileId, tenant);
  sendSuccess(res, file, 'File retrieved successfully');
});

export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const fileId = Number(req.params.fileId);

  if (isNaN(fileId)) return sendError(res, 400, 'Invalid fileId');

  const file = await repositoryService.getFileById(fileId, tenant);
  const absolutePath = repositoryService.resolveAbsolutePath(file.file_path);
  const fileName = path.basename(absolutePath);

  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.sendFile(absolutePath, (err) => {
    if (err && !res.headersSent) {
      sendError(res, 404, 'File not found on disk');
    }
  });
});
