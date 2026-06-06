import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { requireAuth, requireRole } from '../middleware/auth-middleware';
import config from '../config';
import { getMyAttendance } from '../controllers/teacher.controller';

const forward = async (
  req: Request,
  res: Response,
  next: NextFunction,
  path: string,
): Promise<void> => {
  try {
    const response = await axios.get(`${config.teacherServiceUrl}${path}`, {
      headers: {
        Authorization: req.headers.authorization ?? '',
        'x-tenant': (req.headers as Record<string, string | string[] | undefined>)['x-tenant'] ?? '',
      },
      params: req.query,
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

export const createTeacherRoutes = (): Router => {
  const router = Router();

  router.get('/my-attendance', requireAuth, requireRole('teacher'), getMyAttendance);

  router.get('/timetable', requireAuth, requireRole('teacher'), (req, res, next) =>
    forward(req, res, next, '/teachers/timetable'),
  );

  return router;
};
