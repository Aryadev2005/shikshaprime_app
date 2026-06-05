import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/auth-middleware';
import config from '../config';

const getRoleAudience = (role: string | undefined): string => {
  if (role === 'teacher') return 'TEACHER';
  return 'STUDENT';
};

const forwardGet = async (
  req: Request,
  res: Response,
  next: NextFunction,
  path: string,
  params?: Record<string, unknown>,
): Promise<void> => {
  try {
    const response = await axios.get(`${config.noticeServiceUrl}${path}`, {
      headers: {
        Authorization: req.headers.authorization ?? '',
        'x-tenant': req.headers['x-tenant'] ?? '',
      },
      params,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      next(err);
    }
  }
};

export const createNoticeRoutes = (): Router => {
  const router = Router();

  router.get('/notices', requireAuth, (req, res, next) => {
    const audience = getRoleAudience(req.user?.role);
    forwardGet(req, res, next, '/notices', { audience });
  });

  router.get('/notices/:id', requireAuth, (req, res, next) => {
    forwardGet(req, res, next, `/notices/${req.params.id}`);
  });

  return router;
};
