import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth-middleware';
import { getMyAttendance } from '../controllers/teacher.controller';

export const createTeacherRoutes = (): Router => {
  const router = Router();

  router.get('/my-attendance', requireAuth, requireRole('teacher'), getMyAttendance);

  return router;
};
