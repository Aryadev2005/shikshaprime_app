import axios from 'axios';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';
import { studentClient } from '../services/clients';
import { ApiError } from '../utils/api-error';
import config from '../config';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const token = req.token as string;
  const tenant = req.tenant as string;
  const { class_id, subject_id } = req.query;

  const response = await studentClient.request(token, tenant, {
    method: 'GET',
    url: '/student/repository/categories',
    params: { class_id, subject_id },
  });

  const upstream = response.data as { status: number; data: unknown; message: string };
  if (upstream.status !== 1) throw new ApiError(502, upstream.message || 'Failed to fetch categories');

  sendSuccess(res, upstream.data, upstream.message || 'Categories fetched');
});

export const getFilesByCategory = asyncHandler(async (req: Request, res: Response) => {
  const token = req.token as string;
  const tenant = req.tenant as string;
  const { categoryId } = req.params;

  const response = await studentClient.request(token, tenant, {
    method: 'GET',
    url: `/student/repository/categories/${categoryId}/files`,
  });

  const upstream = response.data as { status: number; data: unknown; message: string };
  if (upstream.status !== 1) throw new ApiError(502, upstream.message || 'Failed to fetch files');

  sendSuccess(res, upstream.data, upstream.message || 'Files fetched');
});

export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  const tenant = req.tenant as string;
  const token = req.token as string;
  const { fileId } = req.params;

  try {
    const upstream = await axios.get(
      `${config.studentServiceUrl}/student/repository/files/${fileId}/download`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant': tenant,
        },
        responseType: 'stream',
      },
    );

    res.setHeader(
      'Content-Type',
      (upstream.headers['content-type'] as string) || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      (upstream.headers['content-disposition'] as string) ||
        `attachment; filename="file-${fileId}"`,
    );

    upstream.data.pipe(res);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(502).json({ status: 0, data: null, message: 'Failed to stream file' });
    }
  }
};
