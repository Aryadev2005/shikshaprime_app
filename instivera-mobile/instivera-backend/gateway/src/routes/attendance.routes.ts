import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { requireAuth, requireRole } from '../middleware/auth-middleware';

export const createAttendanceRoutes = (): Router => {
  const router = Router();

  router.get('/my-records', requireAuth, requireRole('student'), attendanceController.getMyRecords);
  router.get('/summary', requireAuth, requireRole('teacher'), attendanceController.getClassSummary);
  router.get('/class-students', requireAuth, requireRole('teacher'), attendanceController.getClassStudents);
  router.post('/bulk-mark', requireAuth, requireRole('teacher'), attendanceController.bulkMark);

  return router;
};
